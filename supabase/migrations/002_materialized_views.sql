-- ============================================================
-- THE WATCHTOWER — Materialized Views
-- Migration 002: Pre-computed views for fast ranking queries
-- ============================================================

-- ============================================================
-- MARKET SUMMARY — combines latest housing + economic + migration
-- + scores into one flat row per geography
-- Used for: rankings page, map layers, leaderboards
-- Refresh: after each ETL run (REFRESH MATERIALIZED VIEW market_summary_mv)
-- ============================================================

CREATE MATERIALIZED VIEW market_summary_mv AS
WITH latest_housing AS (
  SELECT DISTINCT ON (geography_id)
    geography_id,
    period_month,
    median_list_price,
    days_on_market,
    active_inventory,
    new_listings,
    price_reductions_pct,
    months_of_supply,
    inventory_change_yoy_pct,
    median_list_price_yoy_pct,
    sale_to_list_ratio,
    data_source AS housing_source
  FROM monthly_housing_metrics
  ORDER BY geography_id, period_month DESC
),
latest_economic AS (
  SELECT DISTINCT ON (geography_id)
    geography_id,
    period_year AS economic_year,
    unemployment_rate,
    unemployment_change_yoy,
    job_growth_pct,
    gdp_growth_pct,
    median_household_income,
    income_growth_pct,
    data_source AS economic_source
  FROM annual_economic_metrics
  ORDER BY geography_id, period_year DESC
),
latest_migration AS (
  SELECT DISTINCT ON (geography_id)
    geography_id,
    period_year AS migration_year,
    net_migration,
    net_migration_rate,
    in_migration,
    out_migration,
    migration_momentum,
    data_source AS migration_source
  FROM annual_migration_metrics
  ORDER BY geography_id, period_year DESC
),
latest_demographic AS (
  SELECT DISTINCT ON (geography_id)
    geography_id,
    period_year AS demographic_year,
    population,
    population_growth_pct,
    population_growth_abs
  FROM annual_demographic_metrics
  ORDER BY geography_id, period_year DESC
),
latest_rent AS (
  SELECT DISTINCT ON (geography_id)
    geography_id,
    period_month AS rent_period,
    median_rent_2br,
    median_rent_overall,
    rent_growth_yoy_pct,
    rent_to_income_ratio
  FROM monthly_rent_metrics
  ORDER BY geography_id, period_month DESC
),
latest_scores AS (
  SELECT DISTINCT ON (geography_id)
    geography_id,
    calculated_at AS scores_calculated_at,
    strength_score,
    risk_score,
    migration_score,
    affordability_score,
    investor_score,
    price_to_income_ratio,
    score_version
  FROM score_outputs
  ORDER BY geography_id, calculated_at DESC
)
SELECT
  g.id,
  g.geo_type,
  g.name,
  g.fips_code,
  g.cbsa_code,
  g.zip_code,
  g.state_fips,
  g.state_abbreviation,
  g.parent_id,
  -- Housing
  h.period_month AS housing_period,
  h.median_list_price,
  h.days_on_market,
  h.active_inventory,
  h.new_listings,
  h.price_reductions_pct,
  h.months_of_supply,
  h.inventory_change_yoy_pct,
  h.median_list_price_yoy_pct,
  h.sale_to_list_ratio,
  -- Economic
  e.economic_year,
  e.unemployment_rate,
  e.unemployment_change_yoy,
  e.job_growth_pct,
  e.gdp_growth_pct,
  e.median_household_income,
  e.income_growth_pct,
  -- Migration
  m.migration_year,
  m.net_migration,
  m.net_migration_rate,
  m.in_migration,
  m.out_migration,
  m.migration_momentum,
  -- Demographics
  COALESCE(d.population, g.population) AS population,
  d.population_growth_pct,
  d.population_growth_abs,
  -- Rent
  r.rent_period,
  r.median_rent_2br,
  r.median_rent_overall,
  r.rent_growth_yoy_pct,
  r.rent_to_income_ratio,
  -- Scores
  s.scores_calculated_at,
  s.strength_score,
  s.risk_score,
  s.migration_score,
  s.affordability_score,
  s.investor_score,
  s.price_to_income_ratio,
  s.score_version
