import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const geoType = searchParams.get('geo_type') || 'metro'
  const sort = searchParams.get('sort') || 'strength'
  const dir = searchParams.get('dir') !== 'asc'
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

  const sortCol = `${sort}_score`
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, strength_score, risk_score, migration_score, affordability_score, investor_score, scores_calculated_at')
    .eq('geo_type', geoType)
    .not(sortCol, 'is', null)
    .order(sortCol, { ascending: !dir, nullsFirst: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
