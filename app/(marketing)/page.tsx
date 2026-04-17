import Link from 'next/link'
import { ArrowRight, BarChart3, Map, TrendingUp, Users, Shield, DollarSign, Activity, Eye } from 'lucide-react'

const SCORE_TYPES = [
  {
    name: 'Strength Score',
    icon: TrendingUp,
    color: '#10B981',
    description: 'Is this market gaining momentum or losing it?',
    factors: ['Population growth', 'Job creation', 'Migration inflow', 'DOM compression'],
  },
  {
    name: 'Risk Score',
    icon: Shield,
    color: '#EF4444',
    description: 'What warning signals exist and how severe are they?',
    factors: ['Unemployment rise', 'Inventory spike', 'Price cuts', 'Population loss'],
  },
  {
    name: 'Migration Score',
    icon: Users,
    color: '#22D3EE',
    description: 'Are people moving in, moving out, or staying put?',
    factors: ['Net migration rate', 'Momentum trend', 'In/out ratio', 'vs. National avg'],
  },
  {
    name: 'Affordability Score',
    icon: DollarSign,
    color: '#F59E0B',
    description: 'Is housing still accessible relative to local incomes?',
    factors: ['Price-to-income', 'Rent-to-income', 'vs. National median', 'Rent vs. wage growth'],
  },
  {
    name: 'Investor Score',
    icon: BarChart3,
    color: '#8B5CF6',
    description: 'What is the combined signal for return potential?',
    factors: ['Rent yield', 'Price momentum', 'Migration engine', 'Risk-adjusted upside'],
  },
]

