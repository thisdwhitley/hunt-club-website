'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { getIcon } from '@/lib/shared/icons'
import { ManagementHubToolbar } from '@/components/shared/ManagementHubToolbar'
import type { TabConfig } from '@/components/shared/ManagementHubToolbar'
import { useCameras, useCameraAlerts, useCameraHardware } from '@/lib/cameras/hooks'
import CameraCardV2 from '@/components/cameras/CameraCardV2'
import { CameraForm } from '@/components/cameras/CameraForms'
import { CameraDetailModal } from '@/components/cameras/CameraDetailModal'
import { GPXImportModal } from '@/components/cameras/GPXImportModal'
import { DeploymentImportModal } from '@/components/cameras/DeploymentImportModal'
import {
  updateCameraDeployment,
  createCameraDeployment,
  hardDeleteCameraHardware,
  createCameraHardware,
  deactivateAllActiveDeployments,
} from '@/lib/cameras/database'
import type {
  CameraWithStatus,
  CameraFilters,
  CameraHardwareFormData,
  CameraDeploymentFormData,
} from '@/lib/cameras/types'

const CameraIcon = getIcon('camera')
const SearchIcon = getIcon('search')
const FilterIcon = getIcon('filter')
const PlusIcon = getIcon('plus')
const AlertCircleIcon = getIcon('alertCircle')
const WarningIcon = getIcon('warning')
const UploadIcon = getIcon('upload')
const ViewGridIcon = getIcon('viewGrid')
const ViewCompactIcon = getIcon('viewCompact')
const ViewListIcon = getIcon('viewList')

interface CameraManagementFilters {
  search: string
  status: string
  alerts: string
  season: string
}

interface CameraImportData {
  device_id: string
  brand: string
  model: string
  condition: 'good' | 'questionable' | 'poor' | 'retired'
  active: boolean
  location_name: string
  latitude: number
  longitude: number
  season_year: number
  has_solar_panel: boolean
  notes: string
  source_name: string
  import_notes: string
}

const DEFAULT_FILTERS: CameraManagementFilters = {
  search: '',
  status: 'active',
  alerts: 'all',
  season: 'all',
}

interface CameraFiltersProps {
  filters: CameraManagementFilters
  onFiltersChange: (filters: CameraManagementFilters) => void
}

