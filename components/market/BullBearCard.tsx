import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface Props {
  scores: {
    strength_score: number | null
    risk_score: number | null
    migration_score: number | null
    affordability_score: number | null
    investor_score: number | null
  } | null
  summary: {
    unemployment_rate: number | null
    price_to_income_ratio: number | null
    net_migration_rate: number | null
    job_growth_pct: number | null
    months_of_supply: number | null
    affordability_score?: number | null
  }
}

export default function BullBearCard({ scores, summary: s }: Props) {
  const bullPoints: string[] = []
  const bearPoints: string[] = []

  if (scores?.migration_score && scores.migration_score >= 65) {
    bullPoints.push('Strong net migration creates durable demand floor')
  }
  if (scores?.strength_score && scores.strength_score >= 65) {
    bullPoints.push('Broad-based positive momentum across key metrics')
  }
  if (scores?.affordability_score && scores.affordability_score >= 65) {
    bullPoints.push('Relative affordability keeps the buyer pool wide')
  }
  if (s.job_growth_pct && s.job_growth_pct > 2.0) {
    bullPoints.push(`Job growth of +${s.job_growth_pct.toFixed(1)}% supports population retention`)
  }
  if (s.months_of_supply && s.months_of_supply < 3.0) {
    bullPoints.push('Tight supply limits downside on prices near-term')
  }
  if (bullPoints.length === 0) {
    bullPoints.push('Stable market conditions with limited near-term catalysts')
  }

  if (scores?.risk_score && scores.risk_score >= 65) {
    bearPoints.push('Elevated risk signals require monitoring before entry')
  }
  if (s.price_to_income_ratio && s.price_to_income_ratio > 6) {
    bearPoints.push(`Price-to-income ratio of ${s.price_to_income_ratio.toFixed(1)}x is stretched vs. historical norms`)
  }
  if (scores?.migration_score && scores.migration_score < 35) {
    bearPoints.push('Negative migration trend could weaken long-term demand')
  }
  if (s.unemployment_rate && s.unemployment_rate > 5.5) {
    bearPoints.push(`Unemployment at ${s.unemployment_rate.toFixed(1)}% signals economic stress`)
  }
  if (s.months_of_supply && s.months_of_supply > 7) {
    bearPoints.push('Excess supply could create sustained price pressure')
  }
  if (bearPoints.length === 0) {
    bearPoints.push('No major risk flags identified — standard market monitoring advised')
  }

  return (
    <div className="wt-card">
      <div className="px-5 py-4 border-b border-wt-border">
        <h3 className="font-semibold text-sm">Bull / Bear Analysis</h3>
      </div>
      <div className="p-5 space-y-5">
        {/* Bull case */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-wt-green" />
            <span className="text-sm font-semibold text-wt-green">Bull Case</span>
          </div>
          <ul className="space-y-2">
            {bullPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-wt-muted">
                <span className="text-wt-green mt-0.5 flex-shrink-0">+</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-wt-border" />

        {/* Bear case */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-wt-red" />
            <span className="text-sm font-semibold text-wt-red">Bear Case</span>
          </div>
          <ul className="space-y-2">
            {bearPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-wt-muted">
                <span className="text-wt-red mt-0.5 flex-shrink-0">−</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-wt-border pt-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 text-wt-yellow mt-0.5 flex-shrink-0" />
            <p className="text-xs text-wt-muted">
              Analysis based on weighted public data. Not investment advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
