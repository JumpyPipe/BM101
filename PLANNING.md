# BM101 — Baby Management App
### Architecture & Product Plan (Principal Engineer Pass)

## 1. Product scope

A web app for parents/caregivers to track a baby's day-to-day care and get
AI-assisted insights. V1 targets a single family with multiple caregivers
and one or more babies (siblings/twins).

**Core capabilities (V1):**
- Baby profiles (name, DOB, photo, sex, notes) — supports multiple babies
- Caregiver accounts (multiple people logging for the same baby)
- Quick-log trackers:
  - Feeding (breast/bottle/solid — side, amount, duration)
  - Sleep (start/end, naps vs. night sleep, duration)
  - Diaper (wet/dirty/mixed, time)
  - Growth (weight, height, head circumference over time)
  - Milestones (free-text + category + date + photo)
- Dashboard: "today at a glance" summary + quick-add actions
- History/timeline per tracker with simple charts (trends over time)
- AI Intelligence:
  - Conversational assistant for parenting questions, scoped to the baby's
    logged data (age-aware, pattern-aware)
  - Automated insight generation (e.g. "feedings trending later each night",
    "sleep total below typical range for age") surfaced on the dashboard

**Explicitly out of scope for V1:** multi-tenant SaaS billing, native mobile
apps, push notifications/reminders engine, real-time multi-device sync,
pediatrician data sharing/export (PDF), i18n. Noted as V2 candidates below.

## 2. Tech stack decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Single deployable for UI + API routes, server components for data-heavy dashboard, good DX |
| Styling/UI | Tailwind CSS + shadcn/ui | Fast to build a consistent, accessible UI end-to-end without a design team |
| Data fetching | Server Components + Server Actions | Avoids a separate client-state/query layer for V1's CRUD-heavy surface |
| ORM/DB | Prisma + SQLite (file-based) | Zero external infra to run/demo locally; schema is Postgres-compatible, so swapping `provider` + `DATABASE_URL` is the only change needed to move to Postgres in prod |
| Charts | Recharts | Lightweight, composable, good with React server/client split |
| AI | Anthropic Claude API (Messages API) via a server-only API route | Keeps the API key server-side; used for both the chat assistant and insight generation |
| Auth | Deferred to V2 (single-household, no login in V1) | Keeps V1 focused on the tracking + AI UX; caregivers are just rows the current user can log against, not authenticated identities yet |

**Decision log / tradeoffs:**
- SQLite over Postgres for V1: this environment has no provisioned database
  service, and SQLite lets the whole app run and be demoed with `npm run dev`
  and zero setup. The Prisma schema avoids SQLite-only features so the
  migration path to Postgres is a config change, not a rewrite.
- No auth in V1: adding real auth (NextAuth + sessions) is straightforward
  but orthogonal to proving out the tracking UX and AI integration, which are
  the stated priorities. Caregiver *records* exist now so the data model is
  ready when login is added.
- Server Actions over a REST/tRPC layer: fewer moving parts for a CRUD-heavy
  app of this size; API *routes* are still used for the two AI endpoints
  since those are naturally request/response and streamed.

## 3. Data model (Prisma)

```
Baby        (id, name, dob, sex, photoUrl, notes, timestamps)
Caregiver   (id, name, role, timestamps)
FeedingLog  (id, babyId, type[breast|bottle|solid], side, amountMl, durationMin, startedAt, note)
SleepLog    (id, babyId, startedAt, endedAt, type[nap|night], note)
DiaperLog   (id, babyId, occurredAt, type[wet|dirty|mixed], note)
GrowthLog   (id, babyId, measuredAt, weightKg, heightCm, headCm)
Milestone   (id, babyId, occurredAt, category, title, description, photoUrl)
ChatMessage (id, babyId, role[user|assistant], content, createdAt)
```

All log tables share the `babyId` foreign key + `createdAt/updatedAt` for
consistent querying and future multi-caregiver attribution (`loggedById`
can be added in V2 once auth exists).

## 4. Folder structure

```
app/
  (dashboard)/
    layout.tsx            baby selector + nav shell
    page.tsx               dashboard: summary cards + quick log + insights
    feeding/               list + log + edit
    sleep/
    diaper/
    growth/
    milestones/
    babies/                baby CRUD
    caregivers/
    assistant/              AI chat page
  api/
    assistant/route.ts      streaming chat endpoint (Claude)
    insights/route.ts       on-demand insight generation (Claude)
components/
  ui/                       shadcn primitives
  trackers/                 shared log-entry components (forms, cards, charts)
  dashboard/
lib/
  db.ts                     Prisma client singleton
  ai.ts                     Anthropic client + prompt construction
  actions/                  Server Actions per resource
prisma/
  schema.prisma
  seed.ts
```

## 5. Phased roadmap

1. **Scaffold** — Next.js/TS/Tailwind/shadcn project skeleton
2. **Data layer** — Prisma schema, SQLite migration, seed data for demo
3. **Core UI** — app shell, baby switcher, dashboard
4. **Trackers** — feeding/sleep/diaper/growth/milestones (log + history + charts)
5. **Profiles** — baby & caregiver management
6. **Intelligence** — Claude-powered chat assistant + auto-generated insights
7. **Verification** — build/lint/typecheck clean, manual UI walkthrough
8. **Ship** — commit, push to `claude/baby-management-app-plan-eoxn3z`

## 6. V2 candidates (not built now)

- Real auth (NextAuth) + per-caregiver attribution on log entries
- Postgres in production + hosted deployment
- Push/email reminders (feeding due, tummy time, vaccination schedule)
- PDF export for pediatrician visits
- Native mobile (React Native) sharing the same API
- Multi-household / sharing baby data with grandparents etc.
