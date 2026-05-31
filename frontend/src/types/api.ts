export interface ScrapeTarget {
  type: 'hashtag' | 'profile' | 'url'
  value: string
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
  outlierScore: number | null
}

export interface SavedPost extends ScrapedPost {
  transcript: string | null
  savedAt: string
}

// PostCard accepts either shape — transcript/savedAt are optional
export interface PostCardData extends ScrapedPost {
  transcript?: string | null
  savedAt?: string
}

export interface ScrapeResponse {
  posts: ScrapedPost[]
}

export interface SavedResponse {
  reels: SavedPost[]
}
