// Server-only data access for /reports. Reads with the signed-in user's client, so RLS applies.

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentSeason } from '@/lib/seasons'
import { formatForDB } from '@/lib/utils/date'
import { buildReportSits, type RawHunt, type RawMember, type RawSighting, type RawStand } from './build'
import type { ReportSit, SeasonOption } from './types'

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

// PostgREST returns at most 1000 rows per request
async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) return rows
  }
}

export async function getReportSits(client?: ServerClient): Promise<ReportSit[]> {
  const supabase = client ?? await createServerSupabaseClient()
  const [hunts, sightings, stands, members] = await Promise.all([
    fetchAll<RawHunt>((a, b) => supabase.from('hunt_logs')
      .select('id, hunt_date, hunt_type, member_id, stand_id, season, hunting_season, had_harvest, harvest_count, notes')
      .order('hunt_date').range(a, b)),
    fetchAll<RawSighting>((a, b) => supabase.from('hunt_sightings')
      .select('hunt_log_id, animal_type, count, gender').range(a, b)),
    fetchAll<RawStand>((a, b) => supabase.from('stands').select('id, name, active').range(a, b)),
    fetchAll<RawMember>((a, b) => supabase.from('members').select('id, display_name, full_name, role').range(a, b)),
  ])
  return buildReportSits(hunts, sightings, stands, members)
}

/**
 * Default season for the page: the current deer season if one is open today, otherwise the most
 * recent season that has started (e.g. spring 2027 -> 2026; early September before archery -> last season).
 */
export async function getDefaultSeason(seasons: SeasonOption[], client?: ServerClient): Promise<number | null> {
  const current = await getCurrentSeason('deer')
  if (current) return current.season_year

  const supabase = client ?? await createServerSupabaseClient()
  const { data } = await supabase
    .from('season_calendar')
    .select('season_year')
    .eq('species', 'deer')
    .or('zone.eq.central,zone.is.null')
    .lte('opens', formatForDB(new Date()))
    .order('opens', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data) return data.season_year

  return seasons.length ? Math.max(...seasons.map(s => s.season)) : null
}

/** Seasons that have any sits, newest first. */
export function seasonOptions(sits: ReportSit[]): SeasonOption[] {
  const counts = new Map<number, number>()
  for (const s of sits) if (s.season !== null) counts.set(s.season, (counts.get(s.season) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([season, sits]) => ({ season, sits }))
}
