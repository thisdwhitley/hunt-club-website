#!/usr/bin/env node
// Backfills daily_weather_snapshots for pre-2025 hunt dates so imported hunts get weather
// (temperature, wind, pressure trend, moon). Uses the same WeatherCollectionService as the
// daily GitHub Action, so the data matches site-collected days exactly.
//
// Usage:
//   node scripts/history/backfill-weather.js              # dry run: lists the days it would fetch
//   node scripts/history/backfill-weather.js --apply      # fetch up to --limit days (default 38)
//   node scripts/history/backfill-weather.js --apply --limit 200
//
// - For each hunt date it also fetches the day before, first, so pressure_change_24h /
//   pressure_trend can be computed (the service compares against the previous day's snapshot).
// - Days that already have a snapshot are skipped, so it can be run repeatedly until done.
// - Cost: Visual Crossing bills 24 records per day (hourly data). The free tier is 1000 records/day
//   and the daily collection job uses the same key, so the default of 38 days (912 records) leaves room.
// - Inserting a snapshot fires trigger_update_hunt_logs_weather, which fills weather on that
//   date's hunt_logs rows that don't have it yet.

const path = require('path')
const ROOT = path.resolve(__dirname, '../..')
require('dotenv').config({ path: path.join(ROOT, '.env.local') })
const { createClient } = require('@supabase/supabase-js')
const { WeatherCollectionService } = require(path.join(ROOT, 'src/lib/weather/weather-service.js'))

const APPLY = process.argv.includes('--apply')
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : 38
const RECORDS_PER_DAY = 24

const dayBefore = d => { const p = new Date(`${d}T12:00:00Z`); p.setUTCDate(p.getUTCDate() - 1); return p.toISOString().slice(0, 10) }

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: hunts, error } = await sb.from('hunt_logs').select('hunt_date').lt('hunt_date', '2025-01-01')
  if (error) throw new Error(error.message)
  const { data: snaps, error: e2 } = await sb.from('daily_weather_snapshots').select('date').lt('date', '2025-01-01')
  if (e2) throw new Error(e2.message)
  const have = new Set(snaps.map(s => s.date))

  // ordered list: for each hunt date (oldest first) the day before, then the date itself
  const ordered = []
  for (const d of [...new Set(hunts.map(h => h.hunt_date))].sort()) {
    for (const x of [dayBefore(d), d]) if (!ordered.includes(x)) ordered.push(x)
  }
  const todo = ordered.filter(d => !have.has(d))
  const batch = todo.slice(0, LIMIT)
  console.log(`${APPLY ? '*** APPLY ***' : 'DRY RUN'}: ${ordered.length} days needed, ${have.size} already collected, ${todo.length} remaining`)
  console.log(`This run: ${batch.length} days (~${batch.length * RECORDS_PER_DAY} Visual Crossing records)${batch.length ? `: ${batch[0]} .. ${batch[batch.length - 1]}` : ''}`)
  if (!APPLY) { console.log('Dry run complete. Nothing was fetched or written.'); return }

  const service = new WeatherCollectionService()
  let ok = 0
  for (const d of batch) {
    const res = await service.collectDailyWeather(d)
    if (!res.success) {
      console.error(`Stopped at ${d}: ${(res.errors || []).join('; ')}`)
      if ((res.errors || []).some(m => /429|limit|exceed/i.test(m))) console.error('Looks like the API limit for today was reached - run again tomorrow.')
      break
    }
    ok++
  }
  console.log(`Collected ${ok} of ${batch.length} days. ${todo.length - ok} remaining after this run.`)
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1) })
