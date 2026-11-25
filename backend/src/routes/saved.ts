import { Router } from 'express'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { db } from '../db'
import type { ScrapedPost, SavedReel } from '../types'

const execFileAsync = promisify(execFile)

const router = Router()

interface DbRow {
  id: string
  platform: string
  username: string
  url: string
  video_url: string
  caption: string
  likes: number
  comments: number
  views: number
  engagement: number
  outlier_score: number | null
  posted_at: string
  transcript: string | null
  saved_at: string
}

function toSavedReel(row: DbRow): SavedReel {
  return {
    id: row.id,
    platform: row.platform,
    username: row.username,
    url: row.url,
    videoUrl: row.video_url,
    caption: row.caption,
    followers: 0,
    likes: row.likes,
    comments: row.comments,
    views: row.views,
    engagement: row.engagement,
    outlierScore: row.outlier_score,
    postedAt: row.posted_at,
    transcript: row.transcript,
    savedAt: row.saved_at,
  }
}

router.post('/', (req, res) => {
  const post = req.body as ScrapedPost
  if (!post.id) {
    res.status(400).json({ error: 'Post id is required' })
    return
  }
  db.prepare(`
    INSERT OR REPLACE INTO saved_reels
      (id, platform, username, url, video_url, caption, likes, comments, views, engagement, outlier_score, posted_at, transcript, saved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `).run(
    post.id, post.platform, post.username, post.url, post.videoUrl,
    post.caption, post.likes, post.comments, post.views, post.engagement,
    post.outlierScore ?? null, post.postedAt, new Date().toISOString(),
  )
  res.json({ success: true })
})

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM saved_reels ORDER BY saved_at DESC').all() as DbRow[]
  res.json({ reels: rows.map(toSavedReel) })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM saved_reels WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

router.patch('/:id/transcript', (req, res) => {
  const { transcript } = req.body as { transcript: string }
  if (typeof transcript !== 'string') {
    res.status(400).json({ error: 'transcript must be a string' })
    return
  }
  db.prepare('UPDATE saved_reels SET transcript = ? WHERE id = ?').run(transcript, req.params.id)
  res.json({ success: true })
})

router.post('/:id/transcribe', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured' })
    return
  }

  try {
    await execFileAsync('which', ['yt-dlp'])
  } catch {
    res.status(500).json({ error: 'yt-dlp is not installed. Install with: brew install yt-dlp' })
    return
  }

  // Use the post page URL (Instagram or TikTok), not video_url — CDN URLs carry expiry tokens
  const row = db.prepare('SELECT url, transcript FROM saved_reels WHERE id = ?').get(req.params.id) as
    | { url: string; transcript: string | null }
    | undefined

  if (!row) {
    res.status(404).json({ error: 'Reel not found' })
    return
  }
  if (row.transcript) {
    res.status(400).json({ error: 'Reel already has a transcript' })
    return
  }

  const tmpDir = path.resolve(__dirname, '../../tmp')
  fs.mkdirSync(tmpDir, { recursive: true })
  const tmpBase = path.join(tmpDir, req.params.id)
  const tmpFile = `${tmpBase}.mp3`

  try {
    await execFileAsync('yt-dlp', [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '-o', `${tmpBase}.%(ext)s`,
      row.url,
    ], { timeout: 120_000 })

    if (!fs.existsSync(tmpFile)) {
      throw new Error('yt-dlp produced no output file — ffmpeg may not be installed')
    }

    const openai = new OpenAI({ apiKey })
    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: 'whisper-1',
    })

    db.prepare('UPDATE saved_reels SET transcript = ? WHERE id = ?').run(result.text, req.params.id)

    res.json({ transcript: result.text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Transcription failed: ${message}` })
  } finally {
    try { fs.unlinkSync(tmpFile) } catch { /* ignore if file was never created */ }
  }
})

export { router as savedRouter }
