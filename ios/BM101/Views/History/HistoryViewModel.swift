import Foundation

@MainActor
final class HistoryViewModel: ObservableObject {
    @Published var feedings: [FeedingLog] = []
    @Published var sleeps: [SleepLog] = []
    @Published var diapers: [DiaperLog] = []
    @Published var growth: [GrowthLog] = []
    @Published var milestones: [Milestone] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api = APIClient.shared

    func load(babyId: String, kind: LogKind) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            switch kind {
            case .feeding:
                feedings = try await api.fetchFeedingLogs(babyId: babyId, take: 100)
            case .sleep:
                sleeps = try await api.fetchSleepLogs(babyId: babyId, take: 100)
            case .diaper:
                diapers = try await api.fetchDiaperLogs(babyId: babyId, take: 100)
            case .growth:
                growth = try await api.fetchGrowthLogs(babyId: babyId)
            case .milestone:
                milestones = try await api.fetchMilestones(babyId: babyId)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func endSleep(_ log: SleepLog) async {
        do {
            let updated = try await api.endSleepLog(id: log.id)
            if let idx = sleeps.firstIndex(where: { $0.id == updated.id }) {
                sleeps[idx] = updated
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
