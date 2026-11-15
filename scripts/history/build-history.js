#!/usr/bin/env node
// Builds normalized hunt history from the raw exports in data/history/raw.
//
// Inputs (all in data/history/):
//   raw/sheets/*-hunting.csv   2018-2020 spreadsheet logs (one row per sit)
//   raw/forms/*.csv            2021-2023 Google Form responses (one row per sit)
//   raw/calendar/harvests.csv  harvest anniversaries from the "hunting+past" calendar
//   stands.csv                 old stand name -> current/new stand
//   hunters.csv                old hunter name -> site hunter
//   corrections.csv            per-row fixes and decisions (skip, harvest details, shot outcome...)
//
// Outputs (data/history/normalized/):
//   hunts.csv      one row per sit, keyed by source_ref (stable: "<raw file>#<row>")
//   sightings.csv  one row per animal group seen, linked by source_ref
//
// Usage: node scripts/history/build-history.js [--check]
//   --check  build in memory and report, but don't write output files
//
// No database access. Loading into Supabase is a separate step.

const fs = require('fs')
const path = require('path')
const { HISTORY_DIR: ROOT, readCSV, toCSV } = require('./csv')

const OUT = path.join(ROOT, 'normalized')
const CHECK_ONLY = process.argv.includes('--check')
// Seasons from 2025 on are logged on the site itself; never import them from old sources.
const FIRST_SITE_YEAR = 2025

// ---------- normalization helpers ----------
const blank = v => !v || ['-', '?', '\\-'].includes(v.trim())

