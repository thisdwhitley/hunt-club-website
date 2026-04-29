'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { getIcon } from '@/lib/shared/icons'
import { ManagementHubToolbar } from '@/components/shared/ManagementHubToolbar'
import type { TabConfig } from '@/components/shared/ManagementHubToolbar'
import HuntCardV2 from '@/components/hunt-logging/HuntCardV2'
import HuntDetailModal from '@/components/hunt-logging/HuntDetailModal'
import HuntEntryForm from '@/components/hunt-logging/HuntEntryForm'
import { huntService, type HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import type { HuntFormData } from '@/lib/hunt-logging/hunt-validation'
import { useStands } from '@/hooks/useStands'
import { Download, X as XIcon } from 'lucide-react'

const HuntsIcon = getIcon('hunts')
const SearchIcon = getIcon('search')
const FilterIcon = getIcon('filter')
const PlusIcon = getIcon('plus')
const AlertCircleIcon = getIcon('alertCircle')
const ViewGridIcon = getIcon('viewGrid')
const ViewCompactIcon = getIcon('viewCompact')
const ViewListIcon = getIcon('viewList')
const ChevronDownIcon = getIcon('chevronDown')

const PAGE_SIZE = 50

interface HuntManagementFilters {
  search: string
  season: string
  member: string
  harvest: 'all' | 'yes' | 'no'
}

const DEFAULT_FILTERS: HuntManagementFilters = {
  search: '',
  season: '',
  member: 'all',
  harvest: 'all',
}

function HuntFiltersPanel({
  filters,
  onFiltersChange,
  seasons,
  members,
}: {
  filters: HuntManagementFilters
  onFiltersChange: (f: HuntManagementFilters) => void
  seasons: string[]
  members: Array<{ id: string; name: string }>
}) {
  const update = (key: keyof HuntManagementFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value })

  const hasActive = (Object.keys(DEFAULT_FILTERS) as (keyof HuntManagementFilters)[]).some(
    k => filters[k] !== DEFAULT_FILTERS[k] && k !== 'search'
  )

  const selectClass =
    'w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
        <select value={filters.season} onChange={e => update('season', e.target.value)} className={selectClass}>
          <option value="">All Seasons</option>
          {seasons.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
        <select value={filters.member} onChange={e => update('member', e.target.value)} className={selectClass}>
          <option value="all">All Members</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Harvest</label>
        <select value={filters.harvest} onChange={e => update('harvest', e.target.value as HuntManagementFilters['harvest'])} className={selectClass}>
          <option value="all">All Hunts</option>
          <option value="yes">Harvests Only</option>
          <option value="no">No Harvest</option>
        </select>
      </div>
      {hasActive && (
        <div className="flex items-end">
          <button
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="text-sm text-olive-green hover:text-pine-needle font-medium pb-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

interface HuntsTabProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (key: string) => void
}

export function HuntsTab({ tabs, activeTab, onTabChange }: HuntsTabProps) {
  const [allHunts, setAllHunts] = useState<HuntWithDetails[]>([])
  const [seasons, setSeasons] = useState<string[]>([])
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<HuntManagementFilters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'hunt_date' | 'member' | 'stand'>('hunt_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'full' | 'compact' | 'list'>('full')
  const [currentPage, setCurrentPage] = useState(1)

  const [showDetail, setShowDetail] = useState(false)
  const [viewingHunt, setViewingHunt] = useState<HuntWithDetails | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingHunt, setEditingHunt] = useState<HuntWithDetails | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const { stands } = useStands({ active: true })

  const loadAllHunts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Load everything — client-side filtering handles season/member/harvest
      const data = await huntService.getHunts({})
      setAllHunts(data)
      setCurrentPage(1)

      // Derive seasons from hunt_date year (hunting_season field is not yet populated in DB)
      const uniqueSeasons = [...new Set(
        data.map(h => h.hunt_date.substring(0, 4))
      )].sort((a, b) => b.localeCompare(a))
      setSeasons(uniqueSeasons)

      const memberMap = new Map<string, string>()
      data.forEach(h => {
        if (h.member_id && !memberMap.has(h.member_id)) {
          memberMap.set(h.member_id, h.member?.display_name || h.member?.full_name || 'Unknown')
        }
      })
      setMembers([...memberMap.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)))

      // Default season filter to most recent season with data
      if (uniqueSeasons.length > 0) {
        setFilters(prev => prev.season ? prev : { ...prev, season: uniqueSeasons[0] })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hunts')
    } finally {
      setLoading(false)
    }
  }, [])

  const reload = useCallback(() => loadAllHunts(), [loadAllHunts])

  useEffect(() => {
    loadAllHunts()
  }, [loadAllHunts])

  const filteredHunts = useMemo(() => {
    let result = [...allHunts]

    if (filters.season) result = result.filter(h => h.hunt_date.startsWith(filters.season))
    if (filters.member !== 'all') result = result.filter(h => h.member_id === filters.member)
    if (filters.harvest === 'yes') result = result.filter(h => h.had_harvest || h.harvest_count > 0)
    if (filters.harvest === 'no') result = result.filter(h => !h.had_harvest && h.harvest_count === 0)

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        h =>
          (h.member?.display_name || h.member?.full_name || '').toLowerCase().includes(q) ||
          (h.stand?.name || '').toLowerCase().includes(q) ||
          (h.notes || '').toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      let aVal = '', bVal = ''
      switch (sortBy) {
        case 'member':
          aVal = a.member?.display_name || a.member?.full_name || ''
          bVal = b.member?.display_name || b.member?.full_name || ''
          break
        case 'stand':
          aVal = a.stand?.name || ''
          bVal = b.stand?.name || ''
          break
        default:
          aVal = a.hunt_date
          bVal = b.hunt_date
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [allHunts, filters.season, filters.member, filters.harvest, filters.search, sortBy, sortDirection])

  const totalPages = Math.ceil(filteredHunts.length / PAGE_SIZE)
  const paginatedHunts = filteredHunts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const filteredHarvestCount = filteredHunts.filter(h => h.had_harvest || h.harvest_count > 0).length

  const handleViewHunt = (hunt: HuntWithDetails) => {
    setViewingHunt(hunt)
    setShowDetail(true)
  }

  const handleEditHunt = (hunt: HuntWithDetails) => {
    setEditingHunt(hunt)
    setShowForm(true)
  }

  const handleDeleteHunt = async (huntId: string) => {
    if (!confirm('Delete this hunt record? This also deletes all associated harvests and sightings.')) return
    try {
      await huntService.deleteHunt(huntId)
      await reload()
    } catch (err) {
      alert(`Failed to delete hunt: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleAddHunt = () => {
    setEditingHunt(null)
    setShowForm(true)
  }

  const handleFormSubmit = async (data: HuntFormData) => {
    setFormSubmitting(true)
    try {
      if (editingHunt) {
        await huntService.updateHunt(editingHunt.id, {
          hunt_date: data.hunt_date,
          stand_id: data.stand_id,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          hunt_type: data.hunt_type || null,
          notes: data.notes || null,
        })
      } else {
        if (!data.member_id) throw new Error('Member is required to log a hunt')
        await huntService.createHunt({
          hunt_date: data.hunt_date,
          stand_id: data.stand_id,
          member_id: data.member_id,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          hunt_type: data.hunt_type || null,
          notes: data.notes || null,
          had_harvest: data.had_harvest ?? false,
          harvest_count: data.had_harvest ? 1 : 0,
        })
      }
      setShowForm(false)
      setEditingHunt(null)
      await reload()
    } catch (err) {
      alert(`Failed to save hunt: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const csv = await huntService.exportHuntsToCSV({
        season: filters.season || undefined,
        member_id: filters.member !== 'all' ? filters.member : undefined,
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hunts-${filters.season || 'all'}-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const activeFilterCount = (Object.keys(DEFAULT_FILTERS) as (keyof HuntManagementFilters)[]).filter(
    k => k !== 'search' && filters[k] !== DEFAULT_FILTERS[k]
  ).length

  const actions = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportCSV}
        disabled={filteredHunts.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Export to CSV"
      >
        <Download size={15} />
        <span className="hidden sm:inline">Export</span>
      </button>
      <button
        onClick={handleAddHunt}
        className="bg-burnt-orange hover:bg-clay-earth text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors font-medium text-sm"
      >
        <PlusIcon size={16} />
        <span className="hidden sm:inline">Add Hunt</span>
      </button>
    </div>
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
            placeholder="Search by member, stand, or notes…"
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
            <option value="hunt_date">Date</option>
            <option value="member">Member</option>
            <option value="stand">Stand</option>
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
          <span>
            {filteredHunts.length} of {allHunts.length} hunts · {filteredHarvestCount} harvest{filteredHarvestCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <HuntFiltersPanel
            filters={filters}
            onFiltersChange={f => { setFilters(f); setCurrentPage(1) }}
            seasons={seasons}
            members={members}
          />
        </div>
      )}
    </>
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
      >
        {toolbarRow}
      </ManagementHubToolbar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green" />
            <p className="text-weathered-wood mt-2">Loading hunts…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Hunts</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => reload()}
                className="text-olive-green hover:text-pine-needle font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && allHunts.length === 0 && (
          <div className="text-center py-12">
            <HuntsIcon className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hunts logged yet</h3>
            <p className="text-weathered-wood mb-4">Use the + Hunt Log button in the nav to record your first hunt.</p>
          </div>
        )}

        {!loading && !error && filteredHunts.length === 0 && allHunts.length > 0 && (
          <div className="text-center py-12">
            <HuntsIcon className="h-12 w-12 text-weathered-wood mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hunts match your filters</h3>
            <p className="text-weathered-wood mb-4">Try adjusting your search or filters.</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-olive-green hover:text-pine-needle font-medium underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredHunts.length > 0 && (
          <>
            {viewMode === 'list' ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-morning-mist">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Stand</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-forest-shadow uppercase tracking-wide">Harvest</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-forest-shadow uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHunts.map(hunt => (
                      <HuntCardV2
                        key={hunt.id}
                        hunt={hunt}
                        mode="list"
                        onClick={handleViewHunt}
                        onEdit={handleEditHunt}
                        onDelete={handleDeleteHunt}
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
                {paginatedHunts.map(hunt => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-1">
                <p className="text-sm text-weathered-wood">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredHunts.length)} of {filteredHunts.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-weathered-wood">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                            currentPage === p
                              ? 'bg-olive-green border-olive-green text-white'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <HuntDetailModal
        hunt={viewingHunt}
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setViewingHunt(null) }}
      />

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-forest-shadow">
                {editingHunt ? 'Edit Hunt' : 'Add Hunt'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingHunt(null) }}
                className="p-2 hover:bg-morning-mist rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5 text-weathered-wood" />
              </button>
            </div>
            <HuntEntryForm
              stands={stands}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditingHunt(null) }}
              isSubmitting={formSubmitting}
              hunt={editingHunt as unknown as Partial<HuntFormData> | undefined}
              mode={editingHunt ? 'edit' : 'create'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
