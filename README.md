# Home Decor Visualization

A mobile app (React Native + Expo) that lets you visualize furniture and decor items in your own room before you buy or arrange them. Take or pick a photo of your room, drag in photos of decor items, and the app automatically removes each item's background so it looks like it's really sitting in your space — then save or share the finished design.

## Features

- **Room canvas** — take a photo or pick one from your gallery as the background for your design.
- **Auto background removal** — decor items you add have their background stripped automatically (on-device, free) so they blend into the room instantly. An optional cloud "Advanced" mode (Clipdrop API) is available for HD-quality removal.
- **Full item editing** — drag, pinch-to-resize, two-finger rotate, flip, duplicate, delete, and crop any decor item directly on the canvas.
- **Smart snapping** — items snap to the canvas center and to other items' edges/centers while dragging, with visual guide lines.
- **Multi-select** — select several items at once to move, duplicate, or delete them together.
- **Autosave drafts** — in-progress work is saved automatically; a "Resume" prompt appears on Home if you left mid-edit.
- **Projects** — save, rename, search, and reopen designs, each with a real thumbnail preview.
- **Export** — save the finished design to your photo gallery or share it directly from the Preview screen.

## Tech stack

- **Framework:** React Native (0.81) + Expo SDK 54, TypeScript
- **Navigation:** React Navigation (native-stack)
- **State:** Zustand (canvas state, projects, UI state)
- **Storage:** AsyncStorage (projects, drafts) + on-device file system (thumbnails, exported images)
- **Canvas/gestures:** hand-rolled `PanResponder`-based drag/resize/rotate on plain RN Views (no canvas library)
- **Background removal:** `@six33/react-native-bg-removal` (on-device) + Clipdrop API (cloud, optional)
- **Image tools:** `expo-image-manipulator` (crop), `expo-image-picker`, `expo-media-library`, `expo-sharing`, `react-native-view-shot`
- **UI:** custom design system (`src/theme/`) with shared components (`src/components/common/`)

## Project structure

```
src/
  components/
    common/         # Shared IconButton, GradientButton, OutlineButton
    SnackbarNotification.tsx
  screens/          # One folder per screen (Home, Editor, Preview, Projects, Splash, Crop)
  navigation/        # Stack navigator + route param types
  store/             # Zustand stores: canvasStore, projectStore, uiStore
  theme/             # colors.ts, typography.ts, spacing.ts (shadows/radii), theme.ts
  utils/             # backgroundRemoval, exportUtils, storageManager, naming, canvasUtils
  constants/          # App-wide constants (canvas size, storage keys, etc.)
  types/              # Shared TypeScript types
```

## Getting started

### Prerequisites
- Node.js 18+
- Android Studio (for Android builds) and/or Xcode (for iOS builds)
- A physical device or emulator — this app uses native modules (background removal, Skia, SQLite) that **do not run in Expo Go**; it requires a custom dev build.

### Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set your own Clipdrop API key if you want the "Advanced" (cloud) background-removal mode:

```
EXPO_PUBLIC_CLIPDROP_API_KEY=your_clipdrop_api_key_here
```

The free on-device "Normal" removal mode works without this key.

### Run on Android

```bash
npx expo run:android
```

This builds a native dev client and installs it on a connected device/emulator, starting the Metro bundler automatically.

### Run on iOS

```bash
npx expo run:ios
```

### Build a shareable/release APK (Android)

```bash
cd android
./gradlew assembleRelease
```

The signed APK is output to `android/app/build/outputs/apk/release/app-release.apk`. This bundles the JS, so it installs and runs standalone (no dev server needed) — suitable for sharing with testers.

## Notes

- Native folders (`android/`, `ios/`) are gitignored and generated via `npx expo prebuild` — they aren't committed.
- `.env` is gitignored; only `.env.example` is committed. Never commit real API keys.
