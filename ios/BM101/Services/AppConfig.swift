import Foundation

enum AppConfig {
    /// Points at the Next.js backend's `/api/v1` surface (see repo root
    /// `app/api/v1/`). The iOS Simulator can reach a host-machine `npm run
    /// dev` via `localhost`; a physical device needs your Mac's LAN IP
    /// instead (e.g. "http://192.168.1.23:3000/api/v1").
    static let apiBaseURL = URL(string: "http://localhost:3000/api/v1")!
}
