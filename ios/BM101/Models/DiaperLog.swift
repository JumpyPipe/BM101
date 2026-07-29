import Foundation

enum DiaperType: String, Codable, CaseIterable, Identifiable {
    case wet = "WET"
    case dirty = "DIRTY"
    case mixed = "MIXED"

    var id: String { rawValue }
    var label: String {
        switch self {
        case .wet: return "Wet"
        case .dirty: return "Dirty"
        case .mixed: return "Mixed"
        }
    }
}

struct DiaperLog: Codable, Identifiable, Hashable {
    let id: String
    let babyId: String
    var type: DiaperType
    var occurredAt: Date
    var note: String?
    let createdAt: Date
    let updatedAt: Date
}

struct DiaperLogsResponse: Codable {
    let logs: [DiaperLog]
}

struct DiaperLogResponse: Codable {
    let log: DiaperLog
}
