import React from 'react'
import { Filter, X } from 'lucide-react'

export interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'text' | 'date' | 'checkbox'
  value: string | boolean
  options?: Array<{ value: string; label: string }> // For select type
  placeholder?: string // For text type
}

interface FilterPanelProps {
  filters: FilterConfig[]
  onFilterChange: (filterId: string, value: string | boolean) => void
  onClearFilters: () => void
  onClose: () => void
  hasActiveFilters?: boolean
}

/**
 * FilterPanel - Reusable collapsible filter panel
 *
 * Features:
 * - Flexible filter configurations (select, text, date, checkbox)
 * - Green header with close button
 * - Clear all filters button
 * - Responsive grid layout
 */
export default function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  onClose,
  hasActiveFilters = false
}: FilterPanelProps) {
  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <select
              value={filter.value as string}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist text-forest-shadow focus:outline-none focus:ring-2 focus:ring-olive-green"
            >
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case 'text':
        return (
          <div key={filter.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <input
              type="text"
              value={filter.value as string}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              placeholder={filter.placeholder}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist text-forest-shadow placeholder-weathered-wood focus:outline-none focus:ring-2 focus:ring-olive-green"
            />
          </div>
        )

      case 'date':
        return (
          <div key={filter.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <input
              type="date"
              value={filter.value as string}
              onChange={(e) => onFilterChange(filter.id, e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-morning-mist text-forest-shadow focus:outline-none focus:ring-2 focus:ring-olive-green"
            />
          </div>
        )

      case 'checkbox':
        return (
          <div key={filter.id} className="flex items-center">
            <input
              type="checkbox"
              id={filter.id}
              checked={filter.value as boolean}
              onChange={(e) => onFilterChange(filter.id, e.target.checked)}
              className="rounded border-weathered-wood text-olive-green focus:ring-olive-green"
            />
            <label htmlFor={filter.id} className="ml-2 text-sm text-gray-700">
              {filter.label}
            </label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="bg-olive-green text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <h3 className="font-medium">Filters</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-pine-needle rounded transition-colors"
          aria-label="Close filters"
        >
          <X size={18} />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map(renderFilter)}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClearFilters}
              className="text-sm text-olive-green hover:text-pine-needle font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