const TOP_MARKETS = [
  { name: 'Austin, TX', strength: 71, migration: 78, risk: 42, investor: 69 },
  { name: 'Charlotte, NC', strength: 74, migration: 82, risk: 35, investor: 73 },
  { name: 'Nashville, TN', strength: 68, migration: 76, risk: 40, investor: 67 },
  { name: 'Phoenix, AZ', strength: 65, migration: 71, risk: 48, investor: 61 },
  { name: 'Raleigh, NC', strength: 77, migration: 85, risk: 31, investor: 76 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-wt-bg text-white">
      {/* Nav */}
      <nav className="border-b border-wt-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-wt-accent" />
          <span className="font-bold text-lg tracking-tight">THE WATCHTOWER</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-wt-muted hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/explore" className="text-sm text-wt-muted hover:text-white transition-colors">
            Explore
          </Link>
          <Link href="/rankings" className="text-sm text-wt-muted hover:text-white transition-colors">
            Rankings
          </Link>
          <Link
            href="/dashboard"
            className="text-sm bg-wt-accent text-wt-bg font-semibold px-4 py-2 hover:bg-cyan-400 transition-colors"
          >
            Start Exploring Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-wt-accent border border-wt-accent/30 px-3 py-1 mb-8">
          <Activity className="w-3 h-3" />
          Real-Time U.S. Market Intelligence
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl">
          The clearest picture of where{' '}
          <span className="text-wt-accent">America is moving,</span>{' '}
          building, and buying.
        </h1>
        <p className="text-xl text-wt-muted max-w-2xl mb-10 leading-relaxed">
          Track housing, migration, jobs, affordability, and market risk across every U.S. market —
          from national down to county level. Five scores. Every market. One platform.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-wt-accent text-wt-bg font-bold px-8 py-4 text-base hover:bg-cyan-400 transition-colors"
          >
            Start exploring free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/explore"
            className="flex items-center gap-2 border border-wt-border text-wt-muted font-medium px-8 py-4 text-base hover:border-wt-muted hover:text-white transition-colors"
          >
            <Map className="w-4 h-4" />
            Open the map
          </Link>
        </div>
        {/* Data trust bar */}
        <div className="mt-16 pt-8 border-t border-wt-border">
          <p className="text-xs text-wt-muted uppercase tracking-wider mb-4">Powered by public data sources</p>
          <div className="flex flex-wrap gap-6 items-center">
            {['U.S. Census Bureau', 'Bureau of Labor Statistics', 'BEA', 'FHFA', 'HUD', 'FRED', 'Zillow Research', 'Redfin'].map((s) => (
              <span key={s} className="text-xs text-wt-muted/60 font-medium">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Five Scores Section */}
      <section className="border-t border-wt-border px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="wt-label mb-3">Intelligence Framework</p>
            <h2 className="text-3xl font-bold">Five scores. Every market. Full transparency.</h2>
            <p className="text-wt-muted mt-3 max-w-xl">
              Each score is computed from weighted public data factors — and every factor is shown, explained, and ranked on the market profile page.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCORE_TYPES.map((score) => {
              const Icon = score.icon
              return (
                <div key={score.name} className="wt-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center" style={{ color: score.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm">{score.name}</span>
                  </div>
                  <p className="text-wt-muted text-sm mb-4">{score.description}</p>
                  <div className="space-y-1">
                    {score.factors.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-wt-border" />
                        <span className="text-xs text-wt-muted">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {/* "What changed this month" CTA card */}
            <div className="wt-card p-5 border-dashed flex flex-col justify-between">
              <div>
                <p className="wt-label mb-3">Updated monthly</p>
                <p className="font-semibold text-sm mb-2">Scores refresh every month with new data from all sources</p>
                <p className="text-wt-muted text-sm">No stale dashboards. No guesswork about when data was last updated.</p>
              </div>
              <Link href="/dashboard" className="mt-4 text-wt-accent text-sm font-medium flex items-center gap-1 hover:underline">
                See latest data <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top Markets Preview */}
      <section className="border-t border-wt-border px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="wt-label mb-2">Live Market Data</p>
              <h2 className="text-2xl font-bold">Top markets right now</h2>
            </div>
            <Link href="/rankings" className="text-sm text-wt-accent hover:underline flex items-center gap-1">
              View all rankings <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="wt-card overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-wt-border">
              <span className="wt-label">Market</span>
              <span className="wt-label text-right">Strength</span>
              <span className="wt-label text-right">Migration</span>
              <span className="wt-label text-right">Risk</span>
              <span className="wt-label text-right">Investor</span>
            </div>
            {TOP_MARKETS.map((market, i) => (
              <div
                key={market.name}
                className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-wt-border last:border-0 hover:bg-wt-border/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-wt-muted text-xs w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{market.name}</span>
                </div>
                <ScorePill value={market.strength} />
                <ScorePill value={market.migration} />
                <ScorePill value={market.risk} isRisk />
                <ScorePill value={market.investor} />
              </div>
            ))}
          </div>
          <p className="text-xs text-wt-muted mt-3">Sample data shown. Connect data sources to see live scores.</p>
        </div>
      </section>

      {/* The Killer Feature */}
      <section className="border-t border-wt-border px-6 py-20 bg-wt-surface">
        <div className="max-w-4xl mx-auto text-center">
          <p className="wt-label mb-4">The Market Signal</p>
          <h2 className="text-3xl font-bold mb-6">One sentence. Eight data sources.</h2>
          <div className="wt-card p-8 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-wt-green mt-2 flex-shrink-0" />
              <p className="text-base leading-relaxed">
                <span className="text-white font-semibold">Raleigh-Durham</span> is gaining people faster than it&apos;s building homes,
                wages are rising 4.8% year-over-year, and prices have pulled back 3% from the peak —
                creating a rare re-entry window for patient capital.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-wt-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-wt-green">77</div>
                <div className="text-xs text-wt-muted">Strength</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-wt-green">85</div>
                <div className="text-xs text-wt-muted">Migration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-wt-green">31</div>
                <div className="text-xs text-wt-muted">Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-wt-green">76</div>
                <div className="text-xs text-wt-muted">Investor</div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-wt-green/20 text-wt-green font-semibold px-3 py-1">STRONG BUY</span>
              </div>
            </div>
          </div>
          <p className="text-wt-muted mt-6 text-sm">
            No other free platform gives you that sentence backed by transparent, weighted, multi-source intelligence.
          </p>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="border-t border-wt-border px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="wt-label mb-3">Pricing</p>
            <h2 className="text-3xl font-bold">Start free. Upgrade when you need more.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="wt-card p-6">
              <div className="text-2xl font-bold mb-1">Free</div>
              <div className="text-wt-muted text-sm mb-6">Always free. No credit card.</div>
              <ul className="space-y-3 text-sm">
                {[
                  'National, state & metro views',
                  'Core housing & economic metrics',
                  'All five Watchtower scores',
                  'Rankings — top 20 markets',
                  '1 saved watchlist (5 markets)',
                  'Market briefs',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-wt-muted">
                    <span className="text-wt-green">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="mt-8 block text-center border border-wt-border py-3 text-sm font-semibold hover:border-wt-muted transition-colors"
              >
                Start for free
              </Link>
            </div>
            <div className="wt-card p-6 border-wt-accent relative">
              <div className="absolute -top-3 right-4 text-xs font-bold bg-wt-accent text-wt-bg px-3 py-1">COMING SOON</div>
              <div className="text-2xl font-bold mb-1">Pro <span className="text-lg font-normal text-wt-muted">$29/mo</span></div>
              <div className="text-wt-muted text-sm mb-6">For serious investors and analysts.</div>
              <ul className="space-y-3 text-sm">
                {[
                  'Everything in Free',
                  'County-level data',
                  'Unlimited rankings & screens',
                  'Unlimited watchlists + alerts',
                  'Full score factor breakdowns',
                  '10-year trend history',
                  'Exportable reports (CSV/PDF)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-wt-muted">
                    <span className="text-wt-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="mt-8 w-full bg-wt-accent text-wt-bg py-3 text-sm font-bold hover:bg-cyan-400 transition-colors">
                Join the waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wt-border px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-wt-accent" />
            <span className="font-bold text-sm">THE WATCHTOWER</span>
          </div>
          <p className="text-xs text-wt-muted">
            Data updated monthly. For informational purposes only. Not investment advice.
          </p>
        </div>
      </footer>
    </div>
  )
}

function ScorePill({ value, isRisk = false }: { value: number; isRisk?: boolean }) {
  const color = isRisk
    ? value >= 65 ? 'text-wt-red' : value >= 40 ? 'text-wt-yellow' : 'text-wt-green'
    : value >= 70 ? 'text-wt-green' : value >= 45 ? 'text-wt-yellow' : 'text-wt-red'

  return (
    <div className={`text-right text-sm font-bold tabular-nums ${color}`}>
      {value}
    </div>
  )
}
