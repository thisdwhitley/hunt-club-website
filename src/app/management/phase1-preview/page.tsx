'use client'

// Phase 1 Preview: Using Extracted Shared Management Components
// This page demonstrates the reusable management components working together

import React, { useState, useMemo, useEffect } from 'react'
import { Target, Download, Plus } from 'lucide-react'
import HuntCardV2 from '@/components/hunt-logging/HuntCardV2'
import type { CardMode } from '@/components/shared/cards/types'
import { createClient } from '@/lib/supabase/client'
import { huntService } from '@/lib/hunt-logging/hunt-service'
import { getIcon } from '@/lib/shared/icons'
import { getStandIcon } from '@/lib/utils/standUtils'
import { formatHuntDate, getHuntTypeBadge } from '@/lib/utils/date'
import type { IconName } from '@/lib/shared/icons/types'


// Extracted shared components
import ManagementPageLayout from '@/components/management/ManagementPageLayout'
import ManagementToolbar from '@/components/management/ManagementToolbar'
import FilterPanel, { type FilterConfig } from '@/components/management/FilterPanel'
import Pagination from '@/components/management/Pagination'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { exportData } from '@/lib/utils/export'
import { useStands } from '@/hooks/useStands'
import HuntEntryForm from '@/components/hunt-logging/HuntEntryForm'
import type { HuntFormData } from '@/lib/hunt-logging/hunt-validation'
import { HuntDetailsModal } from '@/components/hunt-logging/HuntDetailsModal'

