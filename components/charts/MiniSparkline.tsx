'use client'

import { Sparklines, SparklinesLine } from 'react-sparklines'

interface Props {
  data: (number | null)[]
  color?: string
  height?: number
}

export default function MiniSparkline({ data, color = '#22D3EE', height = 32 }: Props) {
  const clean = data.filter((d): d is number => d !== null)
  if (clean.length < 2) return null

  return (
    <div style={{ width: 60, height }}>
      <Sparklines data={clean} height={height}>
        <SparklinesLine color={color} style={{ strokeWidth: 1.5, fill: 'none' }} />
      </Sparklines>
    </div>
  )
}
