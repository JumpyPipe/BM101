import Foundation

enum PredictionEventType: String, Codable {
    case feeding = "FEEDING"
    case sleep = "SLEEP"
}

struct Prediction: Codable, Hashable {
    let eventType: PredictionEventType
    let predictedTime: Date
    let confidence: Double
    let basedOnEvents: Int
}

struct PredictionsResponse: Codable {
    let feeding: Prediction?
    let sleep: Prediction?
}
