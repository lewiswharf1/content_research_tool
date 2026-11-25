import { Router } from 'express'
import { ApifyClient } from 'apify-client'
import type { ScrapedPost, ScrapeRequest, ScrapeResponse, ScrapeTarget } from '../types'

const router = Router()

type RawItem = Record<string, unknown>

const TIKTOK_VIDEO_URL = /^https?:\/\/(www\.|m\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/

// Share links like https://vm.tiktok.com/ZN8uPKL1N/ or https://www.tiktok.com/t/ZTabc123/
const TIKTOK_SHORT_URL = /^https?:\/\/((vm|vt)\.tiktok\.com\/|(www\.)?tiktok\.com\/t\/)[\w-]+/

function isTikTokUrl(url: string): boolean {
  const trimmed = url.trim()
  return TIKTOK_VIDEO_URL.test(trimmed) || TIKTOK_SHORT_URL.test(trimmed)
}

class InvalidTargetError extends Error {}

/** Follow share-link redirects and return a canonical https://www.tiktok.com/@user/video/<id> URL. */
async function resolveTikTokUrl(url: string): Promise<string> {
  let current = url.trim()
  for (let hop = 0; hop < 5 && !TIKTOK_VIDEO_URL.test(current); hop++) {
    const res = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
    const location = res.headers.get('location')
    if (!location) break
    current = new URL(location, current).toString()
  }

  const match = current.match(TIKTOK_VIDEO_URL)
  if (!match) throw new InvalidTargetError(`Could not resolve TikTok link to a video: ${url}`)
  // Drop tracking query params (?_r=1&_t=…)
  return match[0]
}

function engagementRate(likes: number, comments: number, followers: number): number {
  return followers > 0 ? Math.round(((likes + comments) / followers) * 10000) / 100 : 0
}

function addOutlierScores(posts: ScrapedPost[], isUrlScrape: boolean): ScrapedPost[] {
  if (isUrlScrape) return posts.map(p => ({ ...p, outlierScore: 5 }))

  if (posts.length <= 1) return posts.map(p => ({ ...p, outlierScore: null }))

  const sorted = [...posts.map(p => p.views)].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]

  if (median === 0) return posts.map(p => ({ ...p, outlierScore: null }))

  return posts.map(p => ({
    ...p,
    outlierScore: Math.round((p.views / median) * 100) / 100,
  }))
}

async function scrapeInstagram(
  client: ApifyClient,
  targets: ScrapeTarget[],
  limit: number,
  minDate: string | undefined,
): Promise<ScrapedPost[]> {
  const isUrlScrape = targets.some(t => t.type === 'url')

  const directUrls = targets.map(t => {
    if (t.type === 'url') return t.value
    if (t.type === 'hashtag') return `https://www.instagram.com/explore/tags/${t.value}/`
    return `https://www.instagram.com/${t.value}/`
  })

  const run = await client.actor('apify/instagram-scraper').call({
    directUrls,
    resultsType: isUrlScrape ? 'posts' : 'reels',
    resultsLimit: isUrlScrape ? targets.length : limit,
    ...(!isUrlScrape && minDate ? { onlyPostsNewerThan: minDate } : {}),
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return (items as RawItem[])
    .filter(item => Boolean(item['videoUrl']))
    .map(item => {
      const likes = (item['likesCount'] as number) ?? 0
      const comments = (item['commentsCount'] as number) ?? 0
      const followers = (item['followersCount'] as number) ?? (item['ownerFollowersCount'] as number) ?? 0
      const shortCode = item['shortCode'] as string | undefined

      return {
        id: String(item['id'] ?? shortCode ?? ''),
        platform: 'instagram' as const,
        url: (item['url'] as string) ?? (shortCode ? `https://www.instagram.com/p/${shortCode}/` : ''),
        videoUrl: (item['videoUrl'] as string) ?? '',
        caption: (item['caption'] as string) ?? '',
        username: (item['ownerUsername'] as string) ?? '',
        followers,
        likes,
        comments,
        views: (item['videoPlayCount'] as number) ?? (item['igPlayCount'] as number) ?? 0,
        postedAt: (item['timestamp'] as string) ?? '',
        engagement: engagementRate(likes, comments, followers),
        outlierScore: null,
      }
    })
}

async function scrapeTikTokUrls(client: ApifyClient, urls: string[]): Promise<ScrapedPost[]> {
  const run = await client.actor('clockworks/tiktok-video-scraper').call({
    postURLs: urls,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  return (items as RawItem[])
    .filter(item => Boolean(item['webVideoUrl']) && !item['error'])
    .map(item => {
      const webVideoUrl = item['webVideoUrl'] as string
      const author = (item['authorMeta'] as RawItem | undefined) ?? {}
      const videoMeta = (item['videoMeta'] as RawItem | undefined) ?? {}
      const likes = (item['diggCount'] as number) ?? 0
      const comments = (item['commentCount'] as number) ?? 0
      const followers = (author['fans'] as number) ?? 0

      return {
        id: String(item['id'] ?? webVideoUrl.match(TIKTOK_VIDEO_URL)?.[2] ?? ''),
        platform: 'tiktok' as const,
        url: webVideoUrl,
        // downloadAddr is only populated when shouldDownloadVideos is on; fall back to the page URL
        videoUrl: (videoMeta['downloadAddr'] as string) || webVideoUrl,
        caption: (item['text'] as string) ?? '',
        username: (author['name'] as string) ?? '',
        followers,
        likes,
        comments,
        views: (item['playCount'] as number) ?? 0,
        postedAt: (item['createTimeISO'] as string) ?? '',
        engagement: engagementRate(likes, comments, followers),
        outlierScore: null,
      }
    })
}

router.post('/', async (req, res) => {
  const { targets, limit = 10, minDate } = req.body as ScrapeRequest

  if (!Array.isArray(targets) || targets.length === 0) {
    res.status(400).json({ error: 'targets must be a non-empty array' })
    return
  }

  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'APIFY_API_KEY is not configured' })
    return
  }

  const isUrlScrape = targets.some(t => t.type === 'url')
  const tiktokUrls = targets.filter(t => t.type === 'url' && isTikTokUrl(t.value)).map(t => t.value.trim())
  const instagramTargets = targets.filter(t => !(t.type === 'url' && isTikTokUrl(t.value)))

  const client = new ApifyClient({ token: apiKey })

  let resolvedTikTokUrls: string[]
  try {
    resolvedTikTokUrls = await Promise.all(tiktokUrls.map(resolveTikTokUrl))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(err instanceof InvalidTargetError ? 400 : 502).json({ error: message })
    return
  }

  try {
    const [instagramPosts, tiktokPosts] = await Promise.all([
      instagramTargets.length > 0 ? scrapeInstagram(client, instagramTargets, limit, minDate) : [],
      resolvedTikTokUrls.length > 0 ? scrapeTikTokUrls(client, resolvedTikTokUrls) : [],
    ])

    const response: ScrapeResponse = {
      posts: addOutlierScores([...instagramPosts, ...tiktokPosts], isUrlScrape),
    }
    res.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Apify scrape failed: ${message}` })
  }
})

export { router as scrapeRouter }
