import type { ScoreFactorBreakdown, ScoreType } from '@/types/scores'
import { SCORE_LABELS } from '@/types/scores'
import { formatPercent } from '@/lib/utils'

interface Props {
  breakdown: ScoreFactorBreakdown
}

const SCORE_TYPES: ScoreType[] = ['strength', 'risk', 'migration', 'affordability', 'investor']

export default function ScoreBreakdown({ breakdown }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base mb-1">Score Factor Breakdown</h3>
        <p className="text-wt-muted text-sm">
          Full transparency: every factor, its weight, and its contribution to each score.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {SCORE_TYPES.map((type) => {
          const factors = breakdown[type]
          if (!factors?.length) return null
          return (
            <div key={type} className="wt-card">
              <div className="px-4 py-3 border-b border-wt-border">
                <h4 className="font-medium text-sm">{SCORE_LABELS[type]} Score — Factors</h4>
              </div>
              <div className="divide-y divide-wt-border">
                {factors.map((f) => {
                  const contribColor = f.contribution > 10 ? '#10B981' : f.contribution < 3 ? '#EF4444' : '#94A3B8'
                  return (
                    <div key={f.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white truncate">{f.label}</span>
                          {!f.available && (
                            <span className="text-xs text-wt-muted bg-wt-border px-1 flex-shrink-0">N/A</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-wt-muted">
                            Weight: {Math.round(f.weight * 100)}%
                          </span>
                          {f.raw_value !== null && (
                            <span className="text-xs text-wt-muted">
                              · {f.raw_value.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {f.percentile !== null && (
                          <div className="text-right">
                            <div className="text-xs text-wt-muted">Pctile</div>
                            <div className="text-xs font-medium text-white">{Math.round(f.percentile)}th</div>
                          </div>
                        )}
                        <div className="text-right w-8">
                          <div className="text-xs text-wt-muted">Pts</div>
                          <div className="text-xs font-bold" style={{ color: contribColor }}>
                            {f.contribution.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
