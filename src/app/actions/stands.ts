'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Stand, StandInsert } from '@/lib/stands/types'

export interface StandAPIResponse<T = void> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export async function createStand(
  data: StandInsert
): Promise<StandAPIResponse<Stand>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: newStand, error } = await supabase
      .from('stands')
      .insert([{ active: true, total_hunts: 0, total_harvests: 0, season_hunts: 0, ...data }])
      .select()
      .single()

    if (error) {
      console.error('Error creating stand:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management')
    return { success: true, data: newStand, message: `Stand "${data.name}" created successfully` }
  } catch (error) {
    console.error('Error in createStand:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function updateStand(
  id: string,
  data: Partial<StandInsert>
): Promise<StandAPIResponse<Stand>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: updatedStand, error } = await supabase
      .from('stands')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating stand:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management')
    return { success: true, data: updatedStand, message: 'Stand updated successfully' }
  } catch (error) {
    console.error('Error in updateStand:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function deactivateStand(id: string): Promise<StandAPIResponse<void>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { error } = await supabase
      .from('stands')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating stand:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management')
    return { success: true, message: 'Stand retired successfully' }
  } catch (error) {
    console.error('Error in deactivateStand:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}
