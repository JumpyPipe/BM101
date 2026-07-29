import SwiftUI

struct DiaperLogFormView: View {
    let babyId: String
    var onLogged: () -> Void

    @State private var type: DiaperType = .wet
    @State private var occurredAt = Date()
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Type", selection: $type) {
                ForEach(DiaperType.allCases) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented)

            DatePicker("Time", selection: $occurredAt)

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Button(isSaving ? "Saving…" : "Log diaper") { save() }
                .buttonStyle(.borderedProminent)
                .disabled(isSaving)
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                _ = try await APIClient.shared.createDiaperLog(
                    CreateDiaperLogRequest(babyId: babyId, type: type, occurredAt: occurredAt, note: nil)
                )
                occurredAt = Date()
                onLogged()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
