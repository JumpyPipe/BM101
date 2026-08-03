import SwiftUI
import Photos

/// Lets the caregiver pick which Photos album new captures get saved into
/// ("album of choice"), or create a new one.
struct AlbumPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var library = PhotoLibraryManager.shared

    @State private var showingNewAlbumPrompt = false
    @State private var newAlbumName = ""
    @State private var isCreating = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                if let errorMessage {
                    Section { ErrorBanner(message: errorMessage) }
                }

                Section {
                    ForEach(library.albums, id: \.localIdentifier) { album in
                        Button {
                            library.selectAlbum(album)
                            dismiss()
                        } label: {
                            HStack {
                                Text(album.localizedTitle ?? "Untitled Album")
                                    .foregroundStyle(.primary)
                                Spacer()
                                if album.localIdentifier == library.selectedAlbumId {
                                    Image(systemName: "checkmark").foregroundStyle(.pink)
                                }
                            }
                        }
                    }
                }

                Section {
                    Button {
                        newAlbumName = ""
                        showingNewAlbumPrompt = true
                    } label: {
                        Label("New Album", systemImage: "plus.circle")
                    }
                    .disabled(isCreating)
                }
            }
            .navigationTitle("Choose Album")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .alert("New Album", isPresented: $showingNewAlbumPrompt) {
                TextField("Album name", text: $newAlbumName)
                Button("Cancel", role: .cancel) {}
                Button("Create") { createAlbum() }
                    .disabled(newAlbumName.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .task { library.refreshAlbums() }
        }
    }

    private func createAlbum() {
        let name = newAlbumName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        isCreating = true
        errorMessage = nil
        Task {
            do {
                let album = try await library.createAlbum(named: name)
                library.selectAlbum(album)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isCreating = false
        }
    }
}

#Preview {
    AlbumPickerView()
}
