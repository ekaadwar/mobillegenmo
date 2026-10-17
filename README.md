This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## Catalog And Car Detail

- `Katalog > Lihat Detail` opens the selected car using `GET /api/v1/cars/{id}`. The detail stack preserves the shared header and bottom tabs.
- The gallery supports swiping through all photos and displays up to five nearby thumbnails. The highlighted image is selected initially, with the first image as fallback.
- The star sends `PATCH /api/v1/car-images/{imageId}` without a body, following the supplied API contract. After success, the detail is fetched again and catalog caches are invalidated. Returning to the catalog preserves its search, year filter, and page while refreshing the images.
- Edit photo, Edit Mobil, Brosur / QR, and Hapus Unit dari Katalog open the existing logout screen. They do not edit or delete a car or sign out automatically.
- Missing values and images have fallbacks. `showroom_address` is used for the address, with compatibility for `showroom_location`. Tax validity is displayed as `MM/YYYY`.
- Detail sections have a 20px gap. The hero uses the 358:198 aspect ratio; specification cards use a 4px grid gap and stack on narrow screens or with enlarged system text.
- Specification SVGs from [assets/catalog_icon.zip](assets/catalog_icon.zip) are stored as XML in [assets/catalogIcons.json](assets/catalogIcons.json) and rendered by the existing `react-native-svg` dependency.

## Car Form Photo Upload

- `Tambah Foto Unit` opens a native source dialog with `Kamera`, `Galeri`, and `Batal`. Camera capture and gallery selection use `react-native-image-picker` and the platform's own UI.
- Gallery selection is limited to the remaining slots out of five photos. The returned selection is also checked before upload for Android pickers that do not enforce the limit.
- Selected photos upload immediately as multipart `PATCH /api/v1/cars/{id}` with repeated `images` file parts (URI, filename, MIME type), matching the Postman collection. Other form fields and `removeImageIds` are omitted; unsaved field edits and the existing highlight are preserved.
- The carousel and count update from the API response. Cancellation makes no request; errors keep existing photos and allow another attempt. Uploads block other form mutations and refresh, and are aborted when leaving the screen.
- Android uses app-private temporary camera files (`saveToPhotos: false`) and needs no camera or broad storage permission. Rebuild/reinstall the app after adding this native dependency (`npm run android`); Metro reload alone is insufficient. For iOS, run `bundle exec pod install` in `ios` before rebuilding; camera/photo usage descriptions are included.
- Jest mocks the native picker. Verify camera capture, gallery selection, cancellation, and successful upload on a device with an authenticated session and a reachable API.

## Validation

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm test -- --runInBand --coverage --collectCoverageFrom='android/app/src/**/*.{ts,tsx}'
```

Jest and React Test Renderer cover reusable components, catalog/detail navigation, gallery interactions, responsive grid decisions, API contracts, cache refresh, request cancellation, filters, authentication, and secure session storage. Native safe-area and Keychain APIs are mocked; tests do not access the live backend. Device-level visual checks require an authenticated session and a reachable backend.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
