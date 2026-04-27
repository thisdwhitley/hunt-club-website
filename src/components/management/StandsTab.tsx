'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getIcon } from '@/lib/shared/icons'
import { ManagementHubToolbar } from '@/components/shared/ManagementHubToolbar'
import type { TabConfig } from '@/components/shared/ManagementHubToolbar'
import StandCardV2 from '@/components/stands/StandCardV2'
import StandFormModal from '@/components/stands/StandFormModal'
import { StandDetailModal } from '@/components/stands/StandDetailModal'
import type { Stand } from '@/lib/stands/types'

const StandsIcon = getIcon('stands')
const SearchIcon = getIcon('search')
const FilterIcon = getIcon('filter')
const PlusIcon = getIcon('plus')
const AlertCircleIcon = getIcon('alertCircle')
const ViewGridIcon = getIcon('viewGrid')
const ViewCompactIcon = getIcon('viewCompact')
const ViewListIcon = getIcon('viewList')

interface StandManagementFilters {
  search: string
  status: string
  type: string
  timeOfDay: string
}

const DEFAULT_FILTERS: StandManagementFilters = {
  search: '',
  status: 'active',
  type: 'all',
  timeOfDay: 'all',
}

interface StandHuntStats {
  totalHunts: number
  totalHarvests: number
  seasonHunts: number
  lastHuntDate: string | null
  lastHuntType: string | null
}

