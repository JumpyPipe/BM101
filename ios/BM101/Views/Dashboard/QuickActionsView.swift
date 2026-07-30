import SwiftUI

struct QuickActionsView: View {
    let babyId: String
    @ObservedObject var viewModel: DashboardViewModel

    var body: some View {
        CardView(title: "Quick log") {
            HStack(spacing: 10) {
                quickButton(title: "Wet diaper", icon: "drop") {
                    Task { await viewModel.quickLogDiaper(babyId: babyId, type: .wet) }
                }
                quickButton(title: "Dirty diaper", icon: "drop.fill") {
                    Task { await viewModel.quickLogDiaper(babyId: babyId, type: .dirty) }
                }
            }
        }
    }

    private func quickButton(title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.footnote.weight(.medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
        }
        .buttonStyle(.bordered)
    }
}
