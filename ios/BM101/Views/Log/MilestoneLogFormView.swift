import SwiftUI

struct MilestoneLogFormView: View {
    let babyId: String
    var onLogged: () -> Void

    static let categories = ["Motor", "Social", "Language", "Cognitive", "Feeding", "Other"]

    @State private var title = ""
    @State private var category = "Motor"
    @State private var occurredAt = Date()
    @State private var description = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField("Title, e.g. 'First steps'", text: $title)
                .textFieldStyle(.roundedBorder)
            Picker("Category", selection: $category) {
                ForEach(Self.categories, id: \.self) { Text($0).tag($0) }
            }
            DatePicker("Date", selection: $occurredAt, displayedComponents: .date)
            TextField("Notes (optional)", text: $description, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(2...4)

            if let errorMessage {
                ErrorBanner(message: errorMessage)
            }

            Button(isSaving ? "Saving…" : "Log milestone") { save() }
                .buttonStyle(.borderedProminent)
                .disabled(isSaving || title.trimmingCharacters(in: .whitespaces).isEmpty)
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                _ = try await APIClient.shared.createMilestone(
                    CreateMilestoneRequest(
                        babyId: babyId, occurredAt: occurredAt, category: category,
                        title: title, description: description.isEmpty ? nil : description
                    )
                )
                title = ""; description = ""
                onLogged()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
