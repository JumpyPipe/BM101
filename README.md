# BM101 — Baby Management App

Track feedings, sleep, diapers, growth, and milestones for your baby — with
an AI assistant, auto-generated insights, and predictive reminders powered
by Claude.

This repo now holds two clients against one backend:

- **Web app** (this directory) — Next.js, described below. Also serves the
  JSON API (`/api/v1/*`) that the iOS app talks to.
- **`ios/`** — native SwiftUI app. See [ios/README.md](./ios/README.md) —
  requires a Mac/Xcode to build; it was written in an environment without
  either, so it hasn't been compiled yet.

See [PLANNING.md](./PLANNING.md) for the original web-app architecture, and
[PLANNING-iOS.md](./PLANNING-iOS.md) for how/why the iOS app was added
alongside it.

## Getting started (web app + backend API)

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY for the AI features
npm run db:migrate     # applies the Prisma schema to a local SQLite db
npm run db:seed        # optional: seeds a demo baby with sample logs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma + SQLite ·
Recharts · Anthropic Claude API

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## AI features

The dashboard's "AI insights" panel and the `/assistant` chat page call the
Anthropic API (`app/api/insights`, `app/api/assistant`). Both require
`ANTHROPIC_API_KEY` in `.env` — without it they fail gracefully with a
message telling you to set the key.

## JSON API (`/api/v1`) — for the iOS app

`app/api/v1/*` exposes the same data model as JSON, for the native app in
`ios/`: babies, caregivers, feeding/sleep/diaper/growth/milestone logs,
rolling-average predictions, an age-gated tip bank, a non-streaming chat
endpoint, and a `/parse` endpoint that turns a free-text note into a
structured log entry via Claude tool use. No auth in V1 — same scope
limitation as the web app. See `PLANNING-iOS.md` §4 for the full route list
and design notes.
