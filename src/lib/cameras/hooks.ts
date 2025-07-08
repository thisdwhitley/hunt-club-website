// Camera System React Hooks
// File Location: src/lib/cameras/hooks.ts
// Phase 2, Step 2.3: React hooks using useState/useEffect pattern (matching existing codebase)

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  CameraSortOptions
} from './types';
import {
  getCameraHardware,
  getCameraHardwareById,
  createCameraHardware,
  updateCameraHardware,
  softDeleteCameraHardware,  // ← Changed to softDeleteCameraHardware
  hardDeleteCameraHardware,  // ← Added hardDeleteCameraHardware
  getCameraDeployments,
  getCameraDeploymentById,
  createCameraDeployment,
  updateCameraDeployment,
  deactivateCameraDeployment,
  addStatusReport,
  getStatusReports,
  getCameraAlerts,
  getMissingCameras,
  detectMissingCameras,
  getCameraStats,
  isDeviceIdAvailable,
  getAvailableHardware
} from './database';

// ============================================================================
// CAMERA HARDWARE HOOKS
// ============================================================================

/**
 * Hook for managing camera hardware list with filtering
 */
export function useCameraHardware(filters?: Partial<CameraFilters>) {
  const [hardware, setHardware] = useState<CameraHardware[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHardware = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getCameraHardware(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch camera hardware');
      }
      
      setHardware(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camera hardware';
      setError(errorMessage);
      console.error('Error loading camera hardware:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createHardware = useCallback(async (formData: CameraHardwareFormData): Promise<CameraHardware | null> => {
    try {
      setError(null);
      
      const result = await createCameraHardware(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create camera hardware');
      }
      
      // Refresh the list
      await loadHardware();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create camera hardware';
      setError(errorMessage);
      console.error('Error creating camera hardware:', err);
      return null;
    }
  }, [loadHardware]);

  const updateHardware = useCallback(async (id: string, formData: Partial<CameraHardwareFormData>): Promise<CameraHardware | null> => {
    try {
      setError(null);
      
      const result = await updateCameraHardware(id, formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update camera hardware');
      }
      
      // Update the hardware in state
      setHardware(prev => prev.map(hw => hw.id === id ? result.data! : hw));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update camera hardware';
      setError(errorMessage);
      console.error('Error updating camera hardware:', err);
      return null;
    }
  }, []);

  const deleteHardware = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await softDeleteCameraHardware(id);  // ← Changed to use softDeleteCameraHardware
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete camera hardware');
      }
      
      // Remove from state or mark as inactive
      setHardware(prev => prev.map(hw => hw.id === id ? { ...hw, active: false } : hw));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete camera hardware';
      setError(errorMessage);
      console.error('Error deleting camera hardware:', err);
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    loadHardware();
  }, [loadHardware]);

  // Load on mount and when filters change
  useEffect(() => {
    loadHardware();
  }, [loadHardware]);

  return {
    hardware,
    loading,
    error,
    createHardware,
    updateHardware,
    deleteHardware,
    refresh
  };
}

/**
 * Hook for managing single camera hardware
 */
