import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null, compact = true): string {
  if (value === null || value === undefined) return '—'
  if (compact && value >= 1_000_000) {
    return '$' + (value / 1_000_000).toFixed(1) + 'M'
  }
  if (compact && value >= 1_000) {
    return '$' + (value / 1_000).toFixed(0) + 'K'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number | null, showSign = false): string {
  if (value === null || value === undefined) return '—'
  const formatted = Math.abs(value).toFixed(1) + '%'
  if (showSign) return (value >= 0 ? '+' : '-') + formatted
  return value < 0 ? '-' + formatted : formatted
}

export function formatNumber(value: number | null, compact = true): string {
  if (value === null || value === undefined) return '—'
  if (compact && Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M'
  }
  if (compact && Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K'
  }
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatRatio(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(decimals) + 'x'
}

export function formatDelta(value: number | null, unit: 'percent' | 'currency' | 'number' = 'percent'): string {
  if (value === null || value === undefined) return '—'
  const sign = value >= 0 ? '+' : ''
  switch (unit) {
    case 'percent': return sign + value.toFixed(1) + '%'
    case 'currency': return sign + formatCurrency(value)
    case 'number': return sign + formatNumber(value)
  }
}

export function getDeltaClass(value: number | null, higherIsBetter = true): string {
  if (value === null || value === undefined) return 'text-wt-muted'
  if (value === 0) return 'text-wt-muted'
  const isPositive = value > 0
  const isGood = higherIsBetter ? isPositive : !isPositive
  return isGood ? 'text-wt-green' : 'text-wt-red'
}

export function getScoreColorHex(score: number | null, isRisk = false): string {
  if (score === null) return '#94A3B8'
  if (isRisk) {
    if (score >= 70) return '#EF4444'
    if (score >= 45) return '#F59E0B'
    return '#10B981'
  }
  if (score >= 70) return '#10B981'
  if (score >= 45) return '#F59E0B'
  return '#EF4444'
}

export function formatPeriodMonth(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatYear(year: number | null): string {
  if (!year) return '—'
  return year.toString()
}

export function slugify(name: string, geoType: string, id: string): string {
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${geoType}-${nameSlug}-${id.slice(0, 8)}`
}

export function parseSlug(slug: string): { id: string } | null {
  const parts = slug.split('-')
  const shortId = parts[parts.length - 1]
  if (!shortId || shortId.length !== 8) return null
  return { id: shortId }
}

export function interpolateColor(value: number, min: number, max: number, colorScale: string[][]): string {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const idx = ratio * (colorScale.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return `rgb(${colorScale[lower].join(',')})`
  const t = idx - lower
  const r = Math.round(+colorScale[lower][0] + t * (+colorScale[upper][0] - +colorScale[lower][0]))
  const g = Math.round(+colorScale[lower][1] + t * (+colorScale[upper][1] - +colorScale[lower][1]))
  const b = Math.round(+colorScale[lower][2] + t * (+colorScale[upper][2] - +colorScale[lower][2]))
  return `rgb(${r},${g},${b})`
}
