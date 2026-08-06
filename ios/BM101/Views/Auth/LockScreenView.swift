import SwiftUI

/// Shown when logged in but Face ID unlock hasn't succeeded yet this
/// session (see AuthManager.isUnlocked / lockIfNeeded).
struct LockScreenView: View {
    @EnvironmentObject private var authManager: AuthManager

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "faceid")
                .font(.system(size: 56))
                .foregroundStyle(.pink)
            Text("Snug is locked")
                .font(.title2.bold())
            Text("Use \(authManager.biometryTypeLabel) to continue.")
                .foregroundStyle(.secondary)
            Button("Unlock") {
                Task { await authManager.unlockIfNeeded() }
            }
            .buttonStyle(.borderedProminent)

            Button("Log Out Instead") { authManager.logout() }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .font(.footnote)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
        .task { await authManager.unlockIfNeeded() }
    }
}

#Preview {
    LockScreenView().environmentObject(AuthManager.shared)
}
