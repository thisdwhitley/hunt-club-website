#!/usr/bin/env node
// Backfills season_calendar from data/history/season-dates.csv, then labels pre-2025 hunts with
// their season type (hunting_season) and season year (season) from it.
//
// Usage:
//   NODE_PATH=node_modules node scripts/history/load-seasons.js           # dry run
//   NODE_PATH=node_modules node scripts/history/load-seasons.js --apply   # write
//
// - Season rows are matched on (season_year, species, season_type, zone). Existing rows are left as
//   they are, so it never overwrites dates already managed on the site.
// - Only hunts dated before 2025 with no hunting_season are labeled. Hunts that fall outside every
//   season are reported and left alone.
// - The site caches season_calendar for up to an hour (tag 'season-calendar'), so pages may show
//   the new seasons after that.

const fs = require('fs')
const path = require('path')
const { readCSV } = require('./csv')

const APPLY = process.argv.includes('--apply')

const env = Object.fromEntries(fs.readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf8').split('\n')
  .filter(l => /^[A-Z_][A-Z0-9_]*=/.test(l))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function q(promise, what) {
  const { data, error } = await promise
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

async function main() {
  console.log(APPLY ? '*** APPLY MODE: writing to the database ***' : 'DRY RUN: nothing will be written (use --apply to write)')

  // --- season_calendar ---
  const wanted = readCSV('season-dates.csv').map(({ rowNumber: _rowNumber, ...r }) => ({ ...r, season_year: Number(r.season_year), zone: r.zone || null }))
  const existing = await q(sb.from('season_calendar').select('season_year, species, season_type, zone, opens, closes'), 'read season_calendar')
  const key = r => [r.season_year, r.species, r.season_type, r.zone || ''].join('|')
  const have = new Map(existing.map(r => [key(r), r]))
  const toInsert = wanted.filter(r => !have.has(key(r)))
  for (const r of wanted.filter(r => have.has(key(r)))) {
    const e = have.get(key(r))
    if (e.opens !== r.opens || e.closes !== r.closes) console.log(`  note: ${key(r)} already exists with ${e.opens}..${e.closes} (CSV says ${r.opens}..${r.closes}) - left unchanged`)
  }
  console.log(`\nSeason rows to insert: ${toInsert.length} of ${wanted.length}`)
  toInsert.forEach(r => console.log(`  ${r.season_year} ${r.season_type.padEnd(11)} ${r.opens} .. ${r.closes}  (${r.confidence})`))
  if (APPLY && toInsert.length) await q(sb.from('season_calendar').insert(toInsert), 'insert season_calendar')

  // --- label hunts ---
  const seasons = [...existing, ...toInsert].filter(s => s.species === 'deer' && (s.zone === 'central' || !s.zone))
  const hunts = await q(sb.from('hunt_logs').select('id, hunt_date, hunting_season, season').lt('hunt_date', '2025-01-01').is('hunting_season', null), 'read hunts')
  const updates = []
  const outside = []
  for (const h of hunts) {
    const s = seasons.find(s => h.hunt_date >= s.opens && h.hunt_date <= s.closes)
    if (s) updates.push({ id: h.id, hunting_season: s.season_type, season: String(s.season_year) })
    else outside.push(h.hunt_date)
  }
  const counts = {}
  updates.forEach(u => { const k = `${u.season} ${u.hunting_season}`; counts[k] = (counts[k] || 0) + 1 })
  console.log(`\nHunts to label: ${updates.length} of ${hunts.length} unlabeled pre-2025 hunts`)
  console.table(counts)
  if (outside.length) console.log(`Outside every season (left unlabeled): ${outside.join(', ')}`)

  if (APPLY && updates.length) {
    // group by (season, type) so each group is one UPDATE
    const groups = new Map()
    updates.forEach(u => { const k = `${u.season}|${u.hunting_season}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(u.id) })
    for (const [k, ids] of groups) {
      const [season, hunting_season] = k.split('|')
      await q(sb.from('hunt_logs').update({ season, hunting_season }).in('id', ids).is('hunting_season', null), `label ${k}`)
    }
    console.log(`Labeled ${updates.length} hunts.`)
  }
  if (!APPLY) console.log('\nDry run complete. Nothing was written.')
}

main().catch(err => { console.error('\nFAILED:', err.message); process.exit(1) })
