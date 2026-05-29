import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.resolve(__dirname, '../data')
fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'saved.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_reels (
    id          TEXT PRIMARY KEY,
    platform    TEXT NOT NULL,
    username    TEXT NOT NULL,
    url         TEXT NOT NULL,
    video_url   TEXT NOT NULL,
    caption     TEXT NOT NULL,
    likes       INTEGER NOT NULL DEFAULT 0,
    comments    INTEGER NOT NULL DEFAULT 0,
    views       INTEGER NOT NULL DEFAULT 0,
    engagement  REAL NOT NULL DEFAULT 0,
    posted_at   TEXT NOT NULL,
    transcript  TEXT,
    saved_at    TEXT NOT NULL
  )
`)

export { db }
