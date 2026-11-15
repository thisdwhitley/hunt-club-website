#!/usr/bin/env node
// Loads data/history/normalized/*.csv into Supabase.
//
// Usage:
//   NODE_PATH=node_modules node scripts/history/load-history.js           # dry run (default): reads only, writes nothing
//   NODE_PATH=node_modules node scripts/history/load-history.js --apply   # writes to the database
//
// What it does:
//   1. Creates any missing inactive stands listed in data/history/stands.csv (status new_inactive)
//   2. Inserts each hunt into hunt_logs, plus its hunt_sightings rows and (for harvests) a hunt_harvests row
//   3. Records every loaded row in data/history/loaded.csv (source_ref -> hunt_log id), written after each hunt
//   4. Recalculates stand statistics from the full hunt log (fixes trigger side effects of inserting old hunts)
//
// Safe to re-run: rows already in loaded.csv are skipped, and so is any hunt that already exists in the
// database with the same date, AM/PM, hunter and stand.
//
// Rollback: delete the hunt_logs ids listed in loaded.csv (sightings and harvests cascade), delete the
// inactive stands it created (listed in its output), then re-run with --recalc-only --apply.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local. No schema changes.

const fs = require('fs')
const path = require('path')
const { HISTORY_DIR, readCSV, toCSV } = require('./csv')

const APPLY = process.argv.includes('--apply')
const RECALC_ONLY = process.argv.includes('--recalc-only')
const MANIFEST = path.join(HISTORY_DIR, 'loaded.csv')
const MANIFEST_COLS = ['source_ref', 'hunt_log_id', 'harvest_id', 'sightings', 'loaded_at']
const GUEST_ACCOUNT = 'Guest' // members.display_name of the shared, login-less guest account

