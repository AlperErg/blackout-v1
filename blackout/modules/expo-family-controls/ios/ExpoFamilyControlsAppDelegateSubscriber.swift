import ExpoModulesCore
import ManagedSettings
import UIKit

public class ExpoFamilyControlsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    let type: String? =
      (userInfo["type"] as? String) ??
      ((userInfo["body"] as? [String: Any])?["type"] as? String) ??
      ((userInfo["data"] as? [String: Any])?["type"] as? String)

    guard type == "break-relock" else {
      completionHandler(.noData)
      return
    }

    let store = ManagedSettingsStore()
    store.shield.applications = nil
    store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy<Application>.all()

    UserDefaults.standard.removeObject(forKey: "BlackoutShieldReenableAt")

    completionHandler(.newData)
  }
}
