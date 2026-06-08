'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  CameraHardware,
  CameraDeployment,
  CameraStatusReport,
  CameraHardwareFormData,
  CameraDeploymentFormData,
  CameraStatusReportFormData,
  CameraAPIResponse,
} from '@/lib/cameras/types'
import type { DeploymentImportRow, DeploymentImportResult } from '@/lib/cameras/database'

// ============================================================================
// CAMERA HARDWARE MUTATIONS
// ============================================================================

export async function createCameraHardware(
  data: CameraHardwareFormData
): Promise<CameraAPIResponse<CameraHardware>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: newHardware, error } = await supabase
      .from('camera_hardware')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error creating camera hardware:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return {
      success: true,
      data: newHardware,
      message: `Camera ${data.device_id} added successfully`,
    }
  } catch (error) {
    console.error('Error in createCameraHardware:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function updateCameraHardware(
  id: string,
  data: Partial<CameraHardwareFormData>
): Promise<CameraAPIResponse<CameraHardware>> {
  const supabase = await createServerSupabaseClient()
  try {
    const updateData = { ...data, updated_at: new Date().toISOString() }

    const { data: updatedHardware, error } = await supabase
      .from('camera_hardware')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating camera hardware:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return {
      success: true,
      data: updatedHardware,
      message: 'Camera hardware updated successfully',
    }
  } catch (error) {
    console.error('Error in updateCameraHardware:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function softDeleteCameraHardware(
  id: string
): Promise<CameraAPIResponse<void>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: deployments } = await supabase
      .from('camera_deployments')
      .select('id')
      .eq('hardware_id', id)
      .eq('active', true)

    if (deployments && deployments.length > 0) {
      return {
        success: false,
        error: 'Cannot delete hardware with active deployments. Deactivate deployments first.',
      }
    }

    const { error } = await supabase
      .from('camera_hardware')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error soft deleting camera hardware:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return { success: true, message: 'Camera hardware deactivated successfully (data preserved)' }
  } catch (error) {
    console.error('Error in softDeleteCameraHardware:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function hardDeleteCameraHardware(
  id: string
): Promise<CameraAPIResponse<void>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { error: reportsError } = await supabase
      .from('camera_status_reports')
      .delete()
      .eq('hardware_id', id)

    if (reportsError) {
      console.error('Error deleting status reports:', reportsError)
      return { success: false, error: `Failed to delete status reports: ${reportsError.message}` }
    }

    const { error: deploymentsError } = await supabase
      .from('camera_deployments')
      .delete()
      .eq('hardware_id', id)

    if (deploymentsError) {
      console.error('Error deleting deployments:', deploymentsError)
      return { success: false, error: `Failed to delete deployments: ${deploymentsError.message}` }
    }

    const { error: hardwareError } = await supabase
      .from('camera_hardware')
      .delete()
      .eq('id', id)

    if (hardwareError) {
      console.error('Error deleting camera hardware:', hardwareError)
      return { success: false, error: hardwareError.message }
    }

    revalidatePath('/management/cameras')
    return { success: true, message: 'Camera hardware and all associated data deleted permanently' }
  } catch (error) {
    console.error('Error in hardDeleteCameraHardware:', error)
    return { success: false, error: 'Unknown error occurred during deletion' }
  }
}

// ============================================================================
// CAMERA DEPLOYMENT MUTATIONS
// ============================================================================

