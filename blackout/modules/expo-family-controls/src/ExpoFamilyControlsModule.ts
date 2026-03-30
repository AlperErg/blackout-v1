import { requireOptionalNativeModule } from "expo";

export interface ExpoFamilyControlsModuleType {
  requestAuthorization(): Promise<"authorized" | "denied" | "unavailable">;
  selectAppsToBlock(): Promise<boolean>;
  enableShielding(): Promise<void>;
  disableShielding(): Promise<void>;
  disableShieldingForDuration(seconds: number): Promise<void>;
  cancelBreakTimer(): Promise<void>;
  checkAndReenable(): Promise<boolean>;
  hasStoredSelection(): Promise<boolean>;
  setSessionEndTime(timestampSeconds: number): Promise<void>;
  clearSessionEndTime(): Promise<void>;
}

export default requireOptionalNativeModule<ExpoFamilyControlsModuleType>(
  "ExpoFamilyControls"
);
