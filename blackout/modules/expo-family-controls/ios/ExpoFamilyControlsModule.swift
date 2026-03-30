import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI
import UIKit

extension DeviceActivityName {
  static let breakEnd = Self("breakEnd")
}

private let userDefaultsKey = "BlackoutFamilyActivitySelection"
private let reenableTimestampKey = "BlackoutShieldReenableAt"

public class ExpoFamilyControlsModule: Module {
  private static var reenableWorkItem: DispatchWorkItem?
  private static var backgroundTask: UIBackgroundTaskIdentifier = .invalid

  public func definition() -> ModuleDefinition {
    Name("ExpoFamilyControls")

    AsyncFunction("requestAuthorization") { () -> String in
      do {
        let center = AuthorizationCenter.shared
        try await center.requestAuthorization(for: .individual)
        return "authorized"
      } catch {
        return "denied"
      }
    }

    AsyncFunction("selectAppsToBlock") { () -> Bool in
      return await withCheckedContinuation { continuation in
        DispatchQueue.main.async {
          Self.presentAppPicker(continuation: continuation)
        }
      }
    }

    AsyncFunction("enableShielding") { () in
      await MainActor.run { Self.applyShield(enable: true) }
    }

    AsyncFunction("disableShielding") { () in
      await MainActor.run { Self.applyShield(enable: false) }
    }

    AsyncFunction("disableShieldingForDuration") { (seconds: Int) in
      await MainActor.run { Self.applyShield(enable: false) }
      Self.scheduleReenable(afterSeconds: seconds)
      Self.scheduleBreakMonitor(durationSec: seconds)
    }

    AsyncFunction("cancelBreakTimer") { () in
      Self.cancelScheduledReenable()
      Self.cancelBreakMonitor()
    }

    AsyncFunction("checkAndReenable") { () -> Bool in
      return Self.checkAndReenableIfNeeded()
    }

    AsyncFunction("hasStoredSelection") { () -> Bool in
      guard let s = Self.loadSelection() else { return false }
      return !s.applicationTokens.isEmpty || !s.categoryTokens.isEmpty
    }
  }

  private static func loadSelection() -> FamilyActivitySelection? {
    guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else { return nil }
    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  private static func saveSelection(_ selection: FamilyActivitySelection) {
    if let data = try? PropertyListEncoder().encode(selection) {
      UserDefaults.standard.set(data, forKey: userDefaultsKey)
    }
  }

  private static func applyShield(enable: Bool) {
    let store = ManagedSettingsStore()
    if enable {
      store.shield.applications = nil
      store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy<Application>.all()
    } else {
      store.shield.applications = nil
      store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy<Application>.none
    }
  }

  private static func scheduleReenable(afterSeconds seconds: Int) {
    cancelScheduledReenable()

    let reenableDate = Date().addingTimeInterval(Double(seconds))
    UserDefaults.standard.set(reenableDate.timeIntervalSince1970, forKey: reenableTimestampKey)

    let taskId = UIApplication.shared.beginBackgroundTask(withName: "blackout.reenable") {
      cancelScheduledReenable()
    }
    backgroundTask = taskId

    let work = DispatchWorkItem {
      DispatchQueue.main.async { Self.applyShield(enable: true) }
      UserDefaults.standard.removeObject(forKey: reenableTimestampKey)
      endBackgroundTaskIfNeeded()
    }
    reenableWorkItem = work
    DispatchQueue.main.asyncAfter(deadline: .now() + Double(seconds), execute: work)
  }

  private static func cancelScheduledReenable() {
    reenableWorkItem?.cancel()
    reenableWorkItem = nil
    UserDefaults.standard.removeObject(forKey: reenableTimestampKey)
    endBackgroundTaskIfNeeded()
  }

  private static func endBackgroundTaskIfNeeded() {
    if backgroundTask != .invalid {
      UIApplication.shared.endBackgroundTask(backgroundTask)
      backgroundTask = .invalid
    }
  }

  private static func scheduleBreakMonitor(durationSec: Int) {
    let center = DeviceActivityCenter()
    center.stopMonitoring([.breakEnd])

    let calendar = Calendar.current
    let start = Date().addingTimeInterval(2)
    let end = start.addingTimeInterval(Double(durationSec))

    let schedule = DeviceActivitySchedule(
      intervalStart: calendar.dateComponents([.hour, .minute, .second], from: start),
      intervalEnd: calendar.dateComponents([.hour, .minute, .second], from: end),
      repeats: false
    )

    do {
      try center.startMonitoring(.breakEnd, during: schedule)
    } catch {
      // DeviceActivity monitoring failed; DispatchWorkItem timer is still active as fallback
    }
  }

  private static func cancelBreakMonitor() {
    let center = DeviceActivityCenter()
    center.stopMonitoring([.breakEnd])
  }

  @discardableResult
  static func checkAndReenableIfNeeded() -> Bool {
    let timestamp = UserDefaults.standard.double(forKey: reenableTimestampKey)
    guard timestamp > 0 else { return false }
    if Date().timeIntervalSince1970 >= timestamp {
      DispatchQueue.main.async { applyShield(enable: true) }
      cancelScheduledReenable()
      return true
    }
    return false
  }

  private static func topViewController(from base: UIViewController?) -> UIViewController? {
    if let presented = base?.presentedViewController { return topViewController(from: presented) }
    if let nav = base as? UINavigationController { return topViewController(from: nav.visibleViewController) }
    if let tab = base as? UITabBarController { return topViewController(from: tab.selectedViewController) }
    return base
  }

  private static func presentAppPicker(continuation: CheckedContinuation<Bool, Never>) {
    guard let windowScene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first(where: { $0.activationState == .foregroundActive }),
      let rootVC = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController
    else {
      continuation.resume(returning: false)
      return
    }

    let topVC = topViewController(from: rootVC) ?? rootVC

    let pickerView = AppPickerHostView(
      initialSelection: loadSelection() ?? FamilyActivitySelection(),
      onDone: { selection in
        saveSelection(selection)
        topVC.dismiss(animated: true) { continuation.resume(returning: true) }
      },
      onCancel: {
        topVC.dismiss(animated: true) { continuation.resume(returning: false) }
      }
    )

    let hosting = UIHostingController(rootView: pickerView)
    hosting.modalPresentationStyle = .pageSheet
    if let sheet = hosting.sheetPresentationController {
      sheet.detents = [.large()]
    }
    topVC.present(hosting, animated: true)
  }
}

private struct AppPickerHostView: View {
  @State var selection: FamilyActivitySelection
  var onDone: (FamilyActivitySelection) -> Void
  var onCancel: () -> Void

  init(initialSelection: FamilyActivitySelection, onDone: @escaping (FamilyActivitySelection) -> Void, onCancel: @escaping () -> Void) {
    _selection = State(initialValue: initialSelection)
    self.onDone = onDone
    self.onCancel = onCancel
  }

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Select Entertainment & Games")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") { onCancel() }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") { onDone(selection) }
          }
        }
    }
  }
}
