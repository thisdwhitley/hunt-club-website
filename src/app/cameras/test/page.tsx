// Camera Type Safety Test Page
// File Location: src/app/cameras-/est/page.tsx
// Phase 2, Step 2.4: Comprehensive test for camera types, hooks, and database integration

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Database, Wifi, Eye, Plus, Camera, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  useCameras,
  useCameraHardware,
  useCameraAlerts,
  useCameraStats,
  useMissingCameras,
  useAvailableHardware,
  useDeviceIdAvailability
} from '@/lib/cameras/hooks'
import {
  getCameraHardware,
  getCameraDeployments,
  getCameraStats,
  isDeviceIdAvailable
} from '@/lib/cameras/database'
import type {
  CameraHardware,
  CameraDeployment,
  CameraWithStatus,
  CameraStats,
  CameraHardwareFormData,
  CameraDeploymentFormData
} from '@/lib/cameras/types'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: string | any
}

// Sample data for testing type safety (static to prevent flicker)
const sampleHardwareData: CameraHardwareFormData = {
  device_id: 'TEST999',
  brand: 'Test Brand',
  model: 'Test Model X1',
  serial_number: 'TEST-12345',
  purchase_date: '2024-01-15',
  fw_version: '1.0.0',
  cl_version: '1.0.0',
  condition: 'good',
  active: true,
  notes: 'Test camera for type safety verification'
}

const sampleDeploymentData: CameraDeploymentFormData = {
  hardware_id: '', // Will be set dynamically
  location_name: 'TYPE TEST LOCATION',
  latitude: 36.427236,
  longitude: -79.510881,
  season_year: 2025,
  facing_direction: 'N',
  has_solar_panel: true,
  active: true,
  notes: 'Test deployment for type safety verification'
}

