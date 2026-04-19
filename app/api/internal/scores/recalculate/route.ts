import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { batchCalculateScores, deriveAffordabilityMetrics } from '@/lib/scores/calculator'
import type { MarketDataForScoring } from '@/lib/scores/calculator'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const geoTypes = ['nation', 'state', 'metro', 'county']
  let totalProcessed = 0
  let totalFailed = 0

  for (const geoType of geoTypes) {
    const { data: markets, error } = await supabase
      .from('market_summary_mv')
      .select('*')
      .eq('geo_type', geoType)

    if (error || !markets) continue

    const scoringData: MarketDataForScoring[] = markets.map((m) => {
      const affordability = deriveAffordabilityMetrics({
        median_list_price: m.median_list_price,
        median_household_income: m.median_household_income,
        median_rent_overall: m.median_rent_overall,
        income_growth_pct: m.income_growth_pct,
        rent_growth_yoy_pct: m.rent_growth_yoy_pct,
      })

      const nationalMedianPrice = 400000
      return {
        geography_id: m.id,
        geo_type: geoType,
        median_list_price_yoy_pct: m.median_list_price_yoy_pct,
        days_on_market: m.days_on_market,
        months_of_supply: m.months_of_supply,
        inventory_change_yoy_pct: m.inventory_change_yoy_pct,
        price_reductions_pct: m.price_reductions_pct,
        sale_to_list_ratio: m.sale_to_list_ratio,
        unemployment_rate: m.unemployment_rate,
        unemployment_change_yoy: m.unemployment_change_yoy,
        job_growth_pct: m.job_growth_pct,
        income_growth_pct: m.income_growth_pct,
        gdp_growth_pct: m.gdp_growth_pct,
        median_household_income: m.median_household_income,
        net_migration_rate: m.net_migration_rate,
        migration_momentum_3yr: null,
        inbound_outbound_ratio: m.in_migration && m.out_migration && m.out_migration > 0
          ? m.in_migration / m.out_migration
          : null,
        population_growth_pct: m.population_growth_pct,
        rent_to_income_ratio: affordability.rent_to_income_ratio,
        rent_growth_yoy_pct: m.rent_growth_yoy_pct,
        rent_growth_vs_wage_growth: affordability.rent_growth_vs_wage_growth,
        price_to_income_ratio: affordability.price_to_income_ratio,
        price_vs_national_median_pct: m.median_list_price
          ? ((m.median_list_price - nationalMedianPrice) / nationalMedianPrice) * 100
          : null,
        rent_yield_estimate: m.median_rent_overall && m.median_list_price && m.median_list_price > 0
          ? (m.median_rent_overall * 12) / m.median_list_price * 100
          : null,
      }
    })

    const scores = batchCalculateScores(scoringData)

    for (const score of scores) {
      const { error: upsertError } = await supabase
        .from('score_outputs')
        .upsert({
          ...score,
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'geography_id,score_version' })

      if (upsertError) {
        totalFailed++
      } else {
        totalProcessed++
      }
    }
  }

  // Refresh materialized views
  await supabase.rpc('refresh_all_materialized_views')

  return NextResponse.json({
    success: true,
    processed: totalProcessed,
    failed: totalFailed,
    timestamp: new Date().toISOString(),
  })
}
