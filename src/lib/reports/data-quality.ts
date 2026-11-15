// Data-quality rules for /reports, defined once. Pure: used on the server and in the browser.
// Background: data/history/README.md (how 2018-2024 history was imported).

import type { ReportFilters, ReportSit } from './types'

/** Seasons left out of "all seasons" by default: too little was logged to compare. */
export const INCOMPLETE_SEASONS: Record<number, string> = {
  2022: 'Only 3 sits were logged in 2022. This is missing data, not a slow season.',
}

/** Footnotes shown wherever these seasons appear. */
export const SEASON_NOTES: Record<number, string> = {
  2019: 'Season dates for 2019 are estimated, so archery/blackpowder/gun labels may be off near the boundaries.',
  2021: 'Only October-December sits were logged in 2021.',
  2024: 'No sits were logged in 2024. The only record is one harvest from the old calendar.',
}

export const DATA_NOTES = {
  calendarOnly:
    'Two harvests (2021-11-11 and 2024-12-13) are known only from the old calendar, which recorded harvests but not the sits around them. They count in harvest totals but are left out of rates so they don\'t inflate them.',
  standMoves:
    'Stands have moved over the years and there is no record of when, so a stand\'s history can mix locations.',
  guests:
    'Guests without a site account are logged under the shared Guest account and grouped as "Guests".',
  sightings:
    'Before 2025, sightings were parsed from the old spreadsheets and forms, so detail varies by year.',
}

/** Open issues that affect accuracy, linked in the page footer. */
export const KNOWN_ISSUES = [
  { number: 168, title: 'Removing a sighting in the edit form does not delete it' },
  { number: 167, title: 'Logging a harvest does not add a sighting automatically' },
  { number: 102, title: 'hunt_logs data audit' },
]

export const DEFAULT_QUALITY = {
  includeIncompleteSeasons: false,
  calendarOnlyInRates: false,
}

/**
 * Applies the filters. Incomplete seasons are dropped from an "all seasons" view unless
 * includeIncompleteSeasons is on; picking an incomplete season explicitly always shows it.
 */
export function applyFilters(sits: ReportSit[], f: ReportFilters): ReportSit[] {
  return sits.filter(s => {
    if (f.seasons === 'all') {
      if (!f.includeIncompleteSeasons && s.season !== null && INCOMPLETE_SEASONS[s.season]) return false
    } else if (s.season === null || !f.seasons.includes(s.season)) return false
    if (f.seasonType && s.seasonType !== f.seasonType) return false
    if (f.hunterKey && s.hunterKey !== f.hunterKey) return false
    if (f.standId && s.standId !== f.standId) return false
    // includeInactiveStands only affects which rows the stand table shows, never the totals
    return true
  })
}

/** Notes that apply to the seasons in view. */
export function notesForSeasons(seasons: number[]): { season: number; note: string }[] {
  return seasons
    .filter(s => INCOMPLETE_SEASONS[s] || SEASON_NOTES[s])
    .map(s => ({ season: s, note: INCOMPLETE_SEASONS[s] ?? SEASON_NOTES[s] }))
}
