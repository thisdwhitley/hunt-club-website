import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import ViewModeSelector from './ViewModeSelector'
import type { CardMode } from '@/components/shared/cards/types'

interface ManagementToolbarProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  // View Mode
  viewMode: CardMode
  onViewModeChange: (mode: CardMode) => void

  // Filters
  showFilters: boolean
  onToggleFilters: () => void
  hasActiveFilters?: boolean

  // Sort (optional, only shown in list mode)
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  sortOptions?: Array<{ value: string; label: string }>
  onSortChange?: (sortBy: string) => void
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void

  // Stats
  currentCount: number
  totalCount: number
  selectedCount?: number
  itemName?: string // e.g., "hunts", "stands", "cameras"
}

/**
 * ManagementToolbar - Reusable toolbar for management pages
 *
 * Features:
 * - Search input with clear button
 * - Filter toggle button
 * - View mode selector (Full/Compact/List)
 * - Sort controls (for list mode)
 * - Count statistics
 */
export default function ManagementToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters = false,
  sortBy,
  sortDirection = 'desc',
  sortOptions = [],
  onSortChange,
  onSortDirectionChange,
  currentCount,
  totalCount,
  selectedCount = 0,
  itemName = 'items'
}: ManagementToolbarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Single Row: Search + Filters + View Mode + Sort + Stats */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-weathered-wood" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-morning-mist placeholder-weathered-wood text-forest-shadow focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
          />
          {/* Clear search button */}
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-weathered-wood hover:text-forest-shadow"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            showFilters
              ? 'bg-olive-green border-olive-green text-white'
              : 'border-gray-300 text-forest-shadow hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="bg-burnt-orange text-white px-2 py-0.5 rounded-full text-xs font-bold">
              !
            </span>
          )}
        </button>

        {/* View Mode Selector */}
        <ViewModeSelector mode={viewMode} onChange={onViewModeChange} />

        {/* Sort (always visible) */}
        {sortOptions.length > 0 && onSortChange && onSortDirectionChange && (
          <>
            <div className="hidden lg:block w-px h-8 bg-gray-300" />
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-forest-shadow focus:outline-none focus:ring-2 focus:ring-olive-green"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')
                }
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-forest-shadow"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-weathered-wood ml-auto">
          <span>
            Showing {currentCount} of {totalCount} {itemName}
          </span>
          {selectedCount > 0 && (
            <span className="text-olive-green font-medium">
              {selectedCount} selected
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