// Times were often written 12-hour without AM/PM ("6:15" for an evening sit).
// Returns HH:MM in 24-hour time, or '' if unreadable.
function normTime(raw, huntType) {
  if (blank(raw)) return ''
  const m = String(raw).trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return ''
  let h = Number(m[1])
  const min = m[2]
  if (huntType === 'PM' && h < 12) h += 12
  return `${String(h).padStart(2, '0')}:${min}`
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const normDirection = v => (DIRECTIONS.includes((v || '').trim().toUpperCase()) ? v.trim().toUpperCase() : '')

// Parses free-text sightings from the 2018-2020 sheets ("Doe;4-pt;Doe", "(3) does", "12+ turkeys")
// into animal groups. Unrecognized tokens are kept as animal_type 'Unknown' with the raw text in notes.
function parseSightingText(text) {
  if (blank(text)) return []
  return text.split(/[;,]/).map(t => t.trim()).filter(t => t && !blank(t)).map(token => {
    const lower = token.toLowerCase()
    let count = 1
    // leading count: "(3) doe", "2x doe", "2 yearling", "12+ turkeys" - but not "6 pt" / "4-pt" (antler points)
    const notPoints = '(?!\\s*-?\\s*pt)'
    let m = lower.match(/^\((\d+)\)\s*/) || lower.match(new RegExp(`^(\\d+)\\+?${notPoints}\\s*x?\\s+`)) ||
      lower.match(new RegExp(`^(\\d+)x${notPoints}\\s*`))
    let rest = lower
    if (m) { count = Number(m[1]); rest = lower.slice(m[0].length) }
    const g = { animal_type: 'Deer', count, gender: 'Unknown', estimated_age: '', notes: token }
    if (/turkey/.test(rest)) g.animal_type = 'Turkey'
    else if (/coyote|canine/.test(rest)) g.animal_type = 'Coyote'
    else if (/fox/.test(rest)) g.animal_type = 'Fox'
    else if (/dog/.test(rest)) g.animal_type = 'Dog'
    else if (/cat\b/.test(rest)) g.animal_type = 'Cat'
    else if (/bear/.test(rest)) g.animal_type = 'Bear'
    else if (/doe/.test(rest)) g.gender = 'Doe'
    else if (/\d+\s*-?\s*pt|buck|spike|cow.?horn|button/.test(rest)) g.gender = 'Buck'
    else if (/fawn|yearling|deer/.test(rest)) { /* deer, gender unknown */ }
    else g.animal_type = 'Unknown'
    if (/fawn/.test(rest)) g.estimated_age = 'fawn'
    else if (/yearling|baby|button/.test(rest)) g.estimated_age = 'yearling'
    return g
  })
}

// ---------- load mappings ----------
const standMap = new Map(readCSV('stands.csv').map(r => [r.old_name, r]))
const hunterMap = new Map(readCSV('hunters.csv').map(r => [r.old_name, r]))
const corrections = new Map()
for (const c of readCSV('corrections.csv')) {
  if (!corrections.has(c.source_ref)) corrections.set(c.source_ref, [])
  corrections.get(c.source_ref).push(c)
}
const usedCorrections = new Set()
const problems = []

function mapStand(oldName, ref) {
  const s = standMap.get(oldName ?? '')
  if (!s) { problems.push(`${ref}: stand "${oldName}" not in stands.csv`); return '' }
  return s.stand
}
function mapHunter(oldName, ref) {
  const h = hunterMap.get(oldName)
  if (!h) { problems.push(`${ref}: hunter "${oldName}" not in hunters.csv`); return oldName }
  return h.hunter
}

// ---------- build ----------
const hunts = []
const sightings = []

function addHunt(h, groups) {
  // apply corrections for this row
  const fixes = corrections.get(h.source_ref) || []
  for (const f of fixes) {
    usedCorrections.add(f.source_ref)
    if (f.field === 'skip') return
    if (f.field === 'sightings') { groups = parseSightingText(f.value); continue }
    if (!(f.field in h)) { problems.push(`${h.source_ref}: unknown correction field "${f.field}"`); continue }
    h[f.field] = f.value
  }
  if (Number(h.hunt_date.slice(0, 4)) >= FIRST_SITE_YEAR) return
  h.had_harvest = h.shot_outcome === 'harvest'
  h.harvest_count = h.had_harvest ? Number(h.harvest_count || 1) : 0
  hunts.push(h)
  groups.forEach((g, i) => sightings.push({ source_ref: h.source_ref, seq: i + 1, ...g }))
}

const huntBase = (source, ref) => ({
  source_ref: ref, source, hunt_date: '', hunt_type: '', hunter: '', stand: '', original_stand: '',
  shot_outcome: '', harvest_count: '', harvest_description: '', notes: '',
})

// 2018-2020 spreadsheets
for (const file of fs.readdirSync(path.join(ROOT, 'raw/sheets')).filter(f => /-hunting\.csv$/.test(f)).sort()) {
  const rel = `raw/sheets/${file}`
  for (const r of readCSV(rel)) {
    const ref = `${rel.replace('raw/', '')}#${r.rowNumber}`
    if (!r.HUNTER || !r['AM/PM']) continue // date-only placeholder rows
    const h = { ...huntBase('sheet', ref), hunt_date: r.DATE, hunt_type: r['AM/PM'], hunter: mapHunter(r.HUNTER, ref),
      stand: mapStand(r.STAND, ref), original_stand: r.STAND, notes: blank(r.NOTES) ? '' : r.NOTES }
    const harvest = (r.HARVEST || '').trim()
    // 2018 used free text (6-pt / Missed Doe / Hit); 2019-2020 used TRUE/FALSE
    if (harvest === 'TRUE') h.shot_outcome = 'harvest'
    else if (/^missed/i.test(harvest)) h.shot_outcome = 'miss'
    else if (/^hit$/i.test(harvest)) h.shot_outcome = 'wounded_not_recovered'
    else if (harvest && !['FALSE', '-'].includes(harvest)) { h.shot_outcome = 'harvest'; h.harvest_description = harvest }
    const groups = parseSightingText(r.SIGHTINGS)
    const times = (r.TIME || '').split(/[;,]/).map(t => normTime(t, h.hunt_type))
    groups.forEach((g, i) => { g.time_observed = times.length === groups.length ? times[i] : (i === 0 ? times[0] || '' : '') })
    addHunt(h, groups)
  }
}

// 2021-2023 Google Form responses
for (const file of fs.readdirSync(path.join(ROOT, 'raw/forms')).filter(f => f.endsWith('.csv')).sort()) {
  const rel = `raw/forms/${file}`
  for (const r of readCSV(rel)) {
    const ref = `${rel.replace('raw/', '')}#${r.rowNumber}`
    if (!r.Hunter) continue
    const h = { ...huntBase('form', ref), hunt_date: r.Date, hunt_type: r['Morning/Evening'], hunter: mapHunter(r.Hunter, ref),
      stand: mapStand(r.Location, ref), original_stand: r.Location,
      notes: [r['Sighting(s) Notes'], r['Harvest Notes:']].filter(v => !blank(v)).join(' / ') }
    if (r['Harvest?'] === 'TRUE') h.shot_outcome = 'harvest'
    const groups = []
    const bucks = parseInt(r['Number of Bucks Observed'], 10)
    const does = parseInt(r['Number of Does Seen'], 10)
    if (bucks > 0) groups.push({ animal_type: 'Deer', count: bucks, gender: 'Buck', estimated_age: r['Age Of Bucks'],
      time_observed: normTime(r['Time (first) Bucks Arrived'], h.hunt_type), direction: normDirection(r['Buck Arrival Direction']), notes: '' })
    if (does > 0) groups.push({ animal_type: 'Deer', count: does, gender: 'Doe', estimated_age: '',
      time_observed: normTime(r['Time Does (first) Arrived'], h.hunt_type), direction: normDirection(r['Doe Arrival Direction']),
      notes: /\+/.test(r['Number of Does Seen']) ? `reported as ${r['Number of Does Seen']}` : '' })
    // "Yes" to sightings with no counts filled in: record one deer of unknown sex
    if (!groups.length && r['Sighting(s)?'] === 'Yes') groups.push({ animal_type: 'Deer', count: 1, gender: 'Unknown', estimated_age: '',
      time_observed: '', direction: '', notes: 'sighting reported without counts' })
    addHunt(h, groups)
  }
}

// Calendar harvests with no matching sit in the logs (e.g. 2021-11-11, 2024-12-13) become sits
const INITIALS = { DSW: 'Daniel', JBD: 'Jim' }
for (const r of readCSV('raw/calendar/harvests.csv')) {
  const ref = `calendar/harvests.csv#${r.rowNumber}`
  const m = r.title.match(/=\[\s*(\d{4})\s+(\w+)\s+#\d+\s+(AM|PM)\s*\]=/)
  if (!m) { problems.push(`${ref}: unreadable title "${r.title}"`); continue }
  const [, , initials, huntType] = m
  const hunter = INITIALS[initials]
  const fixes = corrections.get(ref) || []
  const date = (fixes.find(f => f.field === 'hunt_date') || {}).value || r.first_date
  if (Number(date.slice(0, 4)) >= FIRST_SITE_YEAR) continue
  const matched = hunts.some(h => h.hunt_date === date && h.hunter === hunter && h.hunt_type === huntType && h.shot_outcome === 'harvest')
  if (matched) { fixes.forEach(f => usedCorrections.add(f.source_ref)); continue }
  const [standText = '', deer = '', time = ''] = r.description.split('\n')[0].split('|').map(s => s.trim())
  const h = { ...huntBase('calendar', ref), hunt_date: date, hunt_type: huntType, hunter, original_stand: standText,
    shot_outcome: 'harvest', harvest_description: deer, notes: `From calendar entry ${r.title}` }
  const groups = [{ animal_type: 'Deer', count: 1, gender: /doe/i.test(deer) ? 'Doe' : 'Buck', estimated_age: '',
    time_observed: normTime(time, huntType), direction: '', notes: deer }]
  addHunt(h, groups)
}

for (const ref of corrections.keys()) if (!usedCorrections.has(ref)) problems.push(`corrections.csv: ${ref} did not match any row`)
for (const h of hunts) {
  if (!['AM', 'PM'].includes(h.hunt_type)) problems.push(`${h.source_ref}: hunt_type "${h.hunt_type}"`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(h.hunt_date)) problems.push(`${h.source_ref}: hunt_date "${h.hunt_date}"`)
  if (h.source === 'calendar' && !h.stand) problems.push(`${h.source_ref}: calendar harvest needs a stand correction`)
}
const unknownSightings = sightings.filter(s => s.animal_type === 'Unknown')
unknownSightings.forEach(s => problems.push(`${s.source_ref}: unrecognized sighting "${s.notes}"`))

// ---------- output ----------
hunts.sort((a, b) => a.hunt_date.localeCompare(b.hunt_date) || a.hunt_type.localeCompare(b.hunt_type) || a.hunter.localeCompare(b.hunter))
const HUNT_COLS = ['source_ref', 'source', 'hunt_date', 'hunt_type', 'hunter', 'stand', 'original_stand',
  'had_harvest', 'harvest_count', 'harvest_description', 'shot_outcome', 'notes']
const SIGHT_COLS = ['source_ref', 'seq', 'animal_type', 'count', 'gender', 'estimated_age', 'time_observed', 'direction', 'notes']

if (!CHECK_ONLY) {
  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(path.join(OUT, 'hunts.csv'), toCSV(hunts, HUNT_COLS))
  fs.writeFileSync(path.join(OUT, 'sightings.csv'), toCSV(sightings, SIGHT_COLS))
}

const byYear = {}
for (const h of hunts) {
  const y = h.hunt_date.slice(0, 4)
  byYear[y] ??= { sits: 0, harvests: 0 }
  byYear[y].sits++
  byYear[y].harvests += h.had_harvest ? 1 : 0
}
console.log(`hunts: ${hunts.length}   sightings: ${sightings.length}${CHECK_ONLY ? '   (check only, nothing written)' : ''}`)
console.table(byYear)
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`)
  problems.forEach(p => console.log('  - ' + p))
  process.exitCode = 1
} else console.log('no problems found')
