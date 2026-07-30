# BM101 — Native iOS Pivot

This supersedes the "web app only" framing in `PLANNING.md` for product direction,
but the web app's data model, Claude integration patterns, and lessons learned
carry forward directly. This doc covers what changed, what was decided by
default (the user didn't respond to the clarifying questions), and what's
explicitly out of scope for now.

## 1. What's changing

Per the original concept doc (`baby-app-mvp-architecture.md`, uploaded by the
user): the primary product becomes a **native iOS app** with an agentic layer
that parses loose voice/text input, predicts upcoming feed/sleep windows, and
proactively surfaces age-relevant tips — instead of a web dashboard the
caregiver has to remember to open.

## 2. Decisions made by default (no user confirmation — flag and revisit)

The user was asked three scoping questions and didn't respond before asking
to proceed. To avoid blocking, these defaults were chosen as the lowest-risk,
most-reversible option in each case:

| Decision | Default chosen | Why | Reversible? |
|---|---|---|---|
| Existing Next.js web app | **Kept as-is at repo root**, untouched | Avoids a large, risky restructuring diff on working, tested code; PR #1 stays independently valid | Yes — can delete or move later with no loss |
| Backend for iOS | **Extend the Next.js app with a JSON API** (`/api/v1/*`) instead of adopting Supabase/FastAPI | Reuses the Prisma schema and business logic already written and verified; no new hosted service/account needed to get started | Partially — swapping to Supabase later means re-pointing the iOS networking layer, not rewriting the data model (schema is Postgres-compatible) |
| AI model | **Claude (Anthropic)**, not Kimi K2 | Already integrated in this environment with a loaded skill; avoids requiring a new Moonshot API account before anything can run | Yes — the parse/predict/tips endpoints are isolated behind one `lib/ai.ts`-style module |

**Explicitly deferred, not decided against:** realtime multi-caregiver sync
(doc section 7) is the main capability this pivot doesn't yet deliver —
Supabase's realtime layer was the doc's mechanism for it, and a plain Next.js
API doesn't have an equivalent without adding something (websockets, polling,
or moving to Supabase later). For V1 the iOS app polls on open/foreground,
which is a reasonable MVP substitute per the doc's own build order ("MVP:
rolling-average heuristic... don't over-engineer").

## 3. Critical environment constraint

**This sandbox cannot build, run, or preview the iOS app.** It's Linux-based
with no Xcode, no macOS toolchain, no iOS Simulator. Concretely:

- I can write correct, idiomatic Swift/SwiftUI source files.
- I cannot run `xcodebuild`, cannot launch the simulator, cannot take
  screenshots of the iOS UI the way I did for the web app.
- The Xcode project file (`.xcodeproj`) is not something worth hand-authoring
  — its format is fragile and Xcode-version-sensitive. Instead this repo
  includes an **XcodeGen** manifest (`ios/project.yml`); the user runs
  `xcodegen generate` on their Mac to produce a real `.xcodeproj`, then opens
  it in Xcode. See `ios/README.md`.
- Practical implication: **the only way to actually verify this app works is
  for the user to build it in Xcode.** I've written it as carefully as I can
  and kept the API layer testable independently (it runs in this sandbox,
  and I did test it here), but the SwiftUI layer is unverified by me.

## 4. Backend: JSON API v1

Added to the existing Next.js app (no restructuring of what's there):

```
app/api/v1/
  babies/route.ts              GET (list), POST (create)
  babies/[id]/route.ts         GET, PATCH, DELETE
  caregivers/route.ts          GET, POST
  feeding/route.ts             GET (list by babyId), POST
  sleep/route.ts               GET, POST
  sleep/[id]/end/route.ts      POST (mark ongoing sleep ended)
  diaper/route.ts              GET, POST
  growth/route.ts              GET, POST
  milestones/route.ts          GET, POST
  predictions/route.ts         GET (compute + return next predicted feed/sleep)
  tips/route.ts                GET (due tips), POST (dismiss/feedback)
  chat/route.ts                POST (non-streaming — simpler for URLSession)
  parse/route.ts               POST (NL text -> structured log via Claude tool use)
```

Design notes:

- **No auth in V1** — same call as the web app. A `babyId` is passed on every
  request; anyone with the URL can act on any baby. Fine for a single-family
  MVP tested by hand; a hard blocker before any real multi-user deployment.
- **Predictions computed in code, not by the LLM** — per the doc's explicit
  guidance. `lib/predictions.ts` does a rolling mean over the last 5-7
  same-subtype events. Claude's only job (in `/api/v1/chat`) is to *explain*
  the number in conversation, never to compute it.
- **Parsing is the one place Claude sits in the request path for structured
  writes** — `/api/v1/parse` uses tool use (a single `log_event` tool) so the
  model's output is constrained to the same shape the rest of the API expects.
- **Chat is non-streaming** here (unlike the web app's streaming endpoint) —
  URLSession's streaming story is more code for a first pass; can add
  `URLSession.bytes(for:)`-based streaming later without changing the wire
  contract much.

## 5. iOS app structure

```
ios/
  project.yml                  XcodeGen manifest
  README.md                    Build instructions (xcodegen generate, open in Xcode)
  BM101/
    App/BM101App.swift
    Models/                    Codable structs mirroring the API JSON shapes
    Services/
      APIClient.swift          URLSession networking, async/await
      NotificationManager.swift
    Predictions/
      PredictionBanner logic lives server-side; client just displays + schedules
    Views/
      Dashboard/
      Feeding/  Sleep/  Diaper/  Growth/  Milestones/
      Assistant/
      Tips/
      Shared/                  Reusable components (cards, buttons)
```

## 6. Build order (this pivot)

1. Prisma schema additions (Prediction, Tip)
2. JSON API v1 (testable here, in this sandbox)
3. iOS scaffold + models + networking
4. Core tracker views (feature parity with the web app)
5. Notifications (predicted windows + quick-log actions)
6. Tips view
7. Assistant chat view
8. Docs + push

Voice input (doc's "voice/text → parse" step 2) is scoped to **text input
routed through `/api/v1/parse`** for V1 — actual speech-to-text (`Speech`
framework or on-device dictation) is a follow-up, not blocking the core loop.
