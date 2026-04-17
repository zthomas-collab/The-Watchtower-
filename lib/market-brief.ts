import type { MarketMetricsSummary } from '@/types/metrics'
import type { ScoreOutput } from '@/types/scores'
import type { Geography } from '@/types/geography'

export interface MarketBriefData {
  summary: string
  bull_case: string
  bear_case: string
  best_fit: string[]
  method: 'template'
}

function classify(value: number | null, high: number, low: number): 'high' | 'mid' | 'low' | 'unknown' {
  if (value === null) return 'unknown'
  if (value >= high) return 'high'
  if (value <= low) return 'low'
  return 'mid'
}

export function generateMarketBrief(
  geo: Geography,
  metrics: MarketMetricsSummary,
  scores: ScoreOutput
): MarketBriefData {
  const name = geo.name.split(',')[0]
  const m = metrics.migration
  const e = metrics.economic
  const h = metrics.housing
  const r = metrics.rent

  const strengthClass = classify(scores.strength_score, 65, 35)
  const riskClass = classify(scores.risk_score, 65, 35)
  const migrationClass = classify(scores.migration_score, 65, 35)
  const affordabilityClass = classify(scores.affordability_score, 65, 35)
  const investorClass = classify(scores.investor_score, 65, 35)

  // Build summary sentence fragments
  const fragments: string[] = []

  // Migration signal
  if (m) {
    if (migrationClass === 'high' && m.net_migration && m.net_migration > 0) {
      fragments.push(`${name} is attracting strong net in-migration (${m.net_migration.toLocaleString()} net arrivals in ${m.period_year})`)
    } else if (migrationClass === 'low' && m.net_migration && m.net_migration < 0) {
      fragments.push(`${name} is experiencing net population outflow with ${Math.abs(m.net_migration).toLocaleString()} more departures than arrivals`)
    } else {
      fragments.push(`${name} shows neutral migration trends`)
    }
  } else {
    fragments.push(`${name}'s migration data is pending`)
  }

  // Economic signal
  if (e) {
    const unemp = e.unemployment_rate
    const jobs = e.job_growth_pct
    if (unemp !== null && unemp < 4.0 && jobs !== null && jobs > 1.5) {
      fragments.push(`supported by a tight labor market (${unemp}% unemployment, +${jobs?.toFixed(1)}% job growth)`)
    } else if (unemp !== null && unemp > 6.0) {
      fragments.push(`while the local economy faces headwinds with ${unemp}% unemployment`)
    } else {
      fragments.push(`with a stable local economy`)
    }
  }

  // Housing signal
  if (h) {
    const dom = h.days_on_market
    const supply = h.months_of_supply
    const priceChange = h.median_list_price_yoy_pct

    if (supply !== null && supply < 3.0 && dom !== null && dom < 30) {
      fragments.push(`Housing supply remains tight (${supply} months, ${dom} days on market)`)
    } else if (supply !== null && supply > 6.0) {
      fragments.push(`Inventory is building with ${supply} months of supply`)
    }

    if (priceChange !== null) {
      if (priceChange > 5) {
        fragments.push(`prices are rising ${priceChange.toFixed(1)}% year-over-year`)
      } else if (priceChange < -5) {
        fragments.push(`prices have pulled back ${Math.abs(priceChange).toFixed(1)}% from a year ago`)
      }
    }
  }

  // Affordability
  if (affordabilityClass === 'high') {
    fragments.push(`Affordability remains a relative strength compared to peer markets`)
  } else if (affordabilityClass === 'low') {
    fragments.push(`Affordability has become a constraint as prices outpace local incomes`)
  }

  const summary = fragments.join(', ') + '.'

  // Bull case
  const bullParts: string[] = []
  if (migrationClass === 'high') bullParts.push('Strong migration engine creates durable demand')
  if (strengthClass === 'high') bullParts.push('Market momentum is broad-based across multiple indicators')
  if (affordabilityClass === 'high') bullParts.push('Relative affordability keeps the demand pool wide')
  if (e?.job_growth_pct && e.job_growth_pct > 1.5) bullParts.push('Job diversification supports long-term population retention')
  if (bullParts.length === 0) bullParts.push('Market fundamentals are stable with limited downside catalysts')

  // Bear case
  const bearParts: string[] = []
  if (riskClass === 'high') bearParts.push('Elevated risk indicators suggest caution for near-term buyers')
  if (affordabilityClass === 'low') bearParts.push('Stretched affordability limits the buyer pool and compresses future gains')
  if (migrationClass === 'low') bearParts.push('Population outflow could dampen demand without economic catalyst')
  if (h?.price_reductions_pct && h.price_reductions_pct > 20) bearParts.push('Rising price cuts signal softening seller leverage')
  if (bearParts.length === 0) bearParts.push('Limited near-term upside catalysts; patient capital required')

  // Best fit
  const bestFit: string[] = []
  if (investorClass === 'high' && affordabilityClass !== 'low') bestFit.push('long_term_investor')
  if (r?.rent_to_income_ratio && r.rent_to_income_ratio > 0.3) bestFit.push('buy_and_hold_landlord')
  if (migrationClass === 'high' && strengthClass === 'high') bestFit.push('relocation_buyer')
  if (affordabilityClass === 'high' && strengthClass !== 'low') bestFit.push('first_time_buyer')
  if (h?.months_of_supply && h.months_of_supply < 3 && strengthClass === 'high') bestFit.push('fix_and_flip')
  if (bestFit.length === 0) bestFit.push('patient_capital')

  return {
    summary,
    bull_case: bullParts.join('. ') + '.',
    bear_case: bearParts.join('. ') + '.',
    best_fit: bestFit,
    method: 'template',
  }
}

export const BEST_FIT_LABELS: Record<string, string> = {
  long_term_investor: 'Long-Term Investor',
  buy_and_hold_landlord: 'Buy & Hold Landlord',
  relocation_buyer: 'Relocation Buyer',
  first_time_buyer: 'First-Time Buyer',
  fix_and_flip: 'Fix & Flip',
  patient_capital: 'Patient Capital',
  builder_developer: 'Builder / Developer',
}
