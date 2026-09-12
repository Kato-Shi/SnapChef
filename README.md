# SnapChef

SnapChef is a small recipe recommendation prototype that helps people cook with ingredients they already have.

## Features

- Add, normalize, and remove ingredients
- Search every recipe by name, description, or ingredient
- Browse Filipino, global, quick, vegetarian, seafood, soup-and-stew, and saved categories
- Save favorite recipes privately on the current device
- Upload and preview JPG or PNG food photos
- Mock image analysis that returns editable detected ingredients
- Rank recipes by exact ingredient-match percentage
- Show matched and missing ingredients
- Open complete recipe ingredients and instructions
- Follow measured four-serving ingredient guides, expanded methods, equipment lists, and doneness cues
- Responsive, accessible single-page interface

## Important limitation

Image recognition is intentionally mocked for this MVP. `analyzeFoodImage()` returns sample ingredients (`egg`, `tomato`, and `onion`) without using an external AI service or API key. The analyzer is separate from the UI and recipe-matching code so it can be replaced later.

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
- `app/lib/image-analyzer.ts` — replaceable mock image analyzer
- `app/globals.css` — responsive visual design

Product and platform changes are recorded in [`CHANGELOG.md`](CHANGELOG.md).

## Mobile portability

The confirmed browser-and-mobile architecture, compatibility rules, staged implementation plan, validation matrix, and decision log are documented in [`docs/mobile-portability.md`](docs/mobile-portability.md).
