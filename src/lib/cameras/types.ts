// Camera System TypeScript Types
// Phase 2, Step 2.1: Enhanced types with missing detection support

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const CAMERA_CONDITIONS = [
  'good',
  'questionable', 
  'poor',
  'retired'
] as const;

export const FACING_DIRECTIONS = [
  'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'
] as const;

export const BATTERY_STATUSES = [
  'Full', 'Good', 'OK', 'Low', 'Critical', 'Ext OK'
] as const;

export type CameraCondition = typeof CAMERA_CONDITIONS[number];
export type FacingDirection = typeof FACING_DIRECTIONS[number];
export type BatteryStatus = typeof BATTERY_STATUSES[number];

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Physical camera hardware device
 * Maps to: camera_hardware table (13 fields)
 */
export interface CameraHardware {
  id: string;
  device_id: string;           // "002", "013" from daily reports
  brand: string | null;        // "CuddeLink", "Reconyx"
  model: string | null;        // "J-2", "LL2A", "G-2+"
  serial_number: string | null;
  purchase_date: string | null; // ISO date string
  fw_version: string | null;    // "8.3.0", "1.7.0"
  cl_version: string | null;    // "1.0.44 / 5.5.11"
  condition: CameraCondition;
  active: boolean;
  notes: string | null;
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}

/**
 * Camera deployment location with missing detection
 * Maps to: camera_deployments table (17 fields)
 */
export interface CameraDeployment {
  id: string;
  hardware_id: string;
  location_name: string;       // "DAM ROAD", "SHIT STAND FIELD"
  latitude: number;
  longitude: number;
  season_year: number | null;  // 2024, 2025
  stand_id: string | null;
  facing_direction: FacingDirection | null;
  has_solar_panel: boolean;    // Critical for battery alerts
  active: boolean;
  notes: string | null;
  // Missing detection fields
  last_seen_date: string | null;      // ISO date string
  missing_since_date: string | null;  // ISO date string  
  is_missing: boolean;
  consecutive_missing_days: number;
  created_at: string;
  updated_at: string;
}

/**
 * Daily camera status report with automatic alerts
 * Maps to: camera_status_reports table (15 fields)
 */
export interface CameraStatusReport {
  id: string;
  deployment_id: string;
  hardware_id: string;
  report_date: string;               // ISO date string
  battery_status: BatteryStatus | null;
  signal_level: number | null;       // 0-100
  network_links: number | null;      // Number of network connections
  sd_images_count: number | null;    // Images on SD card
  sd_free_space_mb: number | null;   // Free space in MB
  image_queue: number | null;        // Images waiting to upload
  needs_attention: boolean;
  alert_reason: string | null;
  report_processing_date: string;    // When we processed the report
  cuddeback_report_timestamp: string | null;
  created_at: string;
}

// ============================================================================
// COMPOSITE INTERFACES
// ============================================================================

/**
 * Complete camera information (hardware + deployment + latest report)
 * Used for dashboard displays and camera cards
 */
export interface CameraWithStatus {
  hardware: CameraHardware;
  deployment: CameraDeployment | null;
  latest_report: CameraStatusReport | null;
  days_since_last_report: number | null;
}

/**
 * Missing camera alert information
 * Used for alert dashboards and notifications
 */
export interface MissingCameraAlert {
  deployment_id: string;
  hardware_id: string;
  device_id: string;
  location_name: string;
  last_seen_date: string | null;
  missing_since_date: string | null;
  consecutive_missing_days: number;
  investigation_notes?: string;
}

/**
 * Camera statistics for dashboard
 * Includes missing camera metrics
 */
export interface CameraStats {
  total_hardware: number;
  active_deployments: number;
  cameras_with_alerts: number;
  missing_cameras: number;           // New missing detection metric
  average_battery_level: number | null;
  total_photos_stored: number;
  cameras_by_brand: Record<string, number>;
  deployments_by_season: Record<number, number>;
  alerts_by_type: Record<string, number>;
  missing_by_days: Record<number, number>;  // missing 1 day, 2 days, etc.
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

/**
 * Form data for creating/editing camera hardware
 */
export interface CameraHardwareFormData {
  device_id: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  fw_version?: string;
  cl_version?: string;
  condition: CameraCondition;
  active: boolean;
  notes?: string;
}

/**
 * Form data for creating/editing camera deployments
 */
export interface CameraDeploymentFormData {
  hardware_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  season_year?: number;
  stand_id?: string;
  facing_direction?: FacingDirection;
  has_solar_panel: boolean;
  active: boolean;
  notes?: string;
}

/**
 * Form data for manually entering status reports
 */
export interface CameraStatusReportFormData {
  deployment_id: string;
  report_date: string;
  battery_status?: BatteryStatus;
  signal_level?: number;
  network_links?: number;
  sd_images_count?: number;
  sd_free_space_mb?: number;
  image_queue?: number;
  notes?: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * Response from camera management API endpoints
 */
export interface CameraAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response for camera lists
 */
export interface CameraPaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// FILTER INTERFACES  
// ============================================================================

/**
 * Filters for camera queries
 */
export interface CameraFilters {
  active?: boolean;
  condition?: CameraCondition[];
  season_year?: number[];
  has_alerts?: boolean;
  is_missing?: boolean;
  battery_status?: BatteryStatus[];
  brand?: string[];
  search?: string;  // Search device_id, location_name, notes
}

/**
 * Sort options for camera lists
 */
export interface CameraSortOptions {
  field: 'device_id' | 'location_name' | 'last_seen_date' | 'battery_status' | 'created_at';
  direction: 'asc' | 'desc';
}

// ============================================================================
// EMAIL PARSING INTERFACES (for future Phase 5)
// ============================================================================

/**
 * Raw email report data before processing
 */
export interface RawEmailReport {
  device_id: string;
  report_date: string;
  battery_status?: string;
  signal_level?: string;
  network_links?: string;
  sd_images_count?: string;
  sd_free_space_mb?: string;
  image_queue?: string;
  raw_content: string;  // Original email content
}

/**
 * Email parsing result
 */
export interface EmailParseResult {
  success: boolean;
  reports: RawEmailReport[];
  errors: string[];
  warnings: string[];
  parsing_metadata: {
    email_date: string;
    reports_found: number;
    unknown_devices: string[];
  };
}
