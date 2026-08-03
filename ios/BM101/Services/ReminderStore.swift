import Foundation

/// Persists custom reminders locally (`UserDefaults`, JSON-encoded — these
/// are per-device settings, not shared app data, so there's no backend
/// endpoint for them) and keeps their scheduled local notifications in sync
/// with the list.
@MainActor
final class ReminderStore: ObservableObject {
    static let shared = ReminderStore()

    @Published private(set) var reminders: [Reminder] = []

    private let defaultsKey = "bm101.reminders"

    private init() {
        load()
        // Re-arm everything on launch — UNCalendarNotificationTrigger and
        // interval triggers survive a device reboot, but this also recovers
        // from the user having force-quit the app before a schedule change
        // fully round-tripped.
        for reminder in reminders where reminder.isEnabled {
            NotificationManager.shared.scheduleCustomReminder(reminder)
        }
    }

    func add(_ reminder: Reminder) {
        reminders.append(reminder)
        persist()
        if reminder.isEnabled {
            NotificationManager.shared.scheduleCustomReminder(reminder)
        }
    }

    func update(_ reminder: Reminder) {
        guard let index = reminders.firstIndex(where: { $0.id == reminder.id }) else { return }
        reminders[index] = reminder
        persist()
        NotificationManager.shared.cancelCustomReminder(id: reminder.id)
        if reminder.isEnabled {
            NotificationManager.shared.scheduleCustomReminder(reminder)
        }
    }

    func setEnabled(_ id: String, isEnabled: Bool) {
        guard let index = reminders.firstIndex(where: { $0.id == id }) else { return }
        reminders[index].isEnabled = isEnabled
        persist()
        if isEnabled {
            NotificationManager.shared.scheduleCustomReminder(reminders[index])
        } else {
            NotificationManager.shared.cancelCustomReminder(id: id)
        }
    }

    func remove(_ id: String) {
        reminders.removeAll { $0.id == id }
        persist()
        NotificationManager.shared.cancelCustomReminder(id: id)
    }

    private func persist() {
        guard let data = try? JSONEncoder.api.encode(reminders) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey),
              let decoded = try? JSONDecoder.api.decode([Reminder].self, from: data)
        else { return }
        reminders = decoded
    }
}
