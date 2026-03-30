import { requireOptionalNativeModule } from "expo";

export interface ExpoAndroidBlockerModuleType {
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): void;
  startBlocking(): boolean;
  stopBlocking(): void;
  isBlocking(): boolean;
}

export default requireOptionalNativeModule<ExpoAndroidBlockerModuleType>(
  "ExpoAndroidBlocker"
);
