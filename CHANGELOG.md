# SnapChef changelog

All notable product, recipe-catalog, platform, build, and deployment changes are recorded here.

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
