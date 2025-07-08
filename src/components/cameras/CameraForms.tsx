// src/components/cameras/CameraForms.tsx
// Comprehensive forms for creating and editing cameras with all fields

'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, MapPin, Camera, Settings } from 'lucide-react'
import { useStands } from '@/hooks/useStands' // Import your stands hook
import type { 
  CameraHardware, 
  CameraDeployment, 
  CameraWithStatus,
  CameraHardwareFormData,
  CameraDeploymentFormData 
} from '@/lib/cameras/types'

// Combined Camera Form (Hardware + Deployment)
interface CameraFormProps {
  camera?: CameraWithStatus | null
  onClose: () => void
  onSubmit: (hardwareData: CameraHardwareFormData, deploymentData?: CameraDeploymentFormData) => Promise<void>
  isLoading?: boolean
  mode: 'create' | 'edit-hardware' | 'edit-deployment'
}

export function CameraForm({ camera, onClose, onSubmit, isLoading, mode }: CameraFormProps) {
  // Hardware form data
  const [hardwareData, setHardwareData] = useState<CameraHardwareFormData>({
    device_id: '',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    fw_version: '',
    cl_version: '',
    condition: 'good',
    active: true,
    notes: '' // Keep for type compatibility, but set to empty and clean to undefined in submit
  })

  // Deployment form data
  const [deploymentData, setDeploymentData] = useState<CameraDeploymentFormData>({
    hardware_id: '',
    location_name: '',
    latitude: 36.427236, // Default to property center
    longitude: -79.510881,
    season_year: new Date().getFullYear(),
    facing_direction: undefined,
    has_solar_panel: false,
    active: true,
    notes: ''
  })

  const [includeDeployment, setIncludeDeployment] = useState(mode === 'create')
  const [gettingLocation, setGettingLocation] = useState(false)

  // Get stands for the dropdown
  const { stands } = useStands()

  // Get current location function
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeploymentData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }))
        setGettingLocation(false)
      },
      (error) => {
        alert(`Error getting location: ${error.message}`)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Initialize form with existing data
  useEffect(() => {
    console.log('Form initialization:', { mode, camera: camera?.hardware?.device_id, hasDeployment: !!camera?.deployment }) // Debug log
    
    if (camera) {
      // Initialize hardware data
      if (camera.hardware) {
        setHardwareData({
          device_id: camera.hardware.device_id || '',
          brand: camera.hardware.brand || '',
          model: camera.hardware.model || '',
          serial_number: camera.hardware.serial_number || '',
          purchase_date: camera.hardware.purchase_date || '',
          fw_version: camera.hardware.fw_version || '',
          cl_version: camera.hardware.cl_version || '',
          condition: camera.hardware.condition,
          active: camera.hardware.active,
          notes: '' // Don't populate hardware notes since we're not using them
        })

        // Set hardware_id for deployment
        setDeploymentData(prev => ({
          ...prev,
          hardware_id: camera.hardware.id
        }))
      }

      // Initialize deployment data (or set defaults if no deployment)
      if (camera.deployment) {
        setDeploymentData(prev => ({
          ...prev,
          hardware_id: camera.deployment?.hardware_id || camera.hardware?.id || '',
          location_name: camera.deployment.location_name,
          latitude: camera.deployment.latitude,
          longitude: camera.deployment.longitude,
          season_year: camera.deployment.season_year || new Date().getFullYear(),
          stand_id: camera.deployment.stand_id || undefined,
          facing_direction: camera.deployment.facing_direction || undefined,
          has_solar_panel: camera.deployment.has_solar_panel,
          active: camera.deployment.active,
          notes: camera.deployment.notes || ''
        }))
      } else if (mode === 'edit-deployment' && camera.hardware) {
        // No existing deployment, set up for new deployment
        console.log('Setting up new deployment for existing hardware:', camera.hardware.device_id)
        setDeploymentData(prev => ({
          ...prev,
          hardware_id: camera.hardware.id,
          location_name: `${camera.hardware.device_id} Location`, // Provide a default name
          latitude: 36.427236, // Default to property center
          longitude: -79.510881,
          season_year: new Date().getFullYear(),
          stand_id: undefined,
          facing_direction: undefined,
          has_solar_panel: false,
          active: true,
          notes: ''
        }))
        setIncludeDeployment(true)
      }
    }
  }, [camera, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hardwareData.device_id.trim()) {
      alert('Device ID is required')
      return
    }

    if (includeDeployment && !deploymentData.location_name.trim()) {
      alert('Location name is required for deployment')
      return
    }
    
    // For edit-deployment mode, we always need deployment data
    if (mode === 'edit-deployment' && !deploymentData.location_name.trim()) {
      alert('Location name is required')
      return
    }

    // Clean up date fields and handle database constraints
    const cleanHardwareData = {
      ...hardwareData,
      device_id: hardwareData.device_id.trim(),
      brand: hardwareData.brand.trim() || '', // Keep empty string for NOT NULL fields
      model: hardwareData.model.trim() || '', // Keep empty string for NOT NULL fields  
      serial_number: hardwareData.serial_number.trim() || '',
      purchase_date: hardwareData.purchase_date.trim() || null, // Use null for date fields
      fw_version: hardwareData.fw_version.trim() || '',
      cl_version: hardwareData.cl_version.trim() || '',
      notes: '' // Set to empty string instead of undefined
    }

    // Clean deployment data if provided
    const cleanDeploymentData = deploymentData ? {
      ...deploymentData,
      location_name: deploymentData.location_name.trim(),
      notes: deploymentData.notes?.trim() || ''
    } : undefined

    await onSubmit(cleanHardwareData, (includeDeployment || mode === 'edit-deployment') ? cleanDeploymentData : undefined)
  }

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Add New Camera'
      case 'edit-hardware': return 'Edit Camera Hardware'
      case 'edit-deployment': return 'Edit Camera Deployment'
      default: return 'Camera Form'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-olive-green text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera size={20} />
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-pine-needle rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hardware Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={18} />
              Camera Hardware Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Device ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device ID *
                </label>
                <input
                  type="text"
                  value={hardwareData.device_id}
                  onChange={(e) => setHardwareData({ ...hardwareData, device_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                  placeholder="e.g., 002, 013"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">ID from daily email reports</p>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  value={hardwareData.brand}
                  onChange={(e) => setHardwareData({ ...hardwareData, brand: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                >
                  <option value="">Select Brand</option>
                  <option value="Reconyx">Reconyx</option>
                  <option value="Stealth Cam">Stealth Cam</option>
                  <option value="Moultrie">Moultrie</option>
                  <option value="Bushnell">Bushnell</option>
                  <option value="Spypoint">Spypoint</option>
                  <option value="Cuddeback">Cuddeback</option>
                  <option value="Primos">Primos</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={hardwareData.model}
                  onChange={(e) => setHardwareData({ ...hardwareData, model: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                  placeholder="e.g., HC600, P-18"
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={hardwareData.serial_number}
                  onChange={(e) => setHardwareData({ ...hardwareData, serial_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                  placeholder="Manufacturing serial number"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={hardwareData.purchase_date}
                  onChange={(e) => setHardwareData({ ...hardwareData, purchase_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={hardwareData.condition}
                  onChange={(e) => setHardwareData({ ...hardwareData, condition: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              {/* Firmware Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firmware Version
                </label>
                <input
                  type="text"
                  value={hardwareData.fw_version}
                  onChange={(e) => setHardwareData({ ...hardwareData, fw_version: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                  placeholder="e.g., v1.2.3"
                />
              </div>

              {/* Command Language Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Command Language Version
                </label>
                <input
                  type="text"
                  value={hardwareData.cl_version}
                  onChange={(e) => setHardwareData({ ...hardwareData, cl_version: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                  placeholder="e.g., v2.1.0"
                />
              </div>
            </div>

            {/* Hardware Active Status */}
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="hardwareActive"
                checked={hardwareData.active}
                onChange={(e) => setHardwareData({ ...hardwareData, active: e.target.checked })}
                className="h-4 w-4 text-olive-green focus:ring-olive-green border-gray-300 rounded"
              />
              <label htmlFor="hardwareActive" className="ml-2 block text-sm text-gray-700">
                Hardware is active (available for use)
              </label>
            </div>
          </div>

          {/* Deployment Section */}
          {(mode === 'create' || mode === 'edit-deployment') && (
            <>
              {mode === 'create' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeDeployment"
                    checked={includeDeployment}
                    onChange={(e) => setIncludeDeployment(e.target.checked)}
                    className="h-4 w-4 text-olive-green focus:ring-olive-green border-gray-300 rounded"
                  />
                  <label htmlFor="includeDeployment" className="ml-2 block text-sm text-gray-700">
                    Deploy camera to a location immediately
                  </label>
                </div>
              )}

              {(includeDeployment || mode === 'edit-deployment') && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin size={18} />
                    {mode === 'edit-deployment' ? 'Edit Camera Location & Settings' : 'Deployment Details'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name *
                      </label>
                      <input
                        type="text"
                        value={deploymentData.location_name}
                        onChange={(e) => setDeploymentData({ ...deploymentData, location_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                        placeholder="e.g., North Creek Trail, Oak Tree Stand, Food Plot #3"
                        required={includeDeployment}
                      />
                    </div>

                    {/* Coordinates */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={deploymentData.latitude}
                        onChange={(e) => setDeploymentData({ ...deploymentData, latitude: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                        placeholder="36.427236"
                        required={includeDeployment}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={deploymentData.longitude}
                        onChange={(e) => setDeploymentData({ ...deploymentData, longitude: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                        placeholder="-79.510881"
                        required={includeDeployment}
                      />
                    </div>

                    {/* Use Current Location Button */}
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {gettingLocation ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <MapPin size={16} />
                        )}
                        {gettingLocation ? 'Getting location...' : 'Use Current Location'}
                      </button>
                    </div>

                    {/* Season Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Season Year
                      </label>
                      <input
                        type="number"
                        value={deploymentData.season_year}
                        onChange={(e) => setDeploymentData({ ...deploymentData, season_year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                        min="2020"
                        max="2030"
                      />
                    </div>

                    {/* Stand Association */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Associated Stand
                      </label>
                      <select
                        value={deploymentData.stand_id || ''}
                        onChange={(e) => setDeploymentData({ ...deploymentData, stand_id: e.target.value || undefined })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      >
                        <option value="">No associated stand</option>
                        {stands?.map((stand) => (
                          <option key={stand.id} value={stand.id}>
                            {stand.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Facing Direction */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facing Direction
                      </label>
                      <select
                        value={deploymentData.facing_direction || ''}
                        onChange={(e) => setDeploymentData({ ...deploymentData, facing_direction: e.target.value as any || undefined })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      >
                        <option value="">Not specified</option>
                        <option value="N">North</option>
                        <option value="NE">Northeast</option>
                        <option value="E">East</option>
                        <option value="SE">Southeast</option>
                        <option value="S">South</option>
                        <option value="SW">Southwest</option>
                        <option value="W">West</option>
                        <option value="NW">Northwest</option>
                      </select>
                    </div>

                    {/* Solar Panel */}
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="solar"
                          checked={deploymentData.has_solar_panel}
                          onChange={(e) => setDeploymentData({ ...deploymentData, has_solar_panel: e.target.checked })}
                          className="h-4 w-4 text-olive-green focus:ring-olive-green border-gray-300 rounded"
                        />
                        <label htmlFor="solar" className="ml-2 block text-sm text-gray-700">
                          Has solar panel (affects battery alerts)
                        </label>
                      </div>
                    </div>

                    {/* Active Status */}
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deploymentActive"
                          checked={deploymentData.active}
                          onChange={(e) => setDeploymentData({ ...deploymentData, active: e.target.checked })}
                          className="h-4 w-4 text-olive-green focus:ring-olive-green border-gray-300 rounded"
                        />
                        <label htmlFor="deploymentActive" className="ml-2 block text-sm text-gray-700">
                          Active deployment (camera is currently at this location)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Deployment Notes */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={deploymentData.notes}
                      onChange={(e) => setDeploymentData({ ...deploymentData, notes: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="Camera location details, access notes, setup specifics, maintenance reminders, etc..."
                    />
                    <p className="text-xs text-gray-500 mt-1">These notes will appear on the camera card</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !hardwareData.device_id.trim() || ((includeDeployment || mode === 'edit-deployment') && !deploymentData.location_name.trim())}
              className="bg-olive-green text-white px-6 py-2 rounded-md hover:bg-pine-needle transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              {mode === 'create' ? 'Create Camera' : 
               mode === 'edit-deployment' ? 'Save Location' : 
               'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
