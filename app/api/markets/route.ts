import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const geoType = searchParams.get('type') || 'metro'
  const state = searchParams.get('state')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
  const sort = searchParams.get('sort') || 'strength_score'
  const dir = searchParams.get('dir') !== 'asc'

  const supabase = await createClient()

  let query = supabase
    .from('market_summary_mv')
    .select(
      'id, name, geo_type, state_abbreviation, fips_code, cbsa_code, population, strength_score, risk_score, migration_score, affordability_score, investor_score, median_list_price, days_on_market, unemployment_rate, net_migration_rate, population_growth_pct, months_of_supply',
      { count: 'exact' }
    )
    .eq('geo_type', geoType)
    .order(sort, { ascending: !dir, nullsFirst: false })
    .range((page - 1) * limit, page * limit - 1)

  if (state) query = query.eq('state_fips', state)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: { total: count, page, limit, pages: Math.ceil((count || 0) / limit) },
  })
}
