import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ScrapeTarget } from '@/types/api'

interface Props {
  onSearch: (target: ScrapeTarget) => void
  loading: boolean
}

export function SearchForm({ onSearch, loading }: Props) {
  const [type, setType] = useState<'hashtag' | 'profile'>('hashtag')
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim().replace(/^[#@]/, '')
    if (!trimmed) return
    onSearch({ type, value: trimmed })
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
    </form>
  )
}
