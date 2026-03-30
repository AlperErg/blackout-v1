import { Platform } from "expo-modules-core";
import ExpoFamilyControls from "./ExpoFamilyControlsModule";

export type ScreenTimeAuthorizationStatus =
  | "authorized"
  | "denied"
  | "unavailable";

/**
 * True if the native Screen Time module is loaded (development/TestFlight build with the module).
 */
export function isScreenTimeModuleLoaded(): boolean {
  if (Platform.OS !== "ios") return false;
  return typeof ExpoFamilyControls?.requestAuthorization === "function";
}

/**
 * Request Screen Time / Family Controls authorization.
 * User must grant access in the system dialog.
 * Required before selecting apps or enabling shielding.
 * Returns "unavailable" when not on iOS, in Expo Go, or when the native module isn't linked (use a development build for full support).
 */
export async function requestScreenTimeAuthorization(): Promise<ScreenTimeAuthorizationStatus> {
  if (Platform.OS !== "ios") return "unavailable";
  if (!ExpoFamilyControls?.requestAuthorization) return "unavailable";
  try {
    return await ExpoFamilyControls.requestAuthorization();
  } catch {
    return "unavailable";
  }
}

/**
 * Present the system app picker so the user can choose which apps to block during sessions.
 * Call after requestScreenTimeAuthorization() has returned "authorized".
 * Selection is stored locally and used when enableShielding() is called.
 * @returns true if user confirmed, false if cancelled or unavailable
 */
export async function selectAppsToBlock(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  if (!ExpoFamilyControls?.selectAppsToBlock) return false;
  return ExpoFamilyControls.selectAppsToBlock();
}

/**
 * Enable app shielding for the currently stored selection.
 * Call when the user joins a session (e.g. when entering the session screen).
 */
export async function enableShielding(): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (!ExpoFamilyControls?.enableShielding) return;
  await ExpoFamilyControls.enableShielding();
}

/**
 * Disable app shielding. Call when the user leaves the session or when the session ends.
 */
export async function disableShielding(): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (!ExpoFamilyControls?.disableShielding) return;
  await ExpoFamilyControls.disableShielding();
}

/**
 * Disable shielding for a fixed number of seconds, then automatically
 * re-enable it — even if JS is suspended in the background.
 * Uses iOS beginBackgroundTask so it works while the app is backgrounded.
 */
export async function disableShieldingForDuration(seconds: number): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (!ExpoFamilyControls?.disableShieldingForDuration) return;
  await ExpoFamilyControls.disableShieldingForDuration(seconds);
}

/**
 * Cancel any pending break re-enable timer. Call when the session ends
 * so a stale timer doesn't re-enable shielding after the session is over.
 */
export async function cancelBreakTimer(): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (!ExpoFamilyControls?.cancelBreakTimer) return;
  await ExpoFamilyControls.cancelBreakTimer();
}

/**
 * Call when the app returns to foreground. If a scheduled re-enable time
 * has already passed, immediately re-enables shielding and returns true.
 */
export async function checkAndReenable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  if (!ExpoFamilyControls?.checkAndReenable) return false;
  return ExpoFamilyControls.checkAndReenable();
}

/**
 * Whether the user has already chosen apps to block (stored selection exists).
 */
export async function hasStoredSelection(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  if (!ExpoFamilyControls?.hasStoredSelection) return false;
  return ExpoFamilyControls.hasStoredSelection();
}

/**
 * Tell the native module when the current session ends (Unix timestamp in
 * seconds). The native module will automatically disable shielding when
 * this time is reached — even if JS is suspended in the background.
 */
export async function setSessionEndTime(timestampSeconds: number): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (!ExpoFamilyControls?.setSessionEndTime) return;
  await ExpoFamilyControls.setSessionEndTime(timestampSeconds);
}

/**
 * Clear the native session-end timer (e.g. when session is manually ended
 * or the user leaves the session screen).
 */
export async function clearSessionEndTime(): Promise<void> {
  if (Platform.OS !== "ios") return;
  if (!ExpoFamilyControls?.clearSessionEndTime) return;
  await ExpoFamilyControls.clearSessionEndTime();
}
