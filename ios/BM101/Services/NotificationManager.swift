import Foundation
import UserNotifications

/// Wraps UNUserNotificationCenter for the two "predictable event" reminders
/// (doc section 5): a feed window and a sleep window. Each reminder carries
/// two actions so a caregiver can respond without opening the app:
/// "Logged ✓" (creates a same-second log with sensible defaults — edit the
/// specifics later in-app) and "Snooze 15m" (reschedules 15 minutes out).
///
/// Predictions themselves are computed server-side (`/api/v1/predictions`) —
/// this class only turns a predicted time into a local notification.
@MainActor
final class NotificationManager: NSObject, ObservableObject {
    static let shared = NotificationManager()

    enum ReminderKind: String {
        case feeding = "FEEDING"
        case sleep = "SLEEP"

        var identifier: String { "bm101.reminder.\(rawValue.lowercased())" }
        var categoryId: String { "\(rawValue)_REMINDER" }
        var title: String { self == .feeding ? "Feeding time soon" : "Nap/sleep window coming up" }
    }

    private static let logActionId = "LOG_ACTION"
    private static let snoozeActionId = "SNOOZE_ACTION"
    private static let snoozeInterval: TimeInterval = 15 * 60

    private static let customReminderCategoryId = "CUSTOM_REMINDER"
    private static func customReminderIdentifier(_ reminderId: String) -> String {
        "bm101.reminder.custom.\(reminderId)"
    }
    /// Separate identifier for a one-off snooze so it doesn't clobber a
    /// recurring (.daily/.interval) reminder's own pending trigger.
    private static func customReminderSnoozeIdentifier(_ reminderId: String) -> String {
        "bm101.reminder.custom.\(reminderId).snooze"
    }

    /// Set by the app once a baby is selected, so a notification action
    /// (which arrives with no other context) knows which baby to log for.
    var activeBabyId: String?

    @Published var authorizationGranted = false

    private override init() {
        super.init()
    }

    func configure() {
        UNUserNotificationCenter.current().delegate = self
        registerCategories()
    }

    func requestAuthorization() async {
        let center = UNUserNotificationCenter.current()
        do {
            authorizationGranted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            authorizationGranted = false
        }
    }

    private func registerCategories() {
        let logAction = UNNotificationAction(
            identifier: Self.logActionId, title: "Logged ✓", options: []
        )
        let snoozeAction = UNNotificationAction(
            identifier: Self.snoozeActionId, title: "Snooze 15m", options: []
        )
        let predictionCategories = [ReminderKind.feeding, .sleep].map {
            UNNotificationCategory(
                identifier: $0.categoryId,
                actions: [logAction, snoozeAction],
                intentIdentifiers: [],
                options: []
            )
        }
        let customCategory = UNNotificationCategory(
            identifier: Self.customReminderCategoryId,
            actions: [snoozeAction],
            intentIdentifiers: [],
            options: []
        )
        UNUserNotificationCenter.current().setNotificationCategories(
            Set(predictionCategories + [customCategory])
        )
    }

    // MARK: - Custom reminders (ReminderStore)

    /// Schedules (replacing any existing) local notification(s) for a
    /// user-defined reminder. `.daily` and `.interval` schedules repeat
    /// indefinitely until cancelled; `.oneTime` fires once.
    func scheduleCustomReminder(_ reminder: Reminder, asSnooze: Bool = false) {
        let center = UNUserNotificationCenter.current()
        let identifier = asSnooze
            ? Self.customReminderSnoozeIdentifier(reminder.id)
            : Self.customReminderIdentifier(reminder.id)
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
        guard reminder.isEnabled else { return }

        let content = UNMutableNotificationContent()
        content.title = reminder.title
        if !reminder.notes.isEmpty { content.body = reminder.notes }
        content.categoryIdentifier = Self.customReminderCategoryId
        content.sound = .default
        content.userInfo = ["reminderId": reminder.id]

        let trigger: UNNotificationTrigger
        switch reminder.schedule {
        case .oneTime(let date):
            guard date > Date() else { return }
            var comps = Calendar.current.dateComponents(
                [.year, .month, .day, .hour, .minute], from: date
            )
            comps.second = 0
            trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        case .daily(let hour, let minute):
            var comps = DateComponents()
            comps.hour = hour
            comps.minute = minute
            trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        case .interval(let seconds):
            // UNTimeIntervalNotificationTrigger requires >= 60s for repeats.
            trigger = UNTimeIntervalNotificationTrigger(
                timeInterval: max(60, seconds), repeats: true
            )
        }

        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        center.add(request)
    }

    func cancelCustomReminder(id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: [Self.customReminderIdentifier(id), Self.customReminderSnoozeIdentifier(id)]
        )
    }

    /// Schedules (replacing any existing) local notification for a predicted
    /// event time. Silently no-ops if the predicted time is already past.
    func scheduleReminder(kind: ReminderKind, at date: Date, confidence: Double) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [kind.identifier])

        guard date > Date() else { return }

        let content = UNMutableNotificationContent()
        content.title = kind.title
        content.body = confidence >= 0.6
            ? "Based on recent patterns, expect this around now."
            : "Based on recent patterns — timing is less certain than usual."
        content.categoryIdentifier = kind.categoryId
        content.sound = .default
        content.userInfo = ["kind": kind.rawValue]

        let interval = max(60, date.timeIntervalSinceNow)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        let request = UNNotificationRequest(identifier: kind.identifier, content: content, trigger: trigger)
        center.add(request)
    }

    private func snooze(kind: ReminderKind) {
        scheduleReminder(kind: kind, at: Date().addingTimeInterval(Self.snoozeInterval), confidence: 0.5)
    }

    /// "Logged ✓" default entries — intentionally minimal (no amount/type
    /// detail); the caregiver can add specifics later from History.
    private func logQuickDefault(kind: ReminderKind) async {
        guard let babyId = activeBabyId else { return }
        do {
            switch kind {
            case .feeding:
                _ = try await APIClient.shared.createFeedingLog(
                    CreateFeedingLogRequest(
                        babyId: babyId, type: .bottle, side: nil, amountMl: nil,
                        durationMin: nil, startedAt: Date(), note: "Quick-logged from notification"
                    )
                )
            case .sleep:
                _ = try await APIClient.shared.createSleepLog(
                    CreateSleepLogRequest(
                        babyId: babyId, type: .nap, startedAt: Date(), endedAt: nil,
                        note: "Quick-logged from notification"
                    )
                )
            }
        } catch {
            // Best-effort — the notification has already been dismissed by
            // the time this runs; nothing meaningful to surface to the user.
        }
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .list])
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let rawKind = userInfo["kind"] as? String
        let reminderId = userInfo["reminderId"] as? String
        let actionId = response.actionIdentifier

        Task { @MainActor in
            defer { completionHandler() }

            if let rawKind, let kind = ReminderKind(rawValue: rawKind) {
                switch actionId {
                case Self.logActionId:
                    await self.logQuickDefault(kind: kind)
                case Self.snoozeActionId:
                    self.snooze(kind: kind)
                default:
                    break // UNNotificationDefaultActionIdentifier — just opens the app
                }
                return
            }

            if let reminderId, actionId == Self.snoozeActionId,
               let reminder = ReminderStore.shared.reminders.first(where: { $0.id == reminderId }) {
                var snoozed = reminder
                snoozed.schedule = .oneTime(Date().addingTimeInterval(Self.snoozeInterval))
                // Scheduled under a separate "snooze" identifier so a recurring
                // (.daily/.interval) reminder's own trigger is left untouched.
                self.scheduleCustomReminder(snoozed, asSnooze: true)
            }
        }
    }
}
