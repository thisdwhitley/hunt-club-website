'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  HuntLogInsert,
  HuntLogUpdate,
  HuntHarvest,
  HuntHarvestInsert,
  HuntSighting,
} from '@/types/database'

type SightingInput = {
  animal_type: string
  count?: number
  gender?: string | null
  estimated_age?: string | null
  behavior?: string | null
  distance_yards?: number | null
  direction?: string | null
  time_observed?: string | null
  notes?: string | null
}

// ============================================================================
// HUNT LOG MUTATIONS
// ============================================================================

export async function createHunt(huntData: HuntLogInsert): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('hunt_logs')
    .insert(huntData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating hunt:', error.message, error.code, error.details, error.hint)
    throw new Error(error.message || 'Failed to create hunt')
  }

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
  return data.id
}

export async function updateHunt(huntId: string, updates: Partial<HuntLogUpdate>): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('hunt_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', huntId)

  if (error) {
    console.error('Error updating hunt:', error)
    throw new Error(`Failed to update hunt: ${error.message}`)
  }

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function deleteHunt(huntId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { error: sightingsError } = await supabase
    .from('hunt_sightings')
    .delete()
    .eq('hunt_log_id', huntId)
  if (sightingsError) throw new Error(`Failed to delete hunt sightings: ${sightingsError.message}`)

  const { error: harvestsError } = await supabase
    .from('hunt_harvests')
    .delete()
    .eq('hunt_log_id', huntId)
  if (harvestsError) throw new Error(`Failed to delete hunt harvests: ${harvestsError.message}`)

  const { error: huntError } = await supabase
    .from('hunt_logs')
    .delete()
    .eq('id', huntId)
  if (huntError) throw new Error(`Failed to delete hunt log: ${huntError.message}`)

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function bulkDeleteHunts(
  huntIds: string[]
): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = []
  const failed: string[] = []

  for (const huntId of huntIds) {
    try {
      await deleteHunt(huntId)
      succeeded.push(huntId)
    } catch (error) {
      console.error(`Failed to delete hunt ${huntId}:`, error)
      failed.push(huntId)
    }
  }

  // revalidatePath already called per-delete inside deleteHunt
  return { succeeded, failed }
}

// ============================================================================
// HARVEST MUTATIONS
// ============================================================================

export async function saveHarvestDetails(
  huntLogId: string,
  harvestData: Omit<HuntHarvestInsert, 'hunt_log_id'>
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('hunt_harvests')
    .insert({ ...harvestData, hunt_log_id: huntLogId })
  if (error) throw new Error(`Failed to save harvest details: ${error.message}`)

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function upsertHarvestDetails(
  huntLogId: string,
  harvestData: Omit<HuntHarvestInsert, 'hunt_log_id'>
): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { error: delError } = await supabase
    .from('hunt_harvests')
    .delete()
    .eq('hunt_log_id', huntLogId)
  if (delError) throw new Error(`Failed to clear existing harvest: ${delError.message}`)

  const { error } = await supabase
    .from('hunt_harvests')
    .insert({ ...harvestData, hunt_log_id: huntLogId })
  if (error) throw new Error(`Failed to save harvest details: ${error.message}`)

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function createHarvest(
  harvestData: Omit<HuntHarvest, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('hunt_harvests')
    .insert(harvestData)
    .select('id')
    .single()
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
  return data.id
}

export async function updateHarvest(
  harvestId: string,
  updates: Partial<HuntHarvest>
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('hunt_harvests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', harvestId)
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function deleteHarvest(harvestId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('hunt_harvests').delete().eq('id', harvestId)
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

// ============================================================================
// SIGHTING MUTATIONS
// ============================================================================

export async function createSighting(
  sightingData: Omit<HuntSighting, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('hunt_sightings')
    .insert(sightingData)
    .select('id')
    .single()
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
  return data.id
}

export async function updateSighting(
  sightingId: string,
  updates: Partial<HuntSighting>
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('hunt_sightings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sightingId)
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function deleteSighting(sightingId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('hunt_sightings').delete().eq('id', sightingId)
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function saveSightings(
  huntId: string,
  sightings: SightingInput[]
): Promise<void> {
  if (!sightings.length) return
  const supabase = await createServerSupabaseClient()
  const rows = sightings.map(s => ({
    hunt_log_id: huntId,
    animal_type: s.animal_type,
    count: s.count || 1,
    gender: s.gender || null,
    estimated_age: s.estimated_age || null,
    behavior: s.behavior || null,
    distance_yards: s.distance_yards ?? null,
    direction: s.direction || null,
    time_observed: s.time_observed || null,
    notes: s.notes || null,
  }))
  const { error } = await supabase.from('hunt_sightings').insert(rows)
  if (error) throw error

  revalidatePath('/management')
  revalidatePath('/hunt-logging')
}

export async function replaceSightings(
  huntId: string,
  sightings: SightingInput[]
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error: delError } = await supabase
    .from('hunt_sightings')
    .delete()
    .eq('hunt_log_id', huntId)
  if (delError) throw delError

  if (sightings.length) await saveSightings(huntId, sightings)
  else {
    revalidatePath('/management')
    revalidatePath('/hunt-logging')
  }
}
