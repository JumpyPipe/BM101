import SwiftUI

struct SummaryCardsView: View {
    @ObservedObject var viewModel: DashboardViewModel

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            summaryCard(
                icon: "drop.fill", label: "Last feeding",
                value: viewModel.recentFeedings.first.map { Formatting.relative($0.startedAt) } ?? "No data",
                hint: viewModel.recentFeedings.first?.type.label
            )
            summaryCard(
                icon: "moon.fill",
                label: viewModel.ongoingSleep != nil ? "Sleeping now" : "Last sleep",
                value: (viewModel.ongoingSleep ?? viewModel.lastCompletedSleep)
                    .map { Formatting.relative($0.startedAt) } ?? "No data",
                hint: viewModel.ongoingSleep != nil ? "In progress" : nil
            )
            summaryCard(
                icon: "figure.child", label: "Diapers today",
                value: "\(viewModel.diapersToday)", hint: nil
            )
            summaryCard(
                icon: "chart.line.uptrend.xyaxis", label: "Latest weight",
                value: viewModel.latestGrowth?.weightKg.map { "\($0) kg" } ?? "No data",
                hint: viewModel.latestGrowth.map { Formatting.relative($0.measuredAt) }
            )
        }
    }

    private func summaryCard(icon: String, label: String, value: String, hint: String?) -> some View {
        CardView {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: icon)
                    .foregroundStyle(.pink)
                    .frame(width: 28, height: 28)
                    .background(Color.pink.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).font(.caption).foregroundStyle(.secondary)
                    Text(value).font(.headline)
                    if let hint {
                        Text(hint).font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}
