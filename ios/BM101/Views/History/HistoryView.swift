import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = HistoryViewModel()
    @State private var kind: LogKind = .feeding

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Type", selection: $kind) {
                    ForEach(LogKind.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding()

                if let error = viewModel.errorMessage {
                    ErrorBanner(message: error).padding(.horizontal)
                }

                List {
                    switch kind {
                    case .feeding:
                        ForEach(viewModel.feedings) { log in
                            HStack {
                                BadgeView(text: log.type.label, tint: .pink)
                                Text(log.summary).font(.footnote)
                                Spacer()
                                Text(Formatting.dateTime(log.startedAt)).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    case .sleep:
                        ForEach(viewModel.sleeps) { log in
                            HStack {
                                BadgeView(text: log.type.label, tint: .indigo)
                                Text(log.summary).font(.footnote)
                                Spacer()
                                if log.endedAt == nil {
                                    Button("End now") { Task { await viewModel.endSleep(log) } }
                                        .font(.caption)
                                        .buttonStyle(.bordered)
                                }
                                Text(Formatting.dateTime(log.startedAt)).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    case .diaper:
                        ForEach(viewModel.diapers) { log in
                            HStack {
                                BadgeView(text: log.type.label, tint: .cyan)
                                Spacer()
                                Text(Formatting.dateTime(log.occurredAt)).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    case .growth:
                        ForEach(viewModel.growth) { log in
                            HStack {
                                VStack(alignment: .leading) {
                                    if let w = log.weightKg { Text("\(w, specifier: "%.2f") kg") }
                                    if let h = log.heightCm { Text("\(h, specifier: "%.1f") cm") }
                                }
                                .font(.footnote)
                                Spacer()
                                Text(Formatting.dateOnly(log.measuredAt)).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    case .milestone:
                        ForEach(viewModel.milestones) { milestone in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    BadgeView(text: milestone.category, tint: .orange)
                                    Text(milestone.title).font(.footnote.weight(.medium))
                                }
                                if let description = milestone.description {
                                    Text(description).font(.caption).foregroundStyle(.secondary)
                                }
                                Text(Formatting.dateOnly(milestone.occurredAt))
                                    .font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .overlay {
                    if viewModel.isLoading { ProgressView() }
                }
            }
            .navigationTitle("History")
            .task(id: kind) { await reload() }
            .onChange(of: appState.currentBabyId) { _ in
                Task { await reload() }
            }
            .refreshable { await reload() }
        }
    }

    private func reload() async {
        guard let babyId = appState.currentBaby?.id else { return }
        await viewModel.load(babyId: babyId, kind: kind)
    }
}

#Preview {
    HistoryView().environmentObject(AppState())
}
