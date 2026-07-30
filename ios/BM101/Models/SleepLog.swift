import Foundation

enum SleepType: String, Codable, CaseIterable, Identifiable {
    case nap = "NAP"
    case night = "NIGHT"

    var id: String { rawValue }
    var label: String { self == .nap ? "Nap" : "Night sleep" }
}

struct SleepLog: Codable, Identifiable, Hashable {
    let id: String
    let babyId: String
    var type: SleepType
    var startedAt: Date
    var endedAt: Date?
    var note: String?
    let createdAt: Date
    let updatedAt: Date

    var durationMinutes: Int? {
        guard let endedAt else { return nil }
        return Int(endedAt.timeIntervalSince(startedAt) / 60)
    }

    var summary: String {
        guard let durationMinutes else { return "\(type.label) (ongoing)" }
        let h = durationMinutes / 60
        let m = durationMinutes % 60
        let durationText = h > 0 ? (m > 0 ? "\(h)h \(m)m" : "\(h)h") : "\(m) min"
        return "\(type.label) · \(durationText)"
    }
}

struct SleepLogsResponse: Codable {
    let logs: [SleepLog]
}

struct SleepLogResponse: Codable {
    let log: SleepLog
}
