// Shared types for /reports. Pure: safe to import from server and client code.

export type ReportHuntType = 'AM' | 'PM' | 'All Day'

/** One hunt (sit), denormalized with everything the reports need. */
export interface ReportSit {
  id: string
  huntDate: string // YYYY-MM-DD
  season: number | null // season start year (a Jan 1 hunt belongs to the previous year's season)
  seasonType: string | null // archery | blackpowder | gun | null
  huntType: ReportHuntType
  memberId: string
  /** Grouping key for the hunter filter: the member id, or 'guest' for the shared Guest account */
  hunterKey: string
  hunterName: string
  /** Real name of a guest logged under the shared Guest account ("Guest: <name>" in the notes) */
  guestName: string | null
  standId: string | null
  standName: string | null
  standActive: boolean
  deer: number // total deer seen
  bucks: number
  does: number
  sawDeer: boolean
  /** Any animal recorded (deer, turkey, coyote...) - used only for checks against the old spreadsheets */
  sawAnyAnimal: boolean
  harvests: number
  /** Imported only because it was a harvest on the old calendar; no record of the sit otherwise */
  calendarOnly: boolean
}

export interface SitStats {
  sits: number // sits counted in rates
  sitsSawDeer: number
  deer: number
  bucks: number
  does: number
  /** Harvest total, including calendar-only harvests that are left out of rates */
  harvests: number
  sitsWithHarvest: number // among sits counted in rates
  sawDeerRate: number | null // null when sits = 0
  deerPerSit: number | null
  bucksPerSit: number | null
  doesPerSit: number | null
  harvestRate: number | null
  smallSample: boolean
}

export interface ReportFilters {
  /** 'all' or specific season years */
  seasons: 'all' | number[]
  seasonType: string | null
  hunterKey: string | null
  standId: string | null
  includeInactiveStands: boolean
  /** Data-quality toggles (see data-quality.ts) */
  includeIncompleteSeasons: boolean
  calendarOnlyInRates: boolean
}

export interface SeasonOption {
  season: number
  sits: number
}
