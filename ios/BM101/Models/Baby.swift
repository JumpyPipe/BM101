import Foundation

enum Sex: String, Codable, CaseIterable, Identifiable {
    case male = "MALE"
    case female = "FEMALE"
    case unknown = "UNKNOWN"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .male: return "Male"
        case .female: return "Female"
        case .unknown: return "Prefer not to say"
        }
    }
}

struct Baby: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var dob: Date
    var sex: Sex
    var photoUrl: String?
    var notes: String?
    let createdAt: Date
    let updatedAt: Date

    /// Age in whole days, used for tip/prediction age-gating on the client.
    var ageInDays: Int {
        Calendar.current.dateComponents([.day], from: dob, to: Date()).day ?? 0
    }

    var ageLabel: String {
        let days = ageInDays
        if days < 60 {
            return "\(days) day\(days == 1 ? "" : "s") old"
        }
        let months = days / 30
        if months < 24 {
            return "\(months) month\(months == 1 ? "" : "s") old"
        }
        let years = months / 12
        let remMonths = months % 12
        return "\(years)y \(remMonths)m old"
    }
}

struct BabiesResponse: Codable {
    let babies: [Baby]
}

struct BabyResponse: Codable {
    let baby: Baby
}

struct Caregiver: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var role: String
    let createdAt: Date
    let updatedAt: Date
}

struct CaregiversResponse: Codable {
    let caregivers: [Caregiver]
}

struct CaregiverResponse: Codable {
    let caregiver: Caregiver
}
