# SnapChef changelog

All notable product, recipe-catalog, platform, build, and deployment changes are recorded here.

## 2026-11-11 — Google Gemini dish recognition integration

- Integrated Google Gemini (`gemini-3.8-flash`) via `@google/genai` on the server-side `/api/analyze-image` endpoint.
- Added multimodal image processing and structured JSON response schema enforcement for dish candidates, confidence scores, culinary reasoning, and detected ingredients.
- Enabled dish recognition in the frontend UI (`SnapChefApp.tsx`), maintaining client-side photo resizing and hourly rate limiting.
- Supported `GEMINI_USE_API_KEY`, `GEMINI_API_KEY`, and fallback `OPENAI_API_KEY` environment variables forwarded via worker binding vars with automatic whitespace trimming.
- Added direct Gemini REST API fallback, active model failover pool (`gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`) with transient retry logic, and detailed error reporting for Edge/Cloudflare Workers environments.
- Added explicit UI error notifications when API keys are not yet configured.
- Updated documentation in `docs/image-recognition.md` and configuration variables in `.env.example`.

## 2026-11-11 — AI Studio web runtime migration

- Configured Vite development server bindings to host 0.0.0.0 and port 3000 with allowedHosts enabled.
- Normalized package management configuration to npm, removing redundant lockfiles.
- Added graceful database mock fallback for Drizzle D1 client when running outside Cloudflare worker bindings.
- Created `metadata.json` and `.env.example` defining environment variables and application metadata.
- Preserved existing browser and Android cross-platform capabilities and image analysis mock defaults.

## 2026-09-13 — Expanded popular global cuisines

- Added 30 home-cookable dishes across Asian, Indian, American, Italian, Spanish, and Mexican cuisines.
- Added five distinct recipes per cuisine while avoiding dishes already represented in the catalog.
- Integrated every dish with search, filters, pantry matching, serving adjustment, shopping lists, favorites, history, and Cooking Mode.
- Documented the selection scope and research basis in `docs/expanded-global-cuisines.md`.

## 2026-09-13 — Simple shopping list

- Added a compact shopping-list panel accessible from the site header.
- Added manual items, check-off and remove actions, a remaining-item count, and clear-checked cleanup.
- Added one-action transfer of a recipe’s missing ingredients without creating duplicates.
- Stored the list locally on the current device so the prototype needs no account or backend.

## 2026-09-13 — Cooking tools, filters, and history

- Added a full-screen cooking mode with step progress, large instructions, previous/next controls, and a completion action.
- Added 1–12 serving adjustment with live scaling of measured ingredient quantities.
- Added cooking-time, difficulty, and “I have everything” filters with one-action reset.
- Added a device-local Recent category for the 20 latest viewed recipes and visible cooked status.
- Kept all additions shared between the browser and Android builds without requiring an account or paid backend.
- Published the prototype with dish recognition visibly marked as coming soon and submission disabled until its API key and spending controls are configured.

## 2026-09-13 — Cost-controlled dish recognition

- Replaced the sample ingredient mock with real prepared-dish identification through a server-side OpenAI Responses API endpoint.
- Added one confident match or up to three ranked alternatives, with concise reasoning and detected ingredients fed into recipe matching.
- Added client-side resizing, low-detail analysis, structured output, validation, graceful failures, and a best-effort hourly rate limit.
- Kept the API key out of browser and Android bundles and documented local, hosted, and Android configuration in `docs/image-recognition.md`.
- Preserved manual ingredient entry and recipe browsing when the service is unavailable.

## 2026-09-13 — Detailed recipe guidance

- Added practical four-serving quantities and preparation notes to every recipe through a shared detail layer.
- Expanded each recipe from its concise core method into a detailed sequence covering setup, preparation, heat control, timing, texture checks, seasoning, finishing, serving, and storage.
- Added servings, preparation time, cooking time, difficulty, required equipment, and visible doneness guidance to the recipe view.
- Added protein-specific minimum-temperature cues based on current USDA food-safety guidance.
- Preserved the original ingredient names used by pantry matching, search, categories, and favorites.

## 2026-09-13 — Category dropdown

- Replaced the horizontally scrolling category buttons with one labeled native dropdown.
- Preserved all eight filters: All, Filipino, Global, Quick, Vegetarian, Seafood, Soups & stews, and Saved.
- Kept the saved-recipe count visible inside the Saved option.
- Made the control full-width on small screens and retained accessible keyboard and screen-reader behavior.

## 2026-09-13 — Search, categories, and favorites

- Added instant search across recipe names, descriptions, and ingredients.
- Added category filtering for Filipino and global dishes, quick meals, vegetarian dishes, seafood, soups and stews, and favorites.
- Added device-local saved recipes, ingredient-ranked browsing, empty-search guidance, and a clear-all kitchen control.
- Updated the shared browser and Android interface and documented the feature set.

## 2026-09-13 — Global recipe collection

- Added 50 recognizable home-cooked dishes from around the world.
- Expanded the complete catalog to 144 recipes while keeping Filipino dishes at the center of the collection.
- Recorded the selection methodology and sources in `docs/world-recipe-research.md`.

## 2026-09-12 — Filipino catalog and mobile foundation

- Expanded the Filipino catalog to 94 dishes, including regional specialties.
- Added the shared web/mobile React interface, installable web-app files, offline shell, and device-local ingredient storage.
- Added the Capacitor Android project and repeatable mobile build and synchronization commands.
- Kept image analysis as an intentional mock pending a separately approved integration.
