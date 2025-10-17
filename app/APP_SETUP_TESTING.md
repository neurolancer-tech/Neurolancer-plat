# Neurolancer Mobile – Setup & Testing Guide (Windows + Expo)

Version: 1.0
Status: Ready for onboarding

## 0) Overview
This guide walks you through creating, running, and testing the Neurolancer mobile app using React Native with Expo and Tailwind (NativeWind). It emphasizes production-safe dev practices to avoid late-stage build failures.

## 1) Prerequisites (Windows)
- Node.js LTS (>=18). Verify: `node -v`, `npm -v`
- Git
- Expo CLI (via npx, no global install required)
- Android tooling (two options):
  - Option A: Expo Go only (no native build required initially)
  - Option B: Local Android build (ADB + Android SDK). If your ADB/SDK tools are at F:\apps, set environment variables:
    - Add to PATH: `F:\apps\Android\platform-tools` (adjust to your actual directory)
    - (Optional) ANDROID_HOME: `F:\apps\Android` and ensure `platform-tools`, `tools`, `tools\bin` exist
  - Verify: `adb devices` should list your device when plugged in with USB debugging enabled

## 2) Create the Expo app skeleton (proposed location)
We’ll create the mobile app inside the repo under `app/mobile`.

- In a terminal at repo root (F:\neurolancercode\Neurolancer-plat):
  ```
  npx create-expo-app@latest app/mobile --template
  ```
  When prompted, choose: "Blank (TypeScript)"

- Move into the project:
  ```
  cd app/mobile
  ```

## 3) Install core dependencies
- Navigation
  ```
  npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer
  npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
  ```
- Data & Auth
  ```
  npm install axios @tanstack/react-query @tanstack/react-query-persist-client
  npm install react-native-mmkv expo-secure-store
  ```
- Styling (Tailwind for RN via NativeWind)
  ```
  npm install nativewind tailwindcss
  npx tailwindcss init
  ```
- i18n & localization
  ```
  npm install i18next react-i18next expo-localization
  ```
- Forms & validation
  ```
  npm install react-hook-form zod @hookform/resolvers
  ```
- Notifications & haptics
  ```
  npx expo install expo-notifications expo-haptics
  ```

## 4) Configure Tailwind (NativeWind)
- tailwind.config.js (example):
  ```
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    content: [
      "./App.{js,jsx,ts,tsx}",
      "./app/**/*.{js,jsx,ts,tsx}",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#0D9E86",
        },
      },
    },
    plugins: [],
  };
  ```
- babel.config.js: ensure NativeWind plugin is added.
  ```
  module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: ['nativewind/babel', 'react-native-reanimated/plugin'],
    };
  };
  ```

## 5) Project layout (initial)
```
app/mobile/
  src/
    api/
    components/
    screens/
    navigation/
    contexts/
    hooks/
    utils/
    assets/
  App.tsx
  app.json / app.config.ts
  tailwind.config.js
  babel.config.js
  tsconfig.json
```

## 6) Environment configuration
- API base URL: point to your Django backend (prod/staging/dev). Create `src/api/client.ts` with axios instance and interceptors.
- Configure runtime env in `app.config.ts` (read from process.env using dotenv if needed).
- NEVER hardcode secrets. Store tokens via `expo-secure-store`.

## 7) Auth setup (recommended)
- Prefer JWT (DRF SimpleJWT). Backend endpoints to enable if not present:
  - POST /auth/jwt/create (email, password)
  - POST /auth/jwt/refresh
- Store access/refresh tokens in SecureStore. Attach `Authorization: Bearer <token>` in axios interceptors.
- If staying with session cookies, use `@react-native-cookies/cookies` and configure axios with `withCredentials`.

## 8) Data layer & caching
- Install and set up React Query client in App.tsx.
- Enable persistence with MMKV so lists and settings are available offline.
- Paginate everywhere and use infinite queries for long lists (gigs/jobs/experts).

## 9) Theming, language, currency
- Create contexts: ThemeContext, LanguageContext, CurrencyContext under `src/contexts`.
- Theme: light/dark/system (NativeWind). Persist choice to SecureStore or MMKV.
- Language: load device locale via expo-localization; map to supported language codes; allow manual override via settings.
- Currency: supported: KES, USD, EUR, GBP, NGN, INR. Provide conversion (server-side or cached FX rates). Use a `PriceDisplay` component for all monetary UI.

## 10) Navigation wiring
- Root `Drawer` with links to all primary sections and Settings.
- `BottomTabs` inside drawer for: Home, Explore, Messages, Notifications, Profile.
- `Native Stack` inside each tab for pushes (e.g., Detail screens).
- Optional `TopTabs` (Explore: Gigs | Jobs | Experts) using material-top-tabs or a custom segmented control.

## 11) Running on your phone
Option A: Expo Go (fastest)
- Install Expo Go on your Android phone from Play Store.
- Start dev server with tunnel (bypasses LAN issues):
  ```
  npm run start
  # or
  npx expo start --tunnel
  ```
- Scan the QR code shown in terminal/Expo DevTools using Expo Go.

Option B: USB with ADB (local dev build)
- Enable Developer options and USB debugging on your phone.
- Connect via USB. Verify:
  ```
  adb devices
  ```
- Build and run a development build:
  ```
  npx expo run:android
  ```
- Subsequent runs are faster. Use `npx expo run:android --device` to target a specific device if needed.

## 12) Debugging & Quality checks
- Verify RN/Expo setup:
  ```
  npx expo doctor
  ```
- TypeScript check:
  ```
  npx tsc --noEmit
  ```
- Lint:
  ```
  npx eslint .
  ```
- Common fixes:
  - Ensure `react-native-reanimated/plugin` is last in the Babel plugins array.
  - Run `npx expo prebuild --clean` only if you must customize native code.

## 13) Preventing “100 errors at build time”
- Always run: `expo doctor`, `tsc --noEmit`, and `eslint .` before commits.
- Keep dependencies in sync and avoid using web-only libraries in RN.
- Test features on a physical device early and often (Expo Go or dev build).
- Lock API contracts with zod parsing where possible (fail fast).

## 14) EAS Build (preview/release)
- Install and login:
  ```
  npm install -g eas-cli
  eas login
  ```
- Configure EAS in project (app.json/app.config.ts): `eas build:configure`
- Build Android preview:
  ```
  eas build -p android --profile preview
  ```
- Download the .apk/.aab; test on device.

## 15) Requested resources (if missing)
If any tools are not present under `F:\apps`, please provide or allow download for:
- Android SDK Platform Tools (ADB)
- JDK 17 (if doing native builds outside Expo Go)
- Watchman (optional)

## 16) First feature slice to implement (suggested)
- M0 slice: Theme + Language + Currency settings screen
  - Build contexts and simple UI
  - Verify state persistence and UI updates live
  - Confirm layout and Tailwind classes apply in RN (NativeWind)

## 17) Smoke checklist before each PR
- [ ] App launches on device (Expo Go or dev build)
- [ ] `npx expo doctor` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npx eslint .` passes
- [ ] Basic navigation works (Drawer + Tabs)
- [ ] No red screens (exceptions) in runtime

---

If you want, I can bootstrap `app/mobile` with all scaffolding files (navigation, contexts, Tailwind config) so you can run it immediately on your phone. Let me know and I’ll proceed.
