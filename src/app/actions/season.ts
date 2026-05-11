'use server'

import { getSeasonType, getCurrentSeason, getNextSeasonOpener } from '@/lib/seasons'
import type { SeasonType } from '@/types/database'
import type { SeasonOpener } from '@/lib/seasons'

export async function lookupSeasonType(
  huntDate: string,
  species: 'deer' | 'turkey' = 'deer'
): Promise<SeasonType | null> {
  return getSeasonType(huntDate, species)
}

export type SeasonStatus =
  | { status: 'active'; season_year: number; season_type: SeasonType }
  | { status: 'off'; opener: SeasonOpener | null }

export async function lookupSeasonStatus(
  species: 'deer' | 'turkey' = 'deer'
): Promise<SeasonStatus> {
  const active = await getCurrentSeason(species)
  if (active) {
    return {
      status: 'active',
      season_year: active.season_year,
      season_type: active.season_type as SeasonType,
    }
  }
  const opener = await getNextSeasonOpener(species)
  return { status: 'off', opener }
}
