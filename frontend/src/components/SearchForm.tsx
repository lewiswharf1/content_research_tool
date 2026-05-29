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

export function SearchForm({ onSearch, loading }: Props) {
  const [type, setType] = useState<'hashtag' | 'profile'>('hashtag')
  const [value, setValue] = useState('')
  const [limit, setLimit] = useState(10)
  const [minDate, setMinDate] = useState(defaultMinDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim().replace(/^[#@]/, '')
    if (!trimmed) return
    onSearch({ target: { type, value: trimmed }, limit, minDate })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('hashtag')}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
            type === 'hashtag'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          # Hashtag
        </button>
        <button
          type="button"
          onClick={() => setType('profile')}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
            type === 'profile'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          @ Profile
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={type === 'hashtag' ? 'e.g. vibecoding' : 'e.g. therock'}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !value.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </div>

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
    </form>
  )
}
