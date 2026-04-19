'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent, formatNumber, getScoreColorHex } from '@/lib/utils'
import ScoreCard from '@/components/scores/ScoreCard'

interface MarketData {
  id: string
  name: string
  geo_type: string
  state_abbreviation: string | null
  strength_score: number | null
  risk_score: number | null
  migration_score: number | null
  affordability_score: number | null
  investor_score: number | null
  median_list_price: number | null
  days_on_market: number | null
  unemployment_rate: number | null
  net_migration_rate: number | null
  population_growth_pct: number | null
  months_of_supply: number | null
  price_to_income_ratio: number | null
  median_household_income: number | null
  job_growth_pct: number | null
  rent_growth_yoy_pct: number | null
  median_rent_2br: number | null
}

const COMPARE_METRICS: { key: keyof MarketData; label: string; format: 'currency' | 'percent' | 'number' | 'ratio'; higherIsBetter: boolean }[] = [
  { key: 'median_list_price', label: 'Median List Price', format: 'currency', higherIsBetter: false },
  { key: 'days_on_market', label: 'Days on Market', format: 'number', higherIsBetter: false },
  { key: 'months_of_supply', label: 'Months of Supply', format: 'number', higherIsBetter: false },
  { key: 'unemployment_rate', label: 'Unemployment Rate', format: 'percent', higherIsBetter: false },
  { key: 'job_growth_pct', label: 'Job Growth', format: 'percent', higherIsBetter: true },
  { key: 'net_migration_rate', label: 'Net Migration Rate', format: 'number', higherIsBetter: true },
  { key: 'population_growth_pct', label: 'Population Growth', format: 'percent', higherIsBetter: true },
  { key: 'median_household_income', label: 'Median Income', format: 'currency', higherIsBetter: true },
  { key: 'price_to_income_ratio', label: 'Price/Income Ratio', format: 'ratio', higherIsBetter: false },
  { key: 'median_rent_2br', label: 'Median Rent (2BR)', format: 'currency', higherIsBetter: false },
  { key: 'rent_growth_yoy_pct', label: 'Rent Growth YoY', format: 'percent', higherIsBetter: false },
]

function formatValue(value: number | null | undefined, format: string): string {
  if (value === null || value === undefined) return '—'
  switch (format) {
    case 'currency': return formatCurrency(value)
    case 'percent': return formatPercent(value, true)
    case 'number': return formatNumber(value)
    case 'ratio': return value.toFixed(1) + 'x'
    default: return String(value)
  }
}

export default function ComparePage() {
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; state_abbreviation: string | null }[]>([])
  const [searching, setSearching] = useState(false)

  const supabase = createClient()

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase
      .from('market_summary_mv')
      .select('id, name, geo_type, state_abbreviation')
      .eq('geo_type', 'metro')
      .ilike('name', `%${q}%`)
      .limit(8)
    setSearchResults(data || [])
    setSearching(false)
  }

  async function addMarket(id: string) {
    if (markets.length >= 4) return
    if (markets.find((m) => m.id === id)) return

    const { data } = await supabase
      .from('market_summary_mv')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setMarkets([...markets, data])
      setSearchQuery('')
      setSearchResults([])
    }
  }

  function removeMarket(id: string) {
    setMarkets(markets.filter((m) => m.id !== id))
  }

  const SCORES: { key: keyof MarketData; label: string; type: 'strength' | 'risk' | 'migration' | 'affordability' | 'investor' }[] = [
    { key: 'strength_score', label: 'Strength', type: 'strength' },
    { key: 'risk_score', label: 'Risk', type: 'risk' },
    { key: 'migration_score', label: 'Migration', type: 'migration' },
    { key: 'affordability_score', label: 'Affordability', type: 'affordability' },
    { key: 'investor_score', label: 'Investor', type: 'investor' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-bold">Compare Markets</h1>
        <p className="text-wt-muted text-sm mt-1">Add up to 4 markets to compare side by side</p>
      </div>

      {/* Market selector */}
      <div className="flex gap-3 items-start">
        {markets.length < 4 && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a metro..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-wt-surface border border-wt-border text-white placeholder-wt-muted px-4 py-2 text-sm w-72 focus:outline-none focus:border-wt-accent"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-wt-surface border border-wt-border z-50 mt-0.5">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => addMarket(r.id)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-wt-border/50 flex items-center justify-between"
                  >
                    <span>{r.name}</span>
                    <span className="text-wt-muted text-xs">{r.state_abbreviation}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {markets.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-wt-surface border border-wt-border px-3 py-2 text-sm">
              <span className="font-medium">{m.name.split(',')[0].split('-')[0]}</span>
              <button onClick={() => removeMarket(m.id)} className="text-wt-muted hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {markets.length === 0 ? (
        <div className="wt-card p-12 text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <div className="text-wt-muted text-sm">Search for metros above to start comparing</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score comparison */}
          <div className="wt-card">
            <div className="p-5 border-b border-wt-border">
              <h3 className="font-semibold text-sm">Watchtower Scores</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-wt-border">
                    <th className="text-left px-5 py-3 text-xs text-wt-muted font-medium w-32">Score</th>
                    {markets.map((m) => (
                      <th key={m.id} className="text-right px-5 py-3 text-xs font-medium text-white">
                        {m.name.split(',')[0].split('-')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCORES.map((s) => (
                    <tr key={s.key} className="border-b border-wt-border last:border-0">
                      <td className="px-5 py-3 text-sm text-wt-muted">{s.label}</td>
                      {markets.map((m) => {
                        const val = m[s.key] as number | null
                        return (
                          <td key={m.id} className="px-5 py-3 text-right">
                            <span
                              className="text-lg font-bold tabular-nums"
                              style={{ color: getScoreColorHex(val, s.type === 'risk') }}
                            >
                              {val ? Math.round(val) : '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metrics comparison */}
          <div className="wt-card">
            <div className="p-5 border-b border-wt-border">
              <h3 className="font-semibold text-sm">Key Metrics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-wt-border">
                    <th className="text-left px-5 py-3 text-xs text-wt-muted font-medium w-48">Metric</th>
                    {markets.map((m) => (
                      <th key={m.id} className="text-right px-5 py-3 text-xs font-medium text-white">
                        {m.name.split(',')[0].split('-')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_METRICS.map((metric) => (
                    <tr key={metric.key} className="border-b border-wt-border last:border-0">
                      <td className="px-5 py-3 text-sm text-wt-muted">{metric.label}</td>
                      {markets.map((m) => {
                        const val = m[metric.key] as number | null
                        const allVals = markets.map((mx) => mx[metric.key] as number | null).filter((v) => v !== null) as number[]
                        const isBest = val !== null && allVals.length > 1 && (
                          metric.higherIsBetter ? val === Math.max(...allVals) : val === Math.min(...allVals)
                        )
                        return (
                          <td key={m.id} className="px-5 py-3 text-right">
                            <span className={`text-sm font-medium tabular-nums ${isBest ? 'text-wt-green' : 'text-white'}`}>
                              {formatValue(val, metric.format)}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
