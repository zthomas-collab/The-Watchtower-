/**
 * HUD Fair Market Rents (FMR) ETL
 * Fetches county-level rent baselines published annually by HUD.
 *
 * API: https://www.huduser.gov/portal/dataset/fmr-api.html
 * Free, no key required for basic FMR data downloads.
 * Fallback: CSV download from HUD data store.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { buildGeoLookupCache, resolveByCountyFips, resolveByStateCounty } from '../transforms/normalize'
import { upsertRecords, withIngestionTracking } from '../loaders/supabase-loader'

const HUD_FMR_BASE = 'https://www.huduser.gov/hudapi/public/fmr'

interface HUDFMRResponse {
  data: {
    county_name: string
    states_metro_name: string | null
    statecode: string
    countycode: string
    fips_code: string
    year: string
    smallarea: number
    basicdata: {
      Efficiency: number
      'One-Bedroom': number
      'Two-Bedroom': number
      'Three-Bedroom': number
      'Four-Bedroom': number
    }
  }[]
}

interface RentRow {
  geography_id: string
  period_start: string
  period_end: string
  metric_source: string
  rent_1br_median: number | null
  rent_2br_median: number | null
  rent_3br_median: number | null
}

async function fetchHUDFMRForState(stateCode: string, year: number): Promise<RentRow[]> {
  const url = `${HUD_FMR_BASE}/listCounties/${stateCode}?year=${year}`
  const headers: Record<string, string> = {}

  if (process.env.HUD_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HUD_API_TOKEN}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    console.warn(`[HUD] State ${stateCode} year ${year}: HTTP ${res.status}`)
    return []
  }

  const json = (await res.json()) as HUDFMRResponse
  if (!json.data?.length) return []

  const rows: RentRow[] = []
  const periodStart = `${year}-01-01`
  const periodEnd = `${year}-12-31`

  for (const county of json.data) {
    // Try 5-digit FIPS first, then state+county split
    let geoId = county.fips_code ? resolveByCountyFips(county.fips_code) : null

    if (!geoId && county.statecode && county.countycode) {
      geoId = resolveByStateCounty(county.statecode, county.countycode)
    }

    if (!geoId) continue

    const bd = county.basicdata
    rows.push({
      geography_id: geoId,
      period_start: periodStart,
      period_end: periodEnd,
      metric_source: 'hud_fmr',
      rent_1br_median: bd['One-Bedroom'] ?? null,
      rent_2br_median: bd['Two-Bedroom'] ?? null,
      rent_3br_median: bd['Three-Bedroom'] ?? null,
    })
  }

  return rows
}

export async function runHUDETL(): Promise<{ success: boolean; records: number; error?: string }> {
  return withIngestionTracking('hud_fmr', async () => {
    await buildGeoLookupCache()

    const year = new Date().getFullYear() - 1 // FMR is published for prior year
    const stateCodes = Array.from({ length: 56 }, (_, i) => String(i + 1).padStart(2, '0')).filter(
      (s) => !['03', '07', '14', '43', '52'].includes(s) // Skip invalid FIPS state codes
    )

    const allRows: RentRow[] = []

    for (const stateCode of stateCodes) {
      const rows = await fetchHUDFMRForState(stateCode, year)
      allRows.push(...rows)

      // Small delay to be polite to the API
      await new Promise((r) => setTimeout(r, 100))
    }

    console.log(`[HUD] Fetched ${allRows.length} county FMR rows for ${year}`)

    const result = await upsertRecords({
      table: 'monthly_rent_metrics',
      rows: allRows as unknown as Record<string, unknown>[],
      conflictColumns: ['geography_id', 'period_start', 'metric_source'],
      source: 'hud_fmr',
    })

    return result
  })
}

// Allow running directly: npx tsx etl/sources/hud.ts
if (require.main === module) {
  runHUDETL()
    .then((r) => {
      console.log('[HUD] Done:', r)
      process.exit(r.success ? 0 : 1)
    })
    .catch((err) => {
      console.error('[HUD] Fatal:', err)
      process.exit(1)
    })
}
