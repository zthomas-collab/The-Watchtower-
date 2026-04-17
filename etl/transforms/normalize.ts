/**
 * Geography normalization — maps external codes (FIPS, CBSA, state abbrev)
 * to internal geography UUIDs in the Supabase geographies table.
 *
 * Used by all ETL sources after fetching raw data.
 */

import { createServiceClient } from '@/lib/supabase/server'

export interface GeographyLookup {
  id: string
  geo_type: string
  name: string
  fips_code: string | null
  cbsa_code: string | null
  state_abbreviation: string | null
}

// In-memory cache per ETL run — avoids repeated DB lookups
const cache = new Map<string, string>()

function cacheKey(type: string, code: string): string {
  return `${type}:${code}`
}

export async function buildGeoLookupCache(): Promise<void> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('geographies')
    .select('id, geo_type, fips_code, cbsa_code, state_abbreviation')

  if (!data) return

  for (const row of data) {
    if (row.fips_code) {
      cache.set(cacheKey('fips', row.fips_code), row.id)
      cache.set(cacheKey(`fips_${row.geo_type}`, row.fips_code), row.id)
    }
    if (row.cbsa_code) {
      cache.set(cacheKey('cbsa', row.cbsa_code), row.id)
    }
    if (row.state_abbreviation) {
      cache.set(cacheKey('abbrev', row.state_abbreviation.toUpperCase()), row.id)
    }
  }

  console.log(`[Normalize] Loaded ${data.length} geographies into lookup cache`)
}

/** Resolve a state FIPS code (e.g. '06') to geography UUID */
export function resolveByStateFips(fips: string): string | null {
  return cache.get(cacheKey('fips_state', fips.padStart(2, '0'))) ?? null
}

/** Resolve a county FIPS code (5-digit, e.g. '06037') to geography UUID */
export function resolveByCountyFips(fips: string): string | null {
  return cache.get(cacheKey('fips_county', fips.padStart(5, '0'))) ?? null
}

/** Resolve a CBSA code (e.g. '31080') to metro geography UUID */
export function resolveByCbsa(cbsa: string): string | null {
  return cache.get(cacheKey('cbsa', cbsa.padStart(5, '0'))) ?? null
}

/** Resolve a state abbreviation (e.g. 'CA') to geography UUID */
export function resolveByStateAbbrev(abbrev: string): string | null {
  return cache.get(cacheKey('abbrev', abbrev.toUpperCase())) ?? null
}

/** Resolve a combined state+county FIPS (e.g. state='06', county='037') */
export function resolveByStateCounty(stateFips: string, countyFips: string): string | null {
  const combined = stateFips.padStart(2, '0') + countyFips.padStart(3, '0')
  return cache.get(cacheKey('fips_county', combined)) ?? null
}

/** Best-effort name match — used when only a market name is available (e.g. Redfin) */
export async function resolveByName(
  name: string,
  geoType: 'metro' | 'state' | 'county'
): Promise<string | null> {
  const supabase = createServiceClient()

  // Try exact match first
  const { data: exact } = await supabase
    .from('geographies')
    .select('id')
    .eq('geo_type', geoType)
    .ilike('name', name)
    .limit(1)
    .single()

  if (exact) return exact.id

  // Try substring match
  const { data: partial } = await supabase
    .from('geographies')
    .select('id, name')
    .eq('geo_type', geoType)
    .ilike('name', `%${name}%`)
    .limit(1)
    .single()

  return partial?.id ?? null
}

/** Normalise a raw FIPS string — strip leading zeros if needed, pad to correct length */
export function normalizeFips(fips: string, type: 'state' | 'county'): string {
  const clean = fips.replace(/\D/g, '')
  return type === 'state' ? clean.padStart(2, '0') : clean.padStart(5, '0')
}

/** Convert Redfin region_type_id to CBSA where possible */
export function redfinRegionToCbsa(regionTypeId: string): string | null {
  // Redfin uses their own numeric IDs; we do a best-effort CBSA lookup
  // This mapping must be maintained as Redfin data evolves
  // For now return null and fall back to name matching
  return null
}
