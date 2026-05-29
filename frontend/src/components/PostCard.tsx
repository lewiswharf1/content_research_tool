import { useState } from 'react'
import { Bookmark, BookmarkCheck, Trash2, Mic } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PostCardData } from '@/types/api'

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
  post: PostCardData
  // Search page
  isSaved?: boolean
  onSave?: (post: PostCardData) => void
  // Saved page
  onDelete?: (id: string) => void
}

export function PostCard({ post, isSaved, onSave, onDelete }: Props) {
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)
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
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelative(post.postedAt)}
            </span>
            {onSave && (
              <button
                onClick={() => !isSaved && onSave(post)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isSaved
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
                title={isSaved ? 'Already saved' : 'Save'}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
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
            <p className={captionExpanded ? '' : 'line-clamp-3'}>{post.caption}</p>
            {captionLong && (
              <button
                onClick={() => setCaptionExpanded(e => !e)}
                className="text-xs text-primary hover:underline mt-1 cursor-pointer"
              >
                {captionExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        ) : null}

        {/* Transcript — Saved page only */}
        {onDelete && (
          <div className="border-t border-border pt-3">
            {post.transcript ? (
              <div className="text-sm text-muted-foreground">
                <p className="text-xs font-medium text-foreground mb-1">Transcript</p>
                <p className={transcriptExpanded ? '' : 'line-clamp-4'}>{post.transcript}</p>
                {post.transcript.length > 200 && (
                  <button
                    onClick={() => setTranscriptExpanded(e => !e)}
                    className="text-xs text-primary hover:underline mt-1 cursor-pointer"
                  >
                    {transcriptExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            ) : (
              <Button variant="outline" size="sm" disabled className="w-full gap-2 text-xs">
                <Mic size={13} />
                Transcribe
              </Button>
            )}
          </div>
        )}

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
