# Snug iOS

Native SwiftUI client for Snug. Talks to the Next.js backend's `/api/v1`
JSON API at the repo root — see `../PLANNING-iOS.md` for the architecture
and the decisions behind this split. The Xcode project is generated from
`project.yml` as `Snug.xcodeproj`; the on-disk source folder is still named
`BM101/` (harmless — Xcode doesn't care, and renaming it isn't worth the
risk on top of everything else in this app's very first compile).

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
open Snug.xcodeproj
```

Then in Xcode: select a Simulator (e.g. iPhone 15) or your own iPhone, and
Run (⌘R).

`Services/AppConfig.swift` points at the deployed backend
(`https://bm-101.vercel.app/api/v1`) by default, so both the
Simulator and a physical device work out of the box with no LAN setup. To
point at a local `npm run dev` instead: the Simulator can reach
`http://localhost:3000/api/v1` directly; a physical device needs your Mac's
LAN IP (e.g. `http://192.168.1.23:3000/api/v1`) since "localhost" from the
device's own perspective means the device itself. If you do this, you'll
also need to re-add an ATS exception in `project.yml`
(`NSAppTransportSecurity.NSAllowsArbitraryLoads: true`) since iOS blocks
plaintext HTTP by default — it was removed once `AppConfig` moved to a real
HTTPS backend.

## Login & Face ID

The API now requires auth (`POST /api/v1/auth/login`, bearer token stored
in the Keychain) — every other `/api/v1` route 401s without it. **You need
a caregiver login set up first, from the web app**: sign up at the deployed
site's `/signup` (creates your own private household) — or, if you're
joining a household someone else already created, use the invite link
they send you (`/invite/<token>`). Then use those same credentials to sign
in on iOS. There's no separate iOS-only signup flow — it's the same
caregiver accounts either way.

Face ID/Touch ID (More → Security, only shown if the device has one
enrolled) is an optional fast-unlock layer on top of that login — same
framing as the web app's WebAuthn passkey, implemented natively via
`LocalAuthentication` instead (the right API for a native app; WebAuthn is
a browser-platform mechanism). It gates re-entry to already-fetched app
state, not a second credential — logging out always requires the
password again.

## What's here vs. what's not

Implemented: login + Face ID (see above), dashboard (predictions, quick
diaper log, recent activity, tips), a unified log screen (structured forms
+ free-text "quick note" parsed by Claude), history browsing per log type,
assistant chat, baby/caregiver management, local notifications for
predicted feed/sleep windows with in-notification "Logged ✓" / "Snooze
15m" actions, custom reminders (More → Reminders — one-time, daily, or
repeating-interval, e.g. "pump every 3 hours"), and a Photos integration
(More → Photo Album) to take a photo, save it into a Photos album of your
choice, browse that album in-app, switch which album is the "album of
choice", and create new albums.

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
    App/                   App entry point, auth-gated root scene
    Models/                Codable structs mirroring the API's JSON
    Services/               Networking (APIClient), auth, Keychain, notifications, photos, config
    State/                 AppState — current baby, babies list
    Views/
      Auth/  Dashboard/  Log/  History/  Assistant/  More/  Photos/  Reminders/  Shared/
```
