'use client'

import { MAP_LAYERS } from '@/config/metrics'
import type { MetricKey } from '@/types/metrics'
import { cn } from '@/lib/utils'

const SCORE_LAYERS = [
  { key: 'strength_score', label: 'Strength Score' },
  { key: 'risk_score', label: 'Risk Score' },
  { key: 'migration_score', label: 'Migration Score' },
  { key: 'affordability_score', label: 'Affordability Score' },
  { key: 'investor_score', label: 'Investor Score' },
]

const GEO_TYPES = [
  { key: 'state', label: 'States' },
  { key: 'metro', label: 'Metros' },
  { key: 'county', label: 'Counties' },
]

interface Props {
  activeLayer: string
  onLayerChange: (layer: MetricKey) => void
  geoType: 'state' | 'metro' | 'county'
  onGeoTypeChange: (type: 'state' | 'metro' | 'county') => void
}

export default function LayerToggle({ activeLayer, onLayerChange, geoType, onGeoTypeChange }: Props) {
  return (
    <div className="p-4 space-y-6 bg-wt-surface h-full">
      {/* Geography type */}
      <div>
        <div className="wt-label mb-2">Geography Level</div>
        <div className="space-y-0.5">
          {GEO_TYPES.map((g) => (
            <button
              key={g.key}
              onClick={() => onGeoTypeChange(g.key as 'state' | 'metro' | 'county')}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                geoType === g.key
                  ? 'bg-wt-accent/10 text-wt-accent'
                  : 'text-wt-muted hover:text-white hover:bg-wt-border/50'
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Score layers */}
      <div>
        <div className="wt-label mb-2">Watchtower Scores</div>
        <div className="space-y-0.5">
          {SCORE_LAYERS.map((layer) => (
            <button
              key={layer.key}
              onClick={() => onLayerChange(layer.key as MetricKey)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between group',
                activeLayer === layer.key
                  ? 'bg-wt-accent/10 text-wt-accent'
                  : 'text-wt-muted hover:text-white hover:bg-wt-border/50'
              )}
            >
              <span>{layer.label}</span>
              {activeLayer === layer.key && (
                <span className="text-xs bg-wt-accent text-wt-bg px-1.5 py-0.5 font-medium">Active</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Metric layers */}
      <div>
        <div className="wt-label mb-2">Data Layers</div>
        <div className="space-y-0.5">
          {MAP_LAYERS.map((layer) => (
            <button
              key={layer.key}
              onClick={() => onLayerChange(layer.key)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between',
                activeLayer === layer.key
                  ? 'bg-wt-accent/10 text-wt-accent'
                  : 'text-wt-muted hover:text-white hover:bg-wt-border/50'
              )}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-wt-border">
        <div className="text-xs text-wt-muted">
          Click any geography on the map for a quick preview. Click through to the full market profile.
        </div>
      </div>
    </div>
  )
}
