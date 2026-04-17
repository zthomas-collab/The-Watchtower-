'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react'
import { getScoreColorHex } from '@/lib/utils'
import { SCORE_LABELS } from '@/types/scores'

interface MarketCardProps {
  id: string
  name: string
  geo_type: string
  state_abbreviation: string | null
  strength_score: number | null
  risk_score: number | null
  migration_score: number | null
  affordability_score: number | null
  investor_score: number | null
  median_sale_price: number | null
  unemployment_rate: number | null
  population: number | null
  rank?: number
  variant?: 'default' | 'compact' | 'list'
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const color = getScoreColorHex(value)
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-wt-muted uppercase tracking-wide">{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {Math.round(value)}
      </span>
    </div>
  )
}

function TrendIcon({ value }: { value: number | null }) {
  if (value === null) return <Minus className="w-3 h-3 text-wt-muted" />
  if (value > 0) return <TrendingUp className="w-3 h-3 text-wt-green" />
  return <TrendingDown className="w-3 h-3 text-wt-red" />
}

const GEO_TYPE_LABEL: Record<string, string> = {
  metro: 'Metro',
  state: 'State',
  county: 'County',
  zip: 'ZIP',
  nation: 'National',
}

function formatPrice(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

export default function MarketCard({
  id,
  name,
  geo_type,
  state_abbreviation,
  strength_score,
  risk_score,
  migration_score,
  affordability_score,
  investor_score,
  median_sale_price,
  unemployment_rate,
  rank,
  variant = 'default',
}: MarketCardProps) {
  if (variant === 'list') {
    return (
      <Link
        href={`/market/${id}`}
        className="flex items-center gap-4 px-4 py-3 hover:bg-wt-border/30 transition-colors border-b border-wt-border last:border-0 group"
      >
        {rank !== undefined && (
          <span className="text-xs text-wt-muted w-6 flex-shrink-0 tabular-nums">#{rank}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium group-hover:text-wt-accent transition-colors truncate">
              {name}
            </span>
            {state_abbreviation && (
              <span className="text-xs text-wt-muted flex-shrink-0">{state_abbreviation}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-wt-muted" />
            <span className="text-xs text-wt-muted">
              {GEO_TYPE_LABEL[geo_type] || geo_type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <ScorePill label="STR" value={strength_score} />
          <ScorePill label="RSK" value={risk_score} />
          <ScorePill label="MIG" value={migration_score} />
          <ScorePill label="AFF" value={affordability_score} />
          <ScorePill label="INV" value={investor_score} />
        </div>
        <div className="text-right hidden md:block w-20">
          <div className="text-sm font-medium tabular-nums">{formatPrice(median_sale_price)}</div>
          {unemployment_rate !== null && (
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <TrendIcon value={null} />
              <span className="text-xs text-wt-muted">{unemployment_rate.toFixed(1)}% UE</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/market/${id}`}
        className="wt-card p-3 hover:border-wt-accent/50 transition-colors group block"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-sm font-medium group-hover:text-wt-accent transition-colors truncate">
              {name}
            </div>
            <div className="text-xs text-wt-muted mt-0.5">
              {GEO_TYPE_LABEL[geo_type] || geo_type}
              {state_abbreviation && ` · ${state_abbreviation}`}
            </div>
          </div>
          {strength_score !== null && (
            <div
              className="text-xl font-bold tabular-nums flex-shrink-0"
              style={{ color: getScoreColorHex(strength_score) }}
            >
              {Math.round(strength_score)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-wt-muted">
          <span>{formatPrice(median_sale_price)}</span>
          {unemployment_rate !== null && <span>{unemployment_rate.toFixed(1)}% UE</span>}
        </div>
      </Link>
    )
  }

  // Default card
  return (
    <Link
      href={`/market/${id}`}
      className="wt-card p-4 hover:border-wt-accent/50 transition-colors group block space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {rank !== undefined && (
            <div className="text-xs text-wt-muted mb-1">#{rank}</div>
          )}
          <div className="text-sm font-semibold group-hover:text-wt-accent transition-colors leading-tight truncate">
            {name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-2.5 h-2.5 text-wt-muted" />
            <span className="text-xs text-wt-muted">
              {GEO_TYPE_LABEL[geo_type] || geo_type}
              {state_abbreviation && ` · ${state_abbreviation}`}
            </span>
          </div>
        </div>
        {strength_score !== null && (
          <div className="text-right flex-shrink-0">
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color: getScoreColorHex(strength_score) }}
            >
              {Math.round(strength_score)}
            </div>
            <div className="text-[10px] text-wt-muted uppercase tracking-wide">
              {SCORE_LABELS.strength}
            </div>
          </div>
        )}
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-wt-border">
        <ScorePill label="Risk" value={risk_score} />
        <ScorePill label="Migr." value={migration_score} />
        <ScorePill label="Afford." value={affordability_score} />
        <ScorePill label="Invest." value={investor_score} />
      </div>

      {/* Footer metrics */}
      <div className="flex items-center justify-between text-xs text-wt-muted pt-1 border-t border-wt-border">
        <div>
          <span className="text-white font-medium">{formatPrice(median_sale_price)}</span>
          <span className="ml-1">median</span>
        </div>
        {unemployment_rate !== null && (
          <div className="flex items-center gap-1">
            <TrendIcon value={null} />
            <span>{unemployment_rate.toFixed(1)}% UE</span>
          </div>
        )}
      </div>
    </Link>
  )
}
