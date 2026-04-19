import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import RankingsTable from '@/components/rankings/RankingsTable'
import FilterPanel from '@/components/rankings/FilterPanel'

export const metadata: Metadata = { title: 'Market Rankings' }
export const revalidate = 86400

interface SearchParams {
  sort?: string
  dir?: string
  geo_type?: string
  state?: string
  min_strength?: string
  max_risk?: string
  min_migration?: string
  min_affordability?: string
  max_price?: string
  max_unemployment?: string
  min_job_growth?: string
  page?: string
}

async function getMarkets(params: SearchParams) {
  const supabase = await createClient()

  const sortCol = params.sort === 'risk' ? 'risk_score'
    : params.sort === 'migration' ? 'migration_score'
    : params.sort === 'affordability' ? 'affordability_score'
    : params.sort === 'investor' ? 'investor_score'
    : 'strength_score'

  const ascending = params.dir === 'asc'
  const geoType = params.geo_type || 'metro'
  const page = Math.max(1, parseInt(params.page || '1'))
  const pageSize = 50

  let query = supabase
    .from('market_summary_mv')
    .select('id, name, geo_type, state_abbreviation, strength_score, risk_score, migration_score, affordability_score, investor_score, median_list_price, days_on_market, unemployment_rate, net_migration_rate, population_growth_pct, months_of_supply, median_household_income, price_to_income_ratio', { count: 'exact' })
    .eq('geo_type', geoType)
    .not(sortCol, 'is', null)
    .order(sortCol, { ascending })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (params.state) query = query.eq('state_fips', params.state)
  if (params.min_strength) query = query.gte('strength_score', parseFloat(params.min_strength))
  if (params.max_risk) query = query.lte('risk_score', parseFloat(params.max_risk))
  if (params.min_migration) query = query.gte('migration_score', parseFloat(params.min_migration))
  if (params.max_price) query = query.lte('median_list_price', parseFloat(params.max_price))
  if (params.max_unemployment) query = query.lte('unemployment_rate', parseFloat(params.max_unemployment))
  if (params.min_job_growth) query = query.gte('job_growth_pct', parseFloat(params.min_job_growth))

  const { data, count } = await query
  return { data: data || [], count: count || 0, page, pageSize }
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { data, count, page, pageSize } = await getMarkets(searchParams)

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div>
        <h1 className="text-2xl font-bold">Market Rankings</h1>
        <p className="text-wt-muted text-sm mt-1">
          {count.toLocaleString()} markets — filter and sort by any metric
        </p>
      </div>

      <div className="flex gap-6">
        {/* Filter panel */}
        <div className="w-64 flex-shrink-0">
          <FilterPanel current={searchParams} />
        </div>

        {/* Rankings table */}
        <div className="flex-1 min-w-0">
          <RankingsTable
            data={data}
            sortKey={searchParams.sort || 'strength'}
            page={page}
            pageSize={pageSize}
            total={count}
          />
        </div>
      </div>
    </div>
  )
}
