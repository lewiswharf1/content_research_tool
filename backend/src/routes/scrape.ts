import { Router } from 'express'
import { ApifyClient } from 'apify-client'
import type { ScrapedPost, ScrapeRequest, ScrapeResponse } from '../types'

const router = Router()

type RawItem = Record<string, unknown>

router.post('/', async (req, res) => {
  const { targets, limit = 20, newerThan } = req.body as ScrapeRequest

  if (!Array.isArray(targets) || targets.length === 0) {
    res.status(400).json({ error: 'targets must be a non-empty array' })
    return
  }

  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'APIFY_API_KEY is not configured' })
    return
  }

  const directUrls = targets.map(t =>
    t.type === 'hashtag'
      ? `https://www.instagram.com/explore/tags/${t.value}/`
      : `https://www.instagram.com/${t.value}/`
  )

  const client = new ApifyClient({ token: apiKey })

  try {
    const run = await client.actor('apify/instagram-scraper').call({
      directUrls,
      resultsType: 'reels',
      resultsLimit: limit,
      ...(newerThan && { onlyPostsNewerThan: newerThan }),
    })

    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    const posts: ScrapedPost[] = (items as RawItem[])
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
          engagement: followers > 0 ? Math.round(((likes + comments) / followers) * 10000) / 100 : 0,
        }
      })

    const response: ScrapeResponse = { posts }
    res.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Apify scrape failed: ${message}` })
  }
})

export { router as scrapeRouter }
