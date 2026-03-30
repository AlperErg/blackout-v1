import DeviceActivity
import ManagedSettings

extension DeviceActivityName {
  static let breakEnd = Self("breakEnd")
}

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  let store = ManagedSettingsStore()

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    guard activity == .breakEnd else { return }

    store.shield.applications = nil
    store.shield.applicationCategories =
      ShieldSettings.ActivityCategoryPolicy<Application>.all()
  }
}
