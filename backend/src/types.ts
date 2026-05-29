export interface ScrapeTarget {
  type: 'hashtag' | 'profile'
  value: string
}

export interface ScrapeRequest {
  targets: ScrapeTarget[]
  limit?: number
  minDate?: string // ISO date, e.g. "2025-01-01"
}

export interface ScrapedPost {
  id: string
  platform: 'instagram'
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
}

export interface ScrapeResponse {
  posts: ScrapedPost[]
}
