import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, formatPercent, formatNumber, getDeltaClass } from '@/lib/utils'

interface Props {
  summary: {
    median_list_price: number | null
    days_on_market: number | null
    months_of_supply: number | null
    active_inventory: number | null
    price_reductions_pct: number | null
    median_list_price_yoy_pct: number | null
    inventory_change_yoy_pct: number | null
    unemployment_rate: number | null
    unemployment_change_yoy: number | null
    job_growth_pct: number | null
    median_household_income: number | null
    income_growth_pct: number | null
    net_migration_rate: number | null
    population_growth_pct: number | null
    price_to_income_ratio: number | null
    median_rent_2br: number | null
    rent_growth_yoy_pct: number | null
    gdp_growth_pct: number | null
  }
}

interface MetricItem {
  label: string
  value: string
  delta: string | null
  deltaClass: string
  deltaIcon: 'up' | 'down' | 'neutral'
  category: string
}

function DeltaIcon({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  if (direction === 'up') return <TrendingUp className="w-3 h-3" />
  if (direction === 'down') return <TrendingDown className="w-3 h-3" />
  return <Minus className="w-3 h-3" />
}

export default function MetricGrid({ summary: s }: Props) {
  const metrics: MetricItem[] = [
    {
      label: 'Median List Price',
      value: formatCurrency(s.median_list_price),
      delta: s.median_list_price_yoy_pct !== null ? formatPercent(s.median_list_price_yoy_pct, true) : null,
      deltaClass: getDeltaClass(s.median_list_price_yoy_pct, false),
      deltaIcon: s.median_list_price_yoy_pct !== null && s.median_list_price_yoy_pct > 0 ? 'up' : s.median_list_price_yoy_pct !== null && s.median_list_price_yoy_pct < 0 ? 'down' : 'neutral',
      category: 'Housing',
    },
    {
      label: 'Days on Market',
      value: s.days_on_market !== null ? s.days_on_market.toFixed(0) + ' days' : '—',
      delta: null,
      deltaClass: 'text-wt-muted',
      deltaIcon: 'neutral',
      category: 'Housing',
    },
    {
      label: 'Months of Supply',
      value: s.months_of_supply !== null ? s.months_of_supply.toFixed(1) + ' mo' : '—',
      delta: s.inventory_change_yoy_pct !== null ? formatPercent(s.inventory_change_yoy_pct, true) + ' inv YoY' : null,
      deltaClass: getDeltaClass(s.inventory_change_yoy_pct, false),
      deltaIcon: s.inventory_change_yoy_pct !== null && s.inventory_change_yoy_pct > 0 ? 'up' : 'down',
      category: 'Housing',
    },
    {
      label: 'Price Reductions',
      value: s.price_reductions_pct !== null ? s.price_reductions_pct.toFixed(1) + '% of listings' : '—',
      delta: null,
      deltaClass: 'text-wt-muted',
      deltaIcon: 'neutral',
      category: 'Housing',
    },
    {
      label: 'Unemployment Rate',
      value: s.unemployment_rate !== null ? s.unemployment_rate.toFixed(1) + '%' : '—',
      delta: s.unemployment_change_yoy !== null ? formatPercent(s.unemployment_change_yoy, true) + ' YoY' : null,
      deltaClass: getDeltaClass(s.unemployment_change_yoy, false),
      deltaIcon: s.unemployment_change_yoy !== null && s.unemployment_change_yoy < 0 ? 'down' : 'up',
      category: 'Economy',
    },
    {
      label: 'Job Growth',
      value: s.job_growth_pct !== null ? formatPercent(s.job_growth_pct, true) + ' YoY' : '—',
      delta: null,
      deltaClass: getDeltaClass(s.job_growth_pct, true),
      deltaIcon: s.job_growth_pct !== null && s.job_growth_pct > 0 ? 'up' : 'down',
      category: 'Economy',
    },
    {
      label: 'Median Income',
      value: formatCurrency(s.median_household_income, false),
      delta: s.income_growth_pct !== null ? formatPercent(s.income_growth_pct, true) + ' YoY' : null,
      deltaClass: getDeltaClass(s.income_growth_pct, true),
      deltaIcon: s.income_growth_pct !== null && s.income_growth_pct > 0 ? 'up' : 'down',
      category: 'Economy',
    },
    {
      label: 'GDP Growth',
      value: s.gdp_growth_pct !== null ? formatPercent(s.gdp_growth_pct, true) : '—',
      delta: null,
      deltaClass: getDeltaClass(s.gdp_growth_pct, true),
      deltaIcon: s.gdp_growth_pct !== null && s.gdp_growth_pct > 0 ? 'up' : 'down',
      category: 'Economy',
    },
    {
      label: 'Net Migration Rate',
      value: s.net_migration_rate !== null ? (s.net_migration_rate > 0 ? '+' : '') + s.net_migration_rate.toFixed(1) + ' per 1k' : '—',
      delta: s.population_growth_pct !== null ? formatPercent(s.population_growth_pct, true) + ' pop growth' : null,
      deltaClass: getDeltaClass(s.net_migration_rate, true),
      deltaIcon: s.net_migration_rate !== null && s.net_migration_rate > 0 ? 'up' : 'down',
      category: 'Migration',
    },
    {
      label: 'Population Growth',
      value: s.population_growth_pct !== null ? formatPercent(s.population_growth_pct, true) + ' YoY' : '—',
      delta: null,
      deltaClass: getDeltaClass(s.population_growth_pct, true),
      deltaIcon: s.population_growth_pct !== null && s.population_growth_pct > 0 ? 'up' : 'down',
      category: 'Migration',
    },
    {
      label: 'Price / Income',
      value: s.price_to_income_ratio !== null ? s.price_to_income_ratio.toFixed(1) + 'x' : '—',
      delta: null,
      deltaClass: s.price_to_income_ratio !== null && s.price_to_income_ratio > 6 ? 'text-wt-red' : s.price_to_income_ratio !== null && s.price_to_income_ratio < 4 ? 'text-wt-green' : 'text-wt-muted',
      deltaIcon: 'neutral',
      category: 'Affordability',
    },
    {
      label: 'Median Rent (2BR)',
      value: formatCurrency(s.median_rent_2br),
      delta: s.rent_growth_yoy_pct !== null ? formatPercent(s.rent_growth_yoy_pct, true) + ' YoY' : null,
      deltaClass: getDeltaClass(s.rent_growth_yoy_pct, false),
      deltaIcon: s.rent_growth_yoy_pct !== null && s.rent_growth_yoy_pct > 0 ? 'up' : 'down',
      category: 'Affordability',
    },
  ]

  const categories = ['Housing', 'Economy', 'Migration', 'Affordability']

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const catMetrics = metrics.filter((m) => m.category === category)
        return (
          <div key={category}>
            <div className="wt-label mb-3">{category}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {catMetrics.map((metric) => (
                <div key={metric.label} className="wt-card p-4">
                  <div className="wt-label mb-1.5">{metric.label}</div>
                  <div className="text-xl font-bold tabular-nums text-white">{metric.value}</div>
                  {metric.delta && (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${metric.deltaClass}`}>
                      <DeltaIcon direction={metric.deltaIcon} />
                      {metric.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
