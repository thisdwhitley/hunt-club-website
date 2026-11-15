// Metric definitions for /reports. Pure: used on the server and in the browser (filters recompute
// client-side). Definitions are documented in docs/plans/reports-page.md and CLAUDE.md.

import type { ReportSit, SitStats } from './types'

/** Below this many sits a rate is shown muted and marked "small sample". */
export const SMALL_SAMPLE = 10

/** A stand is labeled a morning/evening stand only with this many sits on each side... */
export const LEAN_MIN_SITS = 10
/** ...and when its AM and PM saw-deer rates differ by at least this much (0.15 = 15 points). */
export const LEAN_MIN_DIFF = 0.15

interface SummarizeOptions {
  /** Count calendar-only sits (harvest-only records) in rates. Default false. */
  calendarOnlyInRates?: boolean
}

const rate = (n: number, d: number) => (d > 0 ? n / d : null)

/**
 * Sit: one hunt_logs row. Saw deer: at least one Deer sighting. Deer per sit: deer seen / sits.
 * Harvest rate: sits with a harvest / sits. Calendar-only sits add to the harvest total but
 * are left out of every rate unless calendarOnlyInRates is set.
 */
export function summarize(sits: ReportSit[], options: SummarizeOptions = {}): SitStats {
  let counted = 0, sawDeer = 0, deer = 0, bucks = 0, does = 0, harvests = 0, withHarvest = 0
  for (const s of sits) {
    harvests += s.harvests
    if (s.calendarOnly && !options.calendarOnlyInRates) continue
    counted++
    if (s.sawDeer) sawDeer++
    deer += s.deer
    bucks += s.bucks
    does += s.does
    if (s.harvests > 0) withHarvest++
  }
  return {
    sits: counted,
    sitsSawDeer: sawDeer,
    deer,
    bucks,
    does,
    harvests,
    sitsWithHarvest: withHarvest,
    sawDeerRate: rate(sawDeer, counted),
    deerPerSit: rate(deer, counted),
    bucksPerSit: rate(bucks, counted),
    doesPerSit: rate(does, counted),
    harvestRate: rate(withHarvest, counted),
    smallSample: counted < SMALL_SAMPLE,
  }
}

/** Groups sits by a key and summarizes each group. Groups come back in first-seen order unless `order` is given. */
export function groupStats<K extends string | number>(
  sits: ReportSit[],
  keyOf: (s: ReportSit) => K | null,
  options: SummarizeOptions & { order?: K[] } = {},
): { key: K; stats: SitStats }[] {
  const groups = new Map<K, ReportSit[]>()
  for (const s of sits) {
    const k = keyOf(s)
    if (k === null) continue
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(s)
  }
  const keys = options.order ? options.order.filter(k => groups.has(k)) : [...groups.keys()]
  return keys.map(key => ({ key, stats: summarize(groups.get(key)!, options) }))
}

/** 'morning' / 'evening' when the sample supports it, otherwise null. */
export function standLean(am: SitStats | undefined, pm: SitStats | undefined): 'morning' | 'evening' | null {
  if (!am || !pm || am.sits < LEAN_MIN_SITS || pm.sits < LEAN_MIN_SITS) return null
  if (am.sawDeerRate === null || pm.sawDeerRate === null) return null
  const diff = am.sawDeerRate - pm.sawDeerRate
  if (diff >= LEAN_MIN_DIFF) return 'morning'
  if (-diff >= LEAN_MIN_DIFF) return 'evening'
  return null
}
