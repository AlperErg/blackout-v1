import { Platform } from "expo-modules-core";
import ExpoAndroidBlocker from "./ExpoAndroidBlockerModule";

export function isAndroidBlockerAvailable(): boolean {
  if (Platform.OS !== "android") return false;
  return typeof ExpoAndroidBlocker?.hasUsageAccess === "function";
}

export function hasUsageAccess(): boolean {
  if (Platform.OS !== "android") return false;
  if (!ExpoAndroidBlocker?.hasUsageAccess) return false;
  return ExpoAndroidBlocker.hasUsageAccess();
}

export function openUsageAccessSettings(): void {
  if (Platform.OS !== "android") return;
  ExpoAndroidBlocker?.openUsageAccessSettings?.();
}

export function hasOverlayPermission(): boolean {
  if (Platform.OS !== "android") return false;
  if (!ExpoAndroidBlocker?.hasOverlayPermission) return false;
  return ExpoAndroidBlocker.hasOverlayPermission();
}

export function openOverlaySettings(): void {
  if (Platform.OS !== "android") return;
  ExpoAndroidBlocker?.openOverlaySettings?.();
}

export function startBlocking(): boolean {
  if (Platform.OS !== "android") return false;
  if (!ExpoAndroidBlocker?.startBlocking) return false;
  return ExpoAndroidBlocker.startBlocking();
}

export function stopBlocking(): void {
  if (Platform.OS !== "android") return;
  ExpoAndroidBlocker?.stopBlocking?.();
}

export function isBlocking(): boolean {
  if (Platform.OS !== "android") return false;
  if (!ExpoAndroidBlocker?.isBlocking) return false;
  return ExpoAndroidBlocker.isBlocking();
}
