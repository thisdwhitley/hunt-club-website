// Turns raw database rows into ReportSit[]. Pure (no Supabase imports) so the acceptance
// check script can reuse it with rows fetched by a service-key client.

import type { ReportHuntType, ReportSit } from './types'

export interface RawHunt {
  id: string
  hunt_date: string
  hunt_type: string | null
  member_id: string
  stand_id: string | null
  season: string | null
  hunting_season: string | null
  had_harvest: boolean | null
  harvest_count: number | null
  notes: string | null
}

export interface RawSighting {
  hunt_log_id: string
  animal_type: string | null
  count: number | null
  gender: string | null
}

export interface RawStand {
  id: string
  name: string
  active: boolean | null
}

export interface RawMember {
  id: string
  display_name: string | null
  full_name: string | null
  role: string | null
}

const GUEST_NOTE = /^Guest: (.+)$/m
const CALENDAR_NOTE = /^From calendar entry/m

/** Season start year from a hunt date when the season column is empty (Jan-Jun belongs to last season). */
export function seasonFromDate(date: string): number {
  const [y, m] = date.split('-').map(Number)
  return m >= 7 ? y : y - 1
}

export function buildReportSits(
  hunts: RawHunt[],
  sightings: RawSighting[],
  stands: RawStand[],
  members: RawMember[],
): ReportSit[] {
  const standById = new Map(stands.map(s => [s.id, s]))
  const memberById = new Map(members.map(m => [m.id, m]))

  const seen = new Map<string, { deer: number; bucks: number; does: number; any: boolean }>()
  for (const s of sightings) {
    const entry = seen.get(s.hunt_log_id) ?? { deer: 0, bucks: 0, does: 0, any: false }
    const count = s.count && s.count > 0 ? s.count : 1
    entry.any = true
    if (s.animal_type === 'Deer') {
      entry.deer += count
      if (s.gender === 'Buck') entry.bucks += count
      if (s.gender === 'Doe') entry.does += count
    }
    seen.set(s.hunt_log_id, entry)
  }

  return hunts.map(h => {
    const member = memberById.get(h.member_id)
    const isGuestAccount = member?.role === 'guest' && member.display_name === 'Guest'
    const guestName = isGuestAccount ? (h.notes?.match(GUEST_NOTE)?.[1]?.trim() ?? null) : null
    const stand = h.stand_id ? standById.get(h.stand_id) : undefined
    const s = seen.get(h.id)
    const harvests = h.harvest_count && h.harvest_count > 0 ? h.harvest_count : h.had_harvest ? 1 : 0
    const parsedSeason = h.season ? Number(h.season) : NaN

    return {
      id: h.id,
      huntDate: h.hunt_date,
      season: Number.isFinite(parsedSeason) ? parsedSeason : seasonFromDate(h.hunt_date),
      seasonType: h.hunting_season || null,
      huntType: (h.hunt_type === 'PM' || h.hunt_type === 'All Day' ? h.hunt_type : 'AM') as ReportHuntType,
      memberId: h.member_id,
      hunterKey: isGuestAccount ? 'guest' : h.member_id,
      hunterName: isGuestAccount ? 'Guests' : (member?.display_name || member?.full_name || 'Unknown'),
      guestName,
      standId: h.stand_id,
      standName: stand?.name ?? null,
      standActive: stand?.active ?? true,
      deer: s?.deer ?? 0,
      bucks: s?.bucks ?? 0,
      does: s?.does ?? 0,
      sawDeer: (s?.deer ?? 0) > 0,
      sawAnyAnimal: s?.any ?? false,
      harvests,
      calendarOnly: CALENDAR_NOTE.test(h.notes ?? ''),
    }
  })
}
