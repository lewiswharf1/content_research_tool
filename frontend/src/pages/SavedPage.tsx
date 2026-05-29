import { useState, useEffect } from 'react'
import { PostCard } from '@/components/PostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { SavedPost } from '@/types/api'

export function SavedPage() {
  const [reels, setReels] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:3001/api/saved')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => setReels(data.reels))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load saved reels'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    try {
      await fetch(`http://localhost:3001/api/saved/${id}`, { method: 'DELETE' })
      setReels(prev => prev.filter(r => r.id !== id))
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col gap-3">
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {reels.length} saved reel{reels.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!error && reels.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No saved reels yet. Search for content and click the bookmark icon to save.
        </div>
      )}

      {reels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reels.map(reel => (
            <PostCard
              key={reel.id}
              post={reel}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
