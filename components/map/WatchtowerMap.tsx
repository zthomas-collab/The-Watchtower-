'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import type { MetricKey } from '@/types/metrics'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const COLOR_SCALES: Record<string, string[]> = {
  greens: ['#064E3B', '#065F46', '#047857', '#059669', '#10B981', '#34D399', '#6EE7B7'],
  reds: ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5'],
  blues: ['#1E3A5F', '#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
  oranges: ['#7C2D12', '#9A3412', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74'],
  purples: ['#3B0764', '#4C1D95', '#5B21B6', '#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA'],
  cyans: ['#083344', '#0E4F65', '#0E7490', '#0891B2', '#06B6D4', '#22D3EE', '#67E8F9'],
}

const LAYER_COLOR_SCALES: Partial<Record<MetricKey | 'strength_score' | 'investor_score', { scale: string; reverse: boolean }>> = {
  strength_score: { scale: 'greens', reverse: false },
  investor_score: { scale: 'cyans', reverse: false },
  median_list_price: { scale: 'reds', reverse: false },
  days_on_market: { scale: 'oranges', reverse: false },
  unemployment_rate: { scale: 'reds', reverse: false },
  net_migration_rate: { scale: 'greens', reverse: false },
  job_growth_pct: { scale: 'greens', reverse: false },
  population_growth_pct: { scale: 'blues', reverse: false },
  months_of_supply: { scale: 'blues', reverse: false },
  price_reductions_pct: { scale: 'oranges', reverse: false },
  affordability_index: { scale: 'greens', reverse: false },
}

interface Props {
  activeLayer: MetricKey | string
  geoType: 'state' | 'metro' | 'county'
}

interface MarketPopupData {
  id: string
  name: string
  value: number | null
  strength_score: number | null
  risk_score: number | null
}

export default function WatchtowerMap({ activeLayer, geoType }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [popup, setPopup] = useState<MarketPopupData | null>(null)
  const supabase = createClient()

  const formatLayerValue = useCallback((value: number | null, layer: string): string => {
    if (value === null) return '—'
    if (layer === 'median_list_price') return formatCurrency(value)
    if (layer === 'unemployment_rate' || layer === 'job_growth_pct' || layer === 'population_growth_pct') {
      return formatPercent(value, true)
    }
    if (layer === 'strength_score' || layer === 'risk_score' || layer === 'investor_score') {
      return Math.round(value).toString()
    }
    return formatNumber(value)
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-96, 38],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 12,
    })

    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      // State boundaries layer
      map.addSource('states', {
        type: 'vector',
        url: 'mapbox://mapbox.boundaries-adm1-v3',
      })

      map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'states',
        'source-layer': 'boundaries_admin_1',
        filter: ['==', ['get', 'worldview'], 'US'],
        paint: {
          'fill-color': '#1E2028',
          'fill-opacity': 0.8,
        },
      })

      map.addLayer({
        id: 'states-outline',
        type: 'line',
        source: 'states',
        'source-layer': 'boundaries_admin_1',
        filter: ['==', ['get', 'worldview'], 'US'],
        paint: {
          'line-color': '#2D3142',
          'line-width': 1,
        },
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-8 right-4 bg-wt-surface border border-wt-border p-3 text-xs">
        <div className="wt-label mb-2">{activeLayer.replace(/_/g, ' ').toUpperCase()}</div>
        <div className="flex gap-1">
          {(LAYER_COLOR_SCALES[activeLayer as keyof typeof LAYER_COLOR_SCALES]?.reverse
            ? [...(COLOR_SCALES[LAYER_COLOR_SCALES[activeLayer as keyof typeof LAYER_COLOR_SCALES]?.scale || 'blues'])].reverse()
            : COLOR_SCALES[LAYER_COLOR_SCALES[activeLayer as keyof typeof LAYER_COLOR_SCALES]?.scale || 'blues'] || COLOR_SCALES.blues
          ).map((c, i) => (
            <div key={i} className="w-4 h-3" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-wt-muted">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* No token message */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-wt-bg/80">
          <div className="wt-card p-6 text-center max-w-sm">
            <div className="text-2xl mb-3">🗺️</div>
            <div className="font-semibold text-sm mb-2">Mapbox Token Required</div>
            <div className="text-wt-muted text-xs">
              Add <code className="text-wt-accent">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your <code>.env.local</code> to enable the interactive map.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
