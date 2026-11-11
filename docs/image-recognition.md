# Image dish recognition

SnapChef uses a server-side API request to identify a prepared dish using Google Gemini (`gemini-3.8-flash`) or OpenAI. When an image is ambiguous, the interface shows up to three ranked possibilities instead of claiming one certain answer. Clearly visible or strongly implied ingredients are added to the editable kitchen list.

Dish recognition is now enabled in the frontend, supported by server-side `GEMINI_API_KEY` (or `OPENAI_API_KEY`) configuration.

## Cost & processing controls

- Model: Google Gemini `gemini-3.8-flash` via `@google/genai`
- Client-side resize: longest edge limited to 1024 pixels and encoded as a 78%-quality JPEG
- Output: strict, structured JSON schema (`responseSchema`) with ranked candidates and ingredients
- Server limit: 20 scans per IP address per hour (best-effort, per Worker instance)
- No request is made until the user presses **Identify this dish**

## Configuration

1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. In Google AI Studio Build, the key is automatically attached via `process.env.GEMINI_API_KEY`.
3. In local development, specify `GEMINI_API_KEY` in `.env` or `.dev.vars`. Never commit keys or expose them through client-side `VITE_` variables.

## Hosted and Android configuration

The web build uses its own origin automatically. A packaged Android build can set `VITE_SNAPCHEF_API_URL` to the deployed SnapChef origin at build time so its WebView reaches the hosted endpoint. This variable is only a public endpoint URL; it must never contain the API key.

The endpoint supports the Android WebView's cross-origin preflight request. It accepts only the image-analysis POST operation and never returns the secret to the client.

## Failure behavior

Missing configuration, invalid files, rate limiting, provider errors, and malformed responses produce readable messages. Manual ingredient entry and recipe search remain available when recognition is offline.
