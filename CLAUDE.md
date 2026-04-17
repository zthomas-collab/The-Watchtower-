# The Watchtower — Project Guide

## What This Is
A national real estate intelligence platform combining housing data, migration flows, economic signals, and risk indicators into five proprietary scores and plain-English market briefs for every U.S. geography.

## Stack
- **Framework**: Next.js 14 App Router + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Supabase (PostgreSQL) — free tier
- **Auth**: Supabase Auth
- **Map**: Mapbox GL JS
- **Charts**: Recharts
- **State**: Zustand
- **Data**: TanStack Query
- **ETL**: GitHub Actions (monthly cron)
- **Deploy**: Vercel free tier

## Architecture
```
app/
├── (marketing)/          # Public landing page
├── (app)/                # Authenticated dashboard (sidebar layout)
└── api/                  # API routes (ISR-cached 24h)

etl/                      # Monthly data pipeline
├── sources/              # Census, BLS, Redfin, FRED, HUD, FHFA
├── transforms/           # Normalize FIPS/CBSA to geography IDs
└── loaders/              # Upsert to Supabase

lib/scores/               # Score calculator — reads config/score-weights.json
supabase/migrations/      # Full schema + materialized views
```

## Key Files
| File | Purpose |
|------|---------|
| `config/score-weights.json` | Edit score weights here without touching code |
| `lib/scores/calculator.ts` | Computes all 5 Watchtower scores |
| `lib/market-brief.ts` | Template-based market brief generator |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema |
| `supabase/migrations/002_materialized_views.sql` | market_summary_mv, score_percentiles_mv |
| `etl/run-pipeline.ts` | Manual ETL trigger |
| `.github/workflows/etl-monthly.yml` | Monthly automated refresh |

## Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Set up Supabase
#    - Create project at supabase.com
#    - Run migrations in order:
#      supabase/migrations/001_initial_schema.sql
#      supabase/migrations/002_materialized_views.sql

# 4. Start development
npm run dev

# 5. Run ETL manually (once DB is set up)
npm run etl:run
```

## Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL        # From Supabase dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY   # From Supabase dashboard
SUPABASE_SERVICE_ROLE_KEY       # From Supabase dashboard (server-only)
NEXT_PUBLIC_MAPBOX_TOKEN        # From mapbox.com
CENSUS_API_KEY                  # Free at api.census.gov
BLS_API_KEY                     # Free at bls.gov/developers
FRED_API_KEY                    # Free at fred.stlouisfed.org
INTERNAL_API_SECRET             # Random string for ETL auth
```

## Scoring System
Five scores, 0-100 each. Weights are percentile-rank based — relative to all markets of the same type.

Edit `config/score-weights.json` to adjust weights. No code changes needed.

| Score | Higher = | Key Factors |
|-------|----------|-------------|
| Strength | Better | Population growth, migration, jobs, low DOM |
| Risk | Worse | Unemployment rise, inventory spike, P/I stretch |
| Migration | Better | Net migration rate, momentum, in/out ratio |
| Affordability | Better (more affordable) | P/I ratio, rent/income, vs. national median |
| Investor | Better | Rent yield, strength, migration, low risk |

## Data Pipeline
GitHub Actions runs on the 1st of every month. Fetches:
1. Census ACS — population, migration, income
2. BLS LAUS — unemployment by state/metro/county
3. Redfin Data Center — housing metrics
4. FRED — macro indicators
5. Scores recalculated after each ETL run
6. Materialized views refreshed

## Database Tables
Core: `geographies`, `monthly_housing_metrics`, `annual_migration_metrics`, `annual_economic_metrics`, `annual_demographic_metrics`, `monthly_rent_metrics`, `score_outputs`

User: `user_profiles`, `watchlists`, `watchlist_items`, `alerts`, `saved_screens`

ETL: `data_source_registry`, `ingestion_runs`

Materialized: `market_summary_mv` (main query target), `score_percentiles_mv`

## Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | National overview, leaderboards |
| `/explore` | Mapbox choropleth explorer |
| `/rankings` | Filterable/sortable market table |
| `/market/[id]` | Full market profile page |
| `/compare` | Side-by-side market comparison |
| `/watchlist` | Saved markets |

## Data Quality Caveats (Be Transparent)
- Migration data: 1-2 year lag (Census ACS timing)
- Metro GDP: ~6 month lag (BEA)
- Rent data sparse in rural counties
- Redfin coverage thin in small markets (fallback: FHFA HPI)
- ZIP-level affordability unreliable without granular income data

## MVP Launch Checklist
- [ ] Supabase schema deployed
- [ ] Seed geography data (50 states + top 100 metros)
- [ ] First ETL run completed
- [ ] Scores calculated
- [ ] Materialized views refreshed
- [ ] Vercel deployment live
- [ ] NEXT_PUBLIC_MAPBOX_TOKEN set
- [ ] Auth working (email + Google)
- [ ] Landing page live
