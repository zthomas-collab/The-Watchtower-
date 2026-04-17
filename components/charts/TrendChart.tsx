'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

interface DataPoint {
  period: string
  value: number | null
}

interface Props {
  data: DataPoint[]
  unit: 'currency' | 'percent' | 'number'
  color?: string
  showGrid?: boolean
  height?: number
}

function formatTick(value: number, unit: string): string {
  if (unit === 'currency') return formatCurrency(value)
  if (unit === 'percent') return value.toFixed(1) + '%'
  return formatNumber(value)
}

function CustomTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  return (
    <div className="bg-wt-surface border border-wt-border px-3 py-2 text-xs">
      <div className="text-wt-muted mb-1">{label}</div>
      <div className="font-bold text-white">
        {formatTick(value, unit)}
      </div>
    </div>
  )
}

export default function TrendChart({ data, unit, color = '#22D3EE', showGrid = true, height = 180 }: Props) {
  const cleanData = data.filter((d) => d.value !== null).map((d) => ({
    period: d.period?.length === 10 ? new Date(d.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : d.period,
    value: d.value,
    rawPeriod: d.period,
  }))

  if (cleanData.length === 0) {
    return (
      <div className="flex items-center justify-center text-wt-muted text-xs" style={{ height }}>
        No data available
      </div>
    )
  }

  const values = cleanData.map((d) => d.value as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={cleanData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" vertical={false} />
        )}
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => formatTick(v, unit)}
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={60}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
