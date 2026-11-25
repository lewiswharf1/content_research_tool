import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ScrapeTarget } from '@/types/api'

export interface SearchParams {
  target: ScrapeTarget
  limit: number
  minDate: string
}

interface Props {
  onSearch: (params: SearchParams) => void
  loading: boolean
}

function defaultMinDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}

function isInstagramUrl(url: string): boolean {
  return /https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9_.]+\/)?(p|reel|reels)\/[A-Za-z0-9_-]+/.test(url.trim())
}

function isTikTokUrl(url: string): boolean {
  const trimmed = url.trim()
  return /^https?:\/\/(www\.|m\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/.test(trimmed)
    || /^https?:\/\/((vm|vt)\.tiktok\.com\/|(www\.)?tiktok\.com\/t\/)[\w-]+/.test(trimmed)
}

type TargetType = 'hashtag' | 'profile' | 'url'

const toggleBtn = (active: boolean) =>
  `px-4 py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
    active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'
  }`

export function SearchForm({ onSearch, loading }: Props) {
  const [type, setType] = useState<TargetType>('hashtag')
  const [value, setValue] = useState('')
  const [limit, setLimit] = useState(10)
  const [minDate, setMinDate] = useState(defaultMinDate)
  const [urlError, setUrlError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    if (type === 'url') {
      if (!isInstagramUrl(trimmed) && !isTikTokUrl(trimmed)) {
        setUrlError('Must be an Instagram post/reel URL (instagram.com/reel/…) or a TikTok video/share link (tiktok.com/@user/video/… or vm.tiktok.com/…)')
        return
      }
      setUrlError(null)
      onSearch({ target: { type: 'url', value: trimmed }, limit, minDate })
      return
    }

    const cleaned = trimmed.replace(/^[#@]/, '')
    onSearch({ target: { type, value: cleaned }, limit, minDate })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => { setType('hashtag'); setUrlError(null) }} className={toggleBtn(type === 'hashtag')}># Hashtag</button>
        <button type="button" onClick={() => { setType('profile'); setUrlError(null) }} className={toggleBtn(type === 'profile')}>@ Profile</button>
        <button type="button" onClick={() => { setType('url'); setUrlError(null) }} className={toggleBtn(type === 'url')}>Post URL</button>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={
            type === 'hashtag' ? 'e.g. vibecoding'
            : type === 'profile' ? 'e.g. therock'
            : 'Instagram reel or TikTok video URL'
          }
          value={value}
          onChange={e => { setValue(e.target.value); if (urlError) setUrlError(null) }}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !value.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {urlError && <p className="text-xs text-destructive">{urlError}</p>}

      {type !== 'url' && (
        <div className="flex gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Number of posts</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={e => setLimit(Math.min(50, Math.max(1, Number(e.target.value))))}
              className="w-24"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Posts from</label>
            <Input
              type="date"
              value={minDate}
              onChange={e => setMinDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      )}
    </form>
  )
}