export default function Phase1PreviewPage() {
  // Data State
  const [hunts, setHunts] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { stands } = useStands({ active: true })

  // UI State
  const [viewMode, setViewMode] = useState<CardMode>('list') // Default to list mode as requested
  const [showFilters, setShowFilters] = useState(false)
  const [viewingHuntId, setViewingHuntId] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingHunt, setEditingHunt] = useState<any | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    member: 'all',
    huntType: 'all',
    hadHarvest: 'all'
  })

  // Sorting
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Fetch hunts and members on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Fetch hunts with relationships
        const huntsData = await huntService.getHunts()
        setHunts(huntsData)

        // Fetch members for filter dropdown
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, display_name')
          .order('display_name')

        if (membersError) throw membersError
        setMembers(membersData || [])

        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Computed: Filtered and sorted items
  const filteredAndSortedHunts = useMemo(() => {
    let result = [...hunts]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(hunt =>
        hunt.member?.display_name?.toLowerCase().includes(searchLower) ||
        hunt.stand?.name?.toLowerCase().includes(searchLower) ||
        hunt.notes?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.member !== 'all') {
      result = result.filter(hunt => hunt.member_id === filters.member)
    }

    if (filters.huntType !== 'all') {
      result = result.filter(hunt => hunt.hunt_type === filters.huntType)
    }

    if (filters.hadHarvest !== 'all') {
      const hadHarvest = filters.hadHarvest === 'yes'
      result = result.filter(hunt => (hunt.harvest_count || 0) > 0 === hadHarvest)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.hunt_date).getTime()
          bValue = new Date(b.hunt_date).getTime()
          break
        case 'member':
          aValue = a.member?.display_name || ''
          bValue = b.member?.display_name || ''
          break
        case 'stand':
          aValue = a.stand?.name || ''
          bValue = b.stand?.name || ''
          break
        case 'duration':
          aValue = a.hunt_duration_minutes || 0
          bValue = b.hunt_duration_minutes || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [hunts, filters, sortBy, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedHunts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedHunts = filteredAndSortedHunts.slice(startIndex, endIndex)

  // Bulk selection hook
  const selection = useBulkSelection(paginatedHunts)

  // Export handler
  const handleExport = () => {
    // Transform hunts for export
    const exportableHunts = filteredAndSortedHunts.map(hunt => ({
      hunt_date: hunt.hunt_date,
      hunt_type: hunt.hunt_type,
      member: hunt.member?.display_name || 'Unknown',
      stand: hunt.stand?.name || 'Unknown',
      duration_minutes: hunt.hunt_duration_minutes || 0,
      harvest: (hunt.harvest_count || 0) > 0 ? 'Yes' : 'No',
      harvest_count: hunt.harvest_count || 0,
      notes: hunt.notes || ''
    }))

    const columns = [
      { key: 'hunt_date' as const, label: 'Date' },
      { key: 'hunt_type' as const, label: 'Type' },
      { key: 'member' as const, label: 'Member' },
      { key: 'stand' as const, label: 'Stand' },
      { key: 'duration_minutes' as const, label: 'Duration (min)' },
      { key: 'harvest' as const, label: 'Had Harvest' },
      { key: 'harvest_count' as const, label: 'Harvest Count' },
      { key: 'notes' as const, label: 'Notes' }
    ]

    exportData(
      exportableHunts,
      selection.selectedIds,
      columns,
      'hunts',
      'csv',
      'hunt_logs_export.csv'
    )
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      member: 'all',
      huntType: 'all',
      hadHarvest: 'all'
    })
  }

  const hasActiveFilters = Object.values(filters).some((v, i) => i === 0 ? v !== '' : v !== 'all')

  // Filter configuration for FilterPanel
  const filterConfigs: FilterConfig[] = [
    {
      id: 'member',
      label: 'Hunter',
      type: 'select',
      value: filters.member,
      options: [
        { value: 'all', label: 'All Hunters' },
        ...members.map(m => ({ value: m.id, label: m.display_name }))
      ]
    },
    {
      id: 'huntType',
      label: 'Hunt Type',
      type: 'select',
      value: filters.huntType,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'AM', label: 'AM Only' },
        { value: 'PM', label: 'PM Only' }
      ]
    },
    {
      id: 'hadHarvest',
      label: 'Harvest',
      type: 'select',
      value: filters.hadHarvest,
      options: [
        { value: 'all', label: 'All Hunts' },
        { value: 'yes', label: 'With Harvest' },
        { value: 'no', label: 'No Harvest' }
      ]
    }
  ]

  const handleFilterChange = (filterId: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [filterId]: value }))
  }

  // CRUD Handlers
  const handleViewHunt = (hunt: any) => {
    setViewingHuntId(hunt.id)
    setShowDetailsModal(true)
  }

  const handleEditHunt = (hunt: any) => {
    setEditingHunt(hunt)
    setShowEditForm(true)
  }

  const handleDeleteHunt = async (huntId: string) => {
    if (!confirm('Are you sure you want to delete this hunt? This cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      await huntService.deleteHunt(huntId)
      // Reload hunts
      const huntsData = await huntService.getHunts()
      setHunts(huntsData)
      alert('Hunt deleted successfully')
    } catch (err) {
      console.error('Error deleting hunt:', err)
      alert('Failed to delete hunt: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (data: HuntFormData) => {
    if (!editingHunt) return

    try {
      setIsSubmitting(true)

      // Extract only the fields that belong to hunt_logs table
      const huntUpdates = {
        hunt_date: data.hunt_date,
        stand_id: data.stand_id,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        hunt_type: data.hunt_type || null,
        notes: data.notes || null,
      }

      await huntService.updateHunt(editingHunt.id, huntUpdates)
      setShowEditForm(false)
      setEditingHunt(null)

      // Reload hunts
      const huntsData = await huntService.getHunts()
      setHunts(huntsData)
      alert('Hunt updated successfully')
    } catch (error) {
      console.error('Error updating hunt:', error)
      alert('Failed to update hunt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ManagementPageLayout
      title="Hunt Logs Management"
      description="View, filter, and manage all hunt logs"
      icon={Target}
      actions={[
        {
          label: 'Export',
          icon: Download,
          onClick: handleExport
        },
        {
          label: 'Log Hunt',
          icon: Plus,
          onClick: () => alert('Opening hunt logging form...')
        }
      ]}
    >
      {/* Info Banners */}
      <div className="space-y-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 font-medium mb-2">✅ Phase 1 Complete - Using Extracted Components</h3>
          <p className="text-blue-800 text-sm">
            This page now uses the extracted shared components: ManagementPageLayout, ManagementToolbar,
            FilterPanel, Pagination, useBulkSelection hook, and export utilities. Now displaying <strong>real hunt data</strong> from the database.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-amber-900 font-medium mb-2">⚠️ Testing Reminder</h3>
          <p className="text-amber-800 text-sm">
            When testing edit functionality, consider adding a test entry first so you don't modify real hunt logs.
            The delete and edit buttons are currently placeholders (alerts) - full CRUD implementation comes in Phase 2.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-weathered-wood">Loading hunt data...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-900 font-medium mb-2">Error Loading Data</h3>
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>

      {/* Toolbar */}
      <ManagementToolbar
        searchValue={filters.search}
        onSearchChange={(value) => setFilters({ ...filters, search: value })}
        searchPlaceholder="Search hunts by member, stand, or notes..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
        sortBy={sortBy}
        sortDirection={sortDirection}
        sortOptions={[
          { value: 'date', label: 'Date' },
          { value: 'member', label: 'Hunter' },
          { value: 'stand', label: 'Stand' },
          { value: 'duration', label: 'Duration' }
        ]}
        onSortChange={setSortBy}
        onSortDirectionChange={setSortDirection}
        currentCount={paginatedHunts.length}
        totalCount={filteredAndSortedHunts.length}
        selectedCount={selection.selectedCount}
        itemName="hunts"
      />

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filterConfigs}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          onClose={() => setShowFilters(false)}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* ==================== CONTENT AREA ==================== */}
      {viewMode === 'list' ? (
        /* LIST MODE - Table using HuntCardV2 */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-morning-mist">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                  Hunter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                  Stand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                  Weather
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-forest-shadow uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedHunts.map((hunt) => (
                <HuntCardV2
                  key={hunt.id}
                  hunt={hunt}
                  mode="list"
                  onClick={handleViewHunt}
                  onEdit={handleEditHunt}
                  onDelete={handleDeleteHunt}
                  showActions={true}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* FULL/COMPACT MODE - Grid */
        <div className={`grid gap-4 ${
          viewMode === 'compact'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {paginatedHunts.map((hunt) => (
            <HuntCardV2
              key={hunt.id}
              hunt={hunt}
              mode={viewMode}
              onClick={handleViewHunt}
              onEdit={handleEditHunt}
              onDelete={handleDeleteHunt}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
        </>
      )}

      {/* Details Modal */}
      <HuntDetailsModal
        huntId={viewingHuntId}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setViewingHuntId(null)
        }}
      />

      {/* Edit Form Modal */}
      {showEditForm && editingHunt && (() => {
        const CloseIcon = getIcon('close')
        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEditForm(false)
              setEditingHunt(null)
            }}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-olive-green text-white px-6 py-4 rounded-t-lg flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold">Edit Hunt Log</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingHunt(null)
                  }}
                  className="p-1 hover:bg-pine-needle rounded transition-colors"
                  title="Close"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <HuntEntryForm
                stands={stands}
                hunt={editingHunt}
                mode="edit"
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowEditForm(false)
                  setEditingHunt(null)
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )
      })()}
    </ManagementPageLayout>
  )
}
