// Acceptance check for /reports metrics. Runs the live data through the same functions the page
// uses (buildReportSits -> applyFilters -> summarize) and compares against known tallies:
//   - the old spreadsheets' own "BY TIME" tabs (2019, and 2020 through 12-05)
//   - the preview table in docs/plans/reports-page.md
//
// Usage: node scripts/reports/check-metrics.mts   (Node 22.18+ runs TypeScript directly)
// Reads with SUPABASE_SERVICE_ROLE_KEY from .env.local. Read-only.

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { buildReportSits, type RawHunt, type RawMember, type RawSighting, type RawStand } from '../../src/lib/reports/build.ts'
import { summarize } from '../../src/lib/reports/metrics.ts'
import { applyFilters, DEFAULT_QUALITY } from '../../src/lib/reports/data-quality.ts'
import type { ReportSit } from '../../src/lib/reports/types.ts'

config({ path: '.env.local', quiet: true })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

async function all<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data as T[]))
    if (data.length < 1000) return rows
  }
}

let failures = 0
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`)
}

const sheetTally = (sits: ReportSit[]) => ({
  am: [sits.filter(s => s.huntType === 'AM').length, sits.filter(s => s.huntType === 'AM' && s.sawAnyAnimal).length],
  pm: [sits.filter(s => s.huntType === 'PM').length, sits.filter(s => s.huntType === 'PM' && s.sawAnyAnimal).length],
})

async function main() {
  const sits = buildReportSits(
    await all<RawHunt>('hunt_logs', 'id, hunt_date, hunt_type, member_id, stand_id, season, hunting_season, had_harvest, harvest_count, notes'),
    await all<RawSighting>('hunt_sightings', 'hunt_log_id, animal_type, count, gender'),
    await all<RawStand>('stands', 'id, name, active'),
    await all<RawMember>('members', 'id, display_name, full_name, role'),
  )
  console.log(`${sits.length} sits loaded\n`)

  // The sheets count a sit as "sighting" whenever the cell isn't "-": any animal, plus one blank
  // 2019 PM cell (2019-11-26, Penny Loafer) that recorded nothing. So 2019 PM is 10 here vs the sheet's 11.
  expect('2019 sheet tally [sits, sits with a sighting]', sheetTally(sits.filter(s => s.season === 2019)),
    { am: [21, 3], pm: [18, 10] })
  expect('2020 sheet tally through 12-05', sheetTally(sits.filter(s => s.season === 2020 && s.huntDate <= '2020-12-05')),
    { am: [26, 7], pm: [23, 10] })

  // Preview table in the plan: all seasons, default data-quality rules, as of 2026-11-15.
  // Later seasons add sits, so this only holds while the 2026 season data matches the plan date.
  const view = applyFilters(sits.filter(s => s.huntDate <= '2026-11-15'), {
    seasons: 'all', seasonType: null, hunterKey: null, standId: null, includeInactiveStands: true, ...DEFAULT_QUALITY,
  })
  for (const [type, expected] of [['AM', { sits: 144, saw: 25, perSit: 0.33, withHarvest: 6, harvests: 7 }],
                                  ['PM', { sits: 120, saw: 38, perSit: 0.63, withHarvest: 13, harvests: 14 }]] as const) {
    const st = summarize(view.filter(s => s.huntType === type))
    expect(`plan preview ${type}`, {
      sits: st.sits, saw: Math.round((st.sawDeerRate ?? 0) * 100), perSit: Number((st.deerPerSit ?? 0).toFixed(2)),
      withHarvest: st.sitsWithHarvest, harvests: st.harvests,
    }, expected)
  }

  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
  process.exitCode = failures ? 1 : 0
}

main().catch(e => { console.error(e); process.exit(1) })
