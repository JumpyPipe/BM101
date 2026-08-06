import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

/// Deliberately separate from `Caregiver` — the login response doesn't
/// include createdAt/updatedAt, and decoding against the full `Caregiver`
/// model (which requires them) would fail.
struct LoginCaregiver: Decodable {
    let id: String
    let name: String
    let role: String
    let email: String?
}

struct LoginResponse: Decodable {
    let token: String
    let caregiver: LoginCaregiver
}
