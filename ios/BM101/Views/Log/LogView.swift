import SwiftUI

enum LogKind: String, CaseIterable, Identifiable {
    case feeding = "Feeding"
    case sleep = "Sleep"
    case diaper = "Diaper"
    case growth = "Growth"
    case milestone = "Milestone"

    var id: String { rawValue }
}

struct LogView: View {
    @EnvironmentObject private var appState: AppState
    @State private var kind: LogKind = .feeding
    @State private var confirmation: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let babyId = appState.currentBaby?.id {
                        QuickNoteView(babyId: babyId)

                        CardView {
                            Picker("What are you logging?", selection: $kind) {
                                ForEach(LogKind.allCases) { Text($0.rawValue).tag($0) }
                            }
                            .pickerStyle(.segmented)

                            Divider().padding(.vertical, 4)

                            form(for: kind, babyId: babyId)
                        }

                        if let confirmation {
                            Text(confirmation)
                                .font(.footnote)
                                .foregroundStyle(.green)
                        }
                    } else {
                        Text("Add a baby first from the More tab.")
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()
            }
            .navigationTitle("Log")
        }
    }

    @ViewBuilder
    private func form(for kind: LogKind, babyId: String) -> some View {
        switch kind {
        case .feeding:
            FeedingLogFormView(babyId: babyId) { showConfirmation("Feeding logged.") }
        case .sleep:
            SleepLogFormView(babyId: babyId) { showConfirmation("Sleep logged.") }
        case .diaper:
            DiaperLogFormView(babyId: babyId) { showConfirmation("Diaper logged.") }
        case .growth:
            GrowthLogFormView(babyId: babyId) { showConfirmation("Measurement logged.") }
        case .milestone:
            MilestoneLogFormView(babyId: babyId) { showConfirmation("Milestone logged.") }
        }
    }

    private func showConfirmation(_ message: String) {
        confirmation = message
        Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            if confirmation == message { confirmation = nil }
        }
    }
}

#Preview {
    LogView().environmentObject(AppState())
}
