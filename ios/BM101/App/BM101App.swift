import SwiftUI

@main
struct BM101App: App {
    @StateObject private var appState = AppState()

    init() {
        NotificationManager.shared.configure()
        // Touch the singleton so persisted reminders re-arm their local
        // notifications on every launch, not just when the Reminders screen
        // is opened.
        _ = ReminderStore.shared
    }

    var body: some Scene {
        WindowGroup {
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
}
