// Camera Database Service Layer
// Phase 2, Step 2.2: Database CRUD operations for camera system

import { createClient } from '@/lib/supabase/client';
// import { createClient } from '@supabase/supabase-js';
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
 * Enhanced getCameraDeployments with proper filtering
 */
export async function getCameraDeployments(
  filters?: Partial<CameraFilters>
): Promise<CameraAPIResponse<CameraWithStatus[]>> {
  try {
    const supabase = createClient();
    
    // Build deployment query
    let deploymentQuery = supabase
      .from('camera_deployments')
      .select(`
        *,
        camera_hardware(*)
      `)
      .order('location_name', { ascending: true });

    // Apply database-level filters for performance
    if (filters?.active !== undefined) {
      deploymentQuery = deploymentQuery.eq('active', filters.active);
    }

    if (filters?.season_year && filters.season_year.length > 0) {
      deploymentQuery = deploymentQuery.in('season_year', filters.season_year);
    }

    if (filters?.is_missing !== undefined) {
      deploymentQuery = deploymentQuery.eq('is_missing', filters.is_missing);
    }

    const { data: deployments, error: deploymentsError } = await deploymentQuery;

    if (deploymentsError) {
      console.error('Error fetching deployments:', deploymentsError);
      return { success: false, error: deploymentsError.message };
    }

    if (!deployments || deployments.length === 0) {
      return { success: true, data: [] };
    }

    // Get latest reports for these deployments
    const deploymentIds = deployments.map(d => d.id);
    const { data: reports } = await supabase
      .from('camera_status_reports')
      .select('*')
      .in('deployment_id', deploymentIds)
      .order('report_date', { ascending: false });

    // Create map of latest reports by deployment_id
    const latestReportsMap = new Map();
    reports?.forEach(report => {
      if (!latestReportsMap.has(report.deployment_id)) {
        latestReportsMap.set(report.deployment_id, report);
      }
    });

    // Transform and filter data
    let transformedData: CameraWithStatus[] = deployments.map(deployment => {
      const latestReport = latestReportsMap.get(deployment.id) || null;
      const daysSinceLastReport = latestReport 
        ? Math.floor((Date.now() - new Date(latestReport.report_date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        hardware: deployment.camera_hardware,
        deployment: deployment,
        latest_report: latestReport,
        days_since_last_report: daysSinceLastReport
      };
    });

    // Apply JavaScript-level filters for complex logic
    if (filters?.brand && filters.brand.length > 0) {
      transformedData = transformedData.filter(camera => 
        camera.hardware?.brand && filters.brand!.includes(camera.hardware.brand)
      );
    }

    if (filters?.condition && filters.condition.length > 0) {
      transformedData = transformedData.filter(camera =>
        camera.hardware?.condition && filters.condition!.includes(camera.hardware.condition)
      );
    }

    if (filters?.has_alerts !== undefined) {
      transformedData = transformedData.filter(camera => {
        const hasAlerts = camera.latest_report?.needs_attention || 
                         camera.deployment?.is_missing ||
                         (camera.days_since_last_report !== null && camera.days_since_last_report > 1);
        return filters.has_alerts ? hasAlerts : !hasAlerts;
      });
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      transformedData = transformedData.filter(camera =>
        camera.hardware?.device_id?.toLowerCase().includes(searchTerm) ||
        camera.deployment?.location_name?.toLowerCase().includes(searchTerm) ||
        camera.hardware?.brand?.toLowerCase().includes(searchTerm) ||
        camera.hardware?.model?.toLowerCase().includes(searchTerm) ||
        camera.deployment?.notes?.toLowerCase().includes(searchTerm)
      );
    }

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
 * Get cameras that need attention (alerts)
 */
export async function getCameraAlerts(): Promise<CameraAPIResponse<CameraWithStatus[]>> {
  try {
    // Get all cameras first
    const camerasResult = await getCameraDeployments();
    if (!camerasResult.success) {
      return { success: false, error: camerasResult.error };
    }

    // Filter to only cameras that need attention
    const alertCameras = camerasResult.data?.filter(camera => {
      // Check if latest report has alerts
      if (camera.latest_report?.needs_attention) {
        return true;
      }

      // Check if camera is missing (no recent reports)
      if (camera.days_since_last_report !== null && camera.days_since_last_report > 1) {
        return true;
      }

      // Check if deployment is marked as missing
      if (camera.deployment?.is_missing) {
        return true;
      }

      return false;
    }) || [];

    return { success: true, data: alertCameras };
  } catch (error) {
    console.error('Error in getCameraAlerts:', error);
    return { success: false, error: 'Unknown error occurred while fetching alerts' };
  }
}

/**
 * Get missing cameras (FIXED)
 */
export async function getMissingCameras(): Promise<CameraAPIResponse<MissingCameraAlert[]>> {
  try {
    const { data: deployments, error } = await supabase
      .from('camera_deployments')
      .select(`
        id,
        location_name,
        last_seen_date,
        missing_since_date,
        consecutive_missing_days,
        camera_hardware!inner(id, device_id)
      `)
      .eq('active', true)
      .eq('is_missing', true)
      .order('consecutive_missing_days', { ascending: false });

    if (error) {
      console.error('Error fetching missing cameras:', error);
      return { success: false, error: error.message };
    }

    // Transform data to match MissingCameraAlert interface
    const transformedData: MissingCameraAlert[] = (deployments || []).map(deployment => ({
      deployment_id: deployment.id,
      hardware_id: deployment.camera_hardware.id,
      device_id: deployment.camera_hardware.device_id,
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
 * Get comprehensive camera system statistics
 */
export async function getCameraStats(): Promise<CameraAPIResponse<CameraStats>> {
  try {
    // Get hardware stats
    const { data: hardware, error: hardwareError } = await supabase
      .from('camera_hardware')
      .select('id, brand, active');

    if (hardwareError) {
      console.error('Error fetching hardware for stats:', hardwareError);
      return { success: false, error: hardwareError.message };
    }

    // Get deployment stats
    const { data: deployments, error: deploymentsError } = await supabase
      .from('camera_deployments')
      .select('id, season_year, active, is_missing, consecutive_missing_days');

    if (deploymentsError) {
      console.error('Error fetching deployments for stats:', deploymentsError);
      return { success: false, error: deploymentsError.message };
    }

    // Get recent status reports for battery and photo calculations
    const { data: recentReports, error: reportsError } = await supabase
      .from('camera_status_reports')
      .select('battery_status, sd_images_count, needs_attention, alert_reason')
      .gte('report_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
      .order('report_date', { ascending: false });

    if (reportsError) {
      console.error('Error fetching reports for stats:', reportsError);
      // Don't fail on reports error, just log it
    }

    // Calculate basic counts
    const totalHardware = hardware?.length || 0;
    const activeHardware = hardware?.filter(h => h.active).length || 0;
    const activeDeployments = deployments?.filter(d => d.active).length || 0;
    const missingCameras = deployments?.filter(d => d.is_missing).length || 0;

    // Calculate brand distribution
    const camerasByBrand: Record<string, number> = {};
    hardware?.forEach(hw => {
      if (hw.brand && hw.active) {
        camerasByBrand[hw.brand] = (camerasByBrand[hw.brand] || 0) + 1;
      }
    });

    // Calculate deployments by season
    const deploymentsBySeason: Record<number, number> = {};
    deployments?.forEach(dep => {
      if (dep.season_year && dep.active) {
        deploymentsBySeason[dep.season_year] = (deploymentsBySeason[dep.season_year] || 0) + 1;
      }
    });

    // Calculate missing cameras by days
    const missingByDays: Record<number, number> = {};
    deployments?.filter(d => d.is_missing).forEach(dep => {
      const days = dep.consecutive_missing_days || 0;
      missingByDays[days] = (missingByDays[days] || 0) + 1;
    });

    // Calculate alerts by type
    const alertsByType: Record<string, number> = {};
    const camerasWithAlerts = new Set();
    recentReports?.filter(r => r.needs_attention).forEach(report => {
      if (report.alert_reason) {
        const alertType = report.alert_reason.toLowerCase().includes('battery') ? 'Battery' :
                         report.alert_reason.toLowerCase().includes('storage') ? 'Storage' :
                         report.alert_reason.toLowerCase().includes('signal') ? 'Signal' :
                         report.alert_reason.toLowerCase().includes('missing') ? 'Missing' : 'Other';
        alertsByType[alertType] = (alertsByType[alertType] || 0) + 1;
        camerasWithAlerts.add(report.alert_reason); // This is a rough count
      }
    });

    // Calculate average battery level
    let totalBatteryReadings = 0;
    let batterySum = 0;
    recentReports?.forEach(report => {
      if (report.battery_status) {
        // Extract percentage from battery status like "75%" or "OK (85%)"
        const match = report.battery_status.match(/(\d+)%/);
        if (match) {
          const percentage = parseInt(match[1]);
          batterySum += percentage;
          totalBatteryReadings++;
        } else if (report.battery_status.toLowerCase().includes('ok')) {
          // Assume "OK" means 75%
          batterySum += 75;
          totalBatteryReadings++;
        }
      }
    });

    const averageBatteryLevel = totalBatteryReadings > 0 ? Math.round(batterySum / totalBatteryReadings) : null;

    // Calculate total photos stored
    const totalPhotosStored = recentReports?.reduce((sum, report) => {
      return sum + (report.sd_images_count || 0);
    }, 0) || 0;

    const stats: CameraStats = {
      total_hardware: totalHardware,
      active_deployments: activeDeployments,
      cameras_with_alerts: Object.values(alertsByType).reduce((sum, count) => sum + count, 0),
      missing_cameras: missingCameras,
      average_battery_level: averageBatteryLevel,
      total_photos_stored: totalPhotosStored,
      cameras_by_brand: camerasByBrand,
      deployments_by_season: deploymentsBySeason,
      alerts_by_type: alertsByType,
      missing_by_days: missingByDays
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getCameraStats:', error);
    return { success: false, error: 'Unknown error occurred while calculating statistics' };
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
 * Get available hardware for deployment (FIXED)
 */
export async function getAvailableHardware(): Promise<CameraAPIResponse<CameraHardware[]>> {
  try {
    // First, get all active hardware
    const { data: allHardware, error: hardwareError } = await supabase
      .from('camera_hardware')
      .select('*')
      .eq('active', true)
      .order('device_id', { ascending: true });

    if (hardwareError) {
      console.error('Error fetching hardware:', hardwareError);
      return { success: false, error: hardwareError.message };
    }

    // Then, get all active deployments to filter out deployed hardware
    const { data: activeDeployments, error: deploymentsError } = await supabase
      .from('camera_deployments')
      .select('hardware_id')
      .eq('active', true);

    if (deploymentsError) {
      console.error('Error fetching deployments:', deploymentsError);
      return { success: false, error: deploymentsError.message };
    }

    // Filter out hardware that's currently deployed (do this in JavaScript)
    const deployedHardwareIds = new Set(activeDeployments?.map(d => d.hardware_id) || []);
    const availableHardware = (allHardware || []).filter(hw => !deployedHardwareIds.has(hw.id));

    return { success: true, data: availableHardware };
  } catch (error) {
    console.error('Error in getAvailableHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}


/**
 * HARD DELETE camera hardware (actually removes from database)
 * WARNING: This will permanently delete the camera and all associated data
 */
export async function hardDeleteCameraHardware(
  id: string
): Promise<CameraAPIResponse<void>> {
  try {
    // First, delete all status reports for this hardware
    const { error: reportsError } = await supabase
      .from('camera_status_reports')
      .delete()
      .eq('hardware_id', id);

    if (reportsError) {
      console.error('Error deleting status reports:', reportsError);
      return { success: false, error: `Failed to delete status reports: ${reportsError.message}` };
    }

    // Then, delete all deployments for this hardware
    const { error: deploymentsError } = await supabase
      .from('camera_deployments')
      .delete()
      .eq('hardware_id', id);

    if (deploymentsError) {
      console.error('Error deleting deployments:', deploymentsError);
      return { success: false, error: `Failed to delete deployments: ${deploymentsError.message}` };
    }

    // Finally, delete the hardware itself
    const { error: hardwareError } = await supabase
      .from('camera_hardware')
      .delete()
      .eq('id', id);

    if (hardwareError) {
      console.error('Error deleting camera hardware:', hardwareError);
      return { success: false, error: hardwareError.message };
    }

    return { 
      success: true, 
      message: 'Camera hardware and all associated data deleted permanently'
    };
  } catch (error) {
    console.error('Error in hardDeleteCameraHardware:', error);
    return { success: false, error: 'Unknown error occurred during deletion' };
  }
}

/**
 * SOFT DELETE camera hardware (sets inactive, preserves data)
 * This is the safer option that keeps historical data
 */
export async function softDeleteCameraHardware(
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
      console.error('Error soft deleting camera hardware:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: 'Camera hardware deactivated successfully (data preserved)'
    };
  } catch (error) {
    console.error('Error in softDeleteCameraHardware:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}