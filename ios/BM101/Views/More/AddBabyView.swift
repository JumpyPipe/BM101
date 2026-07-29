import SwiftUI

struct AddBabyView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var dob = Date()
    @State private var sex: Sex = .unknown
    @State private var notes = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Baby profile") {
                    TextField("Name", text: $name)
                    DatePicker("Date of birth", selection: $dob, in: ...Date(), displayedComponents: .date)
                    Picker("Sex", selection: $sex) {
                        ForEach(Sex.allCases) { Text($0.label).tag($0) }
                    }
                }
                Section("Notes") {
                    TextField("Allergies, preferences, etc. (optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
            }
            .navigationTitle("Add a baby")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                try await appState.addBaby(
                    CreateBabyRequest(
                        name: name, dob: dob, sex: sex,
                        notes: notes.isEmpty ? nil : notes
                    )
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}

#Preview {
    AddBabyView().environmentObject(AppState())
}
