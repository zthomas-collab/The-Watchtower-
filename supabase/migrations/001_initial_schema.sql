-- ============================================================
-- THE WATCHTOWER — Initial Database Schema
-- Migration 001: Core tables, indexes, RLS policies
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE geo_type AS ENUM ('nation', 'state', 'metro', 'county', 'zip', 'tract');
CREATE TYPE migration_momentum AS ENUM ('accelerating', 'stable', 'decelerating', 'reversing');
CREATE TYPE ingestion_status AS ENUM ('running', 'completed', 'failed', 'partial');
CREATE TYPE alert_condition AS ENUM ('gt', 'lt', 'gte', 'lte', 'change_gt', 'change_lt');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'api');

-- ============================================================
-- CORE GEOGRAPHY TABLE
-- ============================================================

CREATE TABLE geographies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geo_type        geo_type NOT NULL,
  name            TEXT NOT NULL,
  -- FIPS codes
  fips_code       TEXT,         -- state: '06', county: '06037'
  cbsa_code       TEXT,         -- metro CBSA code: '31080'
  zip_code        TEXT,         -- ZIP: '90210'
  state_fips      TEXT,         -- 2-char state FIPS for all levels
  state_abbreviation TEXT,      -- 'CA', 'TX', etc.
  -- Hierarchy
  parent_id       UUID REFERENCES geographies(id),
  -- Spatial
  centroid_lat    NUMERIC(10, 7),
  centroid_lng    NUMERIC(10, 7),
  -- Population (latest known)
  population      BIGINT,
  -- Metadata
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraints
CREATE UNIQUE INDEX geographies_fips_unique ON geographies(fips_code) WHERE fips_code IS NOT NULL AND geo_type IN ('state', 'county');
CREATE UNIQUE INDEX geographies_cbsa_unique ON geographies(cbsa_code) WHERE cbsa_code IS NOT NULL AND geo_type = 'metro';
CREATE UNIQUE INDEX geographies_zip_unique ON geographies(zip_code) WHERE zip_code IS NOT NULL AND geo_type = 'zip';
CREATE UNIQUE INDEX geographies_nation ON geographies(geo_type) WHERE geo_type = 'nation';

-- Query indexes
CREATE INDEX geographies_geo_type ON geographies(geo_type);
CREATE INDEX geographies_state_fips ON geographies(state_fips);
CREATE INDEX geographies_parent_id ON geographies(parent_id);
CREATE INDEX geographies_name_search ON geographies USING gin(to_tsvector('english', name));

-- ============================================================
-- MONTHLY HOUSING METRICS
-- ============================================================

CREATE TABLE monthly_housing_metrics (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geography_id                UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  period_month                DATE NOT NULL,            -- first day of month: '2024-11-01'
  -- Prices
  median_list_price           NUMERIC(12, 2),
  median_sale_price           NUMERIC(12, 2),
  price_per_sqft              NUMERIC(8, 2),
  median_list_price_yoy_pct   NUMERIC(6, 3),           -- % change vs same month last year
  -- Market activity
  days_on_market              NUMERIC(6, 1),
  active_inventory            INTEGER,
  new_listings                INTEGER,
  pending_sales               INTEGER,
  closed_sales                INTEGER,
  -- Market health
  price_reductions_pct        NUMERIC(5, 2),           -- % of listings with reductions
  months_of_supply            NUMERIC(5, 2),
  sale_to_list_ratio          NUMERIC(6, 4),           -- 1.0 = full list price
  -- YoY changes
  inventory_change_yoy_pct    NUMERIC(6, 3),
  new_listings_yoy_pct        NUMERIC(6, 3),
  dom_change_yoy              NUMERIC(6, 1),
  -- Metadata
  data_source                 TEXT NOT NULL DEFAULT 'redfin',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geography_id, period_month, data_source)
);

CREATE INDEX monthly_housing_metrics_geo_period ON monthly_housing_metrics(geography_id, period_month DESC);
CREATE INDEX monthly_housing_metrics_period ON monthly_housing_metrics(period_month DESC);

-- ============================================================
-- ANNUAL MIGRATION METRICS
-- ============================================================

CREATE TABLE annual_migration_metrics (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geography_id          UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  period_year           INTEGER NOT NULL,              -- 2022
  -- Counts
  net_migration         INTEGER,                       -- positive = net inflow
  in_migration          INTEGER,
  out_migration         INTEGER,
  -- Rates (per 1,000 residents)
  net_migration_rate    NUMERIC(8, 3),
  in_migration_rate     NUMERIC(8, 3),
  out_migration_rate    NUMERIC(8, 3),
  -- Trend analysis
  migration_momentum    migration_momentum,
  migration_momentum_3yr NUMERIC(8, 3),               -- 3-yr average rate for trend
  -- Metadata
  data_source           TEXT NOT NULL DEFAULT 'census_acs',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geography_id, period_year, data_source)
);

