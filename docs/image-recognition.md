# Image dish recognition

SnapChef uses a server-side OpenAI Responses API request to identify a prepared dish. When an image is ambiguous, the interface shows up to three ranked possibilities instead of claiming one certain answer. Clearly visible or strongly implied ingredients are added to the editable kitchen list.

The deployed prototype currently leaves this feature disabled. Set the public build flag `VITE_IMAGE_RECOGNITION_ENABLED=true` only after the server-side API key and spending controls are configured. With the flag absent, users may preview a selected photo but cannot submit it.

## Cost controls

- Model: `gpt-5.6-luna`
- Image detail: `low`
- Browser resize: longest edge limited to 1024 pixels and encoded as a 78%-quality JPEG
- Output: strict, concise JSON capped at 350 tokens
- Server limit: 20 scans per IP address per hour (best-effort, per Worker instance)
- No request is made until the user presses **Identify this dish**

API use is pay-as-you-go. No image scan means no OpenAI API charge. Configure a low project budget and usage alert in the OpenAI Platform dashboard as the authoritative protection against unexpected spend.

## Local setup

1. Create an OpenAI API key for a dedicated SnapChef project.
2. Copy `.dev.vars.example` to `.dev.vars`.
3. Replace the placeholder with the key. Never commit `.dev.vars` or expose the key through a `VITE_` variable.
4. Run `pnpm dev` and test with a JPG or PNG.

The browser sends the resized image to `/api/analyze-image`. The key remains in the Worker environment. SnapChef does not write uploaded photos to its database or local storage.

## Hosted and Android configuration

Add `OPENAI_API_KEY` as a secret in the hosting environment. The web build uses its own origin automatically. A packaged Android build must set `VITE_SNAPCHEF_API_URL` to the deployed SnapChef origin at build time so its WebView can reach the hosted endpoint. This variable is only a public endpoint URL; it must never contain the API key.

The endpoint supports the Android WebView's cross-origin preflight request. It accepts only the image-analysis POST operation and never returns the secret to the client.

## Failure behavior

Missing configuration, invalid files, rate limiting, provider errors, and malformed responses produce readable messages. Manual ingredient entry and recipe search remain available when recognition is offline.
