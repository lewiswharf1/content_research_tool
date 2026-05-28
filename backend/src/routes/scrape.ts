import { Router } from 'express'
import { ApifyClient } from 'apify-client'
import type { ScrapeRequest, ScrapedPost, ScrapeResponse } from '../types'

const router = Router()

router.post('/', async (req, res) => {
  const { targets } = req.body as ScrapeRequest

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
      resultsType: 'posts',
      resultsLimit: 20,
    })

    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    const posts: ScrapedPost[] = (items as Record<string, unknown>[])
      .filter(item => Boolean(item['videoUrl']))
      .map(item => {
        const likes = (item['likesCount'] as number) ?? 0
        const comments = (item['commentsCount'] as number) ?? 0
        // follower count is present on profile scrapes; falls back to 0 for hashtag results
        const followers =
          (item['followersCount'] as number) ??
          (item['ownerFollowersCount'] as number) ??
          0
        const engagement =
          followers > 0
            ? Math.round(((likes + comments) / followers) * 10000) / 100
            : 0

        const shortCode = item['shortCode'] as string | undefined

        return {
          id: String(item['id'] ?? shortCode ?? ''),
          platform: 'instagram' as const,
          url:
            (item['url'] as string) ??
            (shortCode ? `https://www.instagram.com/p/${shortCode}/` : ''),
          videoUrl: (item['videoUrl'] as string) ?? '',
          caption: (item['caption'] as string) ?? '',
          username: (item['ownerUsername'] as string) ?? '',
          followers,
          likes,
          comments,
          views:
            (item['videoViewCount'] as number) ??
            (item['viewsCount'] as number) ??
            0,
          postedAt: (item['timestamp'] as string) ?? '',
          engagement,
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
