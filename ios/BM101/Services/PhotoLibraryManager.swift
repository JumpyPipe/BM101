import Foundation
import Photos
import UIKit

enum PhotoLibraryError: LocalizedError {
    case createAlbumFailed
    case saveFailed

    var errorDescription: String? {
        switch self {
        case .createAlbumFailed: return "Couldn't create the album."
        case .saveFailed: return "Couldn't save the photo."
        }
    }
}

/// Wraps PhotoKit for the app's "album of choice" feature: browsing/creating
/// user albums, saving captured photos into a specific one, and loading
/// thumbnails/full images for the in-app viewer. All calls that touch the
/// photo library must run after authorization is granted.
@MainActor
final class PhotoLibraryManager: NSObject, ObservableObject {
    static let shared = PhotoLibraryManager()

    @Published private(set) var authorizationStatus: PHAuthorizationStatus
    @Published private(set) var albums: [PHAssetCollection] = []
    @Published private(set) var selectedAlbumId: String? {
        didSet { UserDefaults.standard.set(selectedAlbumId, forKey: Self.selectedAlbumKey) }
    }

    private static let selectedAlbumKey = "bm101.photos.selectedAlbumId"
    private let imageManager = PHCachingImageManager()

    var isAuthorized: Bool {
        authorizationStatus == .authorized || authorizationStatus == .limited
    }

    var selectedAlbum: PHAssetCollection? {
        guard let id = selectedAlbumId else { return nil }
        return albums.first { $0.localIdentifier == id }
    }

    private override init() {
        authorizationStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        selectedAlbumId = UserDefaults.standard.string(forKey: Self.selectedAlbumKey)
        super.init()
        PHPhotoLibrary.shared().register(self)
        if isAuthorized { refreshAlbums() }
    }

    deinit {
        PHPhotoLibrary.shared().unregisterChangeObserver(self)
    }

    func requestAuthorization() async {
        authorizationStatus = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        if isAuthorized { refreshAlbums() }
    }

    func refreshAlbums() {
        var results: [PHAssetCollection] = []
        let userAlbums = PHAssetCollection.fetchAssetCollections(
            with: .album, subtype: .albumRegular, options: nil
        )
        userAlbums.enumerateObjects { collection, _, _ in results.append(collection) }
        albums = results.sorted {
            ($0.localizedTitle ?? "").localizedCaseInsensitiveCompare($1.localizedTitle ?? "") == .orderedAscending
        }
    }

    @discardableResult
    func createAlbum(named title: String) async throws -> PHAssetCollection {
        var placeholder: PHObjectPlaceholder?
        do {
            try await PHPhotoLibrary.shared().performChanges {
                let request = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: title)
                placeholder = request.placeholderForCreatedAssetCollection
            }
        } catch {
            throw PhotoLibraryError.createAlbumFailed
        }
        guard let placeholder else { throw PhotoLibraryError.createAlbumFailed }

        let fetched = PHAssetCollection.fetchAssetCollections(
            withLocalIdentifiers: [placeholder.localIdentifier], options: nil
        )
        guard let collection = fetched.firstObject else { throw PhotoLibraryError.createAlbumFailed }

        refreshAlbums()
        return collection
    }

    func selectAlbum(_ collection: PHAssetCollection) {
        selectedAlbumId = collection.localIdentifier
    }

    func save(image: UIImage, to album: PHAssetCollection) async throws {
        do {
            try await PHPhotoLibrary.shared().performChanges {
                let creationRequest = PHAssetChangeRequest.creationRequestForAsset(from: image)
                guard let placeholder = creationRequest.placeholderForCreatedAsset,
                      let albumChangeRequest = PHAssetCollectionChangeRequest(for: album)
                else { return }
                albumChangeRequest.addAssets([placeholder] as NSArray)
            }
        } catch {
            throw PhotoLibraryError.saveFailed
        }
    }

    func fetchAssets(in album: PHAssetCollection) -> PHFetchResult<PHAsset> {
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        return PHAsset.fetchAssets(in: album, options: options)
    }

    func requestThumbnail(for asset: PHAsset, targetSize: CGSize) async -> UIImage? {
        await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .fastFormat
            options.resizeMode = .fast
            options.isNetworkAccessAllowed = true
            imageManager.requestImage(
                for: asset, targetSize: targetSize, contentMode: .aspectFill, options: options
            ) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }

    func requestFullImage(for asset: PHAsset) async -> UIImage? {
        await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            imageManager.requestImage(
                for: asset, targetSize: PHImageManagerMaximumSize, contentMode: .aspectFit, options: options
            ) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }
}

extension PhotoLibraryManager: PHPhotoLibraryChangeObserver {
    nonisolated func photoLibraryDidChange(_ changeInstance: PHChange) {
        Task { @MainActor in
            self.refreshAlbums()
        }
    }
}
