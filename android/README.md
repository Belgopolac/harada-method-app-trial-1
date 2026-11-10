# Android native project scaffold

This repository contains a React Native 0.72 Android scaffold and a registered `CalendarModule`. The calendar bridge requires Android calendar permissions, which the app requests at runtime. Build with JDK 17 and Android SDK/Build Tools installed.

The scaffold files are committed, but this repository does not include the Gradle wrapper JAR/scripts or generated launcher icons. To create these locally, install Gradle and run `gradle wrapper` from `android/`, then generate/add the `mipmap` launcher assets or remove the `android:icon` attribute from the manifest. After cloning, install JS dependencies with `npm install` before building.

Run on Android: `npx react-native run-android`.

This setup is Android-only; an iOS Xcode project has not been generated. Several screens referenced by `App.tsx` (including `GridDetailScreen`, `DiaryScreen`, and `SettingsScreen`) still need their complete implementations before the TypeScript app can compile. The content previously supplied for `DiaryScreen.tsx` was Java Android module code, not a diary screen.