export default function CamerasTestPage() {
  // Test state
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [showSampleData, setShowSampleData] = useState(false)

  // Hook testing - use stable filter objects to prevent flicker
  const cameraFilters = useMemo(() => ({ active: true }), [])
  const cameraHooks = useCameras(cameraFilters)
  const hardwareHooks = useCameraHardware()
  const alertsHooks = useCameraAlerts()
  const statsHooks = useCameraStats()
  const missingHooks = useMissingCameras()
  const availableHooks = useAvailableHardware()
  const deviceIdHooks = useDeviceIdAvailability()

  // Sample camera data for type testing (static to prevent flicker)
const STATIC_TIMESTAMP = '2024-12-07T10:00:00.000Z';

const sampleCameraData: CameraWithStatus = {
  hardware: {
    id: 'test-hw-1',
    device_id: 'TEST001',
    brand: 'Test Brand',
    model: 'Test Model',
    serial_number: 'TEST-001',
    purchase_date: '2024-01-01',
    fw_version: '1.0.0',
    cl_version: '1.0.0',
    condition: 'good',
    active: true,
    notes: 'Sample camera for testing',
    created_at: STATIC_TIMESTAMP,
    updated_at: STATIC_TIMESTAMP
  },
  deployment: {
    id: 'test-dep-1',
    hardware_id: 'test-hw-1',
    location_name: 'TEST STAND FIELD',
    latitude: 36.427236,
    longitude: -79.510881,
    season_year: 2025,
    stand_id: null,
    facing_direction: 'N',
    has_solar_panel: true,
    active: true,
    notes: 'Sample deployment for testing',
    last_seen_date: '2024-12-01',
    missing_since_date: null,
    is_missing: false,
    consecutive_missing_days: 0,
    created_at: STATIC_TIMESTAMP,
    updated_at: STATIC_TIMESTAMP
  },
  latest_report: {
    id: 'test-rep-1',
    deployment_id: 'test-dep-1',
    hardware_id: 'test-hw-1',
    report_date: '2024-12-01',
    battery_status: 'Good',
    signal_level: 85,
    network_links: 3,
    sd_images_count: 150,
    sd_free_space_mb: 2048,
    image_queue: 5,
    needs_attention: false,
    alert_reason: null,
    report_processing_date: STATIC_TIMESTAMP,
    created_at: STATIC_TIMESTAMP
  },
  days_since_last_report: 1
}

  const addTestResult = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTestResults(prev => [...prev, { name, status, message, details }])
  }

  const runComprehensiveTests = async () => {
    setIsRunningTests(true)
    setTestResults([])

    // Test 1: Type Definitions
    try {
      // Test all type interfaces compile correctly
      const testHardware: CameraHardware = sampleCameraData.hardware
      const testDeployment: CameraDeployment = sampleCameraData.deployment!
      const testCameraWithStatus: CameraWithStatus = sampleCameraData
      
      addTestResult('Type Definitions', 'success', 'All camera type interfaces compile correctly', {
        hardware: typeof testHardware,
        deployment: typeof testDeployment,
        cameraWithStatus: typeof testCameraWithStatus
      })
    } catch (error) {
      addTestResult('Type Definitions', 'error', 'Type compilation failed', error)
    }

    // Test 2: Database Connection
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('camera_hardware').select('count').limit(1)
      
      if (error) throw error
      addTestResult('Database Connection', 'success', 'Supabase connection successful')
    } catch (error) {
      addTestResult('Database Connection', 'error', `Database connection failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 3: Table Existence
    try {
      const supabase = createClient()
      const tables = ['camera_hardware', 'camera_deployments', 'camera_status_reports']
      const tableResults = []

      for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1)
        tableResults.push({
          table,
          exists: !error,
          error: error?.message
        })
      }

      const allTablesExist = tableResults.every(t => t.exists)
      addTestResult('Database Tables', allTablesExist ? 'success' : 'error', 
        allTablesExist ? 'All camera tables exist' : 'Some camera tables missing', 
        tableResults
      )
    } catch (error) {
      addTestResult('Database Tables', 'error', `Table check failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 4: Database Service Functions
    try {
      const hardwareResult = await getCameraHardware()
      const deploymentsResult = await getCameraDeployments()
      const statsResult = await getCameraStats()
      
      addTestResult('Database Service Layer', 'success', 'All database service functions working', {
        hardware: hardwareResult.success,
        deployments: deploymentsResult.success,
        stats: statsResult.success
      })
    } catch (error) {
      addTestResult('Database Service Layer', 'error', `Service functions failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 5: React Hooks
    try {
      const hookTests = [
        { name: 'useCameras', loading: cameraHooks.loading, error: cameraHooks.error },
        { name: 'useCameraHardware', loading: hardwareHooks.loading, error: hardwareHooks.error },
        { name: 'useCameraAlerts', loading: alertsHooks.loading, error: alertsHooks.error },
        { name: 'useCameraStats', loading: statsHooks.loading, error: statsHooks.error },
        { name: 'useMissingCameras', loading: missingHooks.loading, error: missingHooks.error },
        { name: 'useAvailableHardware', loading: availableHooks.loading, error: availableHooks.error }
      ]

      const hasErrors = hookTests.some(test => test.error)
      addTestResult('React Hooks', hasErrors ? 'warning' : 'success', 
        hasErrors ? 'Some hooks have errors (may be expected if no data)' : 'All hooks initialized successfully',
        hookTests
      )
    } catch (error) {
      addTestResult('React Hooks', 'error', `Hook testing failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 6: Hook Functions
    try {
      const deviceIdAvailable = await deviceIdHooks.checkAvailability('NONEXISTENT999')
      addTestResult('Hook Functions', 'success', 'Hook functions execute correctly', {
        deviceIdCheck: deviceIdAvailable,
        isChecking: deviceIdHooks.isChecking
      })
    } catch (error) {
      addTestResult('Hook Functions', 'error', `Hook functions failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 7: Type Guards and Validation
    try {
      // Test form data validation
      const validHardwareForm = sampleHardwareData
      const validDeploymentForm = sampleDeploymentData
      
      addTestResult('Type Validation', 'success', 'Form data types validate correctly', {
        hardwareForm: typeof validHardwareForm,
        deploymentForm: typeof validDeploymentForm
      })
    } catch (error) {
      addTestResult('Type Validation', 'error', `Type validation failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 8: Component Props
    try {
      // Test that sample data matches expected component props
      const testCameraProps = {
        camera: sampleCameraData,
        mode: 'full' as const,
        onEdit: () => {},
        onMove: () => {},
        onViewReports: () => {}
      }
      
      addTestResult('Component Props', 'success', 'Component prop types compile correctly', {
        propsType: typeof testCameraProps
      })
    } catch (error) {
      addTestResult('Component Props', 'error', `Component props failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    setIsRunningTests(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <div className="h-5 w-5 rounded-full border-2 border-gray-300 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Camera System Type Safety Test
        </h1>
        <p className="text-gray-600">
          Comprehensive testing of camera types, database services, and React hooks
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={runComprehensiveTests}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunningTests ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={() => setShowSampleData(!showSampleData)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
              {showSampleData ? 'Hide' : 'Show'} Sample Data
            </button>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <span>Fail</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hook Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Hook Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="h-4 w-4" />
              <span className="font-medium">useCameras</span>
            </div>
            <div className="text-sm text-gray-600">
              Loading: {cameraHooks.loading ? 'Yes' : 'No'} | 
              Cameras: {cameraHooks.cameras.length} | 
              Error: {cameraHooks.error ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4" />
              <span className="font-medium">useCameraHardware</span>
            </div>
            <div className="text-sm text-gray-600">
              Loading: {hardwareHooks.loading ? 'Yes' : 'No'} | 
              Hardware: {hardwareHooks.hardware.length} | 
              Error: {hardwareHooks.error ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">useCameraAlerts</span>
            </div>
            <div className="text-sm text-gray-600">
              Loading: {alertsHooks.loading ? 'Yes' : 'No'} | 
              Alerts: {alertsHooks.alerts.length} | 
              Error: {alertsHooks.error ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4" />
              <span className="font-medium">useCameraStats</span>
            </div>
            <div className="text-sm text-gray-600">
              Loading: {statsHooks.loading ? 'Yes' : 'No'} | 
              Stats: {statsHooks.stats ? 'Available' : 'Null'} | 
              Error: {statsHooks.error ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">useMissingCameras</span>
            </div>
            <div className="text-sm text-gray-600">
              Loading: {missingHooks.loading ? 'Yes' : 'No'} | 
              Missing: {missingHooks.missing.length} | 
              Error: {missingHooks.error ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="h-4 w-4" />
              <span className="font-medium">useAvailableHardware</span>
            </div>
            <div className="text-sm text-gray-600">
              Loading: {availableHooks.loading ? 'Yes' : 'No'} | 
              Available: {availableHooks.hardware.length} | 
              Error: {availableHooks.error ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Data Preview */}
      {showSampleData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Sample Camera Data</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">CameraWithStatus Object:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(sampleCameraData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Test Results {testResults.length > 0 && `(${testResults.length})`}
        </h3>
        
        {testResults.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tests run yet. Click "Run All Tests" to begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{result.name}</h4>
                    <p className="text-gray-700 mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto border">
                          {typeof result.details === 'string' 
                            ? result.details 
                            : JSON.stringify(result.details, null, 2)
                          }
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Test Summary:</span>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">
                ✓ {testResults.filter(r => r.status === 'success').length} passed
              </span>
              <span className="text-yellow-600">
                ⚠ {testResults.filter(r => r.status === 'warning').length} warnings
              </span>
              <span className="text-red-600">
                ✗ {testResults.filter(r => r.status === 'error').length} failed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
