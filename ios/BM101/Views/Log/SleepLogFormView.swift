import SwiftUI

struct SleepLogFormView: View {
    let babyId: String
    var onLogged: () -> Void

    @State private var type: SleepType = .nap
    @State private var startedAt = Date()
    @State private var hasEnded = false
    @State private var endedAt = Date()
    @State private var note = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Type", selection: $type) {
                ForEach(SleepType.allCases) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented)

            DatePicker("Start", selection: $startedAt)

            Toggle("Already ended", isOn: $hasEnded)
            if hasEnded {
                DatePicker("End", selection: $endedAt)
            }

            TextField("Note (optional)", text: $note)
                .textFieldStyle(.roundedBorder)

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Button(isSaving ? "Saving…" : "Log sleep") { save() }
                .buttonStyle(.borderedProminent)
                .disabled(isSaving)
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                _ = try await APIClient.shared.createSleepLog(
                    CreateSleepLogRequest(
                        babyId: babyId,
                        type: type,
                        startedAt: startedAt,
                        endedAt: hasEnded ? endedAt : nil,
                        note: note.isEmpty ? nil : note
                    )
                )
                note = ""; startedAt = Date(); hasEnded = false
                onLogged()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
