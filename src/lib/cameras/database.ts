// Camera Database Service Layer
// Phase 2, Step 2.2: Database CRUD operations for camera system

import { createClient } from '@supabase/supabase-js';
import type {
  CameraHardware,
  CameraDeployment,
  CameraStatusReport,
  CameraWithStatus,
  MissingCameraAlert,
  CameraStats,
  CameraHardwareFormData,
  CameraDeploymentFormData,
  CameraStatusReportFormData,
  CameraFilters,
  CameraSortOptions,
  CameraAPIResponse,
  CameraPaginatedResponse
} from './types';

// ============================================================================
// SUPABASE CLIENT SETUP
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CAMERA HARDWARE OPERATIONS
// ============================================================================

/**
 * Get all camera hardware with optional filtering
 */
export async function getCameraHardware(
  filters?: Partial<CameraFilters>
): Promise<CameraAPIResponse<CameraHardware[]>> {
  try {
    let query = supabase
      .from('camera_hardware')
      .select('*')
      .order('device_id', { ascending: true });

    // Apply filters
    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    if (filters?.condition?.length) {
      query = query.in('condition', filters.condition);
    }
    if (filters?.brand?.length) {
      query = query.in('brand', filters.brand);
    }
    if (filters?.search) {
      query = query.or(`device_id.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching camera hardware:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCameraHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Get single camera hardware by ID
 */
export async function getCameraHardwareById(
  id: string
): Promise<CameraAPIResponse<CameraHardware>> {
  try {
    const { data, error } = await supabase
      .from('camera_hardware')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching camera hardware:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCameraHardwareById:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Create new camera hardware
 */
export async function createCameraHardware(
  data: CameraHardwareFormData
): Promise<CameraAPIResponse<CameraHardware>> {
  try {
    const { data: newHardware, error } = await supabase
      .from('camera_hardware')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating camera hardware:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: newHardware,
      message: `Camera ${data.device_id} added successfully`
    };
  } catch (error) {
    console.error('Error in createCameraHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Update camera hardware
 */
export async function updateCameraHardware(
  id: string,
  data: Partial<CameraHardwareFormData>
): Promise<CameraAPIResponse<CameraHardware>> {
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const { data: updatedHardware, error } = await supabase
      .from('camera_hardware')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating camera hardware:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: updatedHardware,
      message: 'Camera hardware updated successfully'
    };
  } catch (error) {
    console.error('Error in updateCameraHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Delete camera hardware (soft delete by setting inactive)
 */
export async function deleteCameraHardware(
  id: string
): Promise<CameraAPIResponse<void>> {
  try {
    // First check if hardware has active deployments
    const { data: deployments } = await supabase
      .from('camera_deployments')
      .select('id')
      .eq('hardware_id', id)
      .eq('active', true);

    if (deployments && deployments.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete hardware with active deployments. Deactivate deployments first.' 
      };
    }

    // Soft delete by setting inactive
    const { error } = await supabase
      .from('camera_hardware')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting camera hardware:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Camera hardware deactivated successfully'
    };
  } catch (error) {
    console.error('Error in deleteCameraHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// ============================================================================
// CAMERA DEPLOYMENTS OPERATIONS
// ============================================================================

/**
 * Get all camera deployments with hardware info
 */
export async function getCameraDeployments(
  filters?: Partial<CameraFilters>
): Promise<CameraAPIResponse<CameraWithStatus[]>> {
  try {
    let query = supabase
      .from('camera_deployments')
      .select(`
        *,
        hardware:camera_hardware(*),
        latest_report:camera_status_reports(
          *
        )
      `)
      .order('location_name', { ascending: true });

    // Apply filters
    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }
    if (filters?.season_year?.length) {
      query = query.in('season_year', filters.season_year);
    }
    if (filters?.is_missing !== undefined) {
      query = query.eq('is_missing', filters.is_missing);
    }
    if (filters?.search) {
      query = query.or(`location_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching camera deployments:', error);
      return { success: false, error: error.message };
    }

    // Transform data to match CameraWithStatus interface
    const transformedData: CameraWithStatus[] = (data || []).map(deployment => {
      const latestReport = deployment.latest_report?.[0] || null;
      const daysSinceLastReport = latestReport 
        ? Math.floor((Date.now() - new Date(latestReport.report_date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        hardware: deployment.hardware,
        deployment: deployment,
        latest_report: latestReport,
        days_since_last_report: daysSinceLastReport
      };
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error in getCameraDeployments:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Get single camera deployment by ID
 */
export async function getCameraDeploymentById(
  id: string
): Promise<CameraAPIResponse<CameraDeployment>> {
  try {
    const { data, error } = await supabase
      .from('camera_deployments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching camera deployment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCameraDeploymentById:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Create new camera deployment
 */
export async function createCameraDeployment(
  data: CameraDeploymentFormData
): Promise<CameraAPIResponse<CameraDeployment>> {
  try {
    // Check if hardware is already actively deployed
    const { data: existingDeployment } = await supabase
      .from('camera_deployments')
      .select('id, location_name')
      .eq('hardware_id', data.hardware_id)
      .eq('active', true)
      .single();

    if (existingDeployment) {
      return { 
        success: false, 
        error: `Camera is already deployed at ${existingDeployment.location_name}. Deactivate existing deployment first.` 
      };
    }

    const { data: newDeployment, error } = await supabase
      .from('camera_deployments')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating camera deployment:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: newDeployment,
      message: `Camera deployed to ${data.location_name} successfully`
    };
  } catch (error) {
    console.error('Error in createCameraDeployment:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Update camera deployment
 */
export async function updateCameraDeployment(
  id: string,
  data: Partial<CameraDeploymentFormData>
): Promise<CameraAPIResponse<CameraDeployment>> {
  try {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const { data: updatedDeployment, error } = await supabase
      .from('camera_deployments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating camera deployment:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: updatedDeployment,
      message: 'Camera deployment updated successfully'
    };
  } catch (error) {
    console.error('Error in updateCameraDeployment:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Deactivate camera deployment (move camera)
 */
export async function deactivateCameraDeployment(
  id: string
): Promise<CameraAPIResponse<void>> {
  try {
    const { error } = await supabase
      .from('camera_deployments')
      .update({ 
        active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating camera deployment:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Camera deployment deactivated successfully'
    };
  } catch (error) {
    console.error('Error in deactivateCameraDeployment:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// ============================================================================
// CAMERA STATUS REPORTS OPERATIONS
// ============================================================================

/**
 * Add new status report
 */
export async function addStatusReport(
  data: CameraStatusReportFormData
): Promise<CameraAPIResponse<CameraStatusReport>> {
  try {
    const reportData = {
      ...data,
      report_processing_date: new Date().toISOString()
    };

    const { data: newReport, error } = await supabase
      .from('camera_status_reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      console.error('Error adding status report:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: newReport,
      message: 'Status report added successfully'
    };
  } catch (error) {
    console.error('Error in addStatusReport:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Get status reports for a deployment
 */
export async function getStatusReports(
  deploymentId: string,
  limit: number = 30
): Promise<CameraAPIResponse<CameraStatusReport[]>> {
  try {
    const { data, error } = await supabase
      .from('camera_status_reports')
      .select('*')
      .eq('deployment_id', deploymentId)
      .order('report_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching status reports:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getStatusReports:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// ============================================================================
// ALERT AND MISSING CAMERA OPERATIONS
// ============================================================================

/**
 * Get cameras that need attention
 */
export async function getCameraAlerts(): Promise<CameraAPIResponse<CameraWithStatus[]>> {
  try {
    const { data, error } = await supabase
      .from('camera_deployments')
      .select(`
        *,
        hardware:camera_hardware(*),
        latest_report:camera_status_reports!inner(*)
      `)
      .eq('active', true)
      .eq('latest_report.needs_attention', true)
      .order('latest_report.report_date', { ascending: false });

    if (error) {
      console.error('Error fetching camera alerts:', error);
      return { success: false, error: error.message };
    }

    // Transform data to match CameraWithStatus interface
    const transformedData: CameraWithStatus[] = (data || []).map(deployment => {
      const latestReport = deployment.latest_report?.[0] || null;
      const daysSinceLastReport = latestReport 
        ? Math.floor((Date.now() - new Date(latestReport.report_date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        hardware: deployment.hardware,
        deployment: deployment,
        latest_report: latestReport,
        days_since_last_report: daysSinceLastReport
      };
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error in getCameraAlerts:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Get missing cameras
 */
export async function getMissingCameras(): Promise<CameraAPIResponse<MissingCameraAlert[]>> {
  try {
    const { data, error } = await supabase
      .from('camera_deployments')
      .select(`
        id,
        location_name,
        last_seen_date,
        missing_since_date,
        consecutive_missing_days,
        hardware:camera_hardware(device_id)
      `)
      .eq('active', true)
      .eq('is_missing', true)
      .order('consecutive_missing_days', { ascending: false });

    if (error) {
      console.error('Error fetching missing cameras:', error);
      return { success: false, error: error.message };
    }

    // Transform data to match MissingCameraAlert interface
    const transformedData: MissingCameraAlert[] = (data || []).map(deployment => ({
      deployment_id: deployment.id,
      hardware_id: deployment.hardware.id,
      device_id: deployment.hardware.device_id,
      location_name: deployment.location_name,
      last_seen_date: deployment.last_seen_date,
      missing_since_date: deployment.missing_since_date,
      consecutive_missing_days: deployment.consecutive_missing_days
    }));

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error in getMissingCameras:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Run missing camera detection
 */
export async function detectMissingCameras(
  date?: string
): Promise<CameraAPIResponse<void>> {
  try {
    const checkDate = date || new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .rpc('detect_missing_cameras', { check_date: checkDate });

    if (error) {
      console.error('Error running missing camera detection:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Missing camera detection completed successfully'
    };
  } catch (error) {
    console.error('Error in detectMissingCameras:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

/**
 * Get camera system statistics
 */
export async function getCameraStats(): Promise<CameraAPIResponse<CameraStats>> {
  try {
    // Get basic counts
    const [
      hardwareResult,
      deploymentsResult,
      alertsResult,
      missingResult
    ] = await Promise.all([
      supabase.from('camera_hardware').select('id, brand').eq('active', true),
      supabase.from('camera_deployments').select('id, season_year').eq('active', true),
      supabase.from('camera_status_reports').select('id').eq('needs_attention', true),
      supabase.from('camera_deployments').select('id, consecutive_missing_days').eq('is_missing', true)
    ]);

    // Calculate statistics
    const stats: CameraStats = {
      total_hardware: hardwareResult.data?.length || 0,
      active_deployments: deploymentsResult.data?.length || 0,
      cameras_with_alerts: alertsResult.data?.length || 0,
      missing_cameras: missingResult.data?.length || 0,
      average_battery_level: 0, // Will be calculated from recent reports
      total_photos_stored: 0, // Will be calculated from recent reports
      cameras_by_brand: {},
      deployments_by_season: {},
      alerts_by_type: {},
      missing_by_days: {}
    };

    // Calculate brand distribution
    if (hardwareResult.data) {
      hardwareResult.data.forEach(hw => {
        if (hw.brand) {
          stats.cameras_by_brand[hw.brand] = (stats.cameras_by_brand[hw.brand] || 0) + 1;
        }
      });
    }

    // Calculate season distribution
    if (deploymentsResult.data) {
      deploymentsResult.data.forEach(dep => {
        if (dep.season_year) {
          stats.deployments_by_season[dep.season_year] = (stats.deployments_by_season[dep.season_year] || 0) + 1;
        }
      });
    }

    // Calculate missing days distribution
    if (missingResult.data) {
      missingResult.data.forEach(missing => {
        const days = missing.consecutive_missing_days;
        stats.missing_by_days[days] = (stats.missing_by_days[days] || 0) + 1;
      });
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getCameraStats:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if device_id is available
 */
export async function isDeviceIdAvailable(
  deviceId: string,
  excludeId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('camera_hardware')
      .select('id')
      .eq('device_id', deviceId);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking device_id availability:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    console.error('Error in isDeviceIdAvailable:', error);
    return false;
  }
}

/**
 * Get available hardware for deployment
 */
export async function getAvailableHardware(): Promise<CameraAPIResponse<CameraHardware[]>> {
  try {
    const { data, error } = await supabase
      .from('camera_hardware')
      .select('*')
      .eq('active', true)
      .not('id', 'in', 
        supabase
          .from('camera_deployments')
          .select('hardware_id')
          .eq('active', true)
      )
      .order('device_id', { ascending: true });

    if (error) {
      console.error('Error fetching available hardware:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getAvailableHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}
