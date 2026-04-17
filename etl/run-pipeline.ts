#!/usr/bin/env tsx
/**
 * THE WATCHTOWER — ETL Pipeline Runner
 *
 * Usage:
 *   npm run etl:run                  Run full pipeline
 *   npm run etl:run --scores-only    Only recalculate scores
 *   npx tsx etl/run-pipeline.ts
 *
 * Called by: GitHub Actions monthly cron, manual trigger, /api/internal/ingest
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

interface PipelineResult {
  source: string
  success: boolean
  records?: number
  error?: string
  durationMs: number
}

async function runStep(name: string, fn: () => Promise<{ success: boolean; records?: number; error?: string }>): Promise<PipelineResult> {
  console.log(`\n[Pipeline] ═══ Running: ${name} ═══`)
  const start = Date.now()
  try {
    const result = await fn()
    const durationMs = Date.now() - start
    console.log(`[Pipeline] ✓ ${name} completed in ${durationMs}ms (records: ${result.records ?? 'N/A'})`)
    return { source: name, ...result, durationMs }
  } catch (err) {
    const durationMs = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)
    console.error(`[Pipeline] ✗ ${name} FAILED: ${error}`)
    return { source: name, success: false, error, durationMs }
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const scoresOnly = args.includes('--scores-only')
  const sourceFilter = args.find((a) => a.startsWith('--source='))?.split('=')[1]

  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║    THE WATCHTOWER — ETL Pipeline         ║')
  console.log(`║    Started: ${new Date().toISOString().slice(0, 19)} UTC  ║`)
  console.log('╚══════════════════════════════════════════╝\n')

  const pipelineStart = Date.now()
  const results: PipelineResult[] = []

  if (!scoresOnly) {
    // Step 1: Census ACS — population + migration + income
    if (!sourceFilter || sourceFilter === 'census') {
      const { runCensusETL } = await import('./sources/census')
      results.push(await runStep('Census ACS', runCensusETL))
      await sleep(2000) // Rate limit pause
    }

    // Step 2: BLS — unemployment + job growth
    if (!sourceFilter || sourceFilter === 'bls') {
      const { runBLSETL } = await import('./sources/bls')
      results.push(await runStep('BLS LAUS', runBLSETL))
      await sleep(2000)
    }

    // Step 3: Redfin — housing data
    if (!sourceFilter || sourceFilter === 'redfin') {
      const { runRedfinETL } = await import('./sources/redfin')
      results.push(await runStep('Redfin Housing', runRedfinETL))
      await sleep(2000)
    }

    // Step 4: FRED — macro indicators
    if (!sourceFilter || sourceFilter === 'fred') {
      results.push(await runStep('FRED', async () => {
        const { fetchMortgageRates, fetchHousingStarts } = await import('./sources/fred')
        const [mortgage, starts] = await Promise.all([fetchMortgageRates(), fetchHousingStarts()])
        console.log(`[FRED] Got ${mortgage.length} mortgage rate points, ${starts.length} housing start points`)
        return { success: true, records: mortgage.length + starts.length }
      }))
    }
  }

  // Step 5: Recalculate scores
  results.push(await runStep('Score Recalculation', async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${BASE_URL}/api/internal/scores/recalculate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` },
    })
    if (!res.ok) throw new Error(`Score API returned ${res.status}`)
    const data = await res.json()
    return { success: true, records: data.processed }
  }))

  // Summary
  const totalDuration = Date.now() - pipelineStart
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║    PIPELINE SUMMARY                      ║')
  console.log('╠══════════════════════════════════════════╣')
  for (const r of results) {
    const status = r.success ? '✓' : '✗'
    const duration = (r.durationMs / 1000).toFixed(1) + 's'
    console.log(`║  ${status} ${r.source.padEnd(25)} ${duration.padStart(6)}  ║`)
  }
  console.log('╠══════════════════════════════════════════╣')
  console.log(`║  Total: ${successCount} success, ${failCount} failed, ${(totalDuration / 1000).toFixed(0)}s  ║`)
  console.log('╚══════════════════════════════════════════╝\n')

  if (failCount > 0) {
    console.error('Pipeline completed with failures. Check logs above.')
    process.exit(1)
  }

  console.log('Pipeline completed successfully.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[Pipeline] Fatal error:', err)
  process.exit(1)
})
