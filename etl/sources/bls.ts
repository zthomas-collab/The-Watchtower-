/**
 * BLS LAUS (Local Area Unemployment Statistics) fetcher
 * Provides: unemployment rate, labor force, employment
 * Geographies: nation, state, metro, county
 *
 * Free API key: https://www.bls.gov/developers/api_signature_v2.htm
 * Rate limits: 500 series/day (no key), 2,500/day (with key)
 * Batch: up to 50 series per request
 *
 * LAUS Series ID format: LAU[state_fips][county_fips]0000000003
 *   03 = unemployment rate
 *   04 = unemployment level
 *   05 = employment level
 *   06 = labor force
 */

const BLS_BASE = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'
const BLS_API_KEY = process.env.BLS_API_KEY

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface BLSDataPoint {
  year: string
  period: string
  value: string
  footnotes: { code: string; text: string }[]
}

interface BLSSeries {
  seriesID: string
  data: BLSDataPoint[]
}

export async function fetchBLSSeries(seriesIds: string[], startYear: number, endYear: number): Promise<BLSSeries[]> {
  const payload = {
    seriesid: seriesIds,
    startyear: String(startYear),
    endyear: String(endYear),
    ...(BLS_API_KEY ? { registrationkey: BLS_API_KEY } : {}),
  }

  const res = await fetch(BLS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`BLS API error: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS API failed: ${json.message?.join(', ')}`)

  return json.Results?.series || []
}

function stateUnemploymentSeriesId(stateFips: string): string {
  return `LAUST${stateFips.padStart(2, '0')}0000000000003`
}

function metroUnemploymentSeriesId(cbsaCode: string): string {
  return `LAUMT${cbsaCode.padStart(5, '0')}0000000003`
}

function countyUnemploymentSeriesId(stateFips: string, countyFips: string): string {
  const fullFips = (stateFips + countyFips).padStart(5, '0')
  return `LAUCN${fullFips}0000000003`
}

export async function fetchAllStateUnemployment(stateFipsCodes: string[]) {
  console.log(`[BLS] Fetching unemployment for ${stateFipsCodes.length} states...`)
  const BATCH_SIZE = 50
  const currentYear = new Date().getFullYear()
  const results: { stateFips: string; year: number; unemployment_rate: number }[] = []

  for (let i = 0; i < stateFipsCodes.length; i += BATCH_SIZE) {
    const batch = stateFipsCodes.slice(i, i + BATCH_SIZE)
    const seriesIds = batch.map(stateUnemploymentSeriesId)

    try {
      const series = await fetchBLSSeries(seriesIds, currentYear - 2, currentYear)
      for (const s of series) {
        const stateFips = s.seriesID.slice(5, 7)
        for (const point of s.data) {
          if (point.period === 'M13' || point.period === 'A01') { // Annual
            results.push({
              stateFips,
              year: parseInt(point.year),
              unemployment_rate: parseFloat(point.value),
            })
          }
        }
      }
    } catch (err) {
      console.error(`[BLS] Batch ${i} failed:`, err)
    }

    if (i + BATCH_SIZE < stateFipsCodes.length) {
      await sleep(500) // Respect rate limits
    }
  }

  return results
}

export async function fetchMetroUnemployment(cbsaCodes: string[]) {
  console.log(`[BLS] Fetching unemployment for ${cbsaCodes.length} metros...`)
  const BATCH_SIZE = 50
  const currentYear = new Date().getFullYear()
  const results: { cbsaCode: string; year: number; unemployment_rate: number }[] = []

  for (let i = 0; i < cbsaCodes.length; i += BATCH_SIZE) {
    const batch = cbsaCodes.slice(i, i + BATCH_SIZE)
    const seriesIds = batch.map(metroUnemploymentSeriesId)

    try {
      const series = await fetchBLSSeries(seriesIds, currentYear - 2, currentYear)
      for (const s of series) {
        const cbsaCode = s.seriesID.slice(5, 10)
        const latestAnnual = s.data.find((d) => d.period === 'M13' || d.period === 'A01')
        if (latestAnnual) {
          results.push({
            cbsaCode,
            year: parseInt(latestAnnual.year),
            unemployment_rate: parseFloat(latestAnnual.value),
          })
        }
      }
    } catch (err) {
      console.error(`[BLS] Metro batch ${i} failed:`, err)
    }

    if (i + BATCH_SIZE < cbsaCodes.length) await sleep(500)
  }

  return results
}

export async function runBLSETL() {
  console.log('[BLS ETL] Starting...')
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = createServiceClient()

  try {
    // Get all state FIPS codes from DB
    const { data: states } = await supabase
      .from('geographies')
      .select('id, fips_code')
      .eq('geo_type', 'state')
      .not('fips_code', 'is', null)

    if (states) {
      const stateFipsCodes = states.map((s) => s.fips_code as string)
      const unemploymentData = await fetchAllStateUnemployment(stateFipsCodes)

      for (const record of unemploymentData) {
        const geo = states.find((s) => s.fips_code === record.stateFips)
        if (geo) {
          await supabase.from('annual_economic_metrics').upsert({
            geography_id: geo.id,
            period_year: record.year,
            unemployment_rate: record.unemployment_rate,
            data_source: 'bls_laus',
          }, { onConflict: 'geography_id,period_year,data_source' })
        }
      }
    }

    // Get all metro CBSA codes
    const { data: metros } = await supabase
      .from('geographies')
      .select('id, cbsa_code')
      .eq('geo_type', 'metro')
      .not('cbsa_code', 'is', null)

    if (metros) {
      const cbsaCodes = metros.map((m) => m.cbsa_code as string)
      const metroUnemployment = await fetchMetroUnemployment(cbsaCodes)

      for (const record of metroUnemployment) {
        const geo = metros.find((m) => m.cbsa_code === record.cbsaCode)
        if (geo) {
          await supabase.from('annual_economic_metrics').upsert({
            geography_id: geo.id,
            period_year: record.year,
            unemployment_rate: record.unemployment_rate,
            data_source: 'bls_laus',
          }, { onConflict: 'geography_id,period_year,data_source' })
        }
      }
    }

    await supabase.from('data_source_registry').update({
      last_successful_run: new Date().toISOString(),
      last_run_at: new Date().toISOString(),
    }).eq('source_id', 'bls_laus')

    console.log('[BLS ETL] Completed.')
    return { success: true }
  } catch (err) {
    console.error('[BLS ETL] Failed:', err)
    return { success: false, error: String(err) }
  }
}
