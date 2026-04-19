export interface HousingMetrics {
  id: string
  geography_id: string
  period_month: string
  median_list_price: number | null
  median_sale_price: number | null
  price_per_sqft: number | null
  days_on_market: number | null
  active_inventory: number | null
  new_listings: number | null
  price_reductions_pct: number | null
  months_of_supply: number | null
  inventory_change_yoy_pct: number | null
  new_listings_yoy_pct: number | null
  sale_to_list_ratio: number | null
  median_list_price_yoy_pct: number | null
  data_source: string
  created_at: string
}

export interface MigrationMetrics {
  id: string
  geography_id: string
  period_year: number
  net_migration: number | null
  in_migration: number | null
  out_migration: number | null
  net_migration_rate: number | null
  in_migration_rate: number | null
  out_migration_rate: number | null
  migration_momentum: 'accelerating' | 'stable' | 'decelerating' | 'reversing' | null
  data_source: string
  created_at: string
}

export interface EconomicMetrics {
  id: string
  geography_id: string
  period_year: number
  unemployment_rate: number | null
  unemployment_change_yoy: number | null
  job_growth_pct: number | null
  job_growth_abs: number | null
  gdp_value: number | null
  gdp_growth_pct: number | null
  median_household_income: number | null
  income_growth_pct: number | null
  labor_force_participation: number | null
  data_source: string
  created_at: string
}

export interface DemographicMetrics {
  id: string
  geography_id: string
  period_year: number
  population: number | null
  population_growth_pct: number | null
  population_growth_abs: number | null
  data_source: string
  created_at: string
}

export interface RentMetrics {
  id: string
  geography_id: string
  period_month: string
  median_rent_1br: number | null
  median_rent_2br: number | null
  median_rent_overall: number | null
  rent_growth_yoy_pct: number | null
  rent_to_income_ratio: number | null
  data_source: string
  created_at: string
}

export interface AffordabilityMetrics {
  price_to_income_ratio: number | null
  rent_to_income_ratio: number | null
  affordability_index: number | null
  rent_growth_vs_wage_growth: number | null
}

export interface MarketMetricsSummary {
  geography_id: string
  housing: HousingMetrics | null
  migration: MigrationMetrics | null
  economic: EconomicMetrics | null
  demographic: DemographicMetrics | null
  rent: RentMetrics | null
  affordability: AffordabilityMetrics
}

export type MetricKey =
  | 'median_list_price'
  | 'days_on_market'
  | 'active_inventory'
  | 'price_reductions_pct'
  | 'months_of_supply'
  | 'net_migration_rate'
  | 'unemployment_rate'
  | 'job_growth_pct'
  | 'gdp_growth_pct'
  | 'median_household_income'
  | 'population_growth_pct'
  | 'rent_growth_yoy_pct'
  | 'price_to_income_ratio'
  | 'affordability_index'

export interface MetricTrendPoint {
  period: string
  value: number
}

export interface MetricTrend {
  metric: MetricKey
  geography_id: string
  data_points: MetricTrendPoint[]
}
