import SwiftUI

/// Text-based version of the concept doc's "voice/NL parsing" step — routes
/// free text through `/api/v1/parse` (Claude tool use) instead of a
/// dedicated form. Real speech-to-text is a follow-up (see PLANNING-iOS.md).
struct QuickNoteView: View {
    let babyId: String

    @State private var text = ""
    @State private var isSubmitting = false
    @State private var resultMessage: String?
    @State private var isError = false

    var body: some View {
        CardView(title: "Quick note") {
            VStack(alignment: .leading, spacing: 8) {
                Text("Describe what happened in your own words — e.g. \"fed 4oz bottle 10 min ago\" or \"just woke up\".")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                TextField("What happened?", text: $text, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...3)
                HStack {
                    if let resultMessage {
                        Text(resultMessage)
                            .font(.caption)
                            .foregroundStyle(isError ? .red : .green)
                    }
                    Spacer()
                    Button(isSubmitting ? "Logging…" : "Log it") { submit() }
                        .buttonStyle(.borderedProminent)
                        .disabled(text.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
        }
    }

    private func submit() {
        isSubmitting = true
        resultMessage = nil
        Task {
            do {
                let result = try await APIClient.shared.parseNote(babyId: babyId, text: text)
                if result.logged {
                    isError = false
                    resultMessage = "Logged as \(result.kind ?? "an event")."
                    text = ""
                } else {
                    isError = true
                    resultMessage = result.clarification ?? "Couldn't understand that — try being more specific."
                }
            } catch {
                isError = true
                resultMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}
