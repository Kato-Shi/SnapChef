# SnapChef

SnapChef is a small recipe recommendation prototype that helps people cook with ingredients they already have.

## Features

- Add, normalize, and remove ingredients
- Search every recipe by name, description, or ingredient
- Browse Filipino, global, quick, vegetarian, seafood, soup-and-stew, and saved categories
- Save favorite recipes privately on the current device
- Revisit recently viewed recipes and see which dishes were cooked
- Filter by time, difficulty, and recipes possible with current ingredients
- Upload and preview JPG or PNG food photos
- Cost-controlled dish recognition with ranked alternatives and editable detected ingredients
- Rank recipes by exact ingredient-match percentage
- Show matched and missing ingredients
- Open complete recipe ingredients and instructions
- Follow measured four-serving ingredient guides, expanded methods, equipment lists, and doneness cues
- Scale ingredient quantities from 1–12 servings and follow a focused step-by-step cooking mode
- Responsive, accessible single-page interface

## Image recognition

Real image recognition is available when a server-side `OPENAI_API_KEY` is configured. Setup, privacy behavior, mobile configuration, safeguards, and cost controls are documented in [`docs/image-recognition.md`](docs/image-recognition.md). Manual recipe search remains usable without an API key.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validate

```bash
pnpm build
node --test tests/rendered-html.test.mjs
```

## Main files

- `app/page.tsx` — user interface and interactions
- `app/lib/recipes.ts` — sample recipe data
- `app/lib/recipe-matcher.ts` — normalization and ranking
- `app/lib/image-analyzer.ts` — client-side resizing and image-analysis client
- `worker/index.ts` — protected server-side image-analysis endpoint
- `app/globals.css` — responsive visual design

Product and platform changes are recorded in [`CHANGELOG.md`](CHANGELOG.md).

## Mobile portability

The confirmed browser-and-mobile architecture, compatibility rules, staged implementation plan, validation matrix, and decision log are documented in [`docs/mobile-portability.md`](docs/mobile-portability.md).