FROM geographies g
LEFT JOIN latest_housing h ON h.geography_id = g.id
LEFT JOIN latest_economic e ON e.geography_id = g.id
LEFT JOIN latest_migration m ON m.geography_id = g.id
LEFT JOIN latest_demographic d ON d.geography_id = g.id
LEFT JOIN latest_rent r ON r.geography_id = g.id
LEFT JOIN latest_scores s ON s.geography_id = g.id
WHERE g.is_active = true;

-- Indexes on the materialized view for fast ranking queries
CREATE UNIQUE INDEX market_summary_mv_id ON market_summary_mv(id);
CREATE INDEX market_summary_mv_geo_type ON market_summary_mv(geo_type);
CREATE INDEX market_summary_mv_strength ON market_summary_mv(strength_score DESC NULLS LAST);
CREATE INDEX market_summary_mv_investor ON market_summary_mv(investor_score DESC NULLS LAST);
CREATE INDEX market_summary_mv_migration ON market_summary_mv(migration_score DESC NULLS LAST);
CREATE INDEX market_summary_mv_risk ON market_summary_mv(risk_score ASC NULLS LAST);
CREATE INDEX market_summary_mv_state ON market_summary_mv(state_fips, geo_type);
CREATE INDEX market_summary_mv_name_search ON market_summary_mv USING gin(to_tsvector('english', name));

-- ============================================================
-- SCORE PERCENTILES VIEW
-- Used by score calculator to get relative rankings
-- ============================================================

CREATE MATERIALIZED VIEW score_percentiles_mv AS
SELECT
  g.geo_type,
  s.geography_id,
  -- Metrics used in scoring
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY d.population_growth_pct NULLS LAST) * 100 AS population_growth_pct_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY m.net_migration_rate NULLS LAST) * 100 AS net_migration_rate_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY e.job_growth_pct NULLS LAST) * 100 AS job_growth_pct_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY e.income_growth_pct NULLS LAST) * 100 AS income_growth_pct_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY e.unemployment_rate NULLS LAST) * 100 AS unemployment_rate_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY h.median_list_price_yoy_pct NULLS LAST) * 100 AS median_list_price_yoy_pct_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY h.days_on_market DESC NULLS LAST) * 100 AS days_on_market_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY h.months_of_supply DESC NULLS LAST) * 100 AS months_of_supply_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY e.unemployment_change_yoy NULLS LAST) * 100 AS unemployment_change_yoy_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY s.price_to_income_ratio NULLS LAST) * 100 AS price_to_income_ratio_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY h.inventory_change_yoy_pct NULLS LAST) * 100 AS inventory_change_yoy_pct_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY h.price_reductions_pct NULLS LAST) * 100 AS price_reductions_pct_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY r.rent_to_income_ratio NULLS LAST) * 100 AS rent_to_income_ratio_pctile,
  PERCENT_RANK() OVER (PARTITION BY g.geo_type ORDER BY r.rent_growth_yoy_pct NULLS LAST) * 100 AS rent_growth_yoy_pct_pctile
FROM score_outputs s
JOIN geographies g ON g.id = s.geography_id
LEFT JOIN (
  SELECT DISTINCT ON (geography_id) * FROM monthly_housing_metrics ORDER BY geography_id, period_month DESC
) h ON h.geography_id = s.geography_id
LEFT JOIN (
  SELECT DISTINCT ON (geography_id) * FROM annual_economic_metrics ORDER BY geography_id, period_year DESC
) e ON e.geography_id = s.geography_id
LEFT JOIN (
  SELECT DISTINCT ON (geography_id) * FROM annual_migration_metrics ORDER BY geography_id, period_year DESC
) m ON m.geography_id = s.geography_id
LEFT JOIN (
  SELECT DISTINCT ON (geography_id) * FROM annual_demographic_metrics ORDER BY geography_id, period_year DESC
) d ON d.geography_id = s.geography_id
LEFT JOIN (
  SELECT DISTINCT ON (geography_id) * FROM monthly_rent_metrics ORDER BY geography_id, period_month DESC
) r ON r.geography_id = s.geography_id
WHERE s.calculated_at = (
  SELECT MAX(calculated_at) FROM score_outputs WHERE geography_id = s.geography_id
);

CREATE UNIQUE INDEX score_percentiles_mv_geo ON score_percentiles_mv(geography_id);

-- ============================================================
-- CONVENIENCE: Refresh function (call after ETL)
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY market_summary_mv;
  REFRESH MATERIALIZED VIEW score_percentiles_mv;
END;
$$ LANGUAGE plpgsql;