function StandFiltersPanel({
  filters,
  onFiltersChange,
}: {
  filters: StandManagementFilters
  onFiltersChange: (f: StandManagementFilters) => void
}) {
  const update = (key: keyof StandManagementFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value })

  const hasActive = (Object.keys(DEFAULT_FILTERS) as (keyof StandManagementFilters)[]).some(
    k => filters[k] !== DEFAULT_FILTERS[k]
  )

  const selectClass =
    'w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select value={filters.status} onChange={e => update('status', e.target.value)} className={selectClass}>
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select value={filters.type} onChange={e => update('type', e.target.value)} className={selectClass}>
          <option value="all">All Types</option>
          <option value="ladder_stand">Ladder Stand</option>
          <option value="bale_blind">Bale Blind</option>
          <option value="box_stand">Box Stand</option>
          <option value="tripod">Tripod</option>
          <option value="ground_blind">Ground Blind</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
        <select value={filters.timeOfDay} onChange={e => update('timeOfDay', e.target.value)} className={selectClass}>
          <option value="all">All Times</option>
          <option value="AM">Morning (AM)</option>
          <option value="PM">Evening (PM)</option>
          <option value="ALL">All Day</option>
        </select>
      </div>
      {hasActive && (
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

interface StandsTabProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (key: string) => void
}

export function StandsTab({ tabs, activeTab, onTabChange }: StandsTabProps) {
  const [stands, setStands] = useState<Stand[]>([])
  const [huntStats, setHuntStats] = useState<Record<string, StandHuntStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<StandManagementFilters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'last_used_date' | 'created_at'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'full' | 'compact' | 'list'>('full')

  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editingStand, setEditingStand] = useState<Stand | null>(null)
  const [viewingStand, setViewingStand] = useState<Stand | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const loadStands = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase.from('stands').select('*').order('name')
      if (fetchError) throw new Error(`Failed to load stands: ${fetchError.message}`)
      setStands(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stands')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const loadHuntStats = useCallback(async () => {
    try {
      const currentSeason = String(new Date().getFullYear())
      const { data } = await supabase
        .from('hunt_logs')
        .select('stand_id, harvest_count, hunt_type, hunt_date, season')
        .not('stand_id', 'is', null)

      if (!data) return

      const statsMap: Record<string, StandHuntStats> = {}
      for (const hunt of data) {
        if (!hunt.stand_id) continue
        if (!statsMap[hunt.stand_id]) {
          statsMap[hunt.stand_id] = {
            totalHunts: 0,
            totalHarvests: 0,
            seasonHunts: 0,
            lastHuntDate: null,
            lastHuntType: null,
          }
        }
        const s = statsMap[hunt.stand_id]
        s.totalHunts++
        s.totalHarvests += hunt.harvest_count || 0
        if (hunt.season === currentSeason) s.seasonHunts++
        if (!s.lastHuntDate || hunt.hunt_date > s.lastHuntDate) {
          s.lastHuntDate = hunt.hunt_date
          s.lastHuntType = hunt.hunt_type
        }
      }
      setHuntStats(statsMap)
    } catch (err) {
      console.error('Error loading hunt stats:', err)
    }
  }, [supabase])

  useEffect(() => {
    loadStands()
    loadHuntStats()
  }, [loadStands, loadHuntStats])

  const filteredStands = useMemo(() => {
    let result = [...stands]

    if (filters.status === 'active') result = result.filter(s => s.active)
    if (filters.status === 'inactive') result = result.filter(s => !s.active)
    if (filters.type !== 'all') result = result.filter(s => s.type === filters.type)
    if (filters.timeOfDay !== 'all') result = result.filter(s => s.time_of_day === filters.timeOfDay)

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.trail_name?.toLowerCase().includes(q) ||
          s.access_notes?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      let aVal: string, bVal: string
      switch (sortBy) {
        case 'type':
          aVal = a.type
          bVal = b.type
          break
        case 'last_used_date':
          aVal = a.last_used_date || ''
          bVal = b.last_used_date || ''
          break
        case 'created_at':
          aVal = a.created_at
          bVal = b.created_at
          break
        default:
          aVal = a.name
          bVal = b.name
      }
      const aStr = aVal.toLowerCase()
      const bStr = bVal.toLowerCase()
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [stands, filters, sortBy, sortDirection])

  const clearFilters = () => setFilters(DEFAULT_FILTERS)

  const handleDeleteStand = async (stand: Stand) => {
    if (
      !confirm(
        `Retire "${stand.name}"? This marks it as inactive and removes it from the active list. It can be restored later.`
      )
    )
      return
    try {
      const { error: updateError } = await supabase
        .from('stands')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', stand.id)
      if (updateError) throw new Error(updateError.message)
      await loadStands()
    } catch (err) {
      alert(`Failed to retire stand: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleEditStand = (stand: Stand) => {
    setEditingStand(stand)
    setShowForm(true)
  }

  const handleViewStand = (stand: Stand) => {
    setViewingStand(stand)
    setShowDetail(true)
  }

  const handleCreateStand = () => {
    setEditingStand(null)
    setShowForm(true)
  }

  const handleFormSubmit = async () => {
    setShowForm(false)
    setEditingStand(null)
    await loadStands()
    await loadHuntStats()
  }

  const getCardHistoryProps = (stand: Stand) => {
    const stats = huntStats[stand.id]
    if (!stats) return {}
    return {
      historyStats: [
        { label: 'Total Harvests', value: stats.totalHarvests, color: 'text-burnt-orange' },
        { label: `${new Date().getFullYear()} Hunts`, value: stats.seasonHunts, color: 'text-muted-gold' },
        { label: 'All-Time Hunts', value: stats.totalHunts, color: 'text-olive-green' },
      ],
      lastActivity: stats.lastHuntDate
        ? { date: stats.lastHuntDate, timeOfDay: stats.lastHuntType ?? undefined, label: 'Last Hunted' }
        : undefined,
    }
  }

  const activeFilterCount = (Object.keys(DEFAULT_FILTERS) as (keyof StandManagementFilters)[]).filter(
    k => filters[k] !== DEFAULT_FILTERS[k] && k !== 'search'
  ).length

  const ChevronDownIcon = getIcon('chevronDown')

  const actions = (
    <button
      onClick={handleCreateStand}
      className="bg-burnt-orange hover:bg-clay-earth text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors font-medium text-sm"
    >
      <PlusIcon size={16} />
      <span className="hidden sm:inline">Add Stand</span>
    </button>
  )

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
            placeholder="Search by name, trail, or notes…"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-morning-mist placeholder-weathered-wood focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label className="hidden sm:block text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 sm:px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="last_used_date">Last Used</option>
            <option value="created_at">Created</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <div className="flex flex-col items-center justify-center w-4 h-4">
              <div
                className={`w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent ${sortDirection === 'asc' ? 'border-b-gray-600' : 'border-b-gray-300'} mb-0.5`}
                style={{ borderBottomWidth: '3px', borderLeftWidth: '2px', borderRightWidth: '2px' }}
              />
              <div
                className={`w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${sortDirection === 'desc' ? 'border-t-gray-600' : 'border-t-gray-300'}`}
                style={{ borderTopWidth: '3px', borderLeftWidth: '2px', borderRightWidth: '2px' }}
              />
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
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                showFilters ? 'bg-white text-olive-green' : 'bg-burnt-orange text-white'
              }`}
            >
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
          {(
            [
              { mode: 'full' as const, icon: ViewGridIcon, title: 'Full cards' },
              { mode: 'compact' as const, icon: ViewCompactIcon, title: 'Compact grid' },
              { mode: 'list' as const, icon: ViewListIcon, title: 'List view' },
            ] as const
          ).map(({ mode, icon: Icon, title }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={title}
              className={`p-1.5 rounded transition-colors ${
                viewMode === mode ? 'bg-olive-green text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-1 text-sm text-weathered-wood shrink-0">
          <div className="w-2.5 h-2.5 bg-olive-green rounded-full" />
          <span>{filteredStands.length} stands</span>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <StandFiltersPanel filters={filters} onFiltersChange={setFilters} />
        </div>
      )}
    </>
  )

  const fab = (
    <button
      onClick={handleCreateStand}
      className="sm:hidden fixed bottom-6 right-6 z-20 w-14 h-14 bg-burnt-orange hover:bg-clay-earth text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      aria-label="Add Stand"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green" />
            <p className="text-weathered-wood mt-2">Loading stands…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Stands</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={loadStands} className="text-olive-green hover:text-pine-needle font-medium underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && stands.length === 0 && (
          <div className="text-center py-12">
            <StandsIcon className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stands yet</h3>
            <p className="text-weathered-wood mb-4">Get started by adding your first hunting stand.</p>
            <button
              onClick={handleCreateStand}
              className="bg-burnt-orange hover:bg-clay-earth text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Your First Stand
            </button>
          </div>
        )}

        {!loading && !error && filteredStands.length === 0 && stands.length > 0 && (
          <div className="text-center py-12">
            <StandsIcon className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stands match your filters</h3>
            <p className="text-weathered-wood mb-4">Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="text-olive-green hover:text-pine-needle font-medium underline">
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredStands.length > 0 && (
          <>
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-morning-mist">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">
                        Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">
                        Last Hunted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">
                        Location
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-forest-shadow uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStands.map(stand => (
                      <StandCardV2
                        key={stand.id}
                        stand={stand}
                        mode="list"
                        onClick={handleViewStand}
                        onEdit={handleEditStand}
                        onDelete={handleDeleteStand}
                        showLocation={true}
                        showStats={true}
                        showActions={true}
                        {...getCardHistoryProps(stand)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'compact'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                }
              >
                {filteredStands.map(stand => (
                  <StandCardV2
                    key={stand.id}
                    stand={stand}
                    mode={viewMode}
                    onClick={handleViewStand}
                    onEdit={handleEditStand}
                    onDelete={handleDeleteStand}
                    showLocation={true}
                    showStats={true}
                    showActions={true}
                    {...getCardHistoryProps(stand)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showDetail && viewingStand && (
        <StandDetailModal
          stand={viewingStand}
          onClose={() => {
            setShowDetail(false)
            setViewingStand(null)
          }}
          onEdit={handleEditStand}
          {...getCardHistoryProps(viewingStand)}
        />
      )}

      {showForm && (
        <StandFormModal
          stand={editingStand}
          onClose={() => {
            setShowForm(false)
            setEditingStand(null)
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
