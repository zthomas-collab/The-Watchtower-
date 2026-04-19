/**
 * Census ACS + Population Estimates API fetcher
 * Fetches: population, net migration, median income
 * Geographies: nation, state, county, metro (CBSA)
 *
 * Free API key at: https://api.census.gov/data/key_signup.html
 * Docs: https://www.census.gov/data/developers/data-sets/acs-5year.html
 */

import { createServiceClient } from '@/lib/supabase/server'

const CENSUS_BASE = 'https://api.census.gov/data'
const API_KEY = process.env.CENSUS_API_KEY

interface CensusRow {
  state?: string
  county?: string
  'metropolitan statistical area/micropolitan statistical area'?: string
  B01003_001E?: string  // Total population
  B07001_001E?: string  // Population 1 year and over
  B07401_001E?: string  // Population that moved in from another state
  B19013_001E?: string  // Median household income
}

async function fetchCensus(url: string): Promise<string[][]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Census API error: ${res.status} ${res.statusText}`)
  return res.json()
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchStatePopulation() {
  console.log('[Census] Fetching state population + income...')
  const url = `${CENSUS_BASE}/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E&for=state:*&key=${API_KEY}`
  try {
    const data = await fetchCensus(url)
    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => ({
      name: row[headers.indexOf('NAME')],
      population: parseInt(row[headers.indexOf('B01003_001E')]) || null,
      median_household_income: parseInt(row[headers.indexOf('B19013_001E')]) || null,
      state_fips: row[headers.indexOf('state')],
    }))
  } catch (err) {
    console.error('[Census] State population fetch failed:', err)
    return []
  }
}

export async function fetchCountyPopulation(stateFips?: string) {
  console.log(`[Census] Fetching county population${stateFips ? ` for state ${stateFips}` : ''}...`)
  const forParam = stateFips ? `county:*&in=state:${stateFips}` : 'county:*&in=state:*'
  const url = `${CENSUS_BASE}/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E&for=${forParam}&key=${API_KEY}`

  try {
    const data = await fetchCensus(url)
    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => ({
      name: row[headers.indexOf('NAME')],
      population: parseInt(row[headers.indexOf('B01003_001E')]) || null,
      median_household_income: parseInt(row[headers.indexOf('B19013_001E')]) || null,
      state_fips: row[headers.indexOf('state')],
      county_fips: row[headers.indexOf('state')] + row[headers.indexOf('county')],
    }))
  } catch (err) {
    console.error('[Census] County population fetch failed:', err)
    return []
  }
}

export async function fetchStateMigration() {
  console.log('[Census] Fetching state migration data (ACS B07001)...')
  // B07001_001E = Population 1 yr and over (denominator)
  // B07401_001E = Moved from different state
  // B07801_001E = Moved abroad / immigration approximation
  const url = `${CENSUS_BASE}/2022/acs/acs5?get=NAME,B07001_001E,B07401_001E&for=state:*&key=${API_KEY}`

  try {
    const data = await fetchCensus(url)
    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => ({
      name: row[headers.indexOf('NAME')],
      population_1yr: parseInt(row[headers.indexOf('B07001_001E')]) || null,
      in_migration_from_other_state: parseInt(row[headers.indexOf('B07401_001E')]) || null,
      state_fips: row[headers.indexOf('state')],
      period_year: 2022,
    }))
  } catch (err) {
    console.error('[Census] Migration fetch failed:', err)
    return []
  }
}

export async function fetchCountyMigration() {
  console.log('[Census] Fetching county migration data...')
  const url = `${CENSUS_BASE}/2022/acs/acs5?get=NAME,B07001_001E,B07401_001E&for=county:*&key=${API_KEY}`

  try {
    const data = await fetchCensus(url)
    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row) => ({
      name: row[headers.indexOf('NAME')],
      population_1yr: parseInt(row[headers.indexOf('B07001_001E')]) || null,
      in_migration_from_other_county: parseInt(row[headers.indexOf('B07401_001E')]) || null,
      state_fips: row[headers.indexOf('state')],
      county_fips: row[headers.indexOf('state')] + row[headers.indexOf('county')],
      period_year: 2022,
    }))
  } catch (err) {
    console.error('[Census] County migration fetch failed:', err)
    return []
  }
}

export async function runCensusETL() {
  console.log('[Census ETL] Starting...')
  const supabase = createServiceClient()

  await supabase.from('ingestion_runs').insert({
    source_id: 'census_acs',
    started_at: new Date().toISOString(),
    status: 'running',
    triggered_by: 'scheduled',
  })

  try {
    const [statePopData, stateMigData] = await Promise.all([
      fetchStatePopulation(),
      fetchStateMigration(),
    ])

    await sleep(1000) // Rate limit respect

    const countyPopData = await fetchCountyPopulation()

    await sleep(1000)

    const countyMigData = await fetchCountyMigration()

    console.log(`[Census ETL] Fetched: ${statePopData.length} states, ${countyPopData.length} counties`)

    // Upsert demographic data
    let processedCount = 0

    for (const state of statePopData) {
      const { data: geo } = await supabase
        .from('geographies')
        .select('id')
        .eq('geo_type', 'state')
        .eq('fips_code', state.state_fips)
        .single()

      if (geo) {
        await supabase.from('annual_demographic_metrics').upsert({
          geography_id: geo.id,
          period_year: 2022,
          population: state.population,
          data_source: 'census_acs',
        }, { onConflict: 'geography_id,period_year,data_source' })

        if (state.median_household_income) {
          await supabase.from('annual_economic_metrics').upsert({
            geography_id: geo.id,
            period_year: 2022,
            median_household_income: state.median_household_income,
            data_source: 'census_acs',
          }, { onConflict: 'geography_id,period_year,data_source' })
        }
        processedCount++
      }
    }

    // Upsert county data
    for (const county of countyPopData) {
      const { data: geo } = await supabase
        .from('geographies')
        .select('id')
        .eq('geo_type', 'county')
        .eq('fips_code', county.county_fips)
        .single()

      if (geo) {
        await supabase.from('annual_demographic_metrics').upsert({
          geography_id: geo.id,
          period_year: 2022,
          population: county.population,
          data_source: 'census_acs',
        }, { onConflict: 'geography_id,period_year,data_source' })
        processedCount++
      }
    }

    await supabase.from('data_source_registry').update({
      last_successful_run: new Date().toISOString(),
      last_run_at: new Date().toISOString(),
    }).eq('source_id', 'census_acs')

    console.log(`[Census ETL] Completed. ${processedCount} records processed.`)
    return { success: true, records: processedCount }
  } catch (err) {
    console.error('[Census ETL] Failed:', err)
    return { success: false, error: String(err) }
  }
}
