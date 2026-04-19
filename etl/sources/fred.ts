/**
 * FRED (St. Louis Fed) API fetcher
 * Provides: mortgage rates, housing starts, vacancy rates
 * Primarily national/state level
 *
 * Free API key: https://fred.stlouisfed.org/docs/api/api_key.html
 * Rate limits: 120 req/10min
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */

const FRED_BASE = 'https://api.fredapi.com/api/v1'
const FRED_API_KEY = process.env.FRED_API_KEY

interface FREDObservation {
  date: string
  value: string
}

async function fetchFREDSeries(seriesId: string, params: Record<string, string> = {}): Promise<FREDObservation[]> {
  const queryParams = new URLSearchParams({
    series_id: seriesId,
    api_key: FRED_API_KEY || '',
    file_type: 'json',
    sort_order: 'desc',
    limit: '24',
    ...params,
  })

  const url = `${FRED_BASE}/series/observations?${queryParams}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`)
  const json = await res.json()
  return json.observations || []
}

export const FRED_SERIES = {
  MORTGAGE_30YR: 'MORTGAGE30US',         // 30-year fixed mortgage rate (weekly)
  HOUSING_STARTS: 'HOUST',               // Housing starts (monthly, national)
  BUILDING_PERMITS: 'PERMIT',            // Building permits (monthly, national)
  HOME_PRICE_INDEX: 'CSUSHPINSA',        // Case-Shiller national HPI
  VACANCY_RATE_RENTAL: 'RRVRUSQ156N',    // Rental vacancy rate (quarterly)
  VACANCY_RATE_HOMEOWNER: 'HPVAC',       // Homeowner vacancy rate (quarterly)
  MEDIAN_HOME_PRICE: 'MSPUS',            // Median sales price (quarterly)
}

export async function fetchMortgageRates() {
  console.log('[FRED] Fetching mortgage rates...')
  try {
    const observations = await fetchFREDSeries(FRED_SERIES.MORTGAGE_30YR)
    return observations
      .filter((o) => o.value !== '.')
      .slice(0, 52) // Last 52 weeks
      .map((o) => ({
        date: o.date,
        rate: parseFloat(o.value),
      }))
  } catch (err) {
    console.error('[FRED] Mortgage rates fetch failed:', err)
    return []
  }
}

export async function fetchHousingStarts() {
  console.log('[FRED] Fetching housing starts...')
  try {
    const observations = await fetchFREDSeries(FRED_SERIES.HOUSING_STARTS, {
      frequency: 'm',
      units: 'lin',
    })
    return observations
      .filter((o) => o.value !== '.')
      .slice(0, 24)
      .map((o) => ({
        month: o.date,
        housing_starts_thousands: parseFloat(o.value),
      }))
  } catch (err) {
    console.error('[FRED] Housing starts fetch failed:', err)
    return []
  }
}

export async function fetchNationalHPI() {
  console.log('[FRED] Fetching national HPI...')
  try {
    const observations = await fetchFREDSeries(FRED_SERIES.HOME_PRICE_INDEX, {
      frequency: 'm',
    })
    return observations
      .filter((o) => o.value !== '.')
      .slice(0, 24)
      .map((o) => ({
        month: o.date,
        hpi: parseFloat(o.value),
      }))
  } catch (err) {
    console.error('[FRED] HPI fetch failed:', err)
    return []
  }
}
