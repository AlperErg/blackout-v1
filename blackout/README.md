# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   If you see **`TypeError: fetch failed`** (e.g. due to firewall, proxy, or no network), skip the dependency version check and start in offline mode:

   ```bash
   EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start
   ```

   Or use `npx expo start --offline` so the dev server doesn’t require network.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Running with Expo Go

To run the app in [Expo Go](https://expo.dev/go) on your phone (no dev build required):

1. **Install dependencies** (if you haven’t already):

   ```bash
   npm install
   ```

2. **Start the dev server for Expo Go** (with tunnel so your phone can connect):

   ```bash
   npm run start:go
   ```

   This runs `expo start --go --tunnel` and automatically proceeds **anonymously** (no Expo login prompt). If you see a QR code, open the **Expo Go** app on your device and scan it.

3. **Limitations in Expo Go**

   - **Screen Time / Family Controls** are not available in Expo Go; they require a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (see “Screen Time / Family Controls” below).
   - Other app features (sessions, chat, mint, etc.) work in Expo Go for testing.

After `npm install`, a postinstall script patches the Expo CLI so that `start:go` does not ask you to log in or choose “Proceed anonymously”; it always uses the anonymous flow.

## Join links and the website (blackout.codes)

Session QR codes encode **https://blackout.codes/join/{sessionId}**. When someone scans the QR with the **device’s normal camera**, the browser opens that URL. For the app to open automatically, blackout.codes must redirect to the app.

**Redirect website included in this repo**

The **`website`** folder at the repo root contains a minimal redirect page you can deploy to **blackout.codes**:

- **`website/join.html`** – Immediately redirects to `blackout://join/{sessionId}` so the OS opens the Blackout app. If the app doesn’t open (e.g. user cancels), it shows an “Open in Blackout app” link.
- **`website/vercel.json`** – Rewrites `/join/:sessionId` to `join.html` (for [Vercel](https://vercel.com)).
- **`website/netlify.toml`** – Same rewrite for [Netlify](https://netlify.com).

**Deploy so that blackout.codes/join/xyz redirects to the app**

1. Deploy the **`website`** folder to the domain **blackout.codes** (e.g. connect the repo to Vercel or Netlify and set the project root or publish directory to **`website`**, or deploy only the contents of `website`).
2. Ensure the host uses the rewrite rules above so that `https://blackout.codes/join/ANY_SESSION_ID` serves `join.html`; the page then redirects to `blackout://join/ANY_SESSION_ID` and the app opens.

After deployment, scanning the session QR with the system camera will open the link in the browser, which will immediately try to open the app; if the app is installed, it opens and joins the session.

The app handles `blackout://join/{sessionId}` (and optionally `https://blackout.codes/join/{sessionId}` via Universal Links / App Links) and navigates to the session screen after joining.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Screen Time / Family Controls (iOS)

When a user is in an active session, selected apps can be blocked using Apple’s Family Controls (Screen Time) API.

- **Setup**: The app uses the `expo-family-controls` local module (Swift). You need a **development build** for iOS; Expo Go does not include this native code.
- **Entitlement**: The Family Controls capability is set in `app.json` under `ios.entitlements`. For distribution, you must request the [Family Controls entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_family-controls) from Apple.
- **Flow**: On the session screen, shielding is enabled when the user is in a session and disabled when they leave. Use **“Manage blocked apps”** (iOS only) to authorize Screen Time and pick which apps to block. The selection is stored on device and applied whenever a session is active.

To build and run on a device:

```bash
npx expo prebuild
npx expo run:ios
```

## Push notifications (host announcements)

When the host posts an announcement, **joiners receive a live push notification** even when the app is in the background or closed. The app uses **Expo Push Notifications** and stores push tokens in Firestore.

- **Registration**: On the session screen, the host (qrpage) and each joiner (session) register their Expo push token in `sessions/{sessionId}/pushTokens/{userId}` (`userId` is `"host"` for the host, or the joiner’s chat user id).
- **Sending**: When the host sends an announcement, the app fetches all tokens in that session (excluding the host), then sends a push via the Expo Push API so joiners get the notification immediately.
- **Firestore rules**: Allow read and write on the `pushTokens` subcollection under each session document (e.g. `sessions/{sessionId}/pushTokens/{document}`) so that the host and joiners can register tokens and the host’s app can read tokens to send pushes. If your rules are restrictive, add a rule for this subcollection.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
