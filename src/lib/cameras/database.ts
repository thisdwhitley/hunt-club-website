// Camera Database Service Layer
// Phase 2, Step 2.2: Database CRUD operations for camera system

import { createClient } from '@/lib/supabase/client';
import type {
  CameraHardware,
  CameraDeployment,
  CameraStatusReport,
  CameraWithStatus,
  MissingCameraAlert,
  CameraStats,
  CameraFilters,
  CameraAPIResponse,
  BatteryType
} from './types';

// ============================================================================
// CAMERA HARDWARE OPERATIONS
// ============================================================================

/**
 * Get all camera hardware with optional filtering
 */
export async function getCameraHardware(
  filters?: Partial<CameraFilters>
): Promise<CameraAPIResponse<CameraHardware[]>> {
  const supabase = createClient()
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
  const supabase = createClient()
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
        const hasAlerts =
          camera.latest_report?.needs_attention ||
          camera.latest_report?.is_check_in_stale ||
          camera.deployment?.is_missing;
        return filters.has_alerts ? !!hasAlerts : !hasAlerts;
      });
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      transformedData = transformedData.filter(camera =>
        camera.hardware?.cuddeback_name?.toLowerCase().includes(searchTerm) ||
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
  const supabase = createClient()
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


// ============================================================================
// CAMERA STATUS REPORTS OPERATIONS
// ============================================================================

/**
 * Get status reports for a deployment
 */
export async function getStatusReports(
  deploymentId: string,
  limit: number = 30
): Promise<CameraAPIResponse<CameraStatusReport[]>> {
  const supabase = createClient()
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
    // Only alert on active deployments — inactive/last-season cameras should never surface
    const camerasResult = await getCameraDeployments({ active: true });
    if (!camerasResult.success) {
      return { success: false, error: camerasResult.error };
    }

    // Filter to only cameras that need attention
    const alertCameras = camerasResult.data?.filter(camera => {
      if (camera.latest_report?.needs_attention) return true;
      if (camera.latest_report?.is_check_in_stale) return true;
      if (camera.deployment?.is_missing) return true;
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
  const supabase = createClient()
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
      hardware_id: deployment.camera_hardware[0]?.id,
      device_id: deployment.camera_hardware[0]?.device_id,
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


// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

/**
 * Get comprehensive camera system statistics
 */
export async function getCameraStats(): Promise<CameraAPIResponse<CameraStats>> {
  const supabase = createClient()
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
    const activeDeployments = deployments?.filter(d => d.active).length || 0;
    const missingCameras = deployments?.filter(d => d.active && d.is_missing).length || 0;

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
  const supabase = createClient()
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
  const supabase = createClient()
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



// ============================================================================
// SEASONAL DEPLOYMENT OPERATIONS
// ============================================================================


/**
 * Get a single camera hardware record by device_id
 */
export async function getCameraHardwareByDeviceId(
  deviceId: string
): Promise<CameraAPIResponse<CameraHardware>> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('camera_hardware')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Device not found' };
      }
      console.error('Error fetching camera hardware by device_id:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCameraHardwareByDeviceId:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

export interface DeploymentImportRow {
  hardware_id: string;
  device_id: string;
  battery_type: BatteryType | null;
  solar_panel_id: string | null;
  has_solar_panel: boolean;
  latitude: number;
  longitude: number;
  location_name: string;
  season_year: number;
  notes: string | null;
}

export interface DeploymentImportResult {
  device_id: string;
  success: boolean;
  error?: string;
}

/**
 * Batch import camera deployments and update hardware battery types
 */
export async function importDeployments(
  rows: DeploymentImportRow[]
): Promise<CameraAPIResponse<DeploymentImportResult[]>> {
  const supabase = createClient()
  const results: DeploymentImportResult[] = [];

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
        });

      if (deployError) {
        results.push({ device_id: row.device_id, success: false, error: deployError.message });
        continue;
      }

      if (row.battery_type) {
        const { error: hwError } = await supabase
          .from('camera_hardware')
          .update({ battery_type: row.battery_type, updated_at: new Date().toISOString() })
          .eq('id', row.hardware_id);

        if (hwError) {
          results.push({ device_id: row.device_id, success: false, error: `Deployment created but battery_type update failed: ${hwError.message}` });
          continue;
        }
      }

      results.push({ device_id: row.device_id, success: true });
    } catch {
      results.push({ device_id: row.device_id, success: false, error: 'Unknown error occurred' });
    }
  }

  return { success: true, data: results };
}

export async function getSeasonYears(): Promise<CameraAPIResponse<number[]>> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('camera_deployments')
      .select('season_year')
      .not('season_year', 'is', null)
      .order('season_year', { ascending: false });

    if (error) throw error;

    const years = [...new Set((data || []).map(r => r.season_year as number))];
    return { success: true, data: years };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch season years';
    return { success: false, error: message };
  }
}