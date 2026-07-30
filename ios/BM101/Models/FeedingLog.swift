import Foundation

enum FeedingType: String, Codable, CaseIterable, Identifiable {
    case breast = "BREAST"
    case bottle = "BOTTLE"
    case solid = "SOLID"

    var id: String { rawValue }
    var label: String {
        switch self {
        case .breast: return "Breast"
        case .bottle: return "Bottle"
        case .solid: return "Solid"
        }
    }
}

enum FeedingSide: String, Codable, CaseIterable, Identifiable {
    case left = "LEFT"
    case right = "RIGHT"
    case both = "BOTH"

    var id: String { rawValue }
    var label: String {
        switch self {
        case .left: return "Left"
        case .right: return "Right"
        case .both: return "Both"
        }
    }
}

struct FeedingLog: Codable, Identifiable, Hashable {
    let id: String
    let babyId: String
    var type: FeedingType
    var side: FeedingSide?
    var amountMl: Double?
    var durationMin: Double?
    var startedAt: Date
    var note: String?
    let createdAt: Date
    let updatedAt: Date

    var summary: String {
        switch type {
        case .bottle:
            return amountMl.map { "Bottle · \(Int($0))ml" } ?? "Bottle"
        case .breast:
            var parts = [String]()
            if let side { parts.append(side.label) }
            if let durationMin { parts.append("\(Int(durationMin)) min") }
            return parts.isEmpty ? "Breast" : "Breast · " + parts.joined(separator: " · ")
        case .solid:
            return "Solids"
        }
    }
}

struct FeedingLogsResponse: Codable {
    let logs: [FeedingLog]
}

struct FeedingLogResponse: Codable {
    let log: FeedingLog
}