CREATE INDEX annual_migration_metrics_geo_year ON annual_migration_metrics(geography_id, period_year DESC);

-- ============================================================
-- ANNUAL ECONOMIC METRICS
-- ============================================================

CREATE TABLE annual_economic_metrics (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geography_id                UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  period_year                 INTEGER NOT NULL,
  -- Employment
  unemployment_rate           NUMERIC(5, 2),           -- 3.8
  unemployment_change_yoy     NUMERIC(5, 2),           -- -0.3
  labor_force                 INTEGER,
  labor_force_participation   NUMERIC(5, 2),
  -- Jobs
  total_jobs                  INTEGER,
  job_growth_abs              INTEGER,
  job_growth_pct              NUMERIC(6, 3),
  -- GDP
  gdp_value                   NUMERIC(16, 2),          -- thousands of dollars
  gdp_growth_pct              NUMERIC(6, 3),
  -- Income
  median_household_income     NUMERIC(10, 2),
  mean_household_income       NUMERIC(10, 2),
  per_capita_income           NUMERIC(10, 2),
  income_growth_pct           NUMERIC(6, 3),
  -- Metadata
  data_source                 TEXT NOT NULL DEFAULT 'bls_bea_census',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geography_id, period_year, data_source)
);

CREATE INDEX annual_economic_metrics_geo_year ON annual_economic_metrics(geography_id, period_year DESC);

-- ============================================================
-- ANNUAL DEMOGRAPHIC METRICS
-- ============================================================

CREATE TABLE annual_demographic_metrics (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geography_id          UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  period_year           INTEGER NOT NULL,
  population            BIGINT,
  population_growth_abs INTEGER,
  population_growth_pct NUMERIC(6, 3),
  median_age            NUMERIC(4, 1),
  data_source           TEXT NOT NULL DEFAULT 'census_pep',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geography_id, period_year, data_source)
);

CREATE INDEX annual_demographic_metrics_geo_year ON annual_demographic_metrics(geography_id, period_year DESC);

-- ============================================================
-- MONTHLY RENT METRICS
-- ============================================================

CREATE TABLE monthly_rent_metrics (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geography_id          UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  period_month          DATE NOT NULL,
  median_rent_studio    NUMERIC(8, 2),
  median_rent_1br       NUMERIC(8, 2),
  median_rent_2br       NUMERIC(8, 2),
  median_rent_3br       NUMERIC(8, 2),
  median_rent_overall   NUMERIC(8, 2),
  rent_index            NUMERIC(10, 4),               -- Zillow ZORI index value
  rent_growth_yoy_pct   NUMERIC(6, 3),
  rent_to_income_ratio  NUMERIC(5, 3),                -- monthly rent * 12 / annual income
  data_source           TEXT NOT NULL DEFAULT 'zillow_zori',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geography_id, period_month, data_source)
);

CREATE INDEX monthly_rent_metrics_geo_period ON monthly_rent_metrics(geography_id, period_month DESC);

-- ============================================================
-- SCORE OUTPUTS
-- ============================================================

CREATE TABLE score_outputs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  geography_id        UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Five scores (0-100)
  strength_score      NUMERIC(5, 2),
  risk_score          NUMERIC(5, 2),
  migration_score     NUMERIC(5, 2),
  affordability_score NUMERIC(5, 2),
  investor_score      NUMERIC(5, 2),
  -- Versioning
  score_version       TEXT NOT NULL DEFAULT '1.0',
  -- Full factor breakdown for transparency
  factor_breakdown    JSONB,
  -- Derived affordability metrics stored with score
  price_to_income_ratio NUMERIC(6, 3),
  rent_to_income_ratio  NUMERIC(5, 3),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX score_outputs_geography_id ON score_outputs(geography_id, calculated_at DESC);
CREATE INDEX score_outputs_strength ON score_outputs(strength_score DESC) WHERE score_version = '1.0';
CREATE INDEX score_outputs_investor ON score_outputs(investor_score DESC) WHERE score_version = '1.0';
CREATE INDEX score_outputs_migration ON score_outputs(migration_score DESC) WHERE score_version = '1.0';

-- ============================================================
-- USER TABLES
-- ============================================================

CREATE TABLE user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  full_name         TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Watchlist',
  description   TEXT,
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlist_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  watchlist_id  UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  geography_id  UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  notes         TEXT,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(watchlist_id, geography_id)
);

CREATE TABLE alerts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  geography_id      UUID NOT NULL REFERENCES geographies(id) ON DELETE CASCADE,
  metric_key        TEXT NOT NULL,
  condition         alert_condition NOT NULL,
  threshold_value   NUMERIC(12, 4) NOT NULL,
  notify_email      BOOLEAN DEFAULT TRUE,
  is_active         BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_screens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  filter_config   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ETL METADATA TABLES
