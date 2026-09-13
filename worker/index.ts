/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
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

function responseText(result: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  return result.output_text || result.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || "";
}

function isRateLimited(request: Request) {
  const key = request.headers.get("cf-connecting-ip") || "local";
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now); requestLog.set(key, recent); return false;
}

async function analyzeImage(request: Request, env: Env) {
  if (!env.OPENAI_API_KEY) return json({ error: "Image recognition has not been configured yet." }, 503);
  if (isRateLimited(request)) return json({ error: "Hourly photo limit reached. Please try again later." }, 429);
  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File) || image.type !== "image/jpeg" || image.size > 2 * 1024 * 1024) return json({ error: "Send one prepared JPEG photo smaller than 2 MB." }, 400);
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna", reasoning: { effort: "low" }, max_output_tokens: 350,
      input: [{ role: "user", content: [
        { type: "input_text", text: "Identify the prepared dish in this photo. Give one candidate when clear, otherwise up to three plausible dishes ranked by likelihood. Also list only clearly visible or strongly implied main ingredients useful for recipe matching. Be conservative: never invent certainty, and say when this may not be food." },
        { type: "input_image", image_url: `data:image/jpeg;base64,${btoa(binary)}`, detail: "low" },
      ] }],
      text: { format: { type: "json_schema", name: "dish_identification", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          candidates: { type: "array", maxItems: 3, items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, confidence: { type: "integer", minimum: 0, maximum: 100 }, reason: { type: "string" } }, required: ["name", "confidence", "reason"] } },
          ingredients: { type: "array", maxItems: 12, items: { type: "string" } }, message: { type: "string" },
        }, required: ["candidates", "ingredients", "message"],
      } } },
    }),
  });
  const result = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }>; error?: { message?: string } };
  if (!response.ok) { console.error("Image analysis failed", response.status, result.error?.message); return json({ error: "The image service is temporarily unavailable." }, 502); }
  try { return json(JSON.parse(responseText(result))); }
  catch { return json({ error: "The image service returned an incomplete result." }, 502); }
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
