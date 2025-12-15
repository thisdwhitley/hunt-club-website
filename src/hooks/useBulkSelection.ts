import { useState, useMemo } from 'react'

/**
 * useBulkSelection - Hook for managing bulk item selection in tables
 *
 * Features:
 * - Track selected items by ID
 * - Select/deselect individual items
 * - Select/deselect all visible items
 * - Calculate selection states (all, some, none)
 * - Clear all selections
 *
 * @param items - Array of items with id property
 * @returns Selection state and control functions
 */
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Selection state calculations
  const allSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  )

  const someSelected = useMemo(
    () => items.some((item) => selectedIds.has(item.id)) && !allSelected,
    [items, selectedIds, allSelected]
  )

  const selectedCount = selectedIds.size

  // Selection actions
  const selectAll = () => {
    setSelectedIds(new Set(items.map((item) => item.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const toggleAll = () => {
    if (allSelected) {
      deselectAll()
    } else {
      selectAll()
    }
  }

  const selectItem = (id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id))
  }

  const deselectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleItem = (id: string) => {
    if (selectedIds.has(id)) {
      deselectItem(id)
    } else {
      selectItem(id)
    }
  }

  const isSelected = (id: string) => selectedIds.has(id)

  return {
    // State
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,

    // Actions
    selectAll,
    deselectAll,
    toggleAll,
    selectItem,
    deselectItem,
    toggleItem,
    isSelected
  }
}
