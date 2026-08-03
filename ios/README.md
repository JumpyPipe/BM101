# BM101 iOS

Native SwiftUI client for BM101. Talks to the Next.js backend's `/api/v1`
JSON API at the repo root — see `../PLANNING-iOS.md` for the architecture
and the decisions behind this split.

## ⚠️ This was written without a Mac

This code was authored in a Linux sandbox with no Xcode, no macOS, and no
iOS Simulator available. It's real, complete SwiftUI/Swift — not a stub —
but **it has not been compiled or run**. Treat the first build as the real
first test: expect to fix a handful of small issues (an API signature that
drifted, a missing case) rather than assume it's flawless.

## Prerequisites

- A Mac with Xcode 15+ installed
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) — generates the
  `.xcodeproj` from `project.yml` rather than one being hand-committed
  (Xcode project files are fragile to hand-author and merge-conflict badly):
  ```bash
  brew install xcodegen
  ```
- The backend running (see repo root `README.md`):
  ```bash
  cd ..
  npm install
  npm run db:migrate
  npm run db:seed   # optional demo data
  npm run dev       # serves http://localhost:3000
  ```

## Build

```bash
cd ios
xcodegen generate
open BM101.xcodeproj
```

Then in Xcode: select a Simulator (e.g. iPhone 15), and Run (⌘R).

The Simulator can reach your Mac's `npm run dev` via `http://localhost:3000`
directly — `Services/AppConfig.swift` is already pointed there. **A physical
device cannot reach `localhost`** — it means the device itself. Change
`AppConfig.apiBaseURL` to your Mac's LAN IP (e.g.
`http://192.168.1.23:3000/api/v1`) and make sure both are on the same
network.

## Why HTTP, not HTTPS, in dev

The backend runs plain HTTP locally. iOS's App Transport Security blocks
plaintext HTTP by default, so `project.yml` sets
`NSAppTransportSecurity.NSAllowsArbitraryLoads: true` for now. **Tighten
this before shipping** — replace it with an `NSExceptionDomains` entry
scoped to your real API host once it's HTTPS, or remove the exception
entirely if the backend moves behind HTTPS in dev too (e.g. via `mkcert` or
an ngrok tunnel).

## What's here vs. what's not

Implemented: dashboard (predictions, quick diaper log, recent activity,
tips), a unified log screen (structured forms + free-text "quick note"
parsed by Claude), history browsing per log type, assistant chat, baby/
caregiver management, local notifications for predicted feed/sleep windows
with in-notification "Logged ✓" / "Snooze 15m" actions, custom reminders
(More → Reminders — one-time, daily, or repeating-interval, e.g. "pump
every 3 hours"), and a Photos integration (More → Photo Album) to take a
photo, save it into a Photos album of your choice, browse that album
in-app, switch which album is the "album of choice", and create new albums.

**Reminders and predicted-event notifications are local (`UNUserNotificationCenter`)**,
scheduled on-device — not remote/APNs push. True push (server-initiated,
works even for schedules the app can't precompute) needs an Apple Developer
Program enrollment, an APNs key, and a server component to send them; none
of that exists here. Local notifications cover "remind me at this time /
on this schedule" fully; they don't cover "notify me the instant someone
else logs something."

**Photos integration needs three new Info.plist usage-description keys**
(`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`,
`NSPhotoLibraryAddUsageDescription`) — already added to `project.yml`, so
`xcodegen generate` picks them up automatically. No further setup needed,
same caveat as everything else in this doc: **written without a Mac,
unverified by an actual compile.** The first things to check if the Photos
screen misbehaves: the permission prompt actually appearing (Settings →
Snug → Photos should show "Full Access" or "Limited Access" after
granting), and that a physical device (not Simulator) is used for the
camera capture flow — the iOS Simulator has no camera, so `UIImagePickerController`
in `.camera` mode will not work there.

Not implemented (see PLANNING-iOS.md §2 "Explicitly deferred"):
realtime multi-caregiver sync (the doc's Supabase-realtime idea — this
version polls on tab appearance/pull-to-refresh instead), actual
speech-to-text (the "quick note" field is typed text, not a live
transcription), edit/delete for existing log entries from the iOS app
(create + read only; edit/delete still work from the web app against the
same database), remote/APNs push notifications (see above), and video
capture (Photos integration is photos only).

## Project layout

```
ios/
  project.yml              XcodeGen manifest — edit this, not a .xcodeproj
  BM101/
    App/                   App entry point, root tab view
    Models/                Codable structs mirroring the API's JSON
    Services/               Networking (APIClient), notifications, photos, config
    State/                 AppState — current baby, babies list
    Views/
      Dashboard/  Log/  History/  Assistant/  More/  Photos/  Reminders/  Shared/
```
