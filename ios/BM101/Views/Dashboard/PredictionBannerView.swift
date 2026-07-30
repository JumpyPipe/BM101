import SwiftUI

struct PredictionBannerView: View {
    let predictions: PredictionsResponse?

    var body: some View {
        CardView(title: "Predicted next") {
            if predictions?.feeding == nil && predictions?.sleep == nil {
                Text("Log a few more feedings and sleep sessions to unlock predictions.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                HStack(spacing: 16) {
                    if let feeding = predictions?.feeding {
                        row(icon: "drop.fill", tint: .pink, title: "Feeding", prediction: feeding)
                    }
                    if let sleep = predictions?.sleep {
                        row(icon: "moon.fill", tint: .indigo, title: "Sleep", prediction: sleep)
                    }
                }
            }
        }
    }

    private func row(icon: String, tint: Color, title: String, prediction: Prediction) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(title, systemImage: icon)
                .font(.caption.weight(.semibold))
                .foregroundStyle(tint)
            Text(Formatting.relative(prediction.predictedTime))
                .font(.headline)
            Text("\(Int(prediction.confidence * 100))% confidence")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    PredictionBannerView(predictions: nil).padding()
}
