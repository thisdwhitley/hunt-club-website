'use client'

import { useState } from 'react'
import CameraCard from '@/components/cameras/CameraCard'
import { CameraWithStatus } from '@/lib/cameras/types'
import { Camera, Eye, EyeOff, MapPin } from 'lucide-react'

// Mock camera data for testing different states
const mockCameraData: CameraWithStatus[] = [
  {
    // Good camera with recent report
    hardware: {
      id: 'hw-001',
      device_id: '002',
      brand: 'CuddeLink',
      model: 'J-2',
      serial_number: 'CL20250001',
      purchase_date: '2025-01-01',
      fw_version: '8.3.0',
      cl_version: '1.0.44 / 5.5.11',
      condition: 'good',
      active: true,
      notes: 'Primary camera',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    deployment: {
      id: 'demo-camera-1',
      hardware_id: 'hw-001',
      location_name: 'Dam Road East',
      latitude: 36.42723576739513,
      longitude: -79.51088069325365,
      season_year: 2025,
      stand_id: 'stand-001',
      facing_direction: 'N',
      has_solar_panel: true,
      active: true,
      notes: 'Good visibility, near feeder',
      last_seen_date: '2025-07-07',
      missing_since_date: null,
      is_missing: false,
      consecutive_missing_days: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-07-07T08:00:00Z'
    },
    latest_report: {
      id: 'report-001',
      deployment_id: 'demo-camera-1',
      hardware_id: 'hw-001',
      report_date: '2025-07-07',
      battery_status: 'Good',
      signal_level: 85,
      network_links: 3,
      sd_images_count: 247,
      sd_free_space_mb: 28567,
      image_queue: 0,
      needs_attention: false,
      alert_reason: null,
      report_processing_date: '2025-07-07T08:15:00Z',
      created_at: '2025-07-07T08:15:00Z'
    },
    days_since_last_report: 1
  },
  {
    // Camera with low battery warning
    hardware: {
      id: 'hw-002',
      device_id: '013',
      brand: 'Reconyx',
      model: 'LL2A',
      serial_number: 'RX20250013',
      purchase_date: '2025-01-15',
      fw_version: '1.7.0',
      cl_version: null,
      condition: 'good',
      active: true,
      notes: 'No CuddeLink capability',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z'
    },
    deployment: {
      id: 'demo-camera-2',
      hardware_id: 'hw-002',
      location_name: 'South Field Trail',
      latitude: 36.425,
      longitude: -79.512,
      season_year: 2025,
      stand_id: null,
      facing_direction: 'SE',
      has_solar_panel: false,
      active: true,
      notes: 'Trail junction camera',
      last_seen_date: '2025-07-06',
      missing_since_date: null,
      is_missing: false,
      consecutive_missing_days: 0,
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-07-06T06:30:00Z'
    },
    latest_report: {
      id: 'report-002',
      deployment_id: 'demo-camera-2',
      hardware_id: 'hw-002',
      report_date: '2025-07-06',
      battery_status: 'Low',
      signal_level: 0,
      network_links: 0,
      sd_images_count: 1847,
      sd_free_space_mb: 2156,
      image_queue: 0,
      needs_attention: true,
      alert_reason: 'Low battery level requires replacement',
      report_processing_date: '2025-07-06T06:30:00Z',
      created_at: '2025-07-06T06:30:00Z'
    },
    days_since_last_report: 2
  },
  {
    // Missing camera (critical alert)
    hardware: {
      id: 'hw-003',
      device_id: '007',
      brand: 'CuddeLink',
      model: 'G-2+',
      serial_number: 'CL20250007',
      purchase_date: '2025-02-01',
      fw_version: '8.3.0',
      cl_version: '1.0.44 / 5.5.11',
      condition: 'questionable',
      active: true,
      notes: 'Previously had connectivity issues',
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z'
    },
    deployment: {
      id: 'demo-camera-3',
      hardware_id: 'hw-003',
      location_name: 'Creek Crossing',
      latitude: 36.428,
      longitude: -79.508,
      season_year: 2025,
      stand_id: 'stand-003',
      facing_direction: 'W',
      has_solar_panel: true,
      active: true,
      notes: 'Near water source',
      last_seen_date: '2025-07-01',
      missing_since_date: '2025-07-02',
      is_missing: true,
      consecutive_missing_days: 6,
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-07-02T00:00:00Z'
    },
    latest_report: {
      id: 'report-003',
      deployment_id: 'demo-camera-3',
      hardware_id: 'hw-003',
      report_date: '2025-07-01',
      battery_status: 'Good',
      signal_level: 67,
      network_links: 2,
      sd_images_count: 892,
      sd_free_space_mb: 25431,
      image_queue: 0,
      needs_attention: true,
      alert_reason: 'Camera missing for 6 consecutive days',
      report_processing_date: '2025-07-01T07:45:00Z',
      created_at: '2025-07-01T07:45:00Z'
    },
    days_since_last_report: 7
  },
  {
    // Critical battery camera
    hardware: {
      id: 'hw-004',
      device_id: '024',
      brand: 'CuddeLink',
      model: 'J-2',
      serial_number: 'CL20250024',
      purchase_date: '2025-03-01',
      fw_version: '8.3.0',
      cl_version: '1.0.44 / 5.5.11',
      condition: 'good',
      active: true,
      notes: 'Recently deployed',
      created_at: '2025-03-01T00:00:00Z',
      updated_at: '2025-03-01T00:00:00Z'
    },
    deployment: {
      id: 'demo-camera-4',
      hardware_id: 'hw-004',
      location_name: 'Ridge Overlook',
      latitude: 36.430,
      longitude: -79.515,
      season_year: 2025,
      stand_id: null,
      facing_direction: 'NE',
      has_solar_panel: false,
      active: true,
      notes: 'High traffic area',
      last_seen_date: '2025-07-07',
      missing_since_date: null,
      is_missing: false,
      consecutive_missing_days: 0,
      created_at: '2025-03-01T00:00:00Z',
      updated_at: '2025-07-07T05:20:00Z'
    },
    latest_report: {
      id: 'report-004',
      deployment_id: 'demo-camera-4',
      hardware_id: 'hw-004',
      report_date: '2025-07-07',
      battery_status: 'Critical',
      signal_level: 23,
      network_links: 1,
      sd_images_count: 3247,
      sd_free_space_mb: 892,
      image_queue: 47,
      needs_attention: true,
      alert_reason: 'Critical battery level - immediate replacement required',
      report_processing_date: '2025-07-07T05:20:00Z',
      created_at: '2025-07-07T05:20:00Z'
    },
    days_since_last_report: 1
  }
]

export default function CameraDemoPage() {
  const [visibleModes, setVisibleModes] = useState({
    compact: true,
    full: true,
    popup: true
  })

  const [selectedCamera, setSelectedCamera] = useState<CameraWithStatus | null>(null)

  const mockHandlers = {
    onEdit: (camera: CameraWithStatus) => {
      console.log('Edit camera:', camera.hardware.device_id)
      alert(`Edit camera ${camera.hardware.device_id} - ${camera.deployment?.location_name}`)
    },
    onDelete: (camera: CameraWithStatus) => {
      console.log('Delete camera:', camera.hardware.device_id)
      alert(`Delete camera ${camera.hardware.device_id}`)
    },
    onNavigate: (camera: CameraWithStatus) => {
      console.log('Navigate to camera:', camera.hardware.device_id)
      alert(`Navigate to ${camera.deployment?.location_name} on map`)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Camera Component Demo
        </h1>
        <p className="text-gray-600">
          Testing CameraCard component in all three modes with various camera states
        </p>
      </div>

      {/* Mode Toggle Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Display Modes</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setVisibleModes(prev => ({ ...prev, compact: !prev.compact }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              visibleModes.compact 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            {visibleModes.compact ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Compact Mode
          </button>
          
          <button
            onClick={() => setVisibleModes(prev => ({ ...prev, full: !prev.full }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              visibleModes.full 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            {visibleModes.full ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Full Mode
          </button>
          
          <button
            onClick={() => setVisibleModes(prev => ({ ...prev, popup: !prev.popup }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              visibleModes.popup 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            {visibleModes.popup ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Popup Mode
          </button>
        </div>
      </div>

      {/* Compact Mode Section */}
      {visibleModes.compact && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Compact Mode
          </h2>
          <p className="text-gray-600 mb-4">
            Used in lists and grid views. Shows essential info with alert indicators.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockCameraData.map((camera) => (
              <CameraCard
                key={`compact-${camera.hardware.id}`}
                camera={camera}
                mode="compact"
                onEdit={mockHandlers.onEdit}
                onDelete={mockHandlers.onDelete}
                onNavigate={mockHandlers.onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full Mode Section */}
      {visibleModes.full && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Full Mode
          </h2>
          <p className="text-gray-600 mb-4">
            Used on dedicated camera pages. Shows comprehensive camera information.
          </p>
          <div className="space-y-6">
            {mockCameraData.map((camera) => (
              <CameraCard
                key={`full-${camera.hardware.id}`}
                camera={camera}
                mode="full"
                onEdit={mockHandlers.onEdit}
                onDelete={mockHandlers.onDelete}
                onNavigate={mockHandlers.onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Popup Mode Section */}
      {visibleModes.popup && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Popup Mode
          </h2>
          <p className="text-gray-600 mb-4">
            Used in PropertyMap popups. Click cameras below to test popup behavior.
          </p>
          
          {/* Camera Selection Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {mockCameraData.map((camera) => (
              <button
                key={`popup-selector-${camera.hardware.id}`}
                onClick={() => setSelectedCamera(camera)}
                className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  Camera {camera.hardware.device_id}
                </div>
                <div className="text-sm text-gray-600">
                  {camera.deployment?.location_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click to show popup
                </div>
              </button>
            ))}
          </div>

          {/* Popup Display */}
          {selectedCamera && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Popup Preview</h3>
                <button
                  onClick={() => setSelectedCamera(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <CameraCard
                camera={selectedCamera}
                mode="popup"
                onEdit={mockHandlers.onEdit}
                onDelete={mockHandlers.onDelete}
                onNavigate={mockHandlers.onNavigate}
              />
            </div>
          )}
        </div>
      )}

      {/* Testing Checklist */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Testing Checklist</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>CameraCard renders in compact mode</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>CameraCard renders in full mode</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>CameraCard renders in popup mode</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Alert styling works for cameras with issues</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Click handlers work (Edit, Delete, Navigate)</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Camera status badges display correctly</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Different camera states display correctly</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Hardware info and power source icons work</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Report data section shows properly in full mode</span>
          </div>
        </div>
      </div>
    </div>
  )
}