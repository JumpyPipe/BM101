import Foundation
import LocalAuthentication

/// Owns login state, the Keychain-stored bearer token, and the optional
/// Face ID "fast unlock" layer on top of it. Password login is the auth of
/// record (matches the web app's per-caregiver accounts); Face ID is a
/// convenience gate in front of an already-issued token, not a separate
/// credential — same framing as the web app's WebAuthn passkey, just using
/// the native `LocalAuthentication` API instead, which is the correct fit
/// for a native app (WebAuthn is a browser-platform mechanism).
@MainActor
final class AuthManager: ObservableObject {
    static let shared = AuthManager()

    private static let tokenKey = "authToken"
    private static let faceIDEnabledDefaultsKey = "bm101.auth.faceIDEnabled"
    private static let caregiverNameDefaultsKey = "bm101.auth.caregiverName"

    @Published private(set) var isLoggedIn: Bool
    @Published private(set) var isUnlocked: Bool
    @Published private(set) var caregiverName: String?
    @Published var faceIDEnabled: Bool {
        didSet { UserDefaults.standard.set(faceIDEnabled, forKey: Self.faceIDEnabledDefaultsKey) }
    }

    var token: String? { KeychainStore.read(forKey: Self.tokenKey) }

    /// Whether this device has Face ID/Touch ID enrolled at all — gates
    /// whether to even show the "enable" toggle.
    var biometryAvailable: Bool {
        LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
    }

    var biometryTypeLabel: String {
        let context = LAContext()
        _ = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        switch context.biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        default: return "your device passcode"
        }
    }

    private init() {
        let faceIDWasEnabled = UserDefaults.standard.bool(forKey: Self.faceIDEnabledDefaultsKey)
        isLoggedIn = KeychainStore.read(forKey: Self.tokenKey) != nil
        faceIDEnabled = faceIDWasEnabled
        caregiverName = UserDefaults.standard.string(forKey: Self.caregiverNameDefaultsKey)
        isUnlocked = !faceIDWasEnabled
    }

    func login(email: String, password: String) async throws {
        let response = try await APIClient.shared.login(email: email, password: password)
        KeychainStore.save(response.token, forKey: Self.tokenKey)
        UserDefaults.standard.set(response.caregiver.name, forKey: Self.caregiverNameDefaultsKey)
        caregiverName = response.caregiver.name
        isLoggedIn = true
        isUnlocked = true // just typed a password — no need to also demand Face ID this instant
    }

    func logout() {
        KeychainStore.delete(forKey: Self.tokenKey)
        UserDefaults.standard.removeObject(forKey: Self.caregiverNameDefaultsKey)
        caregiverName = nil
        isLoggedIn = false
        isUnlocked = !faceIDEnabled
    }

    /// Called by `APIClient` when a request comes back 401 — the token is
    /// invalid or expired server-side, so drop it and fall back to login.
    func handleUnauthorized() {
        guard isLoggedIn else { return }
        logout()
    }

    /// Re-locks the app when Face ID unlock is enabled — call on entering
    /// background, so the next foreground re-prompts.
    func lockIfNeeded() {
        guard faceIDEnabled else { return }
        isUnlocked = false
    }

    /// Prompts Face ID/Touch ID (falling back to device passcode) if
    /// logged in, Face ID unlock is enabled, and not already unlocked this
    /// session. No-ops otherwise.
    func unlockIfNeeded() async {
        guard isLoggedIn, faceIDEnabled, !isUnlocked else { return }
        let context = LAContext()
        let reason = "Unlock Snug to see your baby's data"
        let success = await withCheckedContinuation { continuation in
            context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, _ in
                continuation.resume(returning: success)
            }
        }
        isUnlocked = success
    }
}
