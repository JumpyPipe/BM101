import Foundation

enum AppConfig {
    /// Points at the deployed Next.js backend's `/api/v1` surface (see repo
    /// root `app/api/v1/`), so the app works from a physical device on any
    /// network — not just the Simulator on the same Mac as `npm run dev`.
    ///
    /// To point at a local dev server instead (Simulator only, or a
    /// physical device on the same LAN as your Mac), swap this for
    /// `http://localhost:3000/api/v1` (Simulator) or your Mac's LAN IP
    /// (physical device) — and re-add the ATS exception in `project.yml`
    /// if you do, since plain HTTP is blocked by default.
    static let apiBaseURL = URL(string: "https://bm-101.vercel.app/api/v1")!
}
