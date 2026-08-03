import SwiftUI
import Photos
import UIKit

/// Full-screen, swipeable viewer over an album's assets, starting at
/// `initialIndex`.
struct PhotoDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let assets: [PHAsset]
    @State var currentIndex: Int

    init(assets: [PHAsset], initialIndex: Int) {
        self.assets = assets
        _currentIndex = State(initialValue: initialIndex)
    }

    var body: some View {
        NavigationStack {
            TabView(selection: $currentIndex) {
                ForEach(Array(assets.enumerated()), id: \.offset) { index, asset in
                    PhotoDetailPage(asset: asset)
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .background(Color.black)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .principal) {
                    if let date = assets[safe: currentIndex]?.creationDate {
                        Text(date.formatted(date: .abbreviated, time: .shortened))
                            .font(.footnote)
                    }
                }
            }
        }
    }
}

private struct PhotoDetailPage: View {
    let asset: PHAsset
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
            } else {
                ProgressView()
                    .tint(.white)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .task {
            image = await PhotoLibraryManager.shared.requestFullImage(for: asset)
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

#Preview {
    Text("Preview requires real PHAssets")
}
