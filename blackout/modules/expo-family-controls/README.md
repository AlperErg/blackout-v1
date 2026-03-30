# expo-family-controls

Local Expo module for **Screen Time / Family Controls** on iOS. Used to block user-selected apps while the user is in a Blackout session.

## Requirements

- iOS 16+
- Physical device (Family Controls is not fully available in Simulator)
- [Family Controls entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_family-controls) (must be requested from Apple for the app’s App ID)

## API (from the app)

- `requestScreenTimeAuthorization()` – Request Screen Time permission; returns `"authorized" | "denied" | "unavailable"`.
- `selectAppsToBlock()` – Present the system app picker; selection is stored locally. Returns `true` if user confirmed.
- `enableShielding()` – Apply blocking for the stored selection (call when entering a session).
- `disableShielding()` – Remove blocking (call when leaving a session).
- `hasStoredSelection()` – Whether the user has already chosen apps to block.

## Implementation details

- **Swift**: Uses `FamilyControls.AuthorizationCenter`, `FamilyActivityPicker`, and `ManagedSettings.ManagedSettingsStore` to authorize, pick apps/categories, and shield them.
- Selection is persisted with `PropertyListEncoder` in `UserDefaults` and reused when enabling the shield.
- The session screen enables shielding on mount and disables it on unmount; “Manage blocked apps” allows changing the selection during a session.
