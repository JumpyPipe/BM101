import SwiftUI

struct FeedingLogFormView: View {
    let babyId: String
    var onLogged: () -> Void

    @State private var type: FeedingType = .bottle
    @State private var side: FeedingSide = .left
    @State private var amountMl: String = ""
    @State private var durationMin: String = ""
    @State private var startedAt = Date()
    @State private var note = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Type", selection: $type) {
                ForEach(FeedingType.allCases) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented)

            if type == .breast {
                Picker("Side", selection: $side) {
                    ForEach(FeedingSide.allCases) { Text($0.label).tag($0) }
                }
                TextField("Duration (min)", text: $durationMin)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)
            } else if type == .bottle {
                TextField("Amount (ml)", text: $amountMl)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)
            }

            DatePicker("Time", selection: $startedAt)
            TextField("Note (optional)", text: $note)
                .textFieldStyle(.roundedBorder)

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Button(isSaving ? "Saving…" : "Log feeding") { save() }
                .buttonStyle(.borderedProminent)
                .disabled(isSaving)
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                _ = try await APIClient.shared.createFeedingLog(
                    CreateFeedingLogRequest(
                        babyId: babyId,
                        type: type,
                        side: type == .breast ? side : nil,
                        amountMl: type == .bottle ? Double(amountMl) : nil,
                        durationMin: type == .breast ? Double(durationMin) : nil,
                        startedAt: startedAt,
                        note: note.isEmpty ? nil : note
                    )
                )
                amountMl = ""; durationMin = ""; note = ""; startedAt = Date()
                onLogged()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
