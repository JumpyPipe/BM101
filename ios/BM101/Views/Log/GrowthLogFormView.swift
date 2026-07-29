import SwiftUI

struct GrowthLogFormView: View {
    let babyId: String
    var onLogged: () -> Void

    @State private var weightKg = ""
    @State private var heightCm = ""
    @State private var headCm = ""
    @State private var measuredAt = Date()
    @State private var note = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField("Weight (kg)", text: $weightKg)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)
            TextField("Height (cm)", text: $heightCm)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)
            TextField("Head circumference (cm)", text: $headCm)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)
            DatePicker("Date", selection: $measuredAt, displayedComponents: .date)
            TextField("Note (optional)", text: $note)
                .textFieldStyle(.roundedBorder)

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Button(isSaving ? "Saving…" : "Log measurement") { save() }
                .buttonStyle(.borderedProminent)
                .disabled(isSaving)
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                _ = try await APIClient.shared.createGrowthLog(
                    CreateGrowthLogRequest(
                        babyId: babyId,
                        measuredAt: measuredAt,
                        weightKg: Double(weightKg),
                        heightCm: Double(heightCm),
                        headCm: Double(headCm),
                        note: note.isEmpty ? nil : note
                    )
                )
                weightKg = ""; heightCm = ""; headCm = ""; note = ""
                onLogged()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
