export interface ScoreOutput {
  id: string
  geography_id: string
  calculated_at: string
  strength_score: number
  risk_score: number
  migration_score: number
  affordability_score: number
  investor_score: number
  score_version: string
  factor_breakdown: ScoreFactorBreakdown
}

export interface ScoreFactorBreakdown {
  strength: ScoreFactor[]
  risk: ScoreFactor[]
  migration: ScoreFactor[]
  affordability: ScoreFactor[]
  investor: ScoreFactor[]
}

export interface ScoreFactor {
  key: string
  label: string
  raw_value: number | null
  percentile: number | null
  weight: number
  direction: 'positive' | 'negative'
  contribution: number
  available: boolean
}

export type ScoreType = 'strength' | 'risk' | 'migration' | 'affordability' | 'investor'

export interface ScoreConfig {
  version: string
  strength: Record<string, ScoreWeightConfig>
  risk: Record<string, ScoreWeightConfig>
  migration: Record<string, ScoreWeightConfig>
  affordability: Record<string, ScoreWeightConfig>
  investor: Record<string, ScoreWeightConfig>
}

export interface ScoreWeightConfig {
  weight: number
  direction: 'positive' | 'negative'
  normalize: 'percentile' | 'zscore' | 'direct'
  cap?: number
  label?: string
}

export const SCORE_LABELS: Record<ScoreType, string> = {
  strength: 'Strength',
  risk: 'Risk',
  migration: 'Migration',
  affordability: 'Affordability',
  investor: 'Investor Opportunity',
}

export const SCORE_DESCRIPTIONS: Record<ScoreType, string> = {
  strength: 'Overall market health and momentum',
  risk: 'Likelihood of market deterioration (lower is safer)',
  migration: 'Attractiveness to net population inflow',
  affordability: 'Housing value relative to local incomes',
  investor: 'Combined signal for investment return potential',
}

export function getScoreColor(score: number, type: ScoreType): string {
  if (type === 'risk') {
    if (score >= 70) return '#EF4444'
    if (score >= 45) return '#F59E0B'
    return '#10B981'
  }
  if (score >= 70) return '#10B981'
  if (score >= 45) return '#F59E0B'
  return '#EF4444'
}

export function getScoreLabel(score: number, type: ScoreType): string {
  if (type === 'risk') {
    if (score >= 70) return 'High Risk'
    if (score >= 45) return 'Moderate Risk'
    return 'Low Risk'
  }
  if (score >= 75) return 'Excellent'
  if (score >= 60) return 'Strong'
  if (score >= 45) return 'Moderate'
  if (score >= 30) return 'Weak'
  return 'Poor'
}
