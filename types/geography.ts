export type GeoType = 'nation' | 'state' | 'metro' | 'county' | 'zip' | 'tract'

export interface Geography {
  id: string
  geo_type: GeoType
  name: string
  fips_code: string | null
  cbsa_code: string | null
  zip_code: string | null
  state_fips: string | null
  state_abbreviation: string | null
  parent_id: string | null
  population: number | null
  centroid_lat: number | null
  centroid_lng: number | null
  created_at: string
}

export interface GeographyWithScores extends Geography {
  scores: MarketScores | null
  data_freshness: DataFreshness
}

export interface DataFreshness {
  housing: string | null
  migration: string | null
  economic: string | null
  scores_calculated: string | null
}

export interface MarketScores {
  strength: number
  risk: number
  migration: number
  affordability: number
  investor_opportunity: number
  calculated_at: string
  version: string
}

export interface GeographySearchResult {
  id: string
  name: string
  geo_type: GeoType
  state_abbreviation: string | null
  population: number | null
}
