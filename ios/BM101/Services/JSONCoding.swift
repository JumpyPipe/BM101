import Foundation

/// The backend (Prisma) emits ISO 8601 timestamps with fractional seconds,
/// e.g. "2026-07-29T23:42:19.401Z". `.iso8601` alone can't parse the
/// fractional part, so we try that first and fall back to whole-second ISO.
enum APIDateDecoding {
    static let withFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    static let whole: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func decode(_ decoder: Decoder) throws -> Date {
        let container = try decoder.singleValueContainer()
        let raw = try container.decode(String.self)
        if let date = withFractional.date(from: raw) ?? whole.date(from: raw) {
            return date
        }
        throw DecodingError.dataCorruptedError(
            in: container, debugDescription: "Could not parse date: \(raw)"
        )
    }
}

extension JSONDecoder {
    /// Decoder configured for the Snug API's date format.
    static var api: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { try APIDateDecoding.decode($0) }
        return decoder
    }
}

extension JSONEncoder {
    /// Encoder configured to emit ISO 8601 with fractional seconds, matching
    /// what the API expects for date-time fields.
    static var api: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(APIDateDecoding.withFractional.string(from: date))
        }
        return encoder
    }
}