-- ============================================================

CREATE TABLE data_source_registry (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id         TEXT UNIQUE NOT NULL,              -- 'census_acs', 'bls_laus', etc.
  source_name       TEXT NOT NULL,
  source_type       TEXT NOT NULL,                     -- 'api', 'download', 'derived'
  base_url          TEXT,
  update_frequency  TEXT,
  last_successful_run TIMESTAMPTZ,
  last_run_at       TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingestion_runs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id         TEXT NOT NULL REFERENCES data_source_registry(source_id),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  status            ingestion_status DEFAULT 'running',
  records_fetched   INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  records_failed    INTEGER DEFAULT 0,
  geographies_updated INTEGER DEFAULT 0,
  error_log         TEXT,
  run_metadata      JSONB DEFAULT '{}',
  triggered_by      TEXT DEFAULT 'scheduled'          -- 'scheduled', 'manual', 'api'
);

CREATE INDEX ingestion_runs_source_id ON ingestion_runs(source_id, started_at DESC);
CREATE INDEX ingestion_runs_status ON ingestion_runs(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Geographies: public read
ALTER TABLE geographies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geographies_public_read" ON geographies FOR SELECT USING (true);

-- Metrics: public read
ALTER TABLE monthly_housing_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "housing_public_read" ON monthly_housing_metrics FOR SELECT USING (true);

ALTER TABLE annual_migration_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "migration_public_read" ON annual_migration_metrics FOR SELECT USING (true);

ALTER TABLE annual_economic_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "economic_public_read" ON annual_economic_metrics FOR SELECT USING (true);

ALTER TABLE annual_demographic_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demographic_public_read" ON annual_demographic_metrics FOR SELECT USING (true);

ALTER TABLE monthly_rent_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rent_public_read" ON monthly_rent_metrics FOR SELECT USING (true);

ALTER TABLE score_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_public_read" ON score_outputs FOR SELECT USING (true);

-- User data: private
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON user_profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlists_own" ON watchlists FOR ALL USING (auth.uid() = user_id);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_items_own" ON watchlist_items
  FOR ALL USING (
    watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
  );

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_own" ON alerts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE saved_screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screens_own" ON saved_screens FOR ALL USING (auth.uid() = user_id);

-- ETL tables: service role only (enforced by env, not RLS)
ALTER TABLE data_source_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "data_source_service_only" ON data_source_registry FOR ALL USING (false);
CREATE POLICY "data_source_public_read" ON data_source_registry FOR SELECT USING (is_active = true);

ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingestion_runs_service_only" ON ingestion_runs FOR ALL USING (false);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER geographies_updated_at BEFORE UPDATE ON geographies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER watchlists_updated_at BEFORE UPDATE ON watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: National geography record
-- ============================================================

INSERT INTO geographies (geo_type, name, fips_code, state_fips, population)
VALUES ('nation', 'United States', '00', null, 334914895);

-- ============================================================
-- SEED: Data source registry
-- ============================================================

INSERT INTO data_source_registry (source_id, source_name, source_type, base_url, update_frequency, is_active)
VALUES
  ('census_acs', 'U.S. Census Bureau — ACS', 'api', 'https://api.census.gov', 'annual', true),
  ('census_pep', 'U.S. Census Bureau — PEP', 'api', 'https://api.census.gov', 'annual', true),
  ('bls_laus', 'BLS Local Area Unemployment Statistics', 'api', 'https://api.bls.gov', 'monthly', true),
  ('bls_qcew', 'BLS Quarterly Census of Employment & Wages', 'download', 'https://www.bls.gov/cew', 'quarterly', true),
  ('bea_regional', 'BEA Regional Economic Accounts', 'api', 'https://apps.bea.gov/api', 'annual', true),
  ('redfin', 'Redfin Data Center', 'download', 'https://www.redfin.com/news/data-center/', 'monthly', true),
  ('fhfa_hpi', 'FHFA House Price Index', 'download', 'https://www.fhfa.gov/data/hpi', 'quarterly', true),
  ('hud_fmr', 'HUD Fair Market Rents', 'download', 'https://www.huduser.gov/portal/datasets/fmr.html', 'annual', true),
  ('zillow_zori', 'Zillow Observed Rent Index', 'download', 'https://www.zillow.com/research/data/', 'monthly', true),
  ('census_permits', 'Census Building Permits Survey', 'api', 'https://www.census.gov/construction/bps/', 'monthly', true),
  ('fred', 'FRED — St. Louis Fed', 'api', 'https://fred.stlouisfed.org/docs/api', 'monthly', true);
