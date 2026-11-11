/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { GoogleGenAI, Type } from "@google/genai";

interface Env {
  ASSETS: Fetcher;
  GEMINI_USE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const requestLog = new Map<string, number[]>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" } });
}

function isRateLimited(request: Request) {
  const key = request.headers.get("cf-connecting-ip") || "local";
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now); requestLog.set(key, recent); return false;
}

async function analyzeImage(request: Request, env: Env) {
  const rawKey =
    env.GEMINI_USE_API_KEY ||
    env.GEMINI_API_KEY ||
    (typeof process !== "undefined" && (process.env?.GEMINI_USE_API_KEY || process.env?.GEMINI_API_KEY)) ||
    env.OPENAI_API_KEY ||
    (typeof process !== "undefined" && process.env?.OPENAI_API_KEY);
  const apiKey = rawKey?.trim();
  if (!apiKey) return json({ error: "Image recognition has not been configured yet." }, 503);
  if (isRateLimited(request)) return json({ error: "Hourly photo limit reached. Please try again later." }, 429);
  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File) || image.type !== "image/jpeg" || image.size > 2 * 1024 * 1024) return json({ error: "Send one prepared JPEG photo smaller than 2 MB." }, 400);
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  const base64Data = btoa(binary);

  try {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: "Identify the prepared dish in this photo. Give one candidate when clear, otherwise up to three plausible dishes ranked by likelihood. Also list only clearly visible or strongly implied main ingredients useful for recipe matching. Be conservative: never invent certainty, and say when this may not be food.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              candidates: {
                type: Type.ARRAY,
                description: "Up to 3 dish candidates ranked by likelihood",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    confidence: { type: Type.INTEGER, description: "Confidence score from 0 to 100" },
                    reason: { type: Type.STRING },
                  },
                  required: ["name", "confidence", "reason"],
                },
              },
              ingredients: {
                type: Type.ARRAY,
                description: "Visible or strongly implied main ingredients useful for recipe matching",
                items: {
                  type: Type.STRING,
                },
              },
              message: {
                type: Type.STRING,
                description: "Brief explanation or description",
              },
            },
            required: ["candidates", "ingredients", "message"],
          },
        },
      });

      const text = response.text;
      if (text) return json(JSON.parse(text));
    } catch (sdkError) {
      console.warn("Gemini SDK call failed, falling back to direct REST fetch:", sdkError);
    }

    // Direct REST API fallback for Cloudflare Workers / Edge environments
    const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const restRes = await fetch(restUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: "Identify the prepared dish in this photo. Give one candidate when clear, otherwise up to three plausible dishes ranked by likelihood. Also list only clearly visible or strongly implied main ingredients useful for recipe matching. Be conservative: never invent certainty, and say when this may not be food.",
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    const restData = (await restRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!restRes.ok || restData.error) {
      const errMsg = restData.error?.message || `Gemini API returned status ${restRes.status}`;
      console.error("Gemini REST API error:", errMsg);
      return json({ error: errMsg }, 502);
    }

    const restText = restData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (restText) {
      return json(JSON.parse(restText));
    }

    return json({ error: "The image service returned an incomplete result." }, 502);
  } catch (error: unknown) {
    console.error("Gemini image analysis failed", error);
    let message = "The image service is temporarily unavailable.";
    if (error && typeof error === "object" && "message" in error) {
      message = String((error as { message: unknown }).message);
    }
    return json({ error: message }, 502);
  }
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/analyze-image" && request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" } });
    if (url.pathname === "/api/analyze-image" && request.method === "POST") return analyzeImage(request, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
