import Foundation

enum ChatRole: String, Codable {
    case user = "USER"
    case assistant = "ASSISTANT"
}

struct ChatTurn: Identifiable, Hashable {
    let id = UUID()
    var role: ChatRole
    var content: String
}

struct ChatReplyResponse: Codable {
    let reply: String
}

struct ParseResponse: Codable {
    let logged: Bool
    let kind: String?
    let clarification: String?
}
