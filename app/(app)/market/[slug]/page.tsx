import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MetricGrid from '@/components/market/MetricGrid'
import ScoreBreakdown from '@/components/scores/ScoreBreakdown'
import MarketBrief from '@/components/market/MarketBrief'
import BullBearCard from '@/components/market/BullBearCard'
import TrendChart from '@/components/charts/TrendChart'
import ScoreCard from '@/components/scores/ScoreCard'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

export const revalidate = 86400

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('market_summary_mv')
    .select('name, geo_type, state_abbreviation')
    .eq('id', params.slug)
    .single()

  if (!data) return { title: 'Market Not Found' }
  return {
    title: `${data.name} Real Estate Market Intelligence`,
    description: `Housing, migration, jobs, and risk analysis for ${data.name}. Watchtower scores, trends, and market brief.`,
  }
}

async function getMarketData(id: string) {
  const supabase = await createClient()

  const { data: summary } = await supabase
    .from('market_summary_mv')
    .select('*')
    .eq('id', id)
    .single()

  if (!summary) return null

  const { data: scores } = await supabase
    .from('score_outputs')
    .select('*')
    .eq('geography_id', id)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single()

  const { data: housingHistory } = await supabase
    .from('monthly_housing_metrics')
    .select('period_month, median_list_price, days_on_market, active_inventory, months_of_supply, price_reductions_pct')
    .eq('geography_id', id)
    .order('period_month', { ascending: true })
    .limit(24)

  const { data: migrationHistory } = await supabase
    .from('annual_migration_metrics')
    .select('period_year, net_migration, net_migration_rate, in_migration, out_migration')
    .eq('geography_id', id)
    .order('period_year', { ascending: true })
    .limit(10)

  const { data: economicHistory } = await supabase
    .from('annual_economic_metrics')
    .select('period_year, unemployment_rate, job_growth_pct, median_household_income, income_growth_pct')
    .eq('geography_id', id)
    .order('period_year', { ascending: true })
    .limit(10)

  return { summary, scores, housingHistory, migrationHistory, economicHistory }
}

export default async function MarketPage({ params }: Props) {
  const data = await getMarketData(params.slug)
  if (!data) notFound()

  const { summary: m, scores, housingHistory, migrationHistory, economicHistory } = data

  return (
    <div className="p-6 space-y-8 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-wt-muted border border-wt-border px-2 py-0.5">
              {m.geo_type}
            </span>
            {m.state_abbreviation && (
              <span className="text-xs text-wt-muted">{m.state_abbreviation}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold">{m.name}</h1>
          {m.population && (
            <p className="text-wt-muted text-sm mt-1">
              Population: {formatNumber(m.population)}
            </p>
          )}
        </div>
        {scores && (
          <div className="text-xs text-wt-muted text-right">
            <div>Scores updated</div>
            <div>{new Date(scores.calculated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          </div>
        )}
      </div>

      {/* Score Cards Row */}
      {scores ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ScoreCard type="strength" score={scores.strength_score} />
          <ScoreCard type="risk" score={scores.risk_score} />
          <ScoreCard type="migration" score={scores.migration_score} />
          <ScoreCard type="affordability" score={scores.affordability_score} />
          <ScoreCard type="investor" score={scores.investor_score} />
        </div>
      ) : (
        <div className="wt-card p-6 text-center text-wt-muted text-sm">
          Scores not yet calculated for this market. Run the ETL pipeline to generate scores.
        </div>
      )}

      {/* Market Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketBrief
            name={m.name}
            summary={m}
            scores={scores}
          />
        </div>
        <BullBearCard scores={scores} summary={m} />
      </div>

      {/* KPI Grid */}
      <MetricGrid summary={m} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {housingHistory && housingHistory.length > 0 && (
          <div className="wt-card p-5">
            <h3 className="font-semibold text-sm mb-4">Median List Price Trend</h3>
            <TrendChart
              data={housingHistory.map((h) => ({
                period: h.period_month,
                value: h.median_list_price,
              }))}
              unit="currency"
              color="#22D3EE"
            />
          </div>
        )}
        {housingHistory && housingHistory.length > 0 && (
          <div className="wt-card p-5">
            <h3 className="font-semibold text-sm mb-4">Days on Market Trend</h3>
            <TrendChart
              data={housingHistory.map((h) => ({
                period: h.period_month,
                value: h.days_on_market,
              }))}
              unit="number"
              color="#F59E0B"
            />
          </div>
        )}
        {migrationHistory && migrationHistory.length > 0 && (
          <div className="wt-card p-5">
            <h3 className="font-semibold text-sm mb-4">Net Migration (Annual)</h3>
            <TrendChart
              data={migrationHistory.map((h) => ({
                period: String(h.period_year),
                value: h.net_migration,
              }))}
              unit="number"
              color="#10B981"
            />
          </div>
        )}
        {economicHistory && economicHistory.length > 0 && (
          <div className="wt-card p-5">
            <h3 className="font-semibold text-sm mb-4">Unemployment Rate Trend</h3>
            <TrendChart
              data={economicHistory.map((h) => ({
                period: String(h.period_year),
                value: h.unemployment_rate,
              }))}
              unit="percent"
              color="#EF4444"
            />
          </div>
        )}
      </div>

      {/* Score Factor Breakdown */}
      {scores?.factor_breakdown && (
        <ScoreBreakdown breakdown={scores.factor_breakdown} />
      )}

      {/* Data freshness footer */}
      <div className="wt-card p-4 text-xs text-wt-muted grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="font-medium text-white mb-0.5">Housing Data</div>
          <div>{m.housing_period ? new Date(m.housing_period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Not available'}</div>
        </div>
        <div>
          <div className="font-medium text-white mb-0.5">Migration Data</div>
          <div>{m.migration_year ? m.migration_year + ' (Census ACS)' : 'Not available'}</div>
        </div>
        <div>
          <div className="font-medium text-white mb-0.5">Economic Data</div>
          <div>{m.economic_year ? m.economic_year + ' (BLS/BEA)' : 'Not available'}</div>
        </div>
        <div>
          <div className="font-medium text-white mb-0.5">Scores Calculated</div>
          <div>{scores ? new Date(scores.calculated_at).toLocaleDateString() : 'Not yet calculated'}</div>
        </div>
      </div>
    </div>
  )
}
