import Foundation

// Request payloads for APIClient's POST calls. Optional properties are
// omitted from the encoded JSON when nil (Swift's synthesized Encodable
// uses `encodeIfPresent` for Optional-typed properties), matching the
// backend's zod `.optional()` fields.

struct CreateBabyRequest: Encodable {
    let name: String
    let dob: Date
    let sex: Sex
    let notes: String?
}

struct CreateCaregiverRequest: Encodable {
    let name: String
    let role: String
}

struct CreateFeedingLogRequest: Encodable {
    let babyId: String
    let type: FeedingType
    let side: FeedingSide?
    let amountMl: Double?
    let durationMin: Double?
    let startedAt: Date
    let note: String?
}

struct CreateSleepLogRequest: Encodable {
    let babyId: String
    let type: SleepType
    let startedAt: Date
    let endedAt: Date?
    let note: String?
}

struct CreateDiaperLogRequest: Encodable {
    let babyId: String
    let type: DiaperType
    let occurredAt: Date
    let note: String?
}

struct CreateGrowthLogRequest: Encodable {
    let babyId: String
    let measuredAt: Date
    let weightKg: Double?
    let heightCm: Double?
    let headCm: Double?
    let note: String?
}

struct CreateMilestoneRequest: Encodable {
    let babyId: String
    let occurredAt: Date
    let category: String
    let title: String
    let description: String?
}
