import { useState, useEffect } from 'react'
import { SearchForm } from '@/components/SearchForm'
import type { SearchParams } from '@/components/SearchForm'
import { ResultsGrid } from '@/components/ResultsGrid'
import type { ScrapedPost, PostCardData } from '@/types/api'

export function SearchPage() {
  const [posts, setPosts] = useState<ScrapedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('http://localhost:3001/api/saved')
      .then(r => r.json())
      .then(data => setSavedIds(new Set(data.reels.map((r: { id: string }) => r.id))))
      .catch(() => {})
  }, [])

  async function handleSearch({ target, limit, minDate }: SearchParams) {
    setLoading(true)
    setError(null)
    setSearched(true)
    setPosts([])
    try {
      const res = await fetch('http://localhost:3001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: [target], limit, minDate }),
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

  async function handleSave(post: PostCardData) {
    try {
      await fetch('http://localhost:3001/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })
      setSavedIds(prev => new Set([...prev, post.id]))
    } catch {
      // silently fail — user can retry
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search Instagram Reels by hashtag or profile, or paste an Instagram or TikTok video URL
        </p>
      </div>
      <SearchForm onSearch={handleSearch} loading={loading} />
      <ResultsGrid
        posts={posts}
        loading={loading}
        error={error}
        searched={searched}
        savedIds={savedIds}
        onSave={handleSave}
      />
    </div>
  )
}
