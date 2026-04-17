'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber, getScoreColorHex } from '@/lib/utils'

interface WatchlistItem {
  id: string
  geography_id: string
  notes: string | null
  added_at: string
  market: {
    id: string
    name: string
    geo_type: string
    state_abbreviation: string | null
    strength_score: number | null
    risk_score: number | null
    migration_score: number | null
    investor_score: number | null
    median_list_price: number | null
    unemployment_rate: number | null
  }
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setLoading(false)
        return
      }

      const { data: watchlist } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (watchlist) {
        const { data: wItems } = await supabase
          .from('watchlist_items')
          .select(`
            id, geography_id, notes, added_at,
            market:geographies!geography_id(
              id, name, geo_type, state_abbreviation
            )
          `)
          .eq('watchlist_id', watchlist.id)
          .order('added_at', { ascending: false })

        if (wItems) {
          const geoIds = wItems.map((i) => i.geography_id)
          const { data: summaries } = await supabase
            .from('market_summary_mv')
            .select('id, strength_score, risk_score, migration_score, investor_score, median_list_price, unemployment_rate')
            .in('id', geoIds)

          const summaryMap = new Map(summaries?.map((s) => [s.id, s]) || [])

          const enriched = wItems.map((item) => ({
            ...item,
            market: {
              ...(item.market as unknown as Record<string, unknown>),
              ...(summaryMap.get(item.geography_id) || {}),
            },
          })) as WatchlistItem[]

          setItems(enriched)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function removeItem(itemId: string) {
    await supabase.from('watchlist_items').delete().eq('id', itemId)
    setItems(items.filter((i) => i.id !== itemId))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-wt-muted text-sm">Loading watchlist...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="wt-card p-12 text-center max-w-md mx-auto">
          <Star className="w-8 h-8 text-wt-muted mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">Sign in to use Watchlists</h2>
          <p className="text-wt-muted text-sm mb-6">
            Save and track markets you care about. Free accounts get 1 watchlist with 10 markets.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-wt-accent text-wt-bg font-bold px-6 py-3 text-sm hover:bg-cyan-400 transition-colors"
          >
            Sign In Free
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Watchlist</h1>
          <p className="text-wt-muted text-sm mt-1">{items.length} markets saved</p>
        </div>
        <Link href="/explore" className="flex items-center gap-2 border border-wt-border px-4 py-2 text-sm hover:border-wt-muted transition-colors">
          <Plus className="w-4 h-4" />
          Add Markets
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="wt-card p-12 text-center">
          <Star className="w-8 h-8 text-wt-muted mx-auto mb-4" />
          <h2 className="font-semibold mb-2">No markets saved yet</h2>
          <p className="text-wt-muted text-sm mb-6">
            Browse the map or rankings and save markets to track here.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/explore" className="text-sm border border-wt-border px-4 py-2 hover:border-wt-muted">
              Open Map
            </Link>
            <Link href="/rankings" className="text-sm bg-wt-accent text-wt-bg font-semibold px-4 py-2">
              Browse Rankings
            </Link>
          </div>
        </div>
      ) : (
        <div className="wt-card overflow-hidden">
          <div className="grid grid-cols-7 gap-4 px-5 py-3 border-b border-wt-border text-xs text-wt-muted font-medium">
            <div className="col-span-2">Market</div>
            <div className="text-right">Strength</div>
            <div className="text-right">Risk</div>
            <div className="text-right">Migration</div>
            <div className="text-right">List Price</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-wt-border">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-7 gap-4 px-5 py-4 items-center hover:bg-wt-border/20 transition-colors">
                <div className="col-span-2">
                  <Link href={`/market/${item.geography_id}`} className="font-medium text-sm hover:text-wt-accent transition-colors">
                    {item.market.name?.split(',')[0] || 'Unknown'}
                  </Link>
                  <div className="text-xs text-wt-muted mt-0.5">{item.market.state_abbreviation} · {item.market.geo_type}</div>
                </div>
                <ScoreCell value={item.market.strength_score} />
                <ScoreCell value={item.market.risk_score} isRisk />
                <ScoreCell value={item.market.migration_score} />
                <div className="text-right text-sm font-medium">
                  {item.market.median_list_price ? formatCurrency(item.market.median_list_price) : '—'}
                </div>
                <div className="text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-wt-muted hover:text-wt-red transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreCell({ value, isRisk = false }: { value: number | null | undefined; isRisk?: boolean }) {
  const color = getScoreColorHex(value ?? null, isRisk)
  return (
    <div className="text-right text-sm font-bold tabular-nums" style={{ color }}>
      {value ? Math.round(value) : '—'}
    </div>
  )
}
