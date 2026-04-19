'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency, formatPercent, getScoreColorHex } from '@/lib/utils'

interface MarketRow {
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
  median_household_income: number | null
}

interface Props {
  data: MarketRow[]
  sortKey: string
  page: number
  pageSize: number
  total: number
}

const COLUMNS = [
  { key: 'name', label: 'Market', sortable: false, width: 'w-48' },
  { key: 'strength', label: 'Strength', sortable: true, isScore: true },
  { key: 'risk', label: 'Risk', sortable: true, isScore: true, isRisk: true },
  { key: 'migration', label: 'Migration', sortable: true, isScore: true },
  { key: 'affordability', label: 'Affordability', sortable: true, isScore: true },
  { key: 'investor', label: 'Investor', sortable: true, isScore: true },
  { key: 'price', label: 'List Price', sortable: false },
  { key: 'dom', label: 'DOM', sortable: false },
  { key: 'unemp', label: 'Unemp.', sortable: false },
  { key: 'migration_rate', label: 'Mig. Rate', sortable: false },
]

export default function RankingsTable({ data, sortKey, page, pageSize, total }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('sort') === key) {
      params.set('dir', params.get('dir') === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', key)
      params.set('dir', 'desc')
    }
    params.set('page', '1')
    router.push(`/rankings?${params.toString()}`)
  }

  function getScoreValue(row: MarketRow, key: string): number | null {
    switch (key) {
      case 'strength': return row.strength_score
      case 'risk': return row.risk_score
      case 'migration': return row.migration_score
      case 'affordability': return row.affordability_score
      case 'investor': return row.investor_score
      default: return null
    }
  }

  const totalPages = Math.ceil(total / pageSize)
  const offset = (page - 1) * pageSize

  return (
    <div className="space-y-4">
      <div className="wt-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-wt-border">
                <th className="text-left px-4 py-3 text-xs text-wt-muted font-medium w-8">#</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`py-3 px-3 text-xs text-wt-muted font-medium ${col.key === 'name' ? 'text-left' : 'text-right'}`}>
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className={`flex items-center gap-1 hover:text-white transition-colors ${col.key === 'name' ? '' : 'ml-auto'} ${sortKey === col.key ? 'text-wt-accent' : ''}`}
                      >
                        {col.label}
                        {sortKey === col.key ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUp className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-wt-border last:border-0 hover:bg-wt-border/20 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-wt-muted">{offset + i + 1}</td>
                  <td className="px-3 py-3">
                    <Link href={`/market/${row.id}`} className="block group">
                      <div className="text-sm font-medium group-hover:text-wt-accent transition-colors">
                        {row.name?.split(',')[0].split('-')[0]}
                      </div>
                      <div className="text-xs text-wt-muted">{row.state_abbreviation}</div>
                    </Link>
                  </td>
                  {COLUMNS.filter((c) => c.key !== 'name').map((col) => {
                    if (col.isScore) {
                      const val = getScoreValue(row, col.key)
                      return (
                        <td key={col.key} className="px-3 py-3 text-right">
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: getScoreColorHex(val, col.isRisk) }}
                          >
                            {val !== null ? Math.round(val) : '—'}
                          </span>
                        </td>
                      )
                    }
                    if (col.key === 'price') {
                      return (
                        <td key={col.key} className="px-3 py-3 text-right text-sm text-wt-muted">
                          {formatCurrency(row.median_list_price)}
                        </td>
                      )
                    }
                    if (col.key === 'dom') {
                      return (
                        <td key={col.key} className="px-3 py-3 text-right text-sm text-wt-muted">
                          {row.days_on_market !== null ? row.days_on_market.toFixed(0) : '—'}
                        </td>
                      )
                    }
                    if (col.key === 'unemp') {
                      return (
                        <td key={col.key} className="px-3 py-3 text-right text-sm text-wt-muted">
                          {row.unemployment_rate !== null ? row.unemployment_rate.toFixed(1) + '%' : '—'}
                        </td>
                      )
                    }
                    if (col.key === 'migration_rate') {
                      const v = row.net_migration_rate
                      return (
                        <td key={col.key} className="px-3 py-3 text-right text-sm">
                          <span className={v !== null && v > 0 ? 'text-wt-green' : v !== null && v < 0 ? 'text-wt-red' : 'text-wt-muted'}>
                            {v !== null ? (v > 0 ? '+' : '') + v.toFixed(1) : '—'}
                          </span>
                        </td>
                      )
                    }
                    return <td key={col.key} className="px-3 py-3 text-right text-sm text-wt-muted">—</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className="p-12 text-center text-wt-muted text-sm">
            No markets match your filters. Try adjusting the criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-wt-muted">
          <span>{total.toLocaleString()} markets · Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/rankings?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(searchParams).entries()), page: String(page - 1) })}`}
                className="border border-wt-border px-3 py-1.5 hover:border-wt-muted transition-colors"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/rankings?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(searchParams).entries()), page: String(page + 1) })}`}
                className="border border-wt-border px-3 py-1.5 hover:border-wt-muted transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
