'use client'

import React, { useState, useMemo } from 'react'
import { Camera, Search, Filter, Plus, MapPin, AlertCircle, X } from 'lucide-react'
import { useCameras, useCameraAlerts, useCameraStats, useCameraHardware } from '@/lib/cameras/hooks'
import CameraCard from '@/components/cameras/CameraCard'
import { CameraForm } from '@/components/cameras/CameraForms'
import { updateCameraDeployment, deactivateCameraDeployment, createCameraDeployment, hardDeleteCameraHardware } from '@/lib/cameras/database'
import type { CameraWithStatus, CameraHardware, CameraFilters, CameraHardwareFormData, CameraDeploymentFormData } from '@/lib/cameras/types'

// Define the same filters interface pattern as stands
export interface CameraManagementFilters {
  search: string
  status: string
  brand: string
  alerts: string
  hasCoordinates: string
  season: string
}

// Filters Component matching your StandFilters pattern
interface CameraFiltersProps {
  filters: CameraManagementFilters
  onFiltersChange: (filters: CameraManagementFilters) => void
  onClose: () => void
}

function CameraFilters({ filters, onFiltersChange, onClose }: CameraFiltersProps) {
  const updateFilter = (key: keyof CameraManagementFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      brand: 'all',
      alerts: 'all',
      hasCoordinates: 'all',
      season: 'all'
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-olive-green text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <h3 className="font-medium">Filter Cameras</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-pine-needle rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={filters.brand}
              onChange={(e) => updateFilter('brand', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
            >
              <option value="all">All Brands</option>
              <option value="Reconyx">Reconyx</option>
              <option value="Stealth Cam">Stealth Cam</option>
              <option value="Moultrie">Moultrie</option>
              <option value="Bushnell">Bushnell</option>
              <option value="Spypoint">Spypoint</option>
            </select>
          </div>

          {/* Alerts Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerts
            </label>
            <select
              value={filters.alerts}
              onChange={(e) => updateFilter('alerts', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
            >
              <option value="all">All Cameras</option>
              <option value="has-alerts">Has Alerts</option>
              <option value="no-alerts">No Alerts</option>
            </select>
          </div>

          {/* Coordinates Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={filters.hasCoordinates}
              onChange={(e) => updateFilter('hasCoordinates', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
            >
              <option value="all">All</option>
              <option value="mapped">Mapped</option>
              <option value="unmapped">Unmapped</option>
            </select>
          </div>

          {/* Season Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select
              value={filters.season}
              onChange={(e) => updateFilter('season', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
            >
              <option value="all">All Seasons</option>
              <option value="2025">2025 Season</option>
              <option value="2024">2024 Season</option>
              <option value="2023">2023 Season</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearAllFilters}
              className="text-sm text-olive-green hover:text-pine-needle font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Camera Management Page
export default function CameraManagementPage() {
  const [filters, setFilters] = useState<CameraManagementFilters>({
    search: '',
    status: 'all',
    brand: 'all',
    alerts: 'all',
    hasCoordinates: 'all',
    season: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Form management state
  const [showCameraForm, setShowCameraForm] = useState(false)
  const [editingCamera, setEditingCamera] = useState<CameraWithStatus | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit-hardware' | 'edit-deployment'>('create')
  const [formLoading, setFormLoading] = useState(false)

  // Load data using your hooks
  const { cameras, loading, error, refresh: refreshCameras } = useCameras()
  const { alerts, loading: alertsLoading } = useCameraAlerts()
  const { stats, loading: statsLoading } = useCameraStats()
  const { hardware: allHardware, createHardware, updateHardware, deleteHardware } = useCameraHardware()

  // Filter cameras based on search and filters (matching stands pattern)
  const filteredCameras = useMemo(() => {
    let filtered = cameras

    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(camera => 
        camera.hardware?.device_id?.toLowerCase().includes(search) ||
        camera.deployment?.location_name?.toLowerCase().includes(search) ||
        camera.hardware?.brand?.toLowerCase().includes(search) ||
        camera.hardware?.model?.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(camera => {
        if (filters.status === 'active') return camera.deployment?.active
        if (filters.status === 'inactive') return !camera.deployment?.active
        return true
      })
    }

    // Apply brand filter
    if (filters.brand !== 'all') {
      filtered = filtered.filter(camera => camera.hardware?.brand === filters.brand)
    }

    // Apply alerts filter
    if (filters.alerts !== 'all') {
      filtered = filtered.filter(camera => {
        const hasAlerts = camera.latest_report?.needs_attention || camera.days_since_last_report > 1
        if (filters.alerts === 'has-alerts') return hasAlerts
        if (filters.alerts === 'no-alerts') return !hasAlerts
        return true
      })
    }

    // Apply coordinates filter
    if (filters.hasCoordinates !== 'all') {
      filtered = filtered.filter(camera => {
        const hasCoords = camera.deployment?.latitude && camera.deployment?.longitude
        if (filters.hasCoordinates === 'mapped') return hasCoords
        if (filters.hasCoordinates === 'unmapped') return !hasCoords
        return true
      })
    }

    // Apply season filter
    if (filters.season !== 'all') {
      const seasonYear = parseInt(filters.season)
      filtered = filtered.filter(camera => camera.deployment?.season === seasonYear)
    }

    return filtered
  }, [cameras, filters])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '')

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      brand: 'all',
      alerts: 'all',
      hasCoordinates: 'all',
      season: 'all'
    })
  }

  // Camera action handlers using real database operations
  const handleEditCamera = (camera: CameraWithStatus) => {
    setEditingCamera(camera)
    setFormMode('edit-hardware')
    setShowCameraForm(true)
  }

  const handleDeleteCamera = async (camera: CameraWithStatus) => {
    const hardwareId = camera.hardware?.id
    const deviceId = camera.hardware?.device_id
    
    if (!hardwareId || !deviceId) {
      alert('Cannot delete camera: missing hardware information')
      return
    }

    const confirmMessage = `WARNING: This will PERMANENTLY DELETE camera ${deviceId} and ALL associated data including:
    
• Camera hardware record
• All deployment history  
• All status reports and photos data
• This action CANNOT be undone

Type "${deviceId}" to confirm deletion:`

    const userInput = prompt(confirmMessage)
    
    if (userInput !== deviceId) {
      if (userInput !== null) { // null means they clicked Cancel
        alert('Deletion cancelled - device ID did not match')
      }
      return
    }

    try {
      setFormLoading(true)
      
      console.log('Permanently deleting camera hardware:', hardwareId)
      const deleteResult = await hardDeleteCameraHardware(hardwareId)
      
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete camera hardware')
      }
      
      // Refresh the camera list
      await refreshCameras()
      alert(`Camera ${deviceId} has been permanently deleted`)
      
    } catch (error) {
      console.error('Error deleting camera:', error)
      alert(`Failed to delete camera: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleNavigateToCamera = (camera: CameraWithStatus) => {
    if (camera.deployment?.latitude && camera.deployment?.longitude) {
      const url = `https://maps.google.com/?q=${camera.deployment.latitude},${camera.deployment.longitude}`
      window.open(url, '_blank')
    } else {
      alert('No coordinates available for this camera')
    }
  }

  const handleCreateCamera = () => {
    setEditingCamera(null)
    setFormMode('create')
    setShowCameraForm(true)
  }

  const handleEditDeployment = (camera: CameraWithStatus) => {
    console.log('Editing deployment for camera:', camera) // Debug log
    
    if (!camera.hardware) {
      alert('Cannot edit deployment: camera hardware information is missing')
      return
    }
    
    setEditingCamera(camera)
    setFormMode('edit-deployment')
    setShowCameraForm(true)
  }

  // Comprehensive form handler
  const handleCameraFormSubmit = async (hardwareData: CameraHardwareFormData, deploymentData?: CameraDeploymentFormData) => {
    try {
      setFormLoading(true)
      
      console.log('Form submission:', { 
        formMode, 
        editingCamera: editingCamera?.hardware?.device_id, 
        hasDeployment: !!editingCamera?.deployment,
        deploymentData: !!deploymentData 
      }) // Debug log
      
      if (formMode === 'create') {
        // Create new hardware
        console.log('Creating hardware:', hardwareData)
        const newHardware = await createHardware(hardwareData)
        if (!newHardware) {
          throw new Error('Failed to create camera hardware')
        }
        
        // Create deployment if provided
        if (deploymentData) {
          console.log('Creating deployment:', deploymentData)
          const deploymentWithHardwareId = {
            ...deploymentData,
            hardware_id: newHardware.id
          }
          const deploymentResult = await createCameraDeployment(deploymentWithHardwareId)
          if (!deploymentResult.success) {
            throw new Error(deploymentResult.error || 'Failed to create deployment')
          }
        }
        
        alert(`Camera ${hardwareData.device_id} created successfully`)
        
      } else if (formMode === 'edit-hardware' && editingCamera?.hardware) {
        // Update existing hardware
        console.log('Updating hardware:', editingCamera.hardware.id, hardwareData)
        const updateResult = await updateHardware(editingCamera.hardware.id, hardwareData)
        if (!updateResult) {
          throw new Error('Failed to update camera hardware')
        }
        
        alert(`Camera ${hardwareData.device_id} updated successfully`)
        
      } else if (formMode === 'edit-deployment') {
        if (!editingCamera?.hardware) {
          throw new Error('Cannot update deployment: camera hardware information is missing')
        }
        
        if (!deploymentData) {
          throw new Error('Cannot update deployment: deployment data is missing')
        }
        
        if (editingCamera.deployment) {
          // Update existing deployment
          console.log('Updating existing deployment:', editingCamera.deployment.id, deploymentData)
          const updateResult = await updateCameraDeployment(editingCamera.deployment.id, deploymentData)
          if (!updateResult.success) {
            throw new Error(updateResult.error || 'Failed to update deployment')
          }
          alert(`Camera deployment updated successfully`)
        } else {
          // Create new deployment for existing hardware (camera has hardware but no deployment)
          console.log('Creating new deployment for existing hardware:', editingCamera.hardware.id, deploymentData)
          const deploymentWithHardwareId = {
            ...deploymentData,
            hardware_id: editingCamera.hardware.id
          }
          const deploymentResult = await createCameraDeployment(deploymentWithHardwareId)
          if (!deploymentResult.success) {
            throw new Error(deploymentResult.error || 'Failed to create deployment')
          }
          alert(`Camera deployed to ${deploymentData.location_name} successfully`)
        }
      } else {
        throw new Error(`Invalid form mode: ${formMode}`)
      }
      
      setShowCameraForm(false)
      setEditingCamera(null)
      await refreshCameras()
      
    } catch (error) {
      console.error('Error saving camera:', error)
      alert(`Failed to save camera: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  // Get available hardware for deployment form
  const availableHardware = allHardware.filter(hw => hw.active)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - matching your stands page pattern */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 mb-4 sm:mb-0">
                <Camera size={28} className="text-white" />
                <div>
                  <h1 className="text-2xl font-bold">Trail Camera Management</h1>
                  <p className="text-green-100 opacity-90">
                    Monitor and manage all trail cameras across the property
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border-2 transition-colors ${
                    showFilters 
                      ? 'bg-pine-needle border-pine-needle text-white'
                      : 'border-green-200 text-green-100 hover:bg-green-700'
                  }`}
                  title="Toggle Filters"
                >
                  <Filter size={20} />
                </button>
                
                <button
                  onClick={handleCreateCamera}
                  className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Camera</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Stats Bar - matching your stands pattern */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-weathered-wood" />
              </div>
              <input
                type="text"
                placeholder="Search cameras by device ID, location, brand..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-morning-mist placeholder-weathered-wood focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-weathered-wood">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-olive-green rounded-full"></div>
                <span>
                  {filteredCameras.length} of {cameras.length} cameras
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>
                  {filteredCameras.filter(c => c.deployment?.latitude && c.deployment?.longitude).length} mapped
                </span>
              </div>
              {!alertsLoading && alerts.length > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle size={16} />
                  <span>{alerts.length} alerts</span>
                </div>
              )}
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-olive-green hover:text-pine-needle font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6">
            <CameraFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Alert Banner - only show if there are alerts */}
        {!alertsLoading && alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-medium">
                  {alerts.length} {alerts.length === 1 ? 'Camera Needs' : 'Cameras Need'} Attention
                </h3>
                <p className="text-red-700 text-sm">
                  Some cameras require immediate attention due to missing reports, low battery, or other issues.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green"></div>
            <p className="text-weathered-wood mt-2">Loading cameras...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Cameras</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={refreshCameras}
                className="text-olive-green hover:text-pine-needle font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCameras.length === 0 && cameras.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cameras deployed yet</h3>
            <p className="text-weathered-wood mb-4">
              Get started by adding your first trail camera to the system.
            </p>
            <button
              onClick={handleCreateCamera}
              className="bg-burnt-orange hover:bg-clay-earth text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Your First Camera
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && filteredCameras.length === 0 && cameras.length > 0 && (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cameras match your filters</h3>
            <p className="text-weathered-wood mb-4">
              Try adjusting your search terms or filters to find cameras.
            </p>
            <button
              onClick={clearFilters}
              className="text-olive-green hover:text-pine-needle font-medium underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Cameras Grid - matching your stands grid pattern */}
        {!loading && !error && filteredCameras.length > 0 && (
          <>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Edit Options:</strong> Click <strong>Edit</strong> button to modify camera hardware • 
                Click anywhere on camera card to edit location/deployment details
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCameras.map((camera) => (
                <CameraCard
                  key={camera.hardware?.id || camera.deployment?.id}
                  camera={camera}
                  mode="full"
                  onClick={() => handleEditDeployment(camera)} // Click card to edit deployment/location
                  onEdit={handleEditCamera} // Edit button edits hardware
                  onDelete={handleDeleteCamera}
                  onNavigate={handleNavigateToCamera}
                  showLocation={true}
                  showStats={true}
                  showActions={true}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {showCameraForm && (
        <CameraForm
          camera={editingCamera}
          mode={formMode}
          onClose={() => {
            setShowCameraForm(false)
            setEditingCamera(null)
          }}
          onSubmit={handleCameraFormSubmit}
          isLoading={formLoading}
        />
      )}
    </div>
  )
}
