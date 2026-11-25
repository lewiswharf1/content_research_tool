# Outlier Content Tracker

A full-stack web app for researching high-performing "outlier" Instagram Reels — posts that significantly outperform the norm. Scrapes data via Apify, analyses it with OpenAI, and surfaces insights through a React dashboard.

![Tech Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite-blue)

## Features

- Scrape Instagram Reels by **hashtag**, **profile**, or **direct post URL**
- Scrape a single **TikTok video** by pasting its URL
- Automatic **outlier scoring** — each post is ranked against the median views in its batch
- **Save reels** to a local SQLite database for later reference
- **Transcribe saved reels** via OpenAI Whisper (downloads audio with yt-dlp)
- Filter by date and limit results per target

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | |
| yt-dlp | latest | Required for transcription only |
| ffmpeg | latest | Required for transcription only |

Install optional transcription dependencies on macOS:

```bash
brew install yt-dlp ffmpeg
```

## API Keys

You'll need accounts and API keys for:

- **[Apify](https://apify.com)** — for Instagram and TikTok scraping (free tier available). Get your key from _Console → Settings → Integrations_.
- **[OpenAI](https://platform.openai.com)** — for Whisper transcription. Get your key from _API Keys_.

## Setup

1. **Clone the repo**

```bash
git clone <your-repo-url>
cd content_research_agent
```

2. **Install dependencies**

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

3. **Configure environment variables**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your keys:

```env
APIFY_API_KEY=your_apify_key_here
OPENAI_API_KEY=your_openai_key_here
PORT=3001
```

4. **Start the development servers**

From the project root, start both servers together:

```bash
npm run dev
```

This uses [concurrently](https://www.npmjs.com/package/concurrently) to run both dev servers in one terminal, with output prefixed `be` / `fe`. Ctrl+C stops both.

To run them separately instead, use `cd backend && npm run dev` and `cd frontend && npm run dev` in two terminals.

The app will be available at [http://localhost:5173](http://localhost:5173). The backend API runs on port `3001`.

## Usage

### Scraping

Enter one or more targets in the dashboard:

| Target type | Example value |
|-------------|---------------|
| Hashtag | `fitness` |
| Profile | `therock` |
| Post URL | `https://www.instagram.com/reel/ABC123/` or `https://www.tiktok.com/@user/video/1234567890` |

Set a **limit** (max reels per target) and an optional **date filter** to only return recent posts, then click **Scrape**.

Each result shows view count, likes, comments, engagement rate, and an **outlier score** — the ratio of this post's views to the median across the batch. A score of `3.0` means the post got 3× the typical views.

### Saving & Transcribing

Click **Save** on any result to store it locally. Saved reels appear in the **Saved** tab where you can:

- View all saved reels with their original scores
- Click **Transcribe** to download the audio and generate a transcript via Whisper
- Delete reels you no longer need

## Project Structure

```
/
├── frontend/        Vite + React + TypeScript + Tailwind + shadcn
└── backend/         Express + TypeScript + SQLite (better-sqlite3)
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `APIFY_API_KEY` | Yes | Authenticate with Apify for scraping |
| `OPENAI_API_KEY` | Transcription only | Authenticate with OpenAI Whisper |
| `PORT` | No | Backend port (default `3001`) |
