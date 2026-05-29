import { Router } from 'express'
import { db } from '../db'
import type { ScrapedPost, SavedReel } from '../types'

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
      (id, platform, username, url, video_url, caption, likes, comments, views, engagement, posted_at, transcript, saved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `).run(
    post.id, post.platform, post.username, post.url, post.videoUrl,
    post.caption, post.likes, post.comments, post.views, post.engagement,
    post.postedAt, new Date().toISOString(),
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

export { router as savedRouter }
