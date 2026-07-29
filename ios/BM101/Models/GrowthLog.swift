import Foundation

struct GrowthLog: Codable, Identifiable, Hashable {
    let id: String
    let babyId: String
    var measuredAt: Date
    var weightKg: Double?
    var heightCm: Double?
    var headCm: Double?
    var note: String?
    let createdAt: Date
    let updatedAt: Date
}

struct GrowthLogsResponse: Codable {
    let logs: [GrowthLog]
}

struct GrowthLogResponse: Codable {
    let log: GrowthLog
}

struct Milestone: Codable, Identifiable, Hashable {
    let id: String
    let babyId: String
    var occurredAt: Date
    var category: String
    var title: String
    var description: String?
    var photoUrl: String?
    let createdAt: Date
    let updatedAt: Date
}

struct MilestonesResponse: Codable {
    let milestones: [Milestone]
}

struct MilestoneResponse: Codable {
    let milestone: Milestone
}
