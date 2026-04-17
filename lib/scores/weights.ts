import weightsJson from '@/config/score-weights.json'
import type { ScoreConfig, ScoreType } from '@/types/scores'

export const scoreWeights = weightsJson as ScoreConfig

export function getWeightsForScore(scoreType: ScoreType) {
  return scoreWeights[scoreType]
}

export function validateWeights(): boolean {
  const scoreTypes: ScoreType[] = ['strength', 'risk', 'migration', 'affordability', 'investor']
  for (const type of scoreTypes) {
    const factors = scoreWeights[type]
    const total = Object.values(factors).reduce((sum, f) => sum + f.weight, 0)
    if (Math.abs(total - 1.0) > 0.001) {
      console.error(`Score weights for '${type}' sum to ${total}, expected 1.0`)
      return false
    }
  }
  return true
}
