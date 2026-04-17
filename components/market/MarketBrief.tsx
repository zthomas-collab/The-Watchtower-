import { FileText } from 'lucide-react'
import { BEST_FIT_LABELS } from '@/lib/market-brief'

interface Props {
  name: string
  summary: Record<string, unknown>
  scores: {
    strength_score: number | null
    migration_score: number | null
    risk_score: number | null
    investor_score: number | null
  } | null
}

const BEST_FIT_ICONS: Record<string, string> = {
  long_term_investor: '📈',
  buy_and_hold_landlord: '🏘️',
  relocation_buyer: '🚛',
  first_time_buyer: '🏡',
  fix_and_flip: '🔨',
  patient_capital: '⏳',
  builder_developer: '🏗️',
}

export default function MarketBrief({ name, summary, scores }: Props) {
  const shortName = name.split(',')[0].split('-')[0]

  // Template-generated brief based on available data
  const hasGoodStrength = scores && scores.strength_score !== null && scores.strength_score >= 65
  const hasGoodMigration = scores && scores.migration_score !== null && scores.migration_score >= 65
  const hasLowRisk = scores && scores.risk_score !== null && scores.risk_score < 40
  const isHighRisk = scores && scores.risk_score !== null && scores.risk_score >= 65

  const bestFit = []
  if (hasGoodStrength && hasGoodMigration) bestFit.push('long_term_investor', 'relocation_buyer')
  if (hasLowRisk && scores?.investor_score && scores.investor_score >= 65) bestFit.push('buy_and_hold_landlord')
  if (bestFit.length === 0) bestFit.push('patient_capital')

  return (
    <div className="wt-card">
      <div className="px-5 py-4 border-b border-wt-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-wt-accent" />
        <h3 className="font-semibold text-sm">Market Intelligence Brief</h3>
        <span className="ml-auto text-xs text-wt-muted bg-wt-border px-2 py-0.5">Template</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Signal line */}
        {scores && (
          <div className="flex items-start gap-3 p-3 bg-wt-bg border-l-2 border-wt-accent">
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-white">{shortName}</span>{' '}
                {hasGoodMigration && 'is attracting strong net in-migration, '}
                {hasGoodStrength && !isHighRisk && 'with positive momentum across housing and economic indicators'}
                {isHighRisk && 'but carries elevated risk signals that warrant monitoring'}
                {!hasGoodStrength && !isHighRisk && 'shows mixed signals across key metrics'}.
              </p>
            </div>
          </div>
        )}

        {/* Scores summary */}
        {scores && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Market Strength', value: scores.strength_score, isRisk: false },
              { label: 'Risk Level', value: scores.risk_score, isRisk: true },
              { label: 'Migration Signal', value: scores.migration_score, isRisk: false },
              { label: 'Investor Signal', value: scores.investor_score, isRisk: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-wt-border last:border-0">
                <span className="text-xs text-wt-muted">{item.label}</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{
                    color: item.value !== null
                      ? item.isRisk
                        ? item.value >= 65 ? '#EF4444' : item.value >= 40 ? '#F59E0B' : '#10B981'
                        : item.value >= 65 ? '#10B981' : item.value >= 40 ? '#F59E0B' : '#EF4444'
                      : '#94A3B8'
                  }}
                >
                  {item.value !== null ? Math.round(item.value) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Best fit */}
        {bestFit.length > 0 && (
          <div>
            <div className="wt-label mb-2">Best Fit For</div>
            <div className="flex flex-wrap gap-2">
              {bestFit.map((fit) => (
                <div key={fit} className="flex items-center gap-1.5 text-xs bg-wt-bg border border-wt-border px-2.5 py-1.5">
                  <span>{BEST_FIT_ICONS[fit] || '📊'}</span>
                  <span className="text-white font-medium">{BEST_FIT_LABELS[fit] || fit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-wt-muted border-t border-wt-border pt-3">
          Brief generated from template using public data. AI-enhanced briefs available in Phase 2.
          For informational purposes only — not investment advice.
        </p>
      </div>
    </div>
  )
}
