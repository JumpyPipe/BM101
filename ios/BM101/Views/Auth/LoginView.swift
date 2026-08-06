import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var isLoggingIn = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Image(systemName: "figure.and.child.holdinghands")
                        .font(.system(size: 44))
                        .foregroundStyle(.pink)
                    Text("Snug")
                        .font(.largeTitle.bold())
                    Text("Sign in to see your baby's log.")
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 40)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding(12)
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding(12)
                        .background(Color(.secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    Button {
                        signIn()
                    } label: {
                        Text(isLoggingIn ? "Signing in…" : "Sign In")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(email.trimmingCharacters(in: .whitespaces).isEmpty || password.isEmpty || isLoggingIn)
                }
                .padding(.horizontal, 24)

                Spacer()

                Text("Use the email and password you set up on the web app (the \"Login & security\" section under a caregiver's profile).")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                    .padding(.bottom, 24)
            }
        }
    }

    private func signIn() {
        isLoggingIn = true
        errorMessage = nil
        Task {
            do {
                try await authManager.login(
                    email: email.trimmingCharacters(in: .whitespaces), password: password
                )
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoggingIn = false
        }
    }
}

#Preview {
    LoginView().environmentObject(AuthManager.shared)
}
