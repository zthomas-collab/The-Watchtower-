import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatPercent, formatNumber, getScoreColorHex } from '@/lib/utils'

export const metadata: Metadata = { title: 'National Dashboard' }
export const revalidate = 86400

async function getNationalStats() {
  const supabase = await createClient()
  const { data: topStrength } = await supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, strength_score, migration_score, risk_score, investor_score, median_list_price, unemployment_rate, net_migration_rate')
    .eq('geo_type', 'metro')
    .not('strength_score', 'is', null)
    .order('strength_score', { ascending: false })
    .limit(10)

  const { data: topInvestor } = await supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, strength_score, migration_score, risk_score, investor_score, median_list_price, affordability_score')
    .eq('geo_type', 'metro')
    .not('investor_score', 'is', null)
    .order('investor_score', { ascending: false })
    .limit(10)

  const { data: topMigration } = await supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, migration_score, net_migration_rate, population_growth_pct')
    .eq('geo_type', 'metro')
    .not('migration_score', 'is', null)
    .order('migration_score', { ascending: false })
    .limit(10)

  const { data: highRisk } = await supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, risk_score, unemployment_rate, inventory_change_yoy_pct')
    .eq('geo_type', 'metro')
    .not('risk_score', 'is', null)
    .order('risk_score', { ascending: false })
    .limit(5)

  return { topStrength, topInvestor, topMigration, highRisk }
}

export default async function DashboardPage() {
  const { topStrength, topInvestor, topMigration, highRisk } = await getNationalStats()

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">National Dashboard</h1>
        <p className="text-wt-muted text-sm mt-1">U.S. real estate intelligence overview — all metros ranked</p>
      </div>

      {/* Summary KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Markets Tracked" value="850+" sub="States, metros & counties" />
        <KpiCard label="Data Sources" value="11" sub="Public free-tier sources" />
        <KpiCard label="Metrics Per Market" value="20+" sub="Housing, migration, economic" />
        <KpiCard label="Last Refreshed" value="Monthly" sub="Automated ETL pipeline" accent />
      </div>

      {/* Main leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strength */}
        <LeaderboardCard
          title="Top Strength Markets"
          subtitle="Highest overall market momentum"
          colorKey="strength"
          data={(topStrength || []).map((m) => ({
            id: m.id,
            name: m.name,
            state: m.state_abbreviation,
            primaryScore: m.strength_score,
            secondaryLabel: 'Unemployment',
            secondaryValue: m.unemployment_rate ? m.unemployment_rate + '%' : '—',
          }))}
          viewAllHref="/rankings?sort=strength"
        />

        {/* Top Investor Opportunity */}
        <LeaderboardCard
          title="Top Investor Markets"
          subtitle="Best risk-adjusted return signals"
          colorKey="investor"
          data={(topInvestor || []).map((m) => ({
            id: m.id,
            name: m.name,
            state: m.state_abbreviation,
            primaryScore: m.investor_score,
            secondaryLabel: 'Affordability',
            secondaryValue: m.affordability_score ? String(Math.round(m.affordability_score)) : '—',
          }))}
          viewAllHref="/rankings?sort=investor"
        />

        {/* Top Migration */}
        <LeaderboardCard
          title="Migration Magnets"
          subtitle="Highest net in-migration momentum"
          colorKey="migration"
          data={(topMigration || []).map((m) => ({
            id: m.id,
            name: m.name,
            state: m.state_abbreviation,
            primaryScore: m.migration_score,
            secondaryLabel: 'Net Rate',
            secondaryValue: m.net_migration_rate ? (m.net_migration_rate > 0 ? '+' : '') + m.net_migration_rate.toFixed(1) + '/1k' : '—',
          }))}
          viewAllHref="/rankings?sort=migration"
        />

        {/* High Risk Warning */}
        <div className="wt-card">
          <div className="p-5 border-b border-wt-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Risk Watch</h3>
              <p className="text-wt-muted text-xs mt-0.5">Markets with elevated risk signals</p>
            </div>
            <Link href="/rankings?sort=risk&dir=desc" className="text-xs text-wt-accent hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-wt-border">
            {(highRisk || []).map((m, i) => (
              <Link
                key={m.id}
                href={`/market/${m.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-wt-border/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-wt-muted w-4">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{m.name?.split('-')[0]}</div>
                    <div className="text-xs text-wt-muted">{m.state_abbreviation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {m.unemployment_rate && (
                    <div className="text-right">
                      <div className="text-xs text-wt-muted">Unemp</div>
                      <div className="text-sm font-medium text-wt-red">{m.unemployment_rate}%</div>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-xs text-wt-muted">Risk</div>
                    <div className="text-sm font-bold" style={{ color: getScoreColorHex(m.risk_score, true) }}>
                      {m.risk_score ? Math.round(m.risk_score) : '—'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          title="Explore the Map"
          description="See every metric visualized on an interactive U.S. map with layer toggles"
          href="/explore"
          icon="🗺️"
        />
        <ActionCard
          title="Compare Markets"
          description="Put any 2-4 markets side by side across all metrics and scores"
          href="/compare"
          icon="⚖️"
        />
        <ActionCard
          title="Build a Screen"
          description="Filter all metros by any combination of metric thresholds"
          href="/rankings"
          icon="🔍"
        />
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="wt-card p-5">
      <div className="wt-label mb-1">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${accent ? 'text-wt-accent' : 'text-white'}`}>{value}</div>
      <div className="text-xs text-wt-muted mt-1">{sub}</div>
    </div>
  )
}

function LeaderboardCard({
  title,
  subtitle,
  colorKey,
  data,
  viewAllHref,
}: {
  title: string
  subtitle: string
  colorKey: 'strength' | 'investor' | 'migration'
  data: { id: string; name: string; state: string | null; primaryScore: number | null; secondaryLabel: string; secondaryValue: string }[]
  viewAllHref: string
}) {
  return (
    <div className="wt-card">
      <div className="p-5 border-b border-wt-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-wt-muted text-xs mt-0.5">{subtitle}</p>
        </div>
        <Link href={viewAllHref} className="text-xs text-wt-accent hover:underline flex items-center gap-1">
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-wt-border">
        {data.map((m, i) => (
          <Link
            key={m.id}
            href={`/market/${m.id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-wt-border/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-wt-muted w-4">{i + 1}</span>
              <div>
                <div className="text-sm font-medium">{m.name?.split('-')[0].split(',')[0]}</div>
                <div className="text-xs text-wt-muted">{m.state}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-wt-muted">{m.secondaryLabel}</div>
                <div className="text-sm font-medium text-wt-muted">{m.secondaryValue}</div>
              </div>
              <div
                className="text-2xl font-bold tabular-nums w-12 text-right"
                style={{ color: getScoreColorHex(m.primaryScore) }}
              >
                {m.primaryScore ? Math.round(m.primaryScore) : '—'}
              </div>
            </div>
          </Link>
        ))}
        {data.length === 0 && (
          <div className="px-5 py-8 text-center text-wt-muted text-sm">
            No data yet — run the ETL pipeline to populate markets
          </div>
        )}
      </div>
    </div>
  )
}

function ActionCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <Link href={href} className="wt-card p-5 hover:border-wt-muted/50 transition-colors group">
      <div className="text-2xl mb-3">{icon}</div>
      <div className="font-semibold text-sm mb-1 group-hover:text-wt-accent transition-colors">{title}</div>
      <div className="text-xs text-wt-muted">{description}</div>
    </Link>
  )
}
