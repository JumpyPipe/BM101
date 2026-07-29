# BM101 — Baby Management App

Track feedings, sleep, diapers, growth, and milestones for your baby — with
an AI assistant and auto-generated insights powered by Claude.

See [PLANNING.md](./PLANNING.md) for the architecture and product plan.

## Getting started

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
