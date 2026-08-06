import Foundation

struct APIErrorBody: Codable {
    let error: String
}

enum APIError: LocalizedError {
    case server(String, Int)
    case decoding(Error)
    case transport(Error)

    var errorDescription: String? {
        switch self {
        case .server(let message, _): return message
        case .decoding: return "Couldn't understand the server's response."
        case .transport(let error): return error.localizedDescription
        }
    }
}

/// Thin async/await wrapper around the BM101 `/api/v1` JSON API.
/// One method per endpoint — no generic "request builder" abstraction,
/// since the request/response shapes differ enough per call that a shared
/// builder would just hide the actual contract.
final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let baseURL: URL

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    // MARK: - Core request helpers

    private func sendRaw<Response: Decodable>(
        _ path: String,
        method: String,
        query: [String: String],
        bodyData: Data?,
        requiresAuth: Bool = true
    ) async throws -> Response {
        var components = URLComponents(
            url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false
        )!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        if requiresAuth, let token = await AuthManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let bodyData {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = bodyData
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        if statusCode == 401 && requiresAuth {
            // The token is missing/invalid/expired server-side — drop it
            // locally too, so the app falls back to the login screen
            // instead of silently failing every subsequent request.
            await AuthManager.shared.handleUnauthorized()
        }
        guard (200..<300).contains(statusCode) else {
            let message = (try? JSONDecoder.api.decode(APIErrorBody.self, from: data))?.error
                ?? "Request failed (\(statusCode))"
            throw APIError.server(message, statusCode)
        }

        do {
            return try JSONDecoder.api.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func get<Response: Decodable>(
        _ path: String, query: [String: String] = [:]
    ) async throws -> Response {
        try await sendRaw(path, method: "GET", query: query, bodyData: nil)
    }

    private func post<Body: Encodable, Response: Decodable>(
        _ path: String, body: Body
    ) async throws -> Response {
        let bodyData = try JSONEncoder.api.encode(body)
        return try await sendRaw(path, method: "POST", query: [:], bodyData: bodyData)
    }

    private func post<Response: Decodable>(_ path: String) async throws -> Response {
        try await sendRaw(path, method: "POST", query: [:], bodyData: nil)
    }

    // MARK: - Auth

    func login(email: String, password: String) async throws -> LoginResponse {
        let bodyData = try JSONEncoder.api.encode(LoginRequest(email: email, password: password))
        return try await sendRaw(
            "auth/login", method: "POST", query: [:], bodyData: bodyData, requiresAuth: false
        )
    }

    // MARK: - Babies

    func fetchBabies() async throws -> [Baby] {
        let response: BabiesResponse = try await get("babies")
        return response.babies
    }

    func createBaby(_ req: CreateBabyRequest) async throws -> Baby {
        let response: BabyResponse = try await post("babies", body: req)
        return response.baby
    }

    // MARK: - Caregivers

    func fetchCaregivers() async throws -> [Caregiver] {
        let response: CaregiversResponse = try await get("caregivers")
        return response.caregivers
    }

    func createCaregiver(_ req: CreateCaregiverRequest) async throws -> Caregiver {
        let response: CaregiverResponse = try await post("caregivers", body: req)
        return response.caregiver
    }

    // MARK: - Feeding

    func fetchFeedingLogs(babyId: String, take: Int = 30) async throws -> [FeedingLog] {
        let response: FeedingLogsResponse = try await get(
            "feeding", query: ["babyId": babyId, "take": String(take)]
        )
        return response.logs
    }

    func createFeedingLog(_ req: CreateFeedingLogRequest) async throws -> FeedingLog {
        let response: FeedingLogResponse = try await post("feeding", body: req)
        return response.log
    }

    // MARK: - Sleep

    func fetchSleepLogs(babyId: String, take: Int = 30) async throws -> [SleepLog] {
        let response: SleepLogsResponse = try await get(
            "sleep", query: ["babyId": babyId, "take": String(take)]
        )
        return response.logs
    }

    func createSleepLog(_ req: CreateSleepLogRequest) async throws -> SleepLog {
        let response: SleepLogResponse = try await post("sleep", body: req)
        return response.log
    }

    func endSleepLog(id: String) async throws -> SleepLog {
        let response: SleepLogResponse = try await post("sleep/\(id)/end")
        return response.log
    }

    // MARK: - Diaper

    func fetchDiaperLogs(babyId: String, take: Int = 30) async throws -> [DiaperLog] {
        let response: DiaperLogsResponse = try await get(
            "diaper", query: ["babyId": babyId, "take": String(take)]
        )
        return response.logs
    }

    func createDiaperLog(_ req: CreateDiaperLogRequest) async throws -> DiaperLog {
        let response: DiaperLogResponse = try await post("diaper", body: req)
        return response.log
    }

    // MARK: - Growth

    func fetchGrowthLogs(babyId: String) async throws -> [GrowthLog] {
        let response: GrowthLogsResponse = try await get("growth", query: ["babyId": babyId])
        return response.logs
    }

    func createGrowthLog(_ req: CreateGrowthLogRequest) async throws -> GrowthLog {
        let response: GrowthLogResponse = try await post("growth", body: req)
        return response.log
    }

    // MARK: - Milestones

    func fetchMilestones(babyId: String) async throws -> [Milestone] {
        let response: MilestonesResponse = try await get("milestones", query: ["babyId": babyId])
        return response.milestones
    }

    func createMilestone(_ req: CreateMilestoneRequest) async throws -> Milestone {
        let response: MilestoneResponse = try await post("milestones", body: req)
        return response.milestone
    }

    // MARK: - Predictions & tips

    func fetchPredictions(babyId: String) async throws -> PredictionsResponse {
        try await get("predictions", query: ["babyId": babyId])
    }

    func fetchTips(babyId: String) async throws -> [Tip] {
        let response: TipsResponse = try await get("tips", query: ["babyId": babyId])
        return response.tips
    }

    func sendTipFeedback(tipId: String, action: TipFeedbackAction) async throws {
        struct FeedbackRequest: Encodable {
            let tipId: String
            let action: String
        }
        let _: EmptyResponse = try await post(
            "tips", body: FeedbackRequest(tipId: tipId, action: action.rawValue)
        )
    }

    // MARK: - AI: chat & parse

    func sendChatMessage(babyId: String, message: String) async throws -> String {
        struct ChatRequest: Encodable { let babyId: String; let message: String }
        let response: ChatReplyResponse = try await post(
            "chat", body: ChatRequest(babyId: babyId, message: message)
        )
        return response.reply
    }

    func parseNote(babyId: String, text: String) async throws -> ParseResponse {
        struct ParseRequest: Encodable { let babyId: String; let text: String }
        return try await post("parse", body: ParseRequest(babyId: babyId, text: text))
    }
}

/// Decodes successfully from any small JSON object; used for endpoints whose
/// response body we don't need (e.g. tip feedback).
struct EmptyResponse: Decodable {}
