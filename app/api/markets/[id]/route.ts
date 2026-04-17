import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [summaryRes, scoresRes, housingRes, migrationRes, economicRes, rentRes] = await Promise.all([
    supabase.from('market_summary_mv').select('*').eq('id', params.id).single(),
    supabase.from('score_outputs').select('*').eq('geography_id', params.id).order('calculated_at', { ascending: false }).limit(1).single(),
    supabase.from('monthly_housing_metrics').select('*').eq('geography_id', params.id).order('period_month', { ascending: false }).limit(24),
    supabase.from('annual_migration_metrics').select('*').eq('geography_id', params.id).order('period_year', { ascending: false }).limit(10),
    supabase.from('annual_economic_metrics').select('*').eq('geography_id', params.id).order('period_year', { ascending: false }).limit(10),
    supabase.from('monthly_rent_metrics').select('*').eq('geography_id', params.id).order('period_month', { ascending: false }).limit(24),
  ])

  if (!summaryRes.data) {
    return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  }

  return NextResponse.json({
    summary: summaryRes.data,
    scores: scoresRes.data || null,
    housing_history: housingRes.data || [],
    migration_history: migrationRes.data || [],
    economic_history: economicRes.data || [],
    rent_history: rentRes.data || [],
  })
}
