import SwiftUI

struct MoreView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var notificationManager = NotificationManager.shared
    @StateObject private var authManager = AuthManager.shared
    @State private var caregivers: [Caregiver] = []
    @State private var showingAddBaby = false
    @State private var showingAddCaregiver = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                Section("Babies") {
                    ForEach(appState.babies) { baby in
                        Button {
                            appState.selectBaby(baby.id)
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(baby.name).foregroundStyle(.primary)
                                    Text(baby.ageLabel).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if baby.id == appState.currentBabyId {
                                    Image(systemName: "checkmark").foregroundStyle(.pink)
                                }
                            }
                        }
                    }
                    Button("Add a baby") { showingAddBaby = true }
                }

                Section("Caregivers") {
                    ForEach(caregivers) { caregiver in
                        HStack {
                            Text(caregiver.name)
                            Spacer()
                            Text(caregiver.role).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Button("Add a caregiver") { showingAddCaregiver = true }
                }

                Section("Notifications") {
                    HStack {
                        Text("Predicted feeding/sleep reminders")
                        Spacer()
                        if notificationManager.authorizationGranted {
                            Text("On").foregroundStyle(.green)
                        } else {
                            Button("Enable") {
                                Task { await notificationManager.requestAuthorization() }
                            }
                        }
                    }
                    NavigationLink("Reminders") {
                        RemindersView()
                    }
                }

                Section("Photos") {
                    NavigationLink("Photo Album") {
                        PhotoAlbumView()
                    }
                }

                Section("Security") {
                    if let name = authManager.caregiverName {
                        HStack {
                            Text("Signed in as")
                            Spacer()
                            Text(name).foregroundStyle(.secondary)
                        }
                    }
                    if authManager.biometryAvailable {
                        Toggle(
                            "\(authManager.biometryTypeLabel) Unlock",
                            isOn: Binding(
                                get: { authManager.faceIDEnabled },
                                set: { authManager.faceIDEnabled = $0 }
                            )
                        )
                    }
                    Button("Log Out", role: .destructive) { authManager.logout() }
                }

                if let errorMessage {
                    Section { ErrorBanner(message: errorMessage) }
                }
            }
            .navigationTitle("More")
            .task { await loadCaregivers() }
            .sheet(isPresented: $showingAddBaby) { AddBabyView() }
            .sheet(isPresented: $showingAddCaregiver) {
                AddCaregiverView { caregiver in caregivers.append(caregiver) }
            }
        }
    }

    private func loadCaregivers() async {
        do {
            caregivers = try await APIClient.shared.fetchCaregivers()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct AddCaregiverView: View {
    @Environment(\.dismiss) private var dismiss
    var onAdded: (Caregiver) -> Void

    @State private var name = ""
    @State private var role = "Parent"
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name)
                TextField("Role", text: $role)
                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
            }
            .navigationTitle("Add a caregiver")
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
                let caregiver = try await APIClient.shared.createCaregiver(
                    CreateCaregiverRequest(name: name, role: role)
                )
                onAdded(caregiver)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}

#Preview {
    MoreView().environmentObject(AppState())
}
