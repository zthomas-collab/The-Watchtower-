import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')?.trim()
  const types = searchParams.get('types')?.split(',') || ['metro', 'state', 'county']

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, population, strength_score')
    .in('geo_type', types)
    .ilike('name', `%${q}%`)
    .order('population', { ascending: false, nullsFirst: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
