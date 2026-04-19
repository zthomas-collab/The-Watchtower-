# The Watchtower

Institutional-grade U.S. real estate intelligence — free for everyone.

The Watchtower combines housing data, migration flows, economic signals, and risk indicators into **five proprietary scores** and plain-English market briefs for every U.S. geography (states, metros, counties).

---

## Features

- **Five Watchtower Scores** — Strength, Risk, Migration, Affordability, Investor Opportunity (0–100 each, percentile-ranked)
- **National Rankings** — filter and sort every market by any score or metric
- **Interactive Map** — Mapbox choropleth explorer with live layer switching
- **Market Profiles** — full data page per geography with trend charts and score breakdowns
- **Market Compare** — side-by-side comparison of any two markets
- **Watchlist** — save up to 10 markets; synced to your account
- **Monthly ETL Pipeline** — auto-refreshes from six public data sources via GitHub Actions

---

## Scoring System

All scores are percentile-ranked within the same geography type (metro vs. state vs. county) so markets are never unfairly compared across tiers.

| Score | Higher = | Key Inputs |
|---|---|---|
| **Strength** | Better market health | Population growth, migration, jobs, low DOM |
| **Risk** | More dangerous (lower is safer) | Unemployment rise, inventory spike, price/income stretch |
| **Migration** | More in-migration | Net rate, 3-yr momentum, in/out ratio |
| **Affordability** | More affordable | Price-to-income, rent-to-income, vs. national median |
| **Investor** | Better return potential | Rent yield, strength, migration, low risk |

Weights are stored in [`config/score-weights.json`](config/score-weights.json) — edit them without touching any code.

---

## Data Sources

| Source | Data | Frequency |
|---|---|---|
| Census ACS | Population, migration, income | Annual (1-2yr lag) |
| BLS LAUS | Unemployment by state/metro/county | Monthly |
| Redfin Data Center | Median price, DOM, inventory, sale/list ratio | Monthly |
| FRED | Mortgage rates, housing starts, national HPI | Monthly |
| HUD Fair Market Rents | County-level rent baseline | Annual |
| FHFA HPI | Housing price index (fallback for thin markets) | Quarterly |

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google OAuth) |
| Styling | Tailwind CSS (custom `wt-` palette) |
| Map | Mapbox GL JS |
| Charts | Recharts |
| ETL | GitHub Actions monthly cron |
| Deploy | Vercel |

---

## Project Structure

```
app/
├── (marketing)/        # Public landing page
├── (app)/              # Authenticated dashboard
│   ├── dashboard/      # National leaderboards
│   ├── explore/        # Mapbox choropleth map
│   ├── rankings/       # Filterable market table
│   ├── market/[id]/    # Full market profile
│   ├── compare/        # Side-by-side comparison
│   └── watchlist/      # Saved markets
└── api/                # API routes (ISR-cached 24h)

etl/
├── sources/            # Census, BLS, Redfin, FRED, HUD, FHFA
├── transforms/         # FIPS/CBSA → geography UUID normalization
└── loaders/            # Batch upsert to Supabase

lib/
├── scores/             # Score calculator (reads config/score-weights.json)
├── supabase/           # Server + client Supabase helpers
└── market-brief.ts     # Template-based plain-English brief generator

components/
├── layout/             # Header, Sidebar
├── map/                # WatchtowerMap, LayerToggle
├── charts/             # TrendChart, MiniSparkline
├── scores/             # ScoreCard, ScoreBreakdown
├── market/             # MarketCard, MetricGrid, MarketBrief, BullBearCard
└── rankings/           # RankingsTable, FilterPanel

supabase/
├── migrations/         # Full schema + materialized views
└── seed/               # 50 states + top 50 metros seed data

config/
├── score-weights.json  # All score weights — edit here, no code changes needed
├── metrics.ts          # Metric definitions + map layer configs
└── data-sources.ts     # Data source registry
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Mapbox](https://mapbox.com) account (free tier: 50k map loads/month)
- Free API keys: [Census](https://api.census.gov/data/key_signup.html), [BLS](https://www.bls.gov/developers/), [FRED](https://fred.stlouisfed.org/docs/api/api_key.html)

### 2. Install

```bash
git clone https://github.com/zthomas-collab/the-watchtower-
cd the-watchtower-
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-only)
NEXT_PUBLIC_MAPBOX_TOKEN=        # Mapbox public token
CENSUS_API_KEY=                  # census.gov
BLS_API_KEY=                     # bls.gov
FRED_API_KEY=                    # fred.stlouisfed.org
INTERNAL_API_SECRET=             # Any random string — protects /api/internal/*
```

### 4. Database Setup

In your Supabase SQL editor, run the migrations in order:

```sql
-- 1. Core schema
supabase/migrations/001_initial_schema.sql

-- 2. Materialized views
supabase/migrations/002_materialized_views.sql
```

Then seed the geographies:

```sql
supabase/seed/001_geographies.sql
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. First ETL Run

With the database seeded, pull in live data:

```bash
npm run etl:run              # Full pipeline (all sources)
npm run etl:run --source=redfin  # Single source only
npm run etl:scores           # Recalculate scores only
```

---

## ETL Pipeline

GitHub Actions runs on the **1st of every month at 02:00 UTC**.

```
Census ACS → BLS LAUS → Redfin → FRED → HUD FMR → FHFA HPI → Score Recalculation
```

You can also trigger it manually from the **Actions** tab using the `ETL On-Demand` workflow, with optional source filter.

---

## Customizing Scores

Open `config/score-weights.json` and adjust any weight. Rules:

- Weights within each score must sum to `1.0`
- `direction: "positive"` → higher raw value = better score
- `direction: "negative"` → higher raw value = worse score
- `normalize: "percentile"` | `"zscore"` | `"direct"`

No code changes needed — the calculator reads this file at runtime.

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | National overview + leaderboards |
| `/explore` | Interactive choropleth map |
| `/rankings` | Filterable/sortable market table |
| `/market/[id]` | Full market profile with scores, charts, brief |
| `/compare` | Side-by-side market comparison |
| `/watchlist` | Your saved markets |

---

## Data Caveats

- Migration data carries a **1–2 year lag** (Census ACS timing)
- Metro GDP has a **~6 month lag** (BEA)
- Rent data is **sparse in rural counties** — HUD FMR used as fallback
- Redfin coverage is **thin in small markets** — FHFA HPI used as fallback
- ZIP-level affordability is unreliable without granular income data

---

## License

MIT
