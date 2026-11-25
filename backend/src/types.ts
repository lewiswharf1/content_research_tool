export interface ScrapeTarget {
  type: 'hashtag' | 'profile' | 'url'
  value: string
}

export interface ScrapeRequest {
  targets: ScrapeTarget[]
  limit?: number
  minDate?: string // ISO date, e.g. "2025-01-01"
}

export interface ScrapedPost {
  id: string
  platform: 'instagram' | 'tiktok'
  url: string
  videoUrl: string
  caption: string
  username: string
  followers: number
  likes: number
  comments: number
  views: number
  postedAt: string
  engagement: number
  outlierScore: number | null
}

export interface ScrapeResponse {
  posts: ScrapedPost[]
}

export interface SavedReel {
  id: string
  platform: string
  username: string
  url: string
  videoUrl: string
  caption: string
  followers: number
  likes: number
  comments: number
  views: number
  postedAt: string
  engagement: number
  outlierScore: number | null
  transcript: string | null
  savedAt: string
}

export interface SavedResponse {
  reels: SavedReel[]
}
