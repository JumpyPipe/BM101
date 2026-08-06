import SwiftUI

@main
struct BM101App: App {
    @StateObject private var appState = AppState()
    @StateObject private var authManager = AuthManager.shared
    @Environment(\.scenePhase) private var scenePhase

    init() {
        NotificationManager.shared.configure()
        // Touch the singleton so persisted reminders re-arm their local
        // notifications on every launch, not just when the Reminders screen
        // is opened.
        _ = ReminderStore.shared
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if !authManager.isLoggedIn {
                    LoginView()
                } else if authManager.faceIDEnabled && !authManager.isUnlocked {
                    LockScreenView()
                } else {
                    RootView()
                        .environmentObject(appState)
                        .task {
                            await appState.loadBabies()
                            NotificationManager.shared.activeBabyId = appState.currentBabyId
                        }
                        .onChange(of: appState.currentBabyId) { newValue in
                            NotificationManager.shared.activeBabyId = newValue
                        }
                }
            }
            .environmentObject(authManager)
            .task { await authManager.unlockIfNeeded() }
        }
        .onChange(of: scenePhase) { newPhase in
            if newPhase == .active {
                Task { await authManager.unlockIfNeeded() }
            } else if newPhase == .background {
                authManager.lockIfNeeded()
            }
        }
    }
}
