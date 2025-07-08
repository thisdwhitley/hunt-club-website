'use client'

import React, { useState, useMemo } from 'react'
import { Camera, Search, Filter, Plus, MapPin, AlertCircle, X } from 'lucide-react'
import { useCameras, useCameraAlerts, useCameraStats, useCameraHardware } from '@/lib/cameras/hooks'
import CameraCard from '@/components/cameras/CameraCard'
import type { CameraWithStatus, CameraHardware, CameraFilters } from '@/lib/cameras/types'

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

  // Load data using your hooks
  const { cameras, loading, error, refresh: refreshCameras } = useCameras()
  const { alerts, loading: alertsLoading } = useCameraAlerts()
  const { stats, loading: statsLoading } = useCameraStats()

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

  // Camera action handlers (matching your stand handlers pattern)
  const handleEditCamera = (camera: CameraWithStatus) => {
    console.log('Edit camera:', camera.hardware?.device_id)
    // TODO: Open edit modal or navigate to edit page
    alert(`Edit camera ${camera.hardware?.device_id} - ${camera.deployment?.location_name}`)
  }

  const handleDeleteCamera = (camera: CameraWithStatus) => {
    console.log('Delete camera:', camera.hardware?.device_id)
    if (confirm(`Delete camera ${camera.hardware?.device_id}?`)) {
      // TODO: Implement delete functionality
      alert(`Would delete: ${camera.hardware?.device_id}`)
      refreshCameras()
    }
  }

  const handleNavigateToCamera = (camera: CameraWithStatus) => {
    console.log('Navigate to camera:', camera.hardware?.device_id)
    if (camera.deployment?.latitude && camera.deployment?.longitude) {
      const url = `https://maps.google.com/?q=${camera.deployment.latitude},${camera.deployment.longitude}`
      window.open(url, '_blank')
    }
  }

  const handleCreateCamera = () => {
    console.log('Create camera')
    // TODO: Open create modal or navigate to create page
    alert('Create new camera - form coming soon!')
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCameras.map((camera) => (
              <CameraCard
                key={camera.hardware?.id || camera.deployment?.id}
                camera={camera}
                mode="full"
                onClick={() => {/* Could open detail view */}}
                onEdit={handleEditCamera}
                onDelete={handleDeleteCamera}
                onNavigate={handleNavigateToCamera}
                showLocation={true}
                showStats={true}
                showActions={true}
                className="hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
