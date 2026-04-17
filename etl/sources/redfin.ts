/**
 * Redfin Data Center CSV downloader + parser
 * Provides: median list price, days on market, active inventory,
 *           new listings, price reductions, months of supply
 *
 * Data Center: https://www.redfin.com/news/data-center/
 * Files are free to download as CSVs. Check terms of service.
 *
 * Fallback: FHFA HPI if Redfin unavailable
 *
 * CSV columns include: period_begin, region, state, property_type,
 *   median_sale_price, median_list_price, homes_sold, days_on_market,
 *   active_listings, months_of_supply, price_drops, etc.
 */

import * as Papa from 'papaparse'

const REDFIN_URLS = {
  metro: 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/redfin_metro_market_tracker.tsv000.gz',
  state: 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/redfin_state_market_tracker.tsv000.gz',
  county: 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/county_market_tracker.tsv000.gz',
  zip: 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz',
}

export interface RedfinRow {
  period_begin: string
  period_end: string
  region_type: string
  region_type_id: string
  table_id: string
  is_seasonally_adjusted: string
  region: string
  city: string
  state: string
  state_code: string
  property_type: string
  median_sale_price: string
  median_list_price: string
  median_ppsf: string
  homes_sold: string
  pending_sales: string
  new_listings: string
  inventory: string
  months_of_supply: string
  median_dom: string
  avg_sale_to_list: string
  sold_above_list: string
  price_drops: string
  off_market_in_two_weeks: string
}

export async function downloadRedfinCSV(geoLevel: 'metro' | 'state' | 'county' | 'zip'): Promise<RedfinRow[]> {
  const url = REDFIN_URLS[geoLevel]
  console.log(`[Redfin] Downloading ${geoLevel} data from ${url}...`)

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

    const text = await res.text()

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        delimiter: '\t',
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as RedfinRow[]),
        error: (err: Error) => reject(err),
      })
    })
  } catch (err) {
    console.error(`[Redfin] Failed to download ${geoLevel} data:`, err)
    throw err
  }
}

export function filterLatestPeriod(rows: RedfinRow[]): RedfinRow[] {
  if (rows.length === 0) return []
  const sortedDates = rows
    .map((r) => r.period_begin)
    .filter(Boolean)
    .sort()
    .reverse()
  const latestPeriod = sortedDates[0]
  return rows.filter((r) => r.period_begin === latestPeriod && r.property_type === 'All Residential')
}

export function parseRedfinRow(row: RedfinRow) {
  const parseNum = (val: string) => {
    const n = parseFloat(val)
    return isNaN(n) ? null : n
  }
  const parseInt2 = (val: string) => {
    const n = parseInt(val)
    return isNaN(n) ? null : n
  }

  return {
    period_month: row.period_begin,
    median_list_price: parseNum(row.median_list_price),
    median_sale_price: parseNum(row.median_sale_price),
    price_per_sqft: parseNum(row.median_ppsf),
    days_on_market: parseNum(row.median_dom),
    active_inventory: parseInt2(row.inventory),
    new_listings: parseInt2(row.new_listings),
    pending_sales: parseInt2(row.pending_sales),
    months_of_supply: parseNum(row.months_of_supply),
    sale_to_list_ratio: parseNum(row.avg_sale_to_list),
    price_reductions_pct: parseNum(row.price_drops),
  }
}

export async function runRedfinETL() {
  console.log('[Redfin ETL] Starting...')
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = createServiceClient()
  let processedCount = 0

  try {
    // Process state data
    const stateRows = await downloadRedfinCSV('state')
    const latestStateRows = filterLatestPeriod(stateRows)
    console.log(`[Redfin] Processing ${latestStateRows.length} state rows for period ${latestStateRows[0]?.period_begin}...`)

    for (const row of latestStateRows) {
      const stateCode = row.state_code?.trim()
      if (!stateCode) continue

      const { data: geo } = await supabase
        .from('geographies')
        .select('id')
        .eq('geo_type', 'state')
        .eq('state_abbreviation', stateCode)
        .single()

      if (geo) {
        const parsed = parseRedfinRow(row)
        await supabase.from('monthly_housing_metrics').upsert({
          geography_id: geo.id,
          ...parsed,
          data_source: 'redfin',
        }, { onConflict: 'geography_id,period_month,data_source' })
        processedCount++
      }
    }

    // Process metro data
    const metroRows = await downloadRedfinCSV('metro')
    const latestMetroRows = filterLatestPeriod(metroRows)
    console.log(`[Redfin] Processing ${latestMetroRows.length} metro rows...`)

    for (const row of latestMetroRows) {
      if (!row.region) continue

      // Redfin uses region names, need to match to CBSA
      // This requires a lookup table. For now, try name matching
      const { data: geo } = await supabase
        .from('geographies')
        .select('id')
        .eq('geo_type', 'metro')
        .ilike('name', `%${row.region}%`)
        .limit(1)
        .single()

      if (geo) {
        const parsed = parseRedfinRow(row)
        await supabase.from('monthly_housing_metrics').upsert({
          geography_id: geo.id,
          ...parsed,
          data_source: 'redfin',
        }, { onConflict: 'geography_id,period_month,data_source' })
        processedCount++
      }
    }

    await supabase.from('data_source_registry').update({
      last_successful_run: new Date().toISOString(),
      last_run_at: new Date().toISOString(),
    }).eq('source_id', 'redfin')

    console.log(`[Redfin ETL] Completed. ${processedCount} records processed.`)
    return { success: true, records: processedCount }
  } catch (err) {
    console.error('[Redfin ETL] Failed:', err)
    return { success: false, error: String(err) }
  }
}
