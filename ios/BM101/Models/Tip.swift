import Foundation

enum TipCategory: String, Codable {
    case sleep = "SLEEP"
    case feeding = "FEEDING"
    case development = "DEVELOPMENT"
    case safety = "SAFETY"

    var label: String { rawValue.capitalized }
}

struct Tip: Codable, Identifiable, Hashable {
    let id: String
    let babyId: String
    var category: TipCategory
    var content: String
    var ageDaysMin: Int?
    var ageDaysMax: Int?
    var shownAt: Date?
    var dismissed: Bool
    var usefulFeedback: Bool?
    let createdAt: Date
}

struct TipsResponse: Codable {
    let tips: [Tip]
}

enum TipFeedbackAction: String, Codable {
    case dismiss
    case useful
    case notUseful = "not_useful"
}
