import SwiftUI
import Photos
import UIKit

struct PhotoAlbumView: View {
    @ObservedObject private var library = PhotoLibraryManager.shared
    @State private var assets: [PHAsset] = []
    @State private var showingCamera = false
    @State private var showingAlbumPicker = false
    @State private var selectedIndex: Int?
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let columns = [GridItem(.adaptive(minimum: 100), spacing: 2)]

    var body: some View {
        Group {
            if !library.isAuthorized {
                permissionGate
            } else if library.selectedAlbum == nil {
                albumChoicePrompt
            } else {
                albumGrid
            }
        }
        .navigationTitle(library.selectedAlbum?.localizedTitle ?? "Photo Album")
        .toolbar {
            if library.isAuthorized {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAlbumPicker = true
                    } label: {
                        Image(systemName: "photo.stack")
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCamera = true
                    } label: {
                        Image(systemName: "camera")
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $showingCamera) {
            CameraCaptureView(
                onCapture: { image in
                    showingCamera = false
                    Task { await save(image) }
                },
                onCancel: { showingCamera = false }
            )
            .ignoresSafeArea()
        }
        .sheet(isPresented: $showingAlbumPicker) {
            AlbumPickerView()
        }
        .sheet(item: Binding(
            get: { selectedIndex.map { IdentifiableIndex(value: $0) } },
            set: { selectedIndex = $0?.value }
        )) { wrapped in
            PhotoDetailView(assets: assets, initialIndex: wrapped.value)
        }
        .onChange(of: library.selectedAlbumId) { _ in loadAssets() }
        .task { loadAssets() }
    }

    private var permissionGate: some View {
        VStack(spacing: 16) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 44))
                .foregroundStyle(.pink)
            Text("Photos access needed")
                .font(.title3.bold())
            Text("Snug can save photos straight into a Photos album of your choice, and let you browse it here.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 32)
            Button("Allow Photos Access") {
                Task { await library.requestAuthorization() }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var albumChoicePrompt: some View {
        VStack(spacing: 16) {
            Image(systemName: "rectangle.stack.badge.plus")
                .font(.system(size: 44))
                .foregroundStyle(.pink)
            Text("Choose an album")
                .font(.title3.bold())
            Text("Pick an existing Photos album, or create a new one, to save and view photos here.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 32)
            Button("Choose Album") { showingAlbumPicker = true }
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var albumGrid: some View {
        ScrollView {
            if let errorMessage {
                ErrorBanner(message: errorMessage).padding()
            }
            if library.authorizationStatus == .limited {
                limitedAccessBanner
            }
            if assets.isEmpty {
                Text("No photos in this album yet. Tap the camera button to add one.")
                    .foregroundStyle(.secondary)
                    .padding(32)
            } else {
                LazyVGrid(columns: columns, spacing: 2) {
                    ForEach(Array(assets.enumerated()), id: \.element.localIdentifier) { index, asset in
                        Button {
                            selectedIndex = index
                        } label: {
                            PhotoThumbnail(asset: asset)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .overlay {
            if isSaving {
                ProgressView("Saving…")
                    .padding()
                    .background(.regularMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private var limitedAccessBanner: some View {
        HStack {
            Text("Limited Photos access — only some albums/photos are visible.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Button("Manage") {
                if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
                   let root = scene.windows.first?.rootViewController {
                    PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: root)
                }
            }
            .font(.caption)
        }
        .padding(.horizontal)
    }

    private func loadAssets() {
        guard let album = library.selectedAlbum else {
            assets = []
            return
        }
        let fetchResult = library.fetchAssets(in: album)
        var result: [PHAsset] = []
        fetchResult.enumerateObjects { asset, _, _ in result.append(asset) }
        assets = result
    }

    private func save(_ image: UIImage) async {
        guard let album = library.selectedAlbum else { return }
        isSaving = true
        errorMessage = nil
        do {
            try await library.save(image: image, to: album)
            loadAssets()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

private struct IdentifiableIndex: Identifiable {
    let value: Int
    var id: Int { value }
}

private struct PhotoThumbnail: View {
    let asset: PHAsset
    @State private var image: UIImage?

    var body: some View {
        Color(.tertiarySystemFill)
            .aspectRatio(1, contentMode: .fill)
            .overlay {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                }
            }
            .clipped()
            .task {
                image = await PhotoLibraryManager.shared.requestThumbnail(
                    for: asset, targetSize: CGSize(width: 200, height: 200)
                )
            }
    }
}

#Preview {
    NavigationStack { PhotoAlbumView() }
}
