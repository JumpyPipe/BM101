import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var predictions: PredictionsResponse?
    @Published var recentFeedings: [FeedingLog] = []
    @Published var recentSleeps: [SleepLog] = []
    @Published var recentDiapers: [DiaperLog] = []
    @Published var latestGrowth: GrowthLog?
    @Published var tips: [Tip] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let api = APIClient.shared

    var diapersToday: Int {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        return recentDiapers.filter { $0.occurredAt >= startOfDay }.count
    }

    var ongoingSleep: SleepLog? {
        recentSleeps.first { $0.endedAt == nil }
    }

    var lastCompletedSleep: SleepLog? {
        recentSleeps.first { $0.endedAt != nil }
    }

    struct ActivityItem: Identifiable {
        let id: String
        let kind: String
        let label: String
        let at: Date
    }

    var recentActivity: [ActivityItem] {
        var items: [ActivityItem] = []
        items += recentFeedings.prefix(5).map {
            ActivityItem(id: "f-\($0.id)", kind: "Feeding", label: $0.summary, at: $0.startedAt)
        }
        items += recentSleeps.prefix(5).map {
            ActivityItem(id: "s-\($0.id)", kind: "Sleep", label: $0.summary, at: $0.startedAt)
        }
        items += recentDiapers.prefix(5).map {
            ActivityItem(id: "d-\($0.id)", kind: "Diaper", label: "\($0.type.label) diaper", at: $0.occurredAt)
        }
        return items.sorted { $0.at > $1.at }.prefix(8).map { $0 }
    }

    func load(babyId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let feedings = api.fetchFeedingLogs(babyId: babyId, take: 10)
            async let sleeps = api.fetchSleepLogs(babyId: babyId, take: 10)
            async let diapers = api.fetchDiaperLogs(babyId: babyId, take: 20)
            async let growth = api.fetchGrowthLogs(babyId: babyId)
            async let tipsResult = api.fetchTips(babyId: babyId)
            async let predictionsResult = api.fetchPredictions(babyId: babyId)

            recentFeedings = try await feedings
            recentSleeps = try await sleeps
            recentDiapers = try await diapers
            latestGrowth = try await growth.first
            tips = try await tipsResult
            predictions = try await predictionsResult

            NotificationManager.shared.activeBabyId = babyId
            if let feeding = predictions?.feeding {
                NotificationManager.shared.scheduleReminder(
                    kind: .feeding, at: feeding.predictedTime, confidence: feeding.confidence
                )
            }
            if let sleep = predictions?.sleep {
                NotificationManager.shared.scheduleReminder(
                    kind: .sleep, at: sleep.predictedTime, confidence: sleep.confidence
                )
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func quickLogDiaper(babyId: String, type: DiaperType) async {
        do {
            let log = try await api.createDiaperLog(
                CreateDiaperLogRequest(babyId: babyId, type: type, occurredAt: Date(), note: nil)
            )
            recentDiapers.insert(log, at: 0)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func dismissTip(_ tip: Tip) async {
        do {
            try await api.sendTipFeedback(tipId: tip.id, action: .dismiss)
            tips.removeAll { $0.id == tip.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
