import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let baby = appState.currentBaby {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(baby.name).font(.largeTitle.bold())
                            Text(baby.ageLabel).foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)

                        if let error = viewModel.errorMessage {
                            ErrorBanner(message: error)
                        }

                        SummaryCardsView(viewModel: viewModel)
                        PredictionBannerView(predictions: viewModel.predictions)
                        QuickActionsView(babyId: baby.id, viewModel: viewModel)
                        TipsCarouselView(viewModel: viewModel)
                        RecentActivityView(items: viewModel.recentActivity)
                    }
                }
                .padding()
            }
            .refreshable { await reload() }
            .navigationBarTitleDisplayMode(.inline)
            .task { await reload() }
            .onChange(of: appState.currentBabyId) { _ in
                Task { await reload() }
            }
        }
    }

    private func reload() async {
        guard let babyId = appState.currentBaby?.id else { return }
        await viewModel.load(babyId: babyId)
    }
}

private struct RecentActivityView: View {
    let items: [DashboardViewModel.ActivityItem]

    var body: some View {
        CardView(title: "Recent activity") {
            if items.isEmpty {
                Text("Nothing logged yet.").font(.footnote).foregroundStyle(.secondary)
            } else {
                VStack(spacing: 0) {
                    ForEach(items) { item in
                        HStack {
                            BadgeView(text: item.kind)
                            Text(item.label).font(.footnote)
                            Spacer()
                            Text(Formatting.dateTime(item.at))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 6)
                        if item.id != items.last?.id {
                            Divider()
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    DashboardView().environmentObject(AppState())
}
