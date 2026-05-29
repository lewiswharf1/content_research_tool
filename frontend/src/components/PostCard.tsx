import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ScrapedPost } from '@/types/api'

function formatRelative(isoDate: string): string {
  if (!isoDate) return ''
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  return `${months}mo ago`
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface Props {
  post: ScrapedPost
}

export function PostCard({ post }: Props) {
  const [expanded, setExpanded] = useState(false)
  const captionLong = post.caption.length > 120

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <a
            href={`https://www.instagram.com/${post.username}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm hover:underline truncate"
          >
            @{post.username}
          </a>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatRelative(post.postedAt)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">👁 {formatCount(post.views)}</Badge>
          <Badge variant="secondary">❤️ {formatCount(post.likes)}</Badge>
          <Badge variant="secondary">💬 {formatCount(post.comments)}</Badge>
          {post.engagement > 0 && (
            <Badge variant="outline">{post.engagement}% eng</Badge>
          )}
        </div>

        {post.caption ? (
          <div className="text-sm text-muted-foreground">
            <p className={expanded ? '' : 'line-clamp-3'}>{post.caption}</p>
            {captionLong && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-primary hover:underline mt-1 cursor-pointer"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        ) : null}

        <div className="mt-auto pt-2 border-t border-border">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View on Instagram ↗
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
