import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatForDB } from '@/lib/utils/date'
import type { SeasonCalendar, SeasonSpecies, SeasonType } from '@/types/database'

export type { SeasonCalendar, SeasonSpecies, SeasonType }

// Returned by getNextSeasonOpener — a focused shape, not the full row
export type SeasonOpener = {
  opens: string
  closes: string
  season_year: number
  season_type: SeasonType
  is_estimated: boolean
}

// The club is in central NC. Deer seasons are zone-scoped; turkey is statewide (zone IS NULL).
// Every query filters to "central NC or statewide" so both are naturally included.
const ZONE_FILTER = 'zone.eq.central,zone.is.null'

/**
 * Returns the active season row for a species on a given date (default: today).
 * Returns null when between seasons.
 *
 * If passing a date derived from a DB string, use parseDBDate() — NOT new Date(dbString).
 * new Date("YYYY-MM-DD") parses as UTC midnight, which is the previous evening in Eastern time.
 */
export async function getCurrentSeason(
  species: SeasonSpecies,
  date?: Date
): Promise<SeasonCalendar | null> {
  const supabase = await createServerSupabaseClient()
  const dateStr = date ? formatForDB(date) : formatForDB(new Date())

  const { data, error } = await supabase
    .from('season_calendar')
    .select('*')
    .eq('species', species)
    .lte('opens', dateStr)
    .gte('closes', dateStr)
    .or(ZONE_FILTER)
    .order('opens', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getCurrentSeason error:', error.message)
    return null
  }
  return data
}

/**
 * Returns the next season opener for a species after a given date (default: today).
 * Returns null if no future season is seeded.
 *
 * If passing a date derived from a DB string, use parseDBDate() — NOT new Date(dbString).
 */
export async function getNextSeasonOpener(
  species: SeasonSpecies,
  after?: Date
): Promise<SeasonOpener | null> {
  const supabase = await createServerSupabaseClient()
  const dateStr = after ? formatForDB(after) : formatForDB(new Date())

  const { data, error } = await supabase
    .from('season_calendar')
    .select('opens, closes, season_year, season_type, confidence')
    .eq('species', species)
    .gt('opens', dateStr)
    .or(ZONE_FILTER)
    .order('opens', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('getNextSeasonOpener error:', error.message)
    return null
  }

  return {
    opens: data.opens,
    closes: data.closes,
    season_year: data.season_year,
    season_type: data.season_type as SeasonType,
    is_estimated: data.confidence === 'estimated',
  }
}

/**
 * Returns all season rows for a given year, ordered by open date.
 */
export async function getSeasonsByYear(season_year: number): Promise<SeasonCalendar[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('season_calendar')
    .select('*')
    .eq('season_year', season_year)
    .or(ZONE_FILTER)
    .order('opens', { ascending: true })

  if (error) {
    console.error('getSeasonsByYear error:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Returns the season row that a specific hunt date falls within, for a given species.
 * Used internally to derive season type and year for a given hunt.
 */
export async function getSeasonForDate(
  huntDate: string,
  species: SeasonSpecies
): Promise<SeasonCalendar | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('season_calendar')
    .select('*')
    .eq('species', species)
    .lte('opens', huntDate)
    .gte('closes', huntDate)
    .or(ZONE_FILTER)
    .order('opens', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getSeasonForDate error:', error.message)
    return null
  }
  return data
}

/**
 * Returns the season type ('archery' | 'blackpowder' | 'gun' | 'turkey') for a hunt date.
 * Returns null if the date falls outside any seeded season.
 */
export async function getSeasonType(
  huntDate: string,
  species: SeasonSpecies
): Promise<SeasonType | null> {
  const season = await getSeasonForDate(huntDate, species)
  return season ? (season.season_type as SeasonType) : null
}

/**
 * Returns the season year for a hunt date.
 * Returns null if the date falls outside any seeded season.
 */
export async function getSeasonYear(
  huntDate: string,
  species: SeasonSpecies
): Promise<number | null> {
  const season = await getSeasonForDate(huntDate, species)
  return season ? season.season_year : null
}
