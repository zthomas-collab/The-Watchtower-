/**
 * Supabase batch upsert loader — used by all ETL sources.
 * Handles chunking, conflict resolution, and ingestion run tracking.
 */

import { createServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const CHUNK_SIZE = 500

export type LoaderTable =
  | 'monthly_housing_metrics'
  | 'annual_migration_metrics'
  | 'annual_economic_metrics'
  | 'annual_demographic_metrics'
  | 'monthly_rent_metrics'
  | 'score_outputs'

interface UpsertOptions {
  table: LoaderTable
  rows: Record<string, unknown>[]
  conflictColumns: string[]
  source: string
}

interface LoadResult {
  success: boolean
  records: number
  error?: string
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function upsertRecords(opts: UpsertOptions): Promise<LoadResult> {
  const { table, rows, conflictColumns, source } = opts

  if (!rows.length) {
    console.log(`[Loader:${source}] No rows to upsert into ${table}`)
    return { success: true, records: 0 }
  }

  const supabase = createServiceClient()
  const batches = chunk(rows, CHUNK_SIZE)
  let total = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const { error } = await supabase
      .from(table)
      .upsert(batch as never[], {
        onConflict: conflictColumns.join(','),
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`[Loader:${source}] Batch ${i + 1}/${batches.length} failed:`, error.message)
      return { success: false, records: total, error: error.message }
    }

    total += batch.length
    console.log(`[Loader:${source}] Batch ${i + 1}/${batches.length} — ${total}/${rows.length} rows`)
  }

  return { success: true, records: total }
}

export async function startIngestionRun(
  supabase: SupabaseClient,
  source: string
): Promise<string | null> {
  const { data } = await supabase
    .from('ingestion_runs')
    .insert({ source_name: source, status: 'running', started_at: new Date().toISOString() })
    .select('id')
    .single()

  return data?.id ?? null
}

export async function completeIngestionRun(
  supabase: SupabaseClient,
  runId: string,
  records: number,
  error?: string
): Promise<void> {
  await supabase
    .from('ingestion_runs')
    .update({
      status: error ? 'failed' : 'success',
      completed_at: new Date().toISOString(),
      records_processed: records,
      error_message: error ?? null,
    })
    .eq('id', runId)
}

export async function withIngestionTracking(
  source: string,
  fn: () => Promise<LoadResult>
): Promise<LoadResult> {
  const supabase = createServiceClient()
  const runId = await startIngestionRun(supabase, source)

  const result = await fn()

  if (runId) {
    await completeIngestionRun(supabase, runId, result.records, result.error)
  }

  return result
}
