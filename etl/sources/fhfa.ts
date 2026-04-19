/**
 * FHFA House Price Index (HPI) ETL
 * Downloads quarterly HPI data for states and metros as a fallback
 * when Redfin coverage is unavailable (rural counties, small markets).
 *
 * Data: https://www.fhfa.gov/DataTools/Downloads/Pages/House-Price-Index-Datasets.aspx
 * Format: Public CSV — no API key required.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import Papa from 'papaparse'
import { buildGeoLookupCache, resolveByStateFips, resolveByCbsa } from '../transforms/normalize'
import { upsertRecords, withIngestionTracking } from '../loaders/supabase-loader'

// FHFA publishes CSVs at known stable URLs
const FHFA_METRO_CSV =
  'https://www.fhfa.gov/DataTools/Downloads/Documents/HPI/HPI_AT_metro.csv'
const FHFA_STATE_CSV =
  'https://www.fhfa.gov/DataTools/Downloads/Documents/HPI/HPI_AT_state.csv'

interface FHFAMetroRow {
  CBSA_Code: string
  CBSA_Name: string
  'hpi1990base': string // quarterly HPI (1990Q1=100)
  [key: string]: string
}

interface FHFAStateRow {
  State: string // 2-letter abbreviation
  yr: string
  qtr: string
  index_nsa: string
  index_sa: string
}

interface HousingMetricRow {
  geography_id: string
  period_start: string
  period_end: string
  metric_source: string
  hpi_yoy_change: number | null
}

async function fetchCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FHFA CSV fetch failed: ${res.status} for ${url}`)
  const text = await res.text()

  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err: Error) => reject(err),
    })
  })
}

function quarterToDateRange(year: string, quarter: string): { start: string; end: string } {
  const q = parseInt(quarter, 10)
  const y = parseInt(year, 10)
  const monthStart = (q - 1) * 3 + 1
  const monthEnd = q * 3
  const start = `${y}-${String(monthStart).padStart(2, '0')}-01`
  const lastDay = new Date(y, monthEnd, 0).getDate()
  const end = `${y}-${String(monthEnd).padStart(2, '0')}-${lastDay}`
  return { start, end }
}

function calcYoyChange(current: number, prior: number): number | null {
  if (!prior || prior === 0) return null
  return ((current - prior) / prior) * 100
}

async function processMetroHPI(): Promise<HousingMetricRow[]> {
  // FHFA metro CSV has a different structure — look for the expanded dataset
  // Format: CBSA_Code, CBSA_Name, yr, qtr, index_nsa, index_sa
  type MetroRow = { CBSA_Code: string; yr: string; qtr: string; index_nsa: string }
  const rows = await fetchCSV<MetroRow>(FHFA_METRO_CSV)

  // Group by CBSA to calculate YoY
  const byCbsa = new Map<string, MetroRow[]>()
  for (const row of rows) {
    if (!row.CBSA_Code || !row.yr || !row.qtr) continue
    const existing = byCbsa.get(row.CBSA_Code) ?? []
    existing.push(row)
    byCbsa.set(row.CBSA_Code, existing)
  }

  const output: HousingMetricRow[] = []

  for (const [cbsa, cbsaRows] of Array.from(byCbsa)) {
    const geoId = resolveByCbsa(cbsa.padStart(5, '0'))
    if (!geoId) continue

    // Sort ascending by year + quarter
    cbsaRows.sort((a: MetroRow, b: MetroRow) => {
      const aKey = `${a.yr}Q${a.qtr}`
      const bKey = `${b.yr}Q${b.qtr}`
      return aKey.localeCompare(bKey)
    })

    // Only emit the most recent 8 quarters
    const recent = cbsaRows.slice(-8)

    for (let i = 0; i < recent.length; i++) {
      const row = recent[i]
      const priorRow = cbsaRows.find(
        (r: MetroRow) =>
          parseInt(r.yr, 10) === parseInt(row.yr, 10) - 1 && r.qtr === row.qtr
      )

      const current = parseFloat(row.index_nsa)
      const prior = priorRow ? parseFloat(priorRow.index_nsa) : null
      const yoy = prior !== null ? calcYoyChange(current, prior) : null

      const { start, end } = quarterToDateRange(row.yr, row.qtr)

      output.push({
        geography_id: geoId,
        period_start: start,
        period_end: end,
        metric_source: 'fhfa_hpi',
        hpi_yoy_change: yoy,
      })
    }
  }

  return output
}

async function processStateHPI(): Promise<HousingMetricRow[]> {
  const rows = await fetchCSV<FHFAStateRow>(FHFA_STATE_CSV)

  // Group by state abbreviation
  const byState = new Map<string, FHFAStateRow[]>()
  for (const row of rows) {
    if (!row.State || !row.yr || !row.qtr) continue
    const existing = byState.get(row.State) ?? []
    existing.push(row)
    byState.set(row.State, existing)
  }

  // State abbreviation → FIPS lookup
  const STATE_FIPS: Record<string, string> = {
    AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09',
    DE: '10', DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17',
    IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24',
    MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31',
    NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38',
    OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46',
    TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54',
    WI: '55', WY: '56',
  }

  const output: HousingMetricRow[] = []

  for (const [abbrev, stateRows] of Array.from(byState)) {
    const fips = STATE_FIPS[abbrev.toUpperCase()]
    if (!fips) continue
    const geoId = resolveByStateFips(fips)
    if (!geoId) continue

    stateRows.sort((a: FHFAStateRow, b: FHFAStateRow) => `${a.yr}Q${a.qtr}`.localeCompare(`${b.yr}Q${b.qtr}`))
    const recent = stateRows.slice(-8)

    for (const row of recent) {
      const priorRow = stateRows.find(
        (r: FHFAStateRow) => parseInt(r.yr, 10) === parseInt(row.yr, 10) - 1 && r.qtr === row.qtr
      )

      const current = parseFloat(row.index_nsa)
      const prior = priorRow ? parseFloat(priorRow.index_nsa) : null
      const yoy = prior !== null ? calcYoyChange(current, prior) : null

      const { start, end } = quarterToDateRange(row.yr, row.qtr)

      output.push({
        geography_id: geoId,
        period_start: start,
        period_end: end,
        metric_source: 'fhfa_hpi',
        hpi_yoy_change: yoy,
      })
    }
  }

  return output
}

export async function runFHFAETL(): Promise<{ success: boolean; records: number; error?: string }> {
  return withIngestionTracking('fhfa_hpi', async () => {
    await buildGeoLookupCache()

    const [metroRows, stateRows] = await Promise.all([
      processMetroHPI(),
      processStateHPI(),
    ])

    const allRows = [...metroRows, ...stateRows]
    console.log(`[FHFA] ${metroRows.length} metro rows + ${stateRows.length} state rows = ${allRows.length} total`)

    const result = await upsertRecords({
      table: 'monthly_housing_metrics',
      rows: allRows as unknown as Record<string, unknown>[],
      conflictColumns: ['geography_id', 'period_start', 'metric_source'],
      source: 'fhfa_hpi',
    })

    return result
  })
}

// Allow running directly: npx tsx etl/sources/fhfa.ts
if (require.main === module) {
  runFHFAETL()
    .then((r) => {
      console.log('[FHFA] Done:', r)
      process.exit(r.success ? 0 : 1)
    })
    .catch((err) => {
      console.error('[FHFA] Fatal:', err)
      process.exit(1)
    })
}
