import { getWeightsForScore } from './weights'
import type { ScoreOutput, ScoreFactor, ScoreFactorBreakdown } from '@/types/scores'

export interface MarketDataForScoring {
  geography_id: string
  geo_type: string
  // Housing
  median_list_price_yoy_pct: number | null
  days_on_market: number | null
  months_of_supply: number | null
  inventory_change_yoy_pct: number | null
  price_reductions_pct: number | null
  sale_to_list_ratio: number | null
  // Economic
  unemployment_rate: number | null
  unemployment_change_yoy: number | null
  job_growth_pct: number | null
  income_growth_pct: number | null
  gdp_growth_pct: number | null
  median_household_income: number | null
  // Migration
  net_migration_rate: number | null
  migration_momentum_3yr: number | null
  inbound_outbound_ratio: number | null
  // Demographics
  population_growth_pct: number | null
  // Rent / Affordability
  rent_to_income_ratio: number | null
  rent_growth_yoy_pct: number | null
  rent_growth_vs_wage_growth: number | null
  price_to_income_ratio: number | null
  price_vs_national_median_pct: number | null
  // Derived from other scores
  strength_score?: number | null
  risk_score?: number | null
  affordability_score?: number | null
  migration_score?: number | null
  rent_yield_estimate?: number | null
}

function percentileRank(value: number, allValues: number[]): number {
  const valid = allValues.filter((v) => v !== null && !isNaN(v))
  if (valid.length === 0) return 50
  const below = valid.filter((v) => v < value).length
  const equal = valid.filter((v) => v === value).length
  return ((below + equal * 0.5) / valid.length) * 100
}

function zscoreNormalize(value: number, allValues: number[]): number {
  const valid = allValues.filter((v) => v !== null && !isNaN(v))
  if (valid.length === 0) return 50
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length
  const std = Math.sqrt(valid.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / valid.length)
  if (std === 0) return 50
  const z = (value - mean) / std
  return Math.max(0, Math.min(100, 50 + z * 15))
}

function computeScore(
  data: MarketDataForScoring,
  scoreType: 'strength' | 'risk' | 'migration' | 'affordability' | 'investor',
  allData: MarketDataForScoring[]
): { score: number; factors: ScoreFactor[] } {
  const weights = getWeightsForScore(scoreType)
  const factors: ScoreFactor[] = []
  let totalScore = 0
  let totalWeight = 0

  for (const [key, config] of Object.entries(weights)) {
    const rawValue = (data as Record<string, number | null | undefined>)[key] ?? null
    const available = rawValue !== null && rawValue !== undefined && !isNaN(rawValue as number)

    let normalizedValue = 50

    if (available) {
      const value = rawValue as number
      const allValues = allData
        .map((d) => (d as Record<string, number | null | undefined>)[key])
        .filter((v): v is number => v !== null && v !== undefined && !isNaN(v as number))

      if (config.normalize === 'percentile') {
        normalizedValue = percentileRank(value, allValues)
      } else if (config.normalize === 'zscore') {
        normalizedValue = zscoreNormalize(value, allValues)
      } else if (config.normalize === 'direct') {
        normalizedValue = Math.max(0, Math.min(100, value))
      }

      // Invert if higher is worse for this score
      if (config.direction === 'negative') {
        normalizedValue = 100 - normalizedValue
      }
    }

    const contribution = normalizedValue * config.weight
    totalScore += contribution
    totalWeight += config.weight

    factors.push({
      key,
      label: config.label || key,
      raw_value: available ? (rawValue as number) : null,
      percentile: available ? normalizedValue : null,
      weight: config.weight,
      direction: config.direction,
      contribution,
      available,
    })
  }

  // Normalize by actual weight (handles missing data gracefully)
  const rawScore = totalWeight > 0 ? totalScore / totalWeight : 50
  // Soft cap at 95 to prevent artificial perfect scores
  const finalScore = Math.min(95, Math.max(5, rawScore))

  return { score: Math.round(finalScore * 10) / 10, factors }
}

export function calculateAllScores(
  data: MarketDataForScoring,
  allDataForType: MarketDataForScoring[]
): Omit<ScoreOutput, 'id' | 'created_at'> {
  const strengthResult = computeScore(data, 'strength', allDataForType)
  const riskResult = computeScore(data, 'risk', allDataForType)
  const migrationResult = computeScore(data, 'migration', allDataForType)
  const affordabilityResult = computeScore(data, 'affordability', allDataForType)

  // Investor score uses other scores as inputs
  const dataWithScores: MarketDataForScoring = {
    ...data,
    strength_score: strengthResult.score,
    risk_score: riskResult.score,
    affordability_score: affordabilityResult.score,
    migration_score: migrationResult.score,
  }
  const investorResult = computeScore(dataWithScores, 'investor', allDataForType)

  const breakdown: ScoreFactorBreakdown = {
    strength: strengthResult.factors,
    risk: riskResult.factors,
    migration: migrationResult.factors,
    affordability: affordabilityResult.factors,
    investor: investorResult.factors,
  }

  return {
    geography_id: data.geography_id,
    calculated_at: new Date().toISOString(),
    strength_score: strengthResult.score,
    risk_score: riskResult.score,
    migration_score: migrationResult.score,
    affordability_score: affordabilityResult.score,
    investor_score: investorResult.score,
    score_version: '1.0',
    factor_breakdown: breakdown,
    price_to_income_ratio: data.price_to_income_ratio,
    rent_to_income_ratio: data.rent_to_income_ratio,
  }
}

export function batchCalculateScores(
  allData: MarketDataForScoring[]
): Array<Omit<ScoreOutput, 'id' | 'created_at'>> {
  const byGeoType = new Map<string, MarketDataForScoring[]>()
  for (const d of allData) {
    const group = byGeoType.get(d.geo_type) || []
    group.push(d)
    byGeoType.set(d.geo_type, group)
  }

  const results: Array<Omit<ScoreOutput, 'id' | 'created_at'>> = []
  for (const [, groupData] of byGeoType) {
    for (const d of groupData) {
      results.push(calculateAllScores(d, groupData))
    }
  }
  return results
}

export function deriveAffordabilityMetrics(data: {
  median_list_price: number | null
  median_household_income: number | null
  median_rent_overall: number | null
  income_growth_pct: number | null
  rent_growth_yoy_pct: number | null
}): {
  price_to_income_ratio: number | null
  rent_to_income_ratio: number | null
  rent_growth_vs_wage_growth: number | null
} {
  const price_to_income_ratio =
    data.median_list_price && data.median_household_income && data.median_household_income > 0
      ? data.median_list_price / data.median_household_income
      : null

  const annualRent = data.median_rent_overall ? data.median_rent_overall * 12 : null
  const rent_to_income_ratio =
    annualRent && data.median_household_income && data.median_household_income > 0
      ? annualRent / data.median_household_income
      : null

  const rent_growth_vs_wage_growth =
    data.rent_growth_yoy_pct !== null && data.income_growth_pct !== null
      ? data.rent_growth_yoy_pct - data.income_growth_pct
      : null

  return { price_to_income_ratio, rent_to_income_ratio, rent_growth_vs_wage_growth }
}
