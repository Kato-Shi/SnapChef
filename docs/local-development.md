# Local browser and Android-browser development

Updated 2026-09-12. No cloud account, domain, paid hosting, or Supabase connection is required for this local build.

## Commands

- `npm run dev`: existing Vinext browser development server.
- `npm run build`: existing server production build.
- `npm run dev:mobile`: shared client application, accessible on the local network.
- `npm run build:mobile`: portable static browser assets in `dist-mobile`.
- `npm run preview:mobile`: serve the built static assets for local testing.
- `npm run android:sync`: rebuild and copy the mobile bundle into Android.
- `npm run android:open`: open the project after Android Studio is installed.

For Android browser testing, connect the phone and laptop to the same trusted Wi-Fi and open the Network URL printed by the server. `localhost` on the phone means the phone, not the laptop. Windows may require allowing Node on private networks. The laptop must remain awake. This does not publish the app to the internet.

## Implemented

Both entries use `components/snapchef/SnapChefApp.tsx`, the same recipe data and matching logic. Ingredients persist in browser localStorage per origin; photos are session-only and never uploaded. Storage failures show a message. Photo selection accepts JPEG/PNG up to 10 MiB. Recipe dialogs use native browser focus containment and Escape handling. Safe-area padding, reduced-motion CSS, and larger touch targets are included.

The local catalog now contains 144 recipes: 94 Filipino-focused entries plus 50 familiar dishes from around the world. Research scope and sources are recorded in `docs/recipe-research.md` and `docs/world-recipe-research.md`.

Recipe discovery supports instant text search across names, descriptions, and ingredients; Filipino, global, quick, vegetarian, seafood, soup-and-stew, and saved-recipe categories; ingredient match ranking; device-local favorites; and a clear-all kitchen control. These features share the same component in browser and Android builds.

## Deliberately not enabled

Image recognition remains a mock. No image-search integration, Supabase account/database/authentication, or public deployment was configured. The static bundle includes a manifest and a conservative offline cache. A Capacitor 8 Android project is generated with app ID `com.katoshi.snapchef`, but this laptop does not currently have Android Studio or the Android SDK, so an APK has not been compiled. Vercel can be evaluated for the static output without migrating the existing server deployment configuration.

## Local data

Ingredients stay on this device and browser origin, not in a shared account. Changing ports, browsers or devices uses a separate list. Clearing browser site data removes the saved list.