export function useCameraHardwareById(id: string | null) {
  const [hardware, setHardware] = useState<CameraHardware | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHardware = useCallback(async () => {
    if (!id) {
      setHardware(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getCameraHardwareById(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch camera hardware');
      }
      
      setHardware(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camera hardware';
      setError(errorMessage);
      console.error('Error loading camera hardware:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHardware();
  }, [loadHardware]);

  return {
    hardware,
    loading,
    error,
    refresh: loadHardware
  };
}

/**
 * Hook for getting available hardware for deployment
 */
export function useAvailableHardware() {
  const [hardware, setHardware] = useState<CameraHardware[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableHardware = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAvailableHardware();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch available hardware');
      }
      
      setHardware(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load available hardware';
      setError(errorMessage);
      console.error('Error loading available hardware:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableHardware();
  }, [loadAvailableHardware]);

  return {
    hardware,
    loading,
    error,
    refresh: loadAvailableHardware
  };
}

// ============================================================================
// CAMERA DEPLOYMENTS HOOKS (Main camera management)
// ============================================================================

/**
 * Main hook for camera deployments (similar to useStands pattern)
 */
export function useCameras(filters?: Partial<CameraFilters>) {
  const [cameras, setCameras] = useState<CameraWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getCameraDeployments(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch camera deployments');
      }
      
      setCameras(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cameras';
      setError(errorMessage);
      console.error('Error loading cameras:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createDeployment = useCallback(async (formData: CameraDeploymentFormData): Promise<CameraDeployment | null> => {
    try {
      setError(null);
      
      const result = await createCameraDeployment(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create camera deployment');
      }
      
      // Refresh the list
      await loadCameras();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create camera deployment';
      setError(errorMessage);
      console.error('Error creating camera deployment:', err);
      return null;
    }
  }, [loadCameras]);

  const updateDeployment = useCallback(async (id: string, formData: Partial<CameraDeploymentFormData>): Promise<CameraDeployment | null> => {
    try {
      setError(null);
      
      const result = await updateCameraDeployment(id, formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update camera deployment');
      }
      
      // Update in state
      setCameras(prev => prev.map(camera => 
        camera.deployment?.id === id 
          ? { ...camera, deployment: result.data! }
          : camera
      ));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update camera deployment';
      setError(errorMessage);
      console.error('Error updating camera deployment:', err);
      return null;
    }
  }, []);

  const deactivateDeployment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await deactivateCameraDeployment(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate camera deployment');
      }
      
      // Remove from state or mark as inactive
      setCameras(prev => prev.filter(camera => camera.deployment?.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate camera deployment';
      setError(errorMessage);
      console.error('Error deactivating camera deployment:', err);
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    loadCameras();
  }, [loadCameras]);

  // Load on mount and when filters change
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  return {
    cameras,
    loading,
    error,
    createDeployment,
    updateDeployment,
    deactivateDeployment,
    refresh
  };
}

/**
 * Hook for single camera deployment
 */
export function useCameraById(id: string | null) {
  const [camera, setCamera] = useState<CameraDeployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCamera = useCallback(async () => {
    if (!id) {
      setCamera(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getCameraDeploymentById(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch camera deployment');
      }
      
      setCamera(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camera';
      setError(errorMessage);
      console.error('Error loading camera:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCamera();
  }, [loadCamera]);

  return {
    camera,
    loading,
    error,
    refresh: loadCamera
  };
}

// ============================================================================
// STATUS REPORTS HOOKS
// ============================================================================

/**
 * Hook for camera status reports
 */
export function useStatusReports(deploymentId: string | null, limit?: number) {
  const [reports, setReports] = useState<CameraStatusReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!deploymentId) {
      setReports([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getStatusReports(deploymentId, limit);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch status reports');
      }
      
      setReports(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load status reports';
      setError(errorMessage);
      console.error('Error loading status reports:', err);
    } finally {
      setLoading(false);
    }
  }, [deploymentId, limit]);

  const addReport = useCallback(async (formData: CameraStatusReportFormData): Promise<CameraStatusReport | null> => {
    try {
      setError(null);
      
      const result = await addStatusReport(formData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to add status report');
      }
      
      // Add to beginning of reports list
      setReports(prev => [result.data!, ...prev]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add status report';
      setError(errorMessage);
      console.error('Error adding status report:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    reports,
    loading,
    error,
    addReport,
    refresh: loadReports
  };
}

// ============================================================================
// ALERTS AND MISSING CAMERAS HOOKS
// ============================================================================

/**
 * Hook for camera alerts (similar to useMapData pattern)
 */
export function useCameraAlerts() {
  const [alerts, setAlerts] = useState<CameraWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getCameraAlerts();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch camera alerts');
      }
      
      setAlerts(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camera alerts';
      setError(errorMessage);
      console.error('Error loading camera alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    
    // Auto-refresh alerts every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  return {
    alerts,
    loading,
    error,
    refresh: loadAlerts
  };
}

/**
 * Hook for missing cameras
 */
export function useMissingCameras() {
  const [missing, setMissing] = useState<MissingCameraAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMissing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getMissingCameras();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch missing cameras');
      }
      
      setMissing(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load missing cameras';
      setError(errorMessage);
      console.error('Error loading missing cameras:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectMissing = useCallback(async (date?: string): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await detectMissingCameras(date);
      if (!result.success) {
        throw new Error(result.error || 'Failed to detect missing cameras');
      }
      
      // Refresh the missing cameras list
      await loadMissing();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect missing cameras';
      setError(errorMessage);
      console.error('Error detecting missing cameras:', err);
      return false;
    }
  }, [loadMissing]);

  useEffect(() => {
    loadMissing();
    
    // Auto-refresh missing cameras every 10 minutes
    const interval = setInterval(loadMissing, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadMissing]);

  return {
    missing,
    loading,
    error,
    detectMissing,
    refresh: loadMissing
  };
}

// ============================================================================
// STATISTICS HOOKS
// ============================================================================

/**
 * Hook for camera system statistics
 */
export function useCameraStats() {
  const [stats, setStats] = useState<CameraStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getCameraStats();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch camera statistics');
      }
      
      setStats(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load camera statistics';
      setError(errorMessage);
      console.error('Error loading camera statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    
    // Auto-refresh stats every 10 minutes
    const interval = setInterval(loadStats, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for checking device ID availability
 */
export function useDeviceIdAvailability() {
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async (deviceId: string, excludeId?: string): Promise<boolean> => {
    if (!deviceId) return true;
    
    setIsChecking(true);
    try {
      return await isDeviceIdAvailable(deviceId, excludeId);
    } catch (error) {
      console.error('Error checking device ID availability:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { checkAvailability, isChecking };
}

/**
 * Hook for camera filtering and sorting (similar to stands filtering)
 */
export function useCameraFilters() {
  const [filters, setFilters] = useState<Partial<CameraFilters>>({});
  const [sortOptions, setSortOptions] = useState<CameraSortOptions>({
    field: 'location_name',
    direction: 'asc'
  });

  const updateFilter = useCallback((key: keyof CameraFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const updateSort = useCallback((field: CameraSortOptions['field'], direction?: CameraSortOptions['direction']) => {
    setSortOptions(prev => ({
      field,
      direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc')
    }));
  }, []);

  // Apply filters to camera list
  const applyFilters = useCallback((cameras: CameraWithStatus[]) => {
    let filtered = [...cameras];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(camera => 
        camera.deployment?.location_name.toLowerCase().includes(searchLower) ||
        camera.hardware.device_id.toLowerCase().includes(searchLower) ||
        camera.deployment?.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Active filter
    if (filters.active !== undefined) {
      filtered = filtered.filter(camera => camera.deployment?.active === filters.active);
    }

    // Missing filter
    if (filters.is_missing !== undefined) {
      filtered = filtered.filter(camera => camera.deployment?.is_missing === filters.is_missing);
    }

    // Brand filter
    if (filters.brand?.length) {
      filtered = filtered.filter(camera => 
        filters.brand!.includes(camera.hardware.brand || '')
      );
    }

    // Season year filter
    if (filters.season_year?.length) {
      filtered = filtered.filter(camera => 
        filters.season_year!.includes(camera.deployment?.season_year || 0)
      );
    }

    // Battery status filter
    if (filters.battery_status?.length) {
      filtered = filtered.filter(camera => 
        filters.battery_status!.includes(camera.latest_report?.battery_status || '')
      );
    }

    // Alerts filter
    if (filters.has_alerts !== undefined) {
      filtered = filtered.filter(camera => 
        (camera.latest_report?.needs_attention === true) === filters.has_alerts
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOptions.field) {
        case 'device_id':
          aValue = a.hardware.device_id;
          bValue = b.hardware.device_id;
          break;
        case 'location_name':
          aValue = a.deployment?.location_name || '';
          bValue = b.deployment?.location_name || '';
          break;
        case 'last_seen_date':
          aValue = a.deployment?.last_seen_date || '';
          bValue = b.deployment?.last_seen_date || '';
          break;
        case 'battery_status':
          aValue = a.latest_report?.battery_status || '';
          bValue = b.latest_report?.battery_status || '';
          break;
        case 'created_at':
          aValue = a.deployment?.created_at || '';
          bValue = b.deployment?.created_at || '';
          break;
        default:
          aValue = a.deployment?.location_name || '';
          bValue = b.deployment?.location_name || '';
      }

      if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filters, sortOptions]);

  return {
    filters,
    sortOptions,
    updateFilter,
    clearFilters,
    updateSort,
    setFilters,
    setSortOptions,
    applyFilters
  };
}

/**
 * Combined dashboard hook (similar to useMapData)
 */
export function useCameraDashboard() {
  const { cameras, loading: camerasLoading, error: camerasError } = useCameras({ active: true });
  const { alerts, loading: alertsLoading, error: alertsError } = useCameraAlerts();
  const { missing, loading: missingLoading, error: missingError } = useMissingCameras();
  const { stats, loading: statsLoading, error: statsError } = useCameraStats();

  const loading = camerasLoading || statsLoading;
  const error = camerasError || alertsError || missingError || statsError;

  return {
    cameras,
    alerts,
    missing,
    stats,
    loading,
    error
  };
}
