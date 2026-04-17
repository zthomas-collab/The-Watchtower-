import { getScoreColorHex, getScoreLabel, SCORE_LABELS, SCORE_DESCRIPTIONS } from '@/types/scores'
import type { ScoreType } from '@/types/scores'

interface Props {
  type: ScoreType
  score: number | null
  showLabel?: boolean
}

export default function ScoreCard({ type, score, showLabel = true }: Props) {
  const color = getScoreColorHex(score, type === 'risk')
  const label = score !== null ? getScoreLabel(score, type) : 'No Data'
  const value = score !== null ? Math.round(score) : '—'

  return (
    <div className="wt-card p-4 flex flex-col gap-2">
      <div className="wt-label">{SCORE_LABELS[type]}</div>
      <div className="flex items-end gap-2">
        <div
          className="text-4xl font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {value}
        </div>
        <div className="text-xs text-wt-muted mb-0.5">/100</div>
      </div>
      {showLabel && (
        <div className="text-xs font-semibold" style={{ color }}>
          {label}
        </div>
      )}
      <div className="text-xs text-wt-muted leading-relaxed">
        {SCORE_DESCRIPTIONS[type]}
      </div>
      {/* Score bar */}
      <div className="h-1 bg-wt-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score ?? 0}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