// ---------- setup ----------
function loadEnv() {
  const file = path.resolve(__dirname, '../../.env.local')
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split('\n')
    .filter(l => /^[A-Z_][A-Z0-9_]*=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))
}
const env = loadEnv()
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function q(promise, what) {
  const { data, error } = await promise
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

// Fetches every row of a table (PostgREST caps each request at 1000 rows)
async function fetchAll(table, columns, filter = x => x) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const page = await q(filter(sb.from(table).select(columns)).range(from, from + 999), `read ${table}`)
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

// ---------- mapping helpers ----------
const seasonYear = date => { const [y, m] = date.split('-').map(Number); return m >= 7 ? y : y - 1 }
const standKey = s => (s || '').toLowerCase().replace(/[’']/g, '').replace(/\bstand\b/g, '').replace(/[^a-z0-9]/g, '')
const OUTCOME_NOTE = { miss: 'Shot outcome: missed', wounded_not_recovered: 'Shot outcome: hit, not recovered' }

function huntNotes(h, guestName) {
  const parts = []
  if (guestName) parts.push(`Guest: ${guestName}`)
  if (OUTCOME_NOTE[h.shot_outcome]) parts.push(OUTCOME_NOTE[h.shot_outcome])
  if (h.notes) parts.push(h.notes)
  if (h.original_stand && h.source !== 'calendar' && standKey(h.original_stand) !== standKey(h.stand)) {
    parts.push(`Recorded as stand: ${h.original_stand}`)
  }
  return parts.length ? parts.join('\n') : null
}

// Sighting notes that only restate the animal ("Doe", "(3) does") add nothing - drop them
function sightingNotes(note) {
  if (!note) return null
  const core = note.toLowerCase().replace(/^\(?\d+\+?\)?\s*x?\s*/, '').trim()
  return /^(does?|bucks?|deer|fox|cat|coyote|turkeys?|dogs?)$/.test(core) ? null : note
}

function harvestRow(h) {
  const desc = h.harvest_description || ''
  const points = desc.match(/(\d+)\s*-?\s*pt/i)
  return {
    animal_type: 'Deer',
    gender: /doe/i.test(desc) ? 'Doe' : /pt|buck|cow.?horn|button/i.test(desc) ? 'Buck' : 'Unknown',
    antler_points: points ? Number(points[1]) : null,
    recovery_notes: desc ? `Recorded as: ${desc}` : null,
  }
}

// ---------- main ----------
async function main() {
  console.log(APPLY ? '*** APPLY MODE: writing to the database ***' : 'DRY RUN: nothing will be written (use --apply to write)')

  const members = await q(sb.from('members').select('id, display_name, role'), 'read members')
  const memberByName = new Map(members.map(m => [m.display_name, m]))
  const memberName = new Map(members.map(m => [m.id, m.display_name]))
  let stands = await q(sb.from('stands').select('id, name, active, type, total_hunts, total_harvests, last_used_date, last_hunted, last_hunted_by, last_harvest, last_harvest_by, success_rate'), 'read stands')

  const manifest = fs.existsSync(MANIFEST) ? readCSV('loaded.csv') : []
  const loadedRefs = new Set(manifest.map(r => r.source_ref))

  // --- stands ---
  const standRows = readCSV('stands.csv')
  const toCreate = []
  for (const s of standRows) {
    if (!s.stand || s.status === 'no_stand') continue
    if (stands.some(x => x.name === s.stand) || toCreate.some(x => x.name === s.stand)) continue
    if (s.status !== 'new_inactive') throw new Error(`stand "${s.stand}" (from "${s.old_name}") is marked existing but isn't in the database`)
    toCreate.push({ name: s.stand, active: false, type: s.type || 'ladder_stand', description: s.notes ? `Historical stand (no longer in use): ${s.notes}` : 'Historical stand (no longer in use)' })
  }
  if (!RECALC_ONLY) {
    console.log(`\nInactive stands to create: ${toCreate.length ? toCreate.map(s => s.name).join(', ') : 'none'}`)
    if (APPLY && toCreate.length) {
      const created = await q(sb.from('stands').insert(toCreate).select('id, name'), 'create stands')
      created.forEach(s => console.log(`  created stand ${s.name} (${s.id})`))
      stands = await q(sb.from('stands').select('id, name, active, type, total_hunts, total_harvests, last_used_date, last_hunted, last_hunted_by, last_harvest, last_harvest_by, success_rate'), 'read stands')
    }
  }
  const standId = name => (stands.find(s => s.name === name) || {}).id || (toCreate.some(s => s.name === name) ? `(new:${name})` : undefined)

  // --- hunters ---
  const hunterRows = new Map(readCSV('hunters.csv').map(r => [r.hunter, r]))
  function resolveHunter(name) {
    const h = hunterRows.get(name)
    if (!h) throw new Error(`hunter "${name}" missing from hunters.csv`)
    if (h.status === 'guest_no_account') {
      const g = memberByName.get(GUEST_ACCOUNT)
      if (!g) throw new Error(`shared "${GUEST_ACCOUNT}" member account not found`)
      return { memberId: g.id, guestName: name }
    }
    const m = memberByName.get(h.hunter)
    if (!m) throw new Error(`member "${h.hunter}" not found in members`)
    return { memberId: m.id, guestName: null }
  }

  // --- hunts ---
  const hunts = readCSV('normalized/hunts.csv')
  const sightingsByRef = new Map()
  for (const s of readCSV('normalized/sightings.csv')) {
    if (!sightingsByRef.has(s.source_ref)) sightingsByRef.set(s.source_ref, [])
    sightingsByRef.get(s.source_ref).push(s)
  }

  // existing pre-2025 hunts, to avoid duplicating anything already in the database
  const existing = await fetchAll('hunt_logs', 'id, hunt_date, hunt_type, member_id, stand_id, notes', b => b.lt('hunt_date', '2025-01-01'))
  const guestOf = notes => ((notes || '').match(/^Guest: (.+)$/m) || [])[1] || ''
  const naturalKey = (date, type, member, stand, guest) => [date, type, member, stand || '', guest || ''].join('|')
  const existingKeys = new Set(existing.map(e => naturalKey(e.hunt_date, e.hunt_type, e.member_id, e.stand_id, guestOf(e.notes))))

  const plan = []
  const skipped = { manifest: 0, duplicate: 0 }
  const seenKeys = new Set()
  for (const h of hunts) {
    if (loadedRefs.has(h.source_ref)) { skipped.manifest++; continue }
    const { memberId, guestName } = resolveHunter(h.hunter)
    const sId = h.stand ? standId(h.stand) : null
    if (h.stand && !sId) throw new Error(`${h.source_ref}: stand "${h.stand}" not found`)
    const key = naturalKey(h.hunt_date, h.hunt_type, memberId, sId, guestName)
    if (existingKeys.has(key)) { skipped.duplicate++; continue }
    if (seenKeys.has(key)) throw new Error(`${h.source_ref}: two import rows for the same date/AM-PM/hunter/stand`)
    seenKeys.add(key)
    const hadHarvest = h.had_harvest === 'true'
    const sightings = (sightingsByRef.get(h.source_ref) || []).map(s => {
      const longAge = s.estimated_age && s.estimated_age.length > 20
      return {
        animal_type: s.animal_type,
        count: Number(s.count) || 1,
        gender: s.gender || 'Unknown',
        estimated_age: longAge ? null : (s.estimated_age || null),
        time_observed: s.time_observed ? `${s.time_observed}:00` : null,
        direction: s.direction || null,
        notes: [sightingNotes(s.notes), longAge ? `Age: ${s.estimated_age}` : null].filter(Boolean).join(' / ') || null,
      }
    })
    plan.push({
      ref: h.source_ref,
      hunt: {
        member_id: memberId, stand_id: sId, hunt_date: h.hunt_date, hunt_type: h.hunt_type,
        had_harvest: hadHarvest, harvest_count: hadHarvest ? Number(h.harvest_count) || 1 : 0,
        season: String(seasonYear(h.hunt_date)), notes: huntNotes(h, guestName),
      },
      sightings,
      harvest: hadHarvest ? harvestRow(h) : null,
    })
  }

  if (!RECALC_ONLY) {
    const byHunter = {}
    for (const p of plan) { const n = memberName.get(p.hunt.member_id); byHunter[n] = (byHunter[n] || 0) + 1 }
    console.log(`\nHunts to insert: ${plan.length}   (skipped: ${skipped.manifest} already loaded, ${skipped.duplicate} already in database)`)
    console.log(`Sightings to insert: ${plan.reduce((n, p) => n + p.sightings.length, 0)}   Harvest records to insert: ${plan.filter(p => p.harvest).length}`)
    console.log('Hunts by account:', byHunter)
    const sample = plan.find(p => p.harvest && p.hunt.notes) || plan[0]
    if (sample) console.log('\nExample row:', JSON.stringify({ ref: sample.ref, ...sample }, null, 2))
  }

  // --- write hunts ---
  if (APPLY && !RECALC_ONLY && plan.length) {
    let done = 0
    for (const p of plan) {
      const [inserted] = await q(sb.from('hunt_logs').insert(p.hunt).select('id'), `${p.ref}: insert hunt`)
      try {
        if (p.sightings.length) await q(sb.from('hunt_sightings').insert(p.sightings.map(s => ({ ...s, hunt_log_id: inserted.id }))), `${p.ref}: insert sightings`)
        let harvestId = ''
        if (p.harvest) harvestId = (await q(sb.from('hunt_harvests').insert({ ...p.harvest, hunt_log_id: inserted.id }).select('id'), `${p.ref}: insert harvest`))[0].id
        manifest.push({ source_ref: p.ref, hunt_log_id: inserted.id, harvest_id: harvestId, sightings: p.sightings.length, loaded_at: new Date().toISOString() })
        fs.writeFileSync(MANIFEST, toCSV(manifest, MANIFEST_COLS))
        done++
      } catch (err) {
        // undo this hunt so nothing is left half-loaded (sightings/harvests cascade on delete)
        await sb.from('hunt_logs').delete().eq('id', inserted.id)
        throw new Error(`${err.message} - rolled back this hunt; ${done} hunts loaded before it are recorded in loaded.csv`)
      }
    }
    console.log(`\nInserted ${done} hunts. Manifest: data/history/loaded.csv`)
  }

  // --- recalculate stand statistics from the full hunt log ---
  const allHunts = APPLY
    ? await fetchAll('hunt_logs', 'stand_id, hunt_date, member_id, had_harvest, harvest_count, created_at')
    : [...await fetchAll('hunt_logs', 'stand_id, hunt_date, member_id, had_harvest, harvest_count, created_at'),
       ...(RECALC_ONLY ? [] : plan.map(p => ({ ...p.hunt, created_at: '' })))]
  const latest = list => list.reduce((a, b) => (!a || b.hunt_date > a.hunt_date || (b.hunt_date === a.hunt_date && b.created_at > a.created_at) ? b : a), null)
  console.log('\nStand statistics (current -> recalculated from the full hunt log):')
  const updates = []
  for (const s of stands) {
    const hs = allHunts.filter(h => h.stand_id === s.id)
    const harvests = hs.filter(h => h.had_harvest || (h.harvest_count || 0) > 0)
    const last = latest(hs)
    const lastHarvest = latest(harvests)
    const totalHarvests = hs.reduce((n, h) => n + (h.harvest_count || (h.had_harvest ? 1 : 0)), 0)
    const next = {
      total_hunts: hs.length,
      total_harvests: totalHarvests,
      last_used_date: last ? last.hunt_date : null,
      last_hunted: last ? last.hunt_date : null,
      last_hunted_by: last ? last.member_id : null,
      last_harvest: lastHarvest ? lastHarvest.hunt_date : null,
      last_harvest_by: lastHarvest ? lastHarvest.member_id : null,
      success_rate: hs.length ? Math.round((totalHarvests / hs.length) * 10000) / 100 : 0,
    }
    const changed = Object.keys(next).filter(k => String(next[k] ?? '') !== String(s[k] ?? '') && !(k === 'success_rate' && Number(next[k]) === Number(s[k] ?? 0)))
    if (!changed.length) continue
    updates.push({ id: s.id, ...next })
    const show = k => (k.endsWith('_by') ? memberName.get(s[k]) : s[k]) ?? '-'
    const showNext = k => (k.endsWith('_by') ? memberName.get(next[k]) : next[k]) ?? '-'
    console.log(`  ${s.name}${s.active ? '' : ' (inactive)'}: ` + ['total_hunts', 'total_harvests', 'last_hunted', 'last_hunted_by']
      .map(k => `${k} ${show(k)} -> ${showNext(k)}`).join(', '))
  }
  if (!updates.length) console.log('  no changes')
  if (APPLY && updates.length) {
    for (const u of updates) {
      const { id, ...fields } = u
      await q(sb.from('stands').update(fields).eq('id', id), `update stand ${id}`)
    }
    console.log(`Updated statistics on ${updates.length} stand(s).`)
  }
  if (!APPLY) console.log('\nDry run complete. Nothing was written.')
}

main().catch(err => { console.error('\nFAILED:', err.message); process.exit(1) })
