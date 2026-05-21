'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { getIcon } from '@/lib/shared/icons'
import { ManagementHubToolbar } from '@/components/shared/ManagementHubToolbar'
import type { TabConfig } from '@/components/shared/ManagementHubToolbar'
import { huntService, type SightingWithContext } from '@/lib/hunt-logging/hunt-service'
import { formatDate } from '@/lib/utils/date'
import { useRouter } from 'next/navigation'

const BinocularsIcon = getIcon('binoculars')
const SearchIcon = getIcon('search')
const FilterIcon = getIcon('filter')
const EditIcon = getIcon('edit')
const DeleteIcon = getIcon('delete')
const XIcon = getIcon('x')
const ChevronDownIcon = getIcon('chevronDown')
const AlertCircleIcon = getIcon('alertCircle')
const InfoIcon = getIcon('info')

const HUNTING_COLORS = {
  oliveGreen: '#566E3D',
  burntOrange: '#FA7921',
  forestShadow: '#2D3E1F',
  weatheredWood: '#8B7355',
  morningMist: '#E8E6E0',
  clayEarth: '#A0653A',
}

type SortKey = 'hunt_date' | 'stand' | 'animal_type' | 'count'

interface SightingFilters {
  search: string
  animalType: string
  stand: string
  season: string
}

const DEFAULT_FILTERS: SightingFilters = {
  search: '',
  animalType: '',
  stand: '',
  season: '',
}

type SightingDraft = {
  animal_type: string
  count: string
  gender: string
  time_observed: string
  distance_yards: string
  direction: string
  behavior: string
  notes: string
}

interface SightingsTabProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (key: string) => void
}

