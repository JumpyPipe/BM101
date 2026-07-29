import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var babies: [Baby] = []
    @Published var currentBabyId: String?
    @Published var isLoading = false
    @Published var loadError: String?

    private let api = APIClient.shared
    private let currentBabyDefaultsKey = "bm101.currentBabyId"

    var currentBaby: Baby? {
        babies.first { $0.id == currentBabyId } ?? babies.first
    }

    func loadBabies() async {
        isLoading = true
        loadError = nil
        defer { isLoading = false }
        do {
            babies = try await api.fetchBabies()
            let saved = UserDefaults.standard.string(forKey: currentBabyDefaultsKey)
            if let saved, babies.contains(where: { $0.id == saved }) {
                currentBabyId = saved
            } else {
                currentBabyId = babies.first?.id
            }
        } catch {
            loadError = error.localizedDescription
        }
    }

    func selectBaby(_ id: String) {
        currentBabyId = id
        UserDefaults.standard.set(id, forKey: currentBabyDefaultsKey)
    }

    func addBaby(_ req: CreateBabyRequest) async throws {
        let baby = try await api.createBaby(req)
        babies.append(baby)
        selectBaby(baby.id)
    }
}
