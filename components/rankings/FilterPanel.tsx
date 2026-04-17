'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface Props {
  current: {
    sort?: string
    geo_type?: string
    min_strength?: string
    max_risk?: string
    max_price?: string
    max_unemployment?: string
    min_job_growth?: string
    state?: string
  }
}

const PRESETS: { label: string; icon: string; params: Record<string, string> }[] = [
  {
    label: 'High Growth',
    icon: '🚀',
    params: { sort: 'strength', min_strength: '65', max_risk: '50' },
  },
  {
    label: 'Best Value',
    icon: '💎',
    params: { sort: 'affordability', max_price: '350000', max_unemployment: '5' },
  },
  {
    label: 'Migration Magnets',
    icon: '🧲',
    params: { sort: 'migration', min_strength: '50' },
  },
  {
    label: 'Warning Signs',
    icon: '⚠️',
    params: { sort: 'risk', max_risk: '100', min_strength: '0' },
  },
]

const GEO_TYPE_OPTIONS = [
  { value: 'metro', label: 'Metros' },
  { value: 'state', label: 'States' },
  { value: 'county', label: 'Counties' },
]

export default function FilterPanel({ current }: Props) {
  const router = useRouter()

  const applyFilters = useCallback((params: Record<string, string>) => {
    const p = new URLSearchParams({ ...current, ...params })
    p.set('page', '1')
    router.push(`/rankings?${p.toString()}`)
  }, [current, router])

  const applyPreset = (presetParams: Record<string, string>) => {
    const p = new URLSearchParams(presetParams)
    p.set('geo_type', current.geo_type || 'metro')
    p.set('page', '1')
    router.push(`/rankings?${p.toString()}`)
  }

  const clearFilters = () => {
    router.push(`/rankings?geo_type=${current.geo_type || 'metro'}&sort=strength`)
  }

  return (
    <div className="wt-card p-4 space-y-5">
      {/* Presets */}
      <div>
        <div className="wt-label mb-2">Quick Filters</div>
        <div className="space-y-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.params)}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-wt-border/50 transition-colors text-wt-muted hover:text-white"
            >
              <span>{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-wt-border" />

      {/* Geography type */}
      <div>
        <div className="wt-label mb-2">Geography</div>
        <div className="space-y-1">
          {GEO_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyFilters({ geo_type: opt.value })}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                (current.geo_type || 'metro') === opt.value
                  ? 'bg-wt-accent/10 text-wt-accent'
                  : 'text-wt-muted hover:text-white hover:bg-wt-border/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-wt-border" />

      {/* Score filters */}
      <div>
        <div className="wt-label mb-3">Score Thresholds</div>
        <div className="space-y-3">
          <FilterInput
            label="Min Strength"
            name="min_strength"
            value={current.min_strength || ''}
            placeholder="0"
            onChange={(v) => applyFilters({ min_strength: v })}
          />
          <FilterInput
            label="Max Risk"
            name="max_risk"
            value={current.max_risk || ''}
            placeholder="100"
            onChange={(v) => applyFilters({ max_risk: v })}
          />
        </div>
      </div>

      <div className="border-t border-wt-border" />

      {/* Metric filters */}
      <div>
        <div className="wt-label mb-3">Metric Filters</div>
        <div className="space-y-3">
          <FilterInput
            label="Max List Price ($)"
            name="max_price"
            value={current.max_price || ''}
            placeholder="e.g. 400000"
            onChange={(v) => applyFilters({ max_price: v })}
          />
          <FilterInput
            label="Max Unemployment (%)"
            name="max_unemployment"
            value={current.max_unemployment || ''}
            placeholder="e.g. 5.0"
            onChange={(v) => applyFilters({ max_unemployment: v })}
          />
          <FilterInput
            label="Min Job Growth (%)"
            name="min_job_growth"
            value={current.min_job_growth || ''}
            placeholder="e.g. 1.5"
            onChange={(v) => applyFilters({ min_job_growth: v })}
          />
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full text-xs text-wt-muted border border-wt-border py-2 hover:border-wt-muted hover:text-white transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}

function FilterInput({
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  label: string
  name: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs text-wt-muted block mb-1">{label}</label>
      <input
        type="number"
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => {
          if (e.target.value !== value) onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onChange((e.target as HTMLInputElement).value)
        }}
        className="w-full bg-wt-bg border border-wt-border text-white text-xs px-3 py-2 focus:outline-none focus:border-wt-accent placeholder-wt-muted/50"
      />
    </div>
  )
}
