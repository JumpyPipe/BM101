import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.isLoading && appState.babies.isEmpty {
                ProgressView("Loading…")
            } else if appState.currentBaby == nil {
                NoBabyView()
            } else {
                MainTabView()
            }
        }
        .alert(
            "Couldn't load data",
            isPresented: .constant(appState.loadError != nil),
            actions: {
                Button("Retry") { Task { await appState.loadBabies() } }
                Button("Dismiss", role: .cancel) { appState.loadError = nil }
            },
            message: { Text(appState.loadError ?? "") }
        )
    }
}

private struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "square.grid.2x2") }

            LogView()
                .tabItem { Label("Log", systemImage: "plus.circle") }

            HistoryView()
                .tabItem { Label("History", systemImage: "clock") }

            AssistantView()
                .tabItem { Label("Assistant", systemImage: "bubble.left.and.bubble.right") }

            MoreView()
                .tabItem { Label("More", systemImage: "ellipsis.circle") }
        }
    }
}

private struct NoBabyView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showingAddBaby = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "figure.child")
                    .font(.system(size: 48))
                    .foregroundStyle(.pink)
                Text("Welcome to BM101")
                    .font(.title2.bold())
                Text("Add your baby's profile to start tracking feedings, sleep, diapers, growth, and milestones.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 32)
                Button("Add your first baby") { showingAddBaby = true }
                    .buttonStyle(.borderedProminent)
            }
            .navigationTitle("BM101")
            .sheet(isPresented: $showingAddBaby) {
                AddBabyView()
            }
        }
    }
}

#Preview {
    RootView().environmentObject(AppState())
}
