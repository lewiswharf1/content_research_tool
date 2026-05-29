import { useState } from 'react'
import { SearchForm } from '@/components/SearchForm'
import { ResultsGrid } from '@/components/ResultsGrid'
import type { ScrapedPost, ScrapeTarget } from '@/types/api'

export default function App() {
  const [posts, setPosts] = useState<ScrapedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(target: ScrapeTarget) {
    setLoading(true)
    setError(null)
    setSearched(true)
    setPosts([])
    try {
      const res = await fetch('http://localhost:3001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: [target], limit: 20 }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPosts(data.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outlier Content Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search Instagram Reels by hashtag or profile
          </p>
        </div>
        <SearchForm onSearch={handleSearch} loading={loading} />
        <ResultsGrid posts={posts} loading={loading} error={error} searched={searched} />
      </div>
    </div>
  )
}
