# Outlier Content Tracker

A full-stack web app for researching and tracking high-performing "outlier" content across the web — articles, videos, or posts that significantly outperform the norm. It scrapes data via Apify, analyses it with OpenAI, and surfaces insights through a clean React dashboard.

## Tech Stack

| Layer     | Tech                                              |
|-----------|---------------------------------------------------|
| Frontend  | Vite + React + TypeScript + Tailwind CSS + shadcn |
| Backend   | Node.js + Express + TypeScript                    |
| Dev tools | ts-node-dev (backend HMR), Vite HMR (frontend)   |
| AI        | OpenAI API (analysis)                             |
| Scraping  | Apify (web data collection)                       |

## Folder Structure

```
/
├── frontend/           Vite React app
│   ├── src/
│   │   ├── components/ui/   shadcn components (auto-generated, do not edit)
│   │   ├── lib/utils.ts     shadcn utility (cn helper)
│   │   ├── App.tsx          Root component
│   │   └── main.tsx         Entry point
│   ├── components.json      shadcn configuration
│   └── vite.config.ts
│
├── backend/            Express API
│   ├── src/
│   │   └── index.ts    Server entry point
│   ├── .env            Local secrets (gitignored)
│   ├── .env.example    Template for env vars
│   └── tsconfig.json
│
└── CLAUDE.md           This file
```

## Environment Variables

Defined in `backend/.env` (copy from `.env.example`):

| Variable        | Purpose                                      |
|-----------------|----------------------------------------------|
| `APIFY_API_KEY` | Authenticate with Apify for web scraping     |
| `OPENAI_API_KEY`| Authenticate with OpenAI for content analysis|
| `PORT`          | Port the Express server listens on (default 3001) |

## Phase Build Plan

1. **Phase 1 – Scaffold**: Vite + React frontend, Express backend, Tailwind, shadcn
2. **Phase 2 – Data ingestion**: Apify actor integration to scrape target URLs/channels
3. **Phase 3 – Storage**: Persist raw content to a local SQLite or Postgres database
4. **Phase 4 – AI analysis**: OpenAI pipeline to score and summarise each content piece
5. **Phase 5 – API layer**: REST endpoints to query, filter, and sort content records
6. **Phase 6 – Dashboard UI**: shadcn data table + cards to browse outlier content
7. **Phase 7 – Scheduling**: Cron/queue to run scrape → analyse pipeline automatically
8. **Phase 8 – Polish**: Auth, error boundaries, loading states, export to CSV

## Conventions

- **TypeScript strict mode** is enabled in both frontend and backend (`"strict": true`).
- **Shared response shapes**: define API response types in a shared location (e.g. `frontend/src/types/api.ts` mirrored from backend) so both sides stay in sync without a monorepo build step.
- **shadcn components** live in `frontend/src/components/ui/` — do not hand-edit these; re-run the shadcn CLI to update or extend them.
- **Path alias**: `@/` maps to `frontend/src/` — use it instead of relative imports.
- **No default exports from backend modules** — prefer named exports for clarity.
- **dotenv** is loaded once at the top of `backend/src/index.ts`; all other modules read from `process.env` directly.