export async function createCameraDeployment(
  data: CameraDeploymentFormData
): Promise<CameraAPIResponse<CameraDeployment>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: existingDeployment } = await supabase
      .from('camera_deployments')
      .select('id, location_name')
      .eq('hardware_id', data.hardware_id)
      .eq('active', true)
      .single()

    if (existingDeployment) {
      return {
        success: false,
        error: `Camera is already deployed at ${existingDeployment.location_name}. Deactivate existing deployment first.`,
      }
    }

    const { data: newDeployment, error } = await supabase
      .from('camera_deployments')
      .insert([data])
      .select()
      .single()

    if (error) {
      console.error('Error creating camera deployment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return {
      success: true,
      data: newDeployment,
      message: `Camera deployed to ${data.location_name} successfully`,
    }
  } catch (error) {
    console.error('Error in createCameraDeployment:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function updateCameraDeployment(
  id: string,
  data: Partial<CameraDeploymentFormData>
): Promise<CameraAPIResponse<CameraDeployment>> {
  const supabase = await createServerSupabaseClient()
  try {
    const updateData = { ...data, updated_at: new Date().toISOString() }

    const { data: updatedDeployment, error } = await supabase
      .from('camera_deployments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating camera deployment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return {
      success: true,
      data: updatedDeployment,
      message: 'Camera deployment updated successfully',
    }
  } catch (error) {
    console.error('Error in updateCameraDeployment:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function deactivateCameraDeployment(
  id: string
): Promise<CameraAPIResponse<void>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { error } = await supabase
      .from('camera_deployments')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating camera deployment:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return { success: true, message: 'Camera deployment deactivated successfully' }
  } catch (error) {
    console.error('Error in deactivateCameraDeployment:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function deactivateAllActiveDeployments(): Promise<CameraAPIResponse<{ count: number }>> {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('camera_deployments')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('active', true)
      .select('id')

    if (error) {
      console.error('Error deactivating deployments:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return { success: true, data: { count: data?.length ?? 0 } }
  } catch (error) {
    console.error('Error in deactivateAllActiveDeployments:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// ============================================================================
// STATUS REPORT MUTATIONS
// ============================================================================

export async function addStatusReport(
  data: CameraStatusReportFormData
): Promise<CameraAPIResponse<CameraStatusReport>> {
  const supabase = await createServerSupabaseClient()
  try {
    const reportData = {
      ...data,
      report_processing_date: new Date().toISOString(),
    }

    const { data: newReport, error } = await supabase
      .from('camera_status_reports')
      .insert([reportData])
      .select()
      .single()

    if (error) {
      console.error('Error adding status report:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return { success: true, data: newReport, message: 'Status report added successfully' }
  } catch (error) {
    console.error('Error in addStatusReport:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// ============================================================================
// BATCH IMPORT
// ============================================================================

export async function importDeployments(
  rows: DeploymentImportRow[]
): Promise<CameraAPIResponse<DeploymentImportResult[]>> {
  const supabase = await createServerSupabaseClient()
  const results: DeploymentImportResult[] = []

  for (const row of rows) {
    try {
      const { error: deployError } = await supabase
        .from('camera_deployments')
        .insert({
          hardware_id: row.hardware_id,
          location_name: row.location_name,
          latitude: row.latitude,
          longitude: row.longitude,
          season_year: row.season_year,
          has_solar_panel: row.has_solar_panel,
          solar_panel_id: row.solar_panel_id,
          notes: row.notes || null,
          active: true,
        })

      if (deployError) {
        results.push({ device_id: row.device_id, success: false, error: deployError.message })
        continue
      }

      if (row.battery_type) {
        const { error: hwError } = await supabase
          .from('camera_hardware')
          .update({ battery_type: row.battery_type, updated_at: new Date().toISOString() })
          .eq('id', row.hardware_id)

        if (hwError) {
          results.push({
            device_id: row.device_id,
            success: false,
            error: `Deployment created but battery_type update failed: ${hwError.message}`,
          })
          continue
        }
      }

      results.push({ device_id: row.device_id, success: true })
    } catch {
      results.push({ device_id: row.device_id, success: false, error: 'Unknown error occurred' })
    }
  }

  revalidatePath('/management/cameras')
  return { success: true, data: results }
}

// ============================================================================
// MISSING CAMERA DETECTION
// ============================================================================

export async function detectMissingCameras(
  date?: string
): Promise<CameraAPIResponse<void>> {
  const supabase = await createServerSupabaseClient()
  try {
    const checkDate = date || new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .rpc('detect_missing_cameras', { check_date: checkDate })

    if (error) {
      console.error('Error running missing camera detection:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/management/cameras')
    return { success: true, message: 'Missing camera detection completed successfully' }
  } catch (error) {
    console.error('Error in detectMissingCameras:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}
