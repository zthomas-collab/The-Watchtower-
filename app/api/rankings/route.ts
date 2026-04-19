import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const geoType = searchParams.get('geo_type') || 'metro'
  const sortField = searchParams.get('sort') || 'strength'
  const dir = searchParams.get('dir') === 'asc'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('limit') || '50'))

  const minStrength = searchParams.get('min_strength')
  const maxRisk = searchParams.get('max_risk')
  const minMigration = searchParams.get('min_migration')
  const maxPrice = searchParams.get('max_price')
  const maxUnemployment = searchParams.get('max_unemployment')
  const minJobGrowth = searchParams.get('min_job_growth')

  const sortCol = `${sortField}_score`
  const supabase = await createClient()

  let query = supabase
    .from('market_summary_mv')
    .select(
      'id, name, geo_type, state_abbreviation, strength_score, risk_score, migration_score, affordability_score, investor_score, median_list_price, days_on_market, unemployment_rate, net_migration_rate, population_growth_pct, months_of_supply, median_household_income, job_growth_pct',
      { count: 'exact' }
    )
    .eq('geo_type', geoType)
    .not(sortCol, 'is', null)
    .order(sortCol, { ascending: dir, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (minStrength) query = query.gte('strength_score', parseFloat(minStrength))
  if (maxRisk) query = query.lte('risk_score', parseFloat(maxRisk))
  if (minMigration) query = query.gte('migration_score', parseFloat(minMigration))
  if (maxPrice) query = query.lte('median_list_price', parseFloat(maxPrice))
  if (maxUnemployment) query = query.lte('unemployment_rate', parseFloat(maxUnemployment))
  if (minJobGrowth) query = query.gte('job_growth_pct', parseFloat(minJobGrowth))

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: { total: count, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) },
  })
}
