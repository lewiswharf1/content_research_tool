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

## API Reference

### `GET /health`
Returns `{ "status": "ok" }`. Used to confirm the server is running.

---

### `POST /api/scrape`
Triggers an Apify Instagram scrape and returns normalised Reels data.

Uses **`apify/instagram-scraper`** for both hashtag and profile targets via `directUrls`.

**Request body:**
```json
{
  "targets": [
    { "type": "hashtag", "value": "fitness" },
    { "type": "profile", "value": "therock" }
  ],
  "limit": 10,
  "minDate": "2025-01-01"
}
```

| Field | Type | Description |
|---|---|---|
| `targets` | `array` | One or more scrape targets. `type` is `"hashtag"`, `"profile"`, or `"url"`. |
| `limit` | `number` | Max reels per target. Default `10`. |
| `minDate` | `string` | ISO date filter (`YYYY-MM-DD`). Passed to Apify as `onlyPostsNewerThan`. |

**Response `200`:**
```json
{
  "posts": [
    {
      "id": "string",
      "platform": "instagram",
      "url": "string",
      "videoUrl": "string",
      "caption": "string",
      "username": "string",
      "followers": 0,
      "likes": 0,
      "comments": 0,
      "views": 0,
      "postedAt": "2024-01-01T00:00:00.000Z",
      "engagement": 0.00
    }
  ]
}
```

- `engagement` = `(likes + comments) / followers * 100`, rounded to 2 dp. Is `0` when follower count is unavailable.
- `followers` is `0` for hashtag scrapes — the actor doesn't return profile data for tag results.
- `outlierScore` = `post.views / median(views across batch)`, rounded to 2 dp. Is `null` when the batch has only 1 post or all posts have 0 views. Fixed at `5` for `url`-type scrapes (single post, no batch to compare against). Computed server-side at scrape time.
- For `url` targets: `value` is the full Instagram post URL (e.g. `https://www.instagram.com/reel/ABC123/`). Uses `resultsType: "posts"` and `resultsLimit: 1`. `limit` and `minDate` are ignored.

**Errors:**
| Status | Body | Cause |
|---|---|---|
| `400` | `{ "error": "targets must be a non-empty array" }` | Missing or empty `targets` |
| `500` | `{ "error": "APIFY_API_KEY is not configured" }` | Key missing from `.env` |
| `500` | `{ "error": "Apify scrape failed: <message>" }` | Apify actor or network error |

---

---

### `POST /api/saved`
Save a reel to the local SQLite database. Uses `INSERT OR REPLACE` so re-saving is idempotent.

**Request body:** full `ScrapedPost` object (as returned by `/api/scrape`)

**Response `200`:** `{ "success": true }`

---

### `GET /api/saved`
Return all saved reels ordered by most recently saved.

**Response `200`:**
```json
{ "reels": [ /* SavedReel objects */ ] }
```

`SavedReel` is a `ScrapedPost` plus `transcript: string | null` and `savedAt: string` (ISO timestamp). `followers` is always `0` (not stored). `outlierScore` is preserved from the original scrape.

---

### `DELETE /api/saved/:id`
Remove a saved reel by its Apify post id.

**Response `200`:** `{ "success": true }`

---

### `PATCH /api/saved/:id/transcript`
Set the transcript on a saved reel.

**Request body:** `{ "transcript": "string" }`

**Response `200`:** `{ "success": true }`

---

### `POST /api/saved/:id/transcribe`
Download audio and transcribe a saved reel using OpenAI Whisper.

**Flow:**
1. Checks `OPENAI_API_KEY` and `yt-dlp` are available
2. Looks up the reel's Instagram post URL (`url` column — not `video_url`, which carries CDN expiry tokens)
3. Downloads audio via `yt-dlp -x --audio-format mp3` to `backend/tmp/{id}.mp3`
4. Sends the file to Whisper (`whisper-1` model)
5. Saves the transcript to the DB and deletes the temp file

**Response `200`:** `{ "transcript": "string" }`

**Errors:** `400` if already transcribed, `404` if reel not found, `500` for missing keys/tools or Whisper failure.

**Local requirements:**
- `yt-dlp`: `brew install yt-dlp`
- `ffmpeg` (required by yt-dlp for mp3 conversion): `brew install ffmpeg`

---

## Database

SQLite file at `backend/data/saved.db` (gitignored). Managed with `better-sqlite3` (synchronous).

**Table: `saved_reels`**

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Apify post id |
| `platform` | TEXT | `"instagram"` |
| `username` | TEXT | |
| `url` | TEXT | Post URL |
| `video_url` | TEXT | |
| `caption` | TEXT | |
| `likes` | INTEGER | |
| `comments` | INTEGER | |
| `views` | INTEGER | |
| `engagement` | REAL | |
| `posted_at` | TEXT | ISO timestamp |
| `transcript` | TEXT | Nullable |
| `saved_at` | TEXT | ISO timestamp, set on save |

---

## Conventions

- **TypeScript strict mode** is enabled in both frontend and backend (`"strict": true`).
- **Shared response shapes**: define API response types in a shared location (e.g. `frontend/src/types/api.ts` mirrored from backend) so both sides stay in sync without a monorepo build step.
- **shadcn components** live in `frontend/src/components/ui/` — do not hand-edit these; re-run the shadcn CLI to update or extend them.
- **Path alias**: `@/` maps to `frontend/src/` — use it instead of relative imports.
- **No default exports from backend modules** — prefer named exports for clarity.
- **dotenv** is loaded once at the top of `backend/src/index.ts`; all other modules read from `process.env` directly.
