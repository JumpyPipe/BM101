import SwiftUI

struct TipsCarouselView: View {
    @ObservedObject var viewModel: DashboardViewModel

    var body: some View {
        if !viewModel.tips.isEmpty {
            CardView(title: "Tips for this stage") {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(viewModel.tips) { tip in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                BadgeView(text: tip.category.label, tint: .orange)
                                Spacer()
                                Button {
                                    Task { await viewModel.dismissTip(tip) }
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                            Text(tip.content).font(.footnote)
                        }
                        if tip.id != viewModel.tips.last?.id {
                            Divider()
                        }
                    }
                }
            }
        }
    }
}
