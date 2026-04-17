'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  name: string
  geo_type: string
  state_abbreviation: string | null
}

export default function Header() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 2) {
      setResults([])
      return
    }
    const { data } = await supabase
      .from('market_summary_mv')
      .select('id, name, geo_type, state_abbreviation')
      .ilike('name', `%${q}%`)
      .in('geo_type', ['metro', 'state', 'county'])
      .limit(8)
    setResults(data || [])
    setOpen(true)
  }

  function handleSelect(id: string) {
    router.push(`/market/${id}`)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const GEO_TYPE_LABELS: Record<string, string> = {
    metro: 'Metro',
    state: 'State',
    county: 'County',
    zip: 'ZIP',
    nation: 'National',
  }

  return (
    <header className="h-14 border-b border-wt-border bg-wt-surface px-5 flex items-center justify-between flex-shrink-0">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-wt-bg border border-wt-border px-3 py-1.5 w-72">
          <Search className="w-3.5 h-3.5 text-wt-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search any market..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            className="bg-transparent text-sm text-white placeholder-wt-muted focus:outline-none w-full"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}>
              <X className="w-3.5 h-3.5 text-wt-muted hover:text-white" />
            </button>
          )}
        </div>
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-wt-surface border border-wt-border z-50 mt-0.5 shadow-xl">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-wt-border/50 flex items-center justify-between group"
              >
                <span className="group-hover:text-white transition-colors">{r.name}</span>
                <div className="flex items-center gap-2">
                  {r.state_abbreviation && (
                    <span className="text-xs text-wt-muted">{r.state_abbreviation}</span>
                  )}
                  <span className="text-xs text-wt-border bg-wt-bg px-1.5 py-0.5">
                    {GEO_TYPE_LABELS[r.geo_type] || r.geo_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-wt-muted hidden md:block">
          All data updated monthly
        </span>
        <Link
          href="/auth/login"
          className="text-xs text-wt-muted hover:text-white transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="text-xs bg-wt-accent text-wt-bg font-semibold px-3 py-1.5 hover:bg-cyan-400 transition-colors"
        >
          Sign Up Free
        </Link>
      </div>
    </header>
  )
}
