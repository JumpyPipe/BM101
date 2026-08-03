import Foundation

/// A caregiver-defined reminder, distinct from the automatic feed/sleep
/// prediction reminders in `NotificationManager`. Entirely local to the
/// device (see `ReminderStore`) — there's no backend model for these, same
/// as the prediction reminders.
struct Reminder: Codable, Identifiable, Hashable {
    enum Schedule: Hashable {
        /// Fires once at a specific date/time, then disables itself.
        case oneTime(Date)
        /// Fires every day at the given hour/minute (24h clock).
        case daily(hour: Int, minute: Int)
        /// Fires repeatedly every `interval` seconds starting from now
        /// (e.g. "every 3 hours" for pumping reminders).
        case interval(TimeInterval)

        var summary: String {
            switch self {
            case .oneTime(let date):
                return "Once, " + date.formatted(date: .abbreviated, time: .shortened)
            case .daily(let hour, let minute):
                var components = DateComponents()
                components.hour = hour
                components.minute = minute
                let date = Calendar.current.date(from: components) ?? Date()
                return "Daily at " + date.formatted(date: .omitted, time: .shortened)
            case .interval(let seconds):
                let hours = seconds / 3600
                if hours == floor(hours) {
                    return "Every \(Int(hours))h"
                }
                return "Every \(Int(seconds / 60))min"
            }
        }
    }

    let id: String
    var title: String
    var notes: String
    var schedule: Schedule
    var isEnabled: Bool
    /// Reminders aren't required to be baby-specific (e.g. "take prenatal
    /// vitamin"), so this is optional.
    var babyId: String?

    init(
        id: String = UUID().uuidString,
        title: String,
        notes: String = "",
        schedule: Schedule,
        isEnabled: Bool = true,
        babyId: String? = nil
    ) {
        self.id = id
        self.title = title
        self.notes = notes
        self.schedule = schedule
        self.isEnabled = isEnabled
        self.babyId = babyId
    }
}

/// Written by hand rather than relying on compiler-synthesized Codable for
/// an enum with associated values, since that can't be verified in this
/// sandbox (no Swift toolchain available — see ios/README.md).
extension Reminder.Schedule: Codable {
    private enum Kind: String, Codable {
        case oneTime, daily, interval
    }

    private enum CodingKeys: String, CodingKey {
        case kind, date, hour, minute, seconds
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        switch try container.decode(Kind.self, forKey: .kind) {
        case .oneTime:
            self = .oneTime(try container.decode(Date.self, forKey: .date))
        case .daily:
            self = .daily(
                hour: try container.decode(Int.self, forKey: .hour),
                minute: try container.decode(Int.self, forKey: .minute)
            )
        case .interval:
            self = .interval(try container.decode(TimeInterval.self, forKey: .seconds))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .oneTime(let date):
            try container.encode(Kind.oneTime, forKey: .kind)
            try container.encode(date, forKey: .date)
        case .daily(let hour, let minute):
            try container.encode(Kind.daily, forKey: .kind)
            try container.encode(hour, forKey: .hour)
            try container.encode(minute, forKey: .minute)
        case .interval(let seconds):
            try container.encode(Kind.interval, forKey: .kind)
            try container.encode(seconds, forKey: .seconds)
        }
    }
}
