'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import LayerToggle from '@/components/map/LayerToggle'
import type { MetricKey } from '@/types/metrics'

// Dynamic import to prevent SSR issues with Mapbox
const WatchtowerMap = dynamic(() => import('@/components/map/WatchtowerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-wt-surface flex items-center justify-center">
      <div className="text-wt-muted text-sm">Loading map...</div>
    </div>
  ),
})

export default function ExplorePage() {
  const [activeLayer, setActiveLayer] = useState<MetricKey>('strength_score' as MetricKey)
  const [selectedGeoType, setSelectedGeoType] = useState<'state' | 'metro' | 'county'>('metro')

  return (
    <div className="relative h-full flex">
      {/* Layer control panel */}
      <div className="w-72 flex-shrink-0 border-r border-wt-border overflow-y-auto">
        <LayerToggle
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          geoType={selectedGeoType}
          onGeoTypeChange={setSelectedGeoType}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <WatchtowerMap
          activeLayer={activeLayer}
          geoType={selectedGeoType}
        />
      </div>
    </div>
  )
}