function EditSightingModal({
  sighting,
  onSave,
  onClose,
}: {
  sighting: SightingWithContext
  onSave: (id: string, draft: SightingDraft) => Promise<void>
  onClose: () => void
}) {
  const [draft, setDraft] = useState<SightingDraft>({
    animal_type: sighting.animal_type ?? '',
    count: sighting.count != null ? String(sighting.count) : '1',
    gender: sighting.gender ?? 'Unknown',
    time_observed: sighting.time_observed ?? '',
    distance_yards: sighting.distance_yards != null ? String(sighting.distance_yards) : '',
    direction: sighting.direction ?? 'Unknown',
    behavior: sighting.behavior ?? '',
    notes: sighting.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const update = (key: keyof SightingDraft, value: string) =>
    setDraft(d => ({ ...d, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(sighting.id, draft)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full p-1.5 border border-gray-300 rounded bg-white text-forest-shadow text-sm focus:outline-none focus:ring-1 focus:ring-olive-green'

  const huntDate = sighting.hunt_log?.hunt_date
    ? formatDate(sighting.hunt_log.hunt_date, { style: 'short' })
    : '—'
  const standName = sighting.hunt_log?.stand?.name ?? '—'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-forest-shadow">Edit Sighting</h2>
            <p className="text-xs text-weathered-wood mt-0.5">
              {huntDate} · {standName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-morning-mist rounded-lg transition-colors">
            <XIcon size={16} style={{ color: HUNTING_COLORS.weatheredWood }} />
          </button>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Animal</label>
              <input value={draft.animal_type} onChange={e => update('animal_type', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Count</label>
              <input type="number" min="1" value={draft.count} onChange={e => update('count', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
              <select value={draft.gender} onChange={e => update('gender', e.target.value)} className={inputClass}>
                {['Unknown', 'Buck', 'Doe', 'Mixed'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time Observed</label>
              <input type="time" value={draft.time_observed} onChange={e => update('time_observed', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Distance (yds)</label>
              <input type="number" min="0" value={draft.distance_yards} onChange={e => update('distance_yards', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Direction</label>
              <select value={draft.direction} onChange={e => update('direction', e.target.value)} className={inputClass}>
                {['Unknown', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Behavior</label>
              <input value={draft.behavior} onChange={e => update('behavior', e.target.value)} placeholder="Feeding, alert, moving…" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={draft.notes} onChange={e => update('notes', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-olive-green text-white text-sm font-medium rounded-lg hover:bg-forest-shadow disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-morning-mist transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  sighting,
  onConfirm,
  onClose,
}: {
  sighting: SightingWithContext
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-xl p-6">
        <h2 className="text-base font-semibold text-forest-shadow mb-2">Delete Sighting?</h2>
        <p className="text-sm text-weathered-wood mb-4">
          This will permanently remove the{' '}
          <strong className="text-forest-shadow">{sighting.animal_type}</strong> sighting
          {sighting.hunt_log?.hunt_date
            ? ` from ${formatDate(sighting.hunt_log.hunt_date, { style: 'short' })}`
            : ''}
          . This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2 bg-clay-earth text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-morning-mist transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function SightingsTab({ tabs, activeTab, onTabChange }: SightingsTabProps) {
  const router = useRouter()
  const [allSightings, setAllSightings] = useState<SightingWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<SightingFilters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('hunt_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [editingSighting, setEditingSighting] = useState<SightingWithContext | null>(null)
  const [deletingSighting, setDeletingSighting] = useState<SightingWithContext | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await huntService.getSightingsWithContext()
      setAllSightings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sightings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Derived filter options
  const animalTypes = useMemo(
    () => [...new Set(allSightings.map(s => s.animal_type).filter(Boolean))].sort(),
    [allSightings]
  )
  const stands = useMemo(
    () => [...new Set(allSightings.map(s => s.hunt_log?.stand?.name).filter((n): n is string => Boolean(n)))].sort(),
    [allSightings]
  )
  const seasons = useMemo(
    () => [...new Set(allSightings.map(s => s.hunt_log?.hunt_date?.substring(0, 4)).filter((y): y is string => Boolean(y)))].sort((a, b) => b.localeCompare(a)),
    [allSightings]
  )

  const activeFilterCount = (Object.keys(DEFAULT_FILTERS) as (keyof SightingFilters)[])
    .filter(k => k !== 'search' && filters[k] !== DEFAULT_FILTERS[k]).length

  const filtered = useMemo(() => {
    let result = allSightings

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(s =>
        s.animal_type?.toLowerCase().includes(q) ||
        s.hunt_log?.stand?.name?.toLowerCase().includes(q) ||
        s.behavior?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q)
      )
    }
    if (filters.animalType) result = result.filter(s => s.animal_type === filters.animalType)
    if (filters.stand) result = result.filter(s => s.hunt_log?.stand?.name === filters.stand)
    if (filters.season) result = result.filter(s => s.hunt_log?.hunt_date?.startsWith(filters.season))

    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'hunt_date') {
        cmp = (a.hunt_log?.hunt_date ?? '').localeCompare(b.hunt_log?.hunt_date ?? '')
      } else if (sortBy === 'stand') {
        cmp = (a.hunt_log?.stand?.name ?? '').localeCompare(b.hunt_log?.stand?.name ?? '')
      } else if (sortBy === 'animal_type') {
        cmp = (a.animal_type ?? '').localeCompare(b.animal_type ?? '')
      } else if (sortBy === 'count') {
        cmp = (a.count ?? 0) - (b.count ?? 0)
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [allSightings, filters, sortBy, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
  }

  const handleSave = async (id: string, draft: SightingDraft) => {
    await huntService.updateSighting(id, {
      animal_type: draft.animal_type,
      count: Number(draft.count) || 1,
      gender: draft.gender || null,
      time_observed: draft.time_observed || null,
      distance_yards: draft.distance_yards ? Number(draft.distance_yards) : null,
      direction: (draft.direction || null) as 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'Unknown' | null,
      behavior: draft.behavior || null,
      notes: draft.notes || null,
    })
    setAllSightings(prev => prev.map(s =>
      s.id === id ? {
        ...s,
        animal_type: draft.animal_type,
        count: Number(draft.count) || 1,
        gender: draft.gender || null,
        time_observed: draft.time_observed || null,
        distance_yards: draft.distance_yards ? Number(draft.distance_yards) : null,
        direction: (draft.direction || null) as 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'Unknown' | null,
        behavior: draft.behavior || null,
        notes: draft.notes || null,
      } : s
    ))
  }

  const handleDelete = async (sighting: SightingWithContext) => {
    await huntService.deleteSighting(sighting.id)
    setAllSightings(prev => prev.filter(s => s.id !== sighting.id))
  }

  const selectClass = 'w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green'

  const thClass = 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
  const tdClass = 'px-3 py-3 text-sm text-forest-shadow'

  const SortColIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col items-center justify-center ml-1 w-2.5">
      <span
        className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[3px] border-transparent mb-px"
        style={{ borderBottomColor: sortBy === col && sortDir === 'asc' ? HUNTING_COLORS.oliveGreen : '#d1d5db' }}
      />
      <span
        className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent"
        style={{ borderTopColor: sortBy === col && sortDir === 'desc' ? HUNTING_COLORS.oliveGreen : '#d1d5db' }}
      />
    </span>
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
            placeholder="Search by animal, stand, or behavior…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-morning-mist text-gray-900 placeholder-weathered-wood focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <label className="hidden sm:block text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as SortKey); setSortDir('desc') }}
            className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 sm:px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          >
            <option value="hunt_date">Date</option>
            <option value="stand">Stand</option>
            <option value="animal_type">Animal</option>
            <option value="count">Count</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={`Sort ${sortDir === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <div className="flex flex-col items-center justify-center w-4 h-4">
              <div
                className={`w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent ${sortDir === 'asc' ? 'border-b-gray-600' : 'border-b-gray-300'} mb-0.5`}
                style={{ borderBottomWidth: '3px', borderLeftWidth: '2px', borderRightWidth: '2px' }}
              />
              <div
                className={`w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${sortDir === 'desc' ? 'border-t-gray-600' : 'border-t-gray-300'}`}
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
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFilters ? 'bg-white text-olive-green' : 'bg-burnt-orange text-white'}`}>
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

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-1 text-sm text-weathered-wood shrink-0">
          <div className="w-2.5 h-2.5 bg-olive-green rounded-full" />
          <span>{filtered.length} sighting{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
              <select value={filters.animalType} onChange={e => setFilters(f => ({ ...f, animalType: e.target.value }))} className={selectClass}>
                <option value="">All Animals</option>
                {animalTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stand</label>
              <select value={filters.stand} onChange={e => setFilters(f => ({ ...f, stand: e.target.value }))} className={selectClass}>
                <option value="">All Stands</option>
                {stands.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season Year</label>
              <select value={filters.season} onChange={e => setFilters(f => ({ ...f, season: e.target.value }))} className={selectClass}>
                <option value="">All Seasons</option>
                {seasons.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-2 text-sm text-olive-green hover:text-pine-needle font-medium"
            >
              Clear filters
            </button>
          )}
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
      >
        {toolbarRow}
      </ManagementHubToolbar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* "Add via hunt log" hint */}
        <div className="flex items-center gap-1.5 text-xs text-weathered-wood mb-4">
          <InfoIcon size={12} style={{ color: HUNTING_COLORS.weatheredWood, flexShrink: 0 }} />
          <span>
            To add a sighting, open the hunt log from the{' '}
            <button
              onClick={() => router.push('/management?tab=hunts')}
              className="underline underline-offset-2 hover:text-olive-green transition-colors"
            >
              Hunts tab
            </button>
            .
          </span>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green" />
            <p className="text-weathered-wood mt-2">Loading sightings…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Sightings</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={load} className="text-olive-green hover:text-pine-needle font-medium underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <BinocularsIcon size={32} className="mx-auto mb-3 text-weathered-wood" />
            <p className="text-sm font-medium text-forest-shadow">No sightings found</p>
            {(filters.search || activeFilterCount > 0) && (
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-2 text-sm text-olive-green hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={thClass}>
                      <button className="flex items-center gap-1 hover:text-forest-shadow transition-colors" onClick={() => handleSort('hunt_date')}>
                        Date <SortColIcon col="hunt_date" />
                      </button>
                    </th>
                    <th className={thClass}>
                      <button className="flex items-center gap-1 hover:text-forest-shadow transition-colors" onClick={() => handleSort('stand')}>
                        Stand <SortColIcon col="stand" />
                      </button>
                    </th>
                    <th className={thClass}>
                      <button className="flex items-center gap-1 hover:text-forest-shadow transition-colors" onClick={() => handleSort('animal_type')}>
                        Animal <SortColIcon col="animal_type" />
                      </button>
                    </th>
                    <th className={thClass}>
                      <button className="flex items-center gap-1 hover:text-forest-shadow transition-colors" onClick={() => handleSort('count')}>
                        Count <SortColIcon col="count" />
                      </button>
                    </th>
                    <th className={thClass}>Gender</th>
                    <th className={thClass}>Time</th>
                    <th className={thClass}>Distance</th>
                    <th className={thClass}>Direction</th>
                    <th className={thClass}>Behavior / Notes</th>
                    <th className={thClass + ' text-right'}>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.map(sighting => (
                    <tr key={sighting.id} className="hover:bg-gray-50 transition-colors">
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.hunt_log?.hunt_date
                          ? formatDate(sighting.hunt_log.hunt_date, { style: 'short' })
                          : '—'}
                      </td>
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.hunt_log?.stand?.name ?? <span className="text-weathered-wood">—</span>}
                      </td>
                      <td className={tdClass + ' font-medium whitespace-nowrap'}>
                        {sighting.animal_type}
                      </td>
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.count ?? 1}
                      </td>
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.gender ?? <span className="text-weathered-wood text-xs">—</span>}
                      </td>
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.time_observed
                          ? sighting.time_observed.slice(0, 5)
                          : <span className="text-weathered-wood text-xs">—</span>}
                      </td>
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.distance_yards != null
                          ? `${sighting.distance_yards} yds`
                          : <span className="text-weathered-wood text-xs">—</span>}
                      </td>
                      <td className={tdClass + ' whitespace-nowrap'}>
                        {sighting.direction ?? <span className="text-weathered-wood text-xs">—</span>}
                      </td>
                      <td className={tdClass + ' max-w-[200px]'}>
                        <span className="block truncate text-xs text-weathered-wood">
                          {[sighting.behavior, sighting.notes].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </td>
                      <td className={tdClass + ' whitespace-nowrap text-right'}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingSighting(sighting)}
                            className="p-1.5 rounded hover:bg-olive-green/10 transition-colors"
                            title="Edit"
                          >
                            <EditIcon size={14} style={{ color: HUNTING_COLORS.oliveGreen }} />
                          </button>
                          <button
                            onClick={() => setDeletingSighting(sighting)}
                            className="p-1.5 rounded hover:bg-clay-earth/10 transition-colors"
                            title="Delete"
                          >
                            <DeleteIcon size={14} style={{ color: HUNTING_COLORS.clayEarth }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editingSighting && (
        <EditSightingModal
          sighting={editingSighting}
          onSave={handleSave}
          onClose={() => setEditingSighting(null)}
        />
      )}

      {deletingSighting && (
        <DeleteConfirmModal
          sighting={deletingSighting}
          onConfirm={() => handleDelete(deletingSighting)}
          onClose={() => setDeletingSighting(null)}
        />
      )}
    </div>
  )
}