function CameraFilters({ filters, onFiltersChange }: CameraFiltersProps) {
  const updateFilter = (key: keyof CameraManagementFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = (
    Object.keys(DEFAULT_FILTERS) as (keyof CameraManagementFilters)[]
  ).some(key => filters[key] !== DEFAULT_FILTERS[key])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alerts</label>
        <select
          value={filters.alerts}
          onChange={(e) => updateFilter('alerts', e.target.value)}
          className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
        >
          <option value="all">All Cameras</option>
          <option value="has-alerts">Has Alerts</option>
          <option value="no-alerts">No Alerts</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
        <select
          value={filters.season}
          onChange={(e) => updateFilter('season', e.target.value)}
          className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
        >
          <option value="all">All Seasons</option>
          <option value="2025">2025 Season</option>
          <option value="2024">2024 Season</option>
          <option value="2023">2023 Season</option>
        </select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-end">
          <button
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="text-sm text-olive-green hover:text-pine-needle font-medium pb-2"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

interface CamerasTabProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (key: string) => void
}

export function CamerasTab({ tabs, activeTab, onTabChange }: CamerasTabProps) {
  const [filters, setFilters] = useState<CameraManagementFilters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const [showCameraForm, setShowCameraForm] = useState(false)
  const [showCameraDetail, setShowCameraDetail] = useState(false)
  const [showGPXImport, setShowGPXImport] = useState(false)
  const [showDeploymentImport, setShowDeploymentImport] = useState(false)
  const [showEndSeasonConfirm, setShowEndSeasonConfirm] = useState(false)
  const [endSeasonLoading, setEndSeasonLoading] = useState(false)
  const [showImportDropdown, setShowImportDropdown] = useState(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const importDropdownRef = useRef<HTMLDivElement>(null)
  const overflowMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (importDropdownRef.current && !importDropdownRef.current.contains(e.target as Node)) {
        setShowImportDropdown(false)
      }
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setShowOverflowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const [editingCamera, setEditingCamera] = useState<CameraWithStatus | null>(null)
  const [viewingCamera, setViewingCamera] = useState<CameraWithStatus | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formLoading, setFormLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const [viewMode, setViewMode] = useState<'full' | 'compact' | 'list'>('full')
  const [alertBannerOpen, setAlertBannerOpen] = useState(false)

  const [sortBy, setSortBy] = useState<'location_name' | 'device_id' | 'last_seen' | 'battery_status'>('device_id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const cameraFilters = useMemo(() => {
    const filterObj: Partial<CameraFilters> = {}
    if (filters.status === 'active') filterObj.active = true
    if (filters.status === 'inactive') filterObj.active = false
    if (filters.alerts === 'has-alerts') filterObj.has_alerts = true
    if (filters.alerts === 'no-alerts') filterObj.has_alerts = false
    if (filters.season !== 'all') filterObj.season_year = [parseInt(filters.season)]
    if (filters.search.trim()) filterObj.search = filters.search.trim()
    return filterObj
  }, [filters])

  const { cameras, loading, error, refresh: refreshCameras } = useCameras(cameraFilters)
  const { alerts, loading: alertsLoading } = useCameraAlerts()
  const { createHardware, updateHardware } = useCameraHardware()

  useEffect(() => { if (alerts.length === 0) setAlertBannerOpen(false) }, [alerts.length])

  const filteredCameras = useMemo(() => {
    const sorted = [...cameras].sort((a, b) => {
      if (filters.status === 'all') {
        const aActive = a.deployment?.active ?? false
        const bActive = b.deployment?.active ?? false
        if (aActive !== bActive) return aActive ? -1 : 1
      }

      let aValue: string | number, bValue: string | number

      switch (sortBy) {
        case 'device_id': {
          const extractNumericId = (deviceId: string) => {
            const match = deviceId.match(/(\d+)/)
            return match ? parseInt(match[1], 10) : 0
          }
          aValue = extractNumericId(a.hardware?.device_id || '')
          bValue = extractNumericId(b.hardware?.device_id || '')
          break
        }
        case 'location_name':
          aValue = a.deployment?.location_name || ''
          bValue = b.deployment?.location_name || ''
          break
        case 'last_seen':
          aValue = a.days_since_last_report ?? 9999
          bValue = b.days_since_last_report ?? 9999
          break
        case 'battery_status': {
          const batteryPriority = (status: string | null) => {
            if (!status) return 0
            if (status.includes('Critical')) return 5
            if (status.includes('Low')) return 4
            if (status.includes('OK') || status.includes('Ext OK')) return 3
            if (status.includes('Good')) return 2
            if (status.includes('Full')) return 1
            return 0
          }
          aValue = batteryPriority(a.latest_report?.battery_status ?? null)
          bValue = batteryPriority(b.latest_report?.battery_status ?? null)
          break
        }
        default:
          aValue = a.deployment?.location_name || ''
          bValue = b.deployment?.location_name || ''
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [cameras, filters.status, sortBy, sortDirection])

  const clearFilters = () => setFilters(DEFAULT_FILTERS)

  const handleEndSeason = async () => {
    setEndSeasonLoading(true)
    const result = await deactivateAllActiveDeployments()
    setEndSeasonLoading(false)
    setShowEndSeasonConfirm(false)
    if (result.success) {
      refreshCameras()
    } else {
      alert(`Failed to end season: ${result.error}`)
    }
  }

  const handleGPXImport = async (importData: CameraImportData[]) => {
    setImporting(true)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      for (const cameraData of importData) {
        try {
          const hardwareData: CameraHardwareFormData = {
            device_id: cameraData.device_id,
            brand: cameraData.brand || '',
            model: cameraData.model || '',
            condition: cameraData.condition,
            active: cameraData.active,
            notes: cameraData.import_notes,
          }
          const hardwareResult = await createCameraHardware(hardwareData)
          if (!hardwareResult.success) throw new Error(hardwareResult.error || 'Failed to create hardware')

          const deploymentData: CameraDeploymentFormData = {
            hardware_id: hardwareResult.data!.id,
            location_name: cameraData.location_name,
            latitude: cameraData.latitude,
            longitude: cameraData.longitude,
            season_year: cameraData.season_year,
            has_solar_panel: cameraData.has_solar_panel,
            active: true,
            notes: cameraData.notes,
          }
          const deploymentResult = await createCameraDeployment(deploymentData)
          if (!deploymentResult.success) throw new Error(deploymentResult.error || 'Failed to create deployment')

          successCount++
        } catch (error) {
          errorCount++
          errors.push(`${cameraData.device_id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.error(`Failed to import camera ${cameraData.device_id}:`, error)
        }
      }

      if (successCount > 0) await refreshCameras()

      if (errorCount === 0) {
        alert(`Successfully imported ${successCount} cameras from GPX file!`)
      } else {
        alert(`Import completed with ${successCount} successes and ${errorCount} errors.\n\nErrors:\n${errors.join('\n')}`)
      }
    } catch (error) {
      console.error('GPX import error:', error)
      alert(`Failed to import cameras: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setImporting(false)
    }
  }

  const handleCameraCardClick = (camera: CameraWithStatus) => {
    setViewingCamera(camera)
    setShowCameraDetail(true)
  }

  const handleEditCamera = (camera: CameraWithStatus) => {
    setEditingCamera(camera)
    setFormMode('edit')
    setShowCameraForm(true)
  }

  const handleDeleteCamera = async (camera: CameraWithStatus) => {
    const hardwareId = camera.hardware?.id
    const deviceId = camera.hardware?.device_id
    if (!hardwareId || !deviceId) {
      alert('Cannot delete camera: missing hardware information')
      return
    }

    const confirmMessage = `WARNING: This will PERMANENTLY DELETE camera ${deviceId} and ALL associated data including:\n    \n• Camera hardware record\n• All deployment history  \n• All status reports and photos data\n• This action CANNOT be undone\n\nType "${deviceId}" to confirm deletion:`
    const userInput = prompt(confirmMessage)
    if (userInput !== deviceId) {
      if (userInput !== null) alert('Deletion cancelled - device ID did not match')
      return
    }

    try {
      setFormLoading(true)
      const deleteResult = await hardDeleteCameraHardware(hardwareId)
      if (!deleteResult.success) throw new Error(deleteResult.error || 'Failed to delete camera hardware')
      await refreshCameras()
      alert(`Camera ${deviceId} has been permanently deleted`)
    } catch (error) {
      console.error('Error deleting camera:', error)
      alert(`Failed to delete camera: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }


  const handleCreateCamera = () => {
    setEditingCamera(null)
    setFormMode('create')
    setShowCameraForm(true)
  }

  const handleCameraFormSubmit = async (hardwareData: CameraHardwareFormData, deploymentData?: CameraDeploymentFormData) => {
    try {
      setFormLoading(true)

      if (formMode === 'create') {
        const newHardware = await createHardware(hardwareData)
        if (!newHardware) throw new Error('Failed to create camera hardware')

        if (deploymentData) {
          const deploymentResult = await createCameraDeployment({ ...deploymentData, hardware_id: newHardware.id })
          if (!deploymentResult.success) throw new Error(deploymentResult.error || 'Failed to create deployment')
        }
        alert(`Camera ${hardwareData.device_id} created successfully`)

      } else if (formMode === 'edit' && editingCamera?.hardware) {
        const updateResult = await updateHardware(editingCamera.hardware.id, hardwareData)
        if (!updateResult) throw new Error('Failed to update camera hardware')

        if (deploymentData) {
          if (editingCamera.deployment) {
            const result = await updateCameraDeployment(editingCamera.deployment.id, deploymentData)
            if (!result.success) throw new Error(result.error || 'Failed to update deployment')
          } else {
            const result = await createCameraDeployment({ ...deploymentData, hardware_id: editingCamera.hardware.id })
            if (!result.success) throw new Error(result.error || 'Failed to create deployment')
          }
        }
        alert(`Camera ${hardwareData.device_id} updated successfully`)
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

  // — Toolbar slots —

  const actions = (
    <div className="flex items-center gap-2">
      <div className="relative" ref={importDropdownRef}>
        <div className="flex">
          <button
            onClick={handleCreateCamera}
            className="bg-burnt-orange hover:bg-clay-earth text-white px-3 py-1.5 rounded-l-md flex items-center gap-1.5 transition-colors font-medium text-sm"
          >
            <PlusIcon size={16} />
            <span className="hidden sm:inline">Add Camera</span>
          </button>
          <button
            onClick={() => setShowImportDropdown(prev => !prev)}
            className="bg-burnt-orange hover:bg-clay-earth text-white px-1.5 py-1.5 rounded-r-md border-l border-white/30 transition-colors"
            aria-label="Import options"
          >
            {React.createElement(getIcon('chevronDown'), { size: 14 })}
          </button>
        </div>
        {showImportDropdown && (
          <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
            <button
              onClick={() => { setShowDeploymentImport(true); setShowImportDropdown(false) }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900 text-sm">Import Deployments</div>
              <div className="text-xs text-gray-500 mt-0.5">Batch-redeploy hardware from a text list</div>
            </button>
            <button
              onClick={() => { setShowGPXImport(true); setShowImportDropdown(false) }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900 text-sm">Import from GPX</div>
              <div className="text-xs text-gray-500 mt-0.5">Create cameras from an OnX Hunt .gpx file</div>
            </button>
          </div>
        )}
      </div>

      <div className="relative" ref={overflowMenuRef}>
        <button
          onClick={() => setShowOverflowMenu(prev => !prev)}
          className="border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 p-1.5 rounded-md transition-colors"
          title="More options"
        >
          {React.createElement(getIcon('moreVertical'), { size: 16 })}
        </button>
        {showOverflowMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
            <button
              onClick={() => { setShowEndSeasonConfirm(true); setShowOverflowMenu(false) }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-clay-earth font-medium"
            >
              End Season
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const activeFilterCount = (
    Object.keys(DEFAULT_FILTERS) as (keyof CameraManagementFilters)[]
  ).filter(key => filters[key] !== DEFAULT_FILTERS[key] && key !== 'search').length

  const ChevronDownIcon = getIcon('chevronDown')

  const toolbarRow = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-weathered-wood" />
          </div>
          <input
            type="text"
            placeholder="Search by device ID, location, brand…"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-morning-mist placeholder-weathered-wood focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label className="hidden sm:block text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 sm:px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          >
            <option value="location_name">Location</option>
            <option value="device_id">Device ID</option>
            <option value="last_seen">Last Seen</option>
            <option value="battery_status">Battery</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <div className="flex flex-col items-center justify-center w-4 h-4">
              <div className={`w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent ${
                sortDirection === 'asc' ? 'border-b-gray-600' : 'border-b-gray-300'
              } mb-0.5`} style={{ borderBottomWidth: '3px', borderLeftWidth: '2px', borderRightWidth: '2px' }} />
              <div className={`w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${
                sortDirection === 'desc' ? 'border-t-gray-600' : 'border-t-gray-300'
              }`} style={{ borderTopWidth: '3px', borderLeftWidth: '2px', borderRightWidth: '2px' }} />
            </div>
          </button>
        </div>

        {/* Filters button */}
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm font-medium transition-colors shrink-0 ${
            showFilters
              ? 'bg-olive-green border-olive-green text-white'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FilterIcon size={15} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              showFilters ? 'bg-white text-olive-green' : 'bg-burnt-orange text-white'
            }`}>
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon
            size={14}
            className={`hidden sm:block transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-gray-200 shrink-0" />

        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-gray-300 rounded-md p-0.5 shrink-0">
          {([
            { mode: 'full' as const, icon: ViewGridIcon, title: 'Full cards' },
            { mode: 'compact' as const, icon: ViewCompactIcon, title: 'Compact grid' },
            { mode: 'list' as const, icon: ViewListIcon, title: 'List view' },
          ]).map(({ mode, icon: Icon, title }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={title}
              className={`p-1.5 rounded transition-colors ${
                viewMode === mode
                  ? 'bg-olive-green text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 text-sm text-weathered-wood shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-olive-green rounded-full" />
            <span>{filteredCameras.length} of {cameras.length} cameras</span>
          </div>
          {!alertsLoading && alerts.length > 0 && (
            <button
              onClick={() => setAlertBannerOpen(o => !o)}
              className="flex items-center gap-1 px-2 py-0.5 rounded transition-colors"
              style={alertBannerOpen
                ? { backgroundColor: '#A0653A', color: 'white' }
                : { color: '#A0653A' }
              }
              title={alertBannerOpen ? 'Hide alert details' : 'Show alert details'}
            >
              <AlertCircleIcon size={14} />
              <span className="font-medium">{alerts.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <CameraFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      )}
    </>
  )

  const fab = (
    <button
      onClick={handleCreateCamera}
      className="sm:hidden fixed bottom-6 right-6 z-20 w-14 h-14 bg-burnt-orange hover:bg-clay-earth text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      aria-label="Add Camera"
    >
      <PlusIcon size={24} />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementHubToolbar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        title="Management"
        icon="management"
        actions={actions}
        fab={fab}
      >
        {toolbarRow}
      </ManagementHubToolbar>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert Banner */}
        {!alertsLoading && alerts.length > 0 && alertBannerOpen && (
          <div
            className="rounded-lg p-4 mb-6 border-l-4 flex items-start gap-3"
            style={{ backgroundColor: '#A0653A18', borderLeftColor: '#A0653A' }}
          >
            <WarningIcon size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#A0653A' }} />
            <div>
              <h3 className="font-semibold" style={{ color: '#A0653A' }}>
                {alerts.length} {alerts.length === 1 ? 'Camera Needs' : 'Cameras Need'} Attention
              </h3>
              <p className="text-sm mt-0.5 text-weathered-wood">
                {alerts.map(a => a.hardware.cuddeback_name || a.hardware.device_id).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green" />
            <p className="text-weathered-wood mt-2">Loading cameras...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Cameras</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={refreshCameras} className="text-olive-green hover:text-pine-needle font-medium underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredCameras.length === 0 && cameras.length === 0 && (
          <div className="text-center py-12">
            <CameraIcon className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cameras deployed yet</h3>
            <p className="text-weathered-wood mb-4">Get started by adding cameras manually or importing from a GPX file.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowGPXImport(true)}
                className="bg-olive-green hover:bg-pine-needle text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <UploadIcon size={16} />
                Import from GPX
              </button>
              <button
                onClick={handleCreateCamera}
                className="bg-burnt-orange hover:bg-clay-earth text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Add Camera Manually
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && !error && filteredCameras.length === 0 && cameras.length > 0 && (
          <div className="text-center py-12">
            <CameraIcon className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cameras match your filters</h3>
            <p className="text-weathered-wood mb-4">Try adjusting your search terms or filters to find cameras.</p>
            <button onClick={clearFilters} className="text-olive-green hover:text-pine-needle font-medium underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Camera grid */}
        {!loading && !error && filteredCameras.length > 0 && (
          <>
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-morning-mist">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Hardware / Battery</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-forest-shadow uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCameras.map((camera) => (
                      <CameraCardV2
                        key={`${camera.hardware?.id}-${camera.deployment?.id ?? 'none'}`}
                        camera={camera}
                        mode="list"
                        onClick={handleCameraCardClick}
                        onEdit={handleEditCamera}
                        onDelete={handleDeleteCamera}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={
                viewMode === 'compact'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              }>
                {filteredCameras.map((camera) => (
                  <CameraCardV2
                    key={`${camera.hardware?.id}-${camera.deployment?.id ?? 'none'}`}
                    camera={camera}
                    mode={viewMode}
                    onClick={handleCameraCardClick}
                    onEdit={handleEditCamera}
                    onDelete={handleDeleteCamera}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showCameraDetail && viewingCamera && (
        <CameraDetailModal
          camera={viewingCamera}
          onClose={() => { setShowCameraDetail(false); setViewingCamera(null) }}
          onEdit={handleEditCamera}
        />
      )}

      {/* Form Modal */}
      {showCameraForm && (
        <CameraForm
          camera={editingCamera}
          mode={formMode}
          onClose={() => { setShowCameraForm(false); setEditingCamera(null) }}
          onSubmit={handleCameraFormSubmit}
          isLoading={formLoading}
        />
      )}

      {/* GPX Import */}
      {showGPXImport && (
        <GPXImportModal
          onClose={() => setShowGPXImport(false)}
          onImport={handleGPXImport}
          isImporting={importing}
        />
      )}

      {/* Deployment Import */}
      {showDeploymentImport && (
        <DeploymentImportModal
          onClose={() => setShowDeploymentImport(false)}
          onImportComplete={() => { setShowDeploymentImport(false); refreshCameras() }}
        />
      )}

      {/* End Season Confirmation */}
      {showEndSeasonConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-forest-shadow mb-2">End Season</h2>
            <p className="text-gray-600 text-sm mb-6">
              This will deactivate all{' '}
              <strong>{cameras.filter(c => c.deployment?.active).length}</strong>{' '}
              active camera deployments. Hardware records and historical data are preserved.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEndSeasonConfirm(false)}
                disabled={endSeasonLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSeason}
                disabled={endSeasonLoading}
                className="px-5 py-2 bg-clay-earth hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {endSeasonLoading
                  ? 'Deactivating…'
                  : `Deactivate All ${cameras.filter(c => c.deployment?.active).length} Deployments`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
