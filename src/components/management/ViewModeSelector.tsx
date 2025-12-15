import React from 'react'
import { LayoutGrid, LayoutList, Table } from 'lucide-react'
import type { CardMode } from '@/components/shared/cards/types'

interface ViewModeSelectorProps {
  mode: CardMode
  onChange: (mode: CardMode) => void
  className?: string
}

/**
 * ViewModeSelector - Toggle between Full, Compact, and List view modes
 *
 * Features:
 * - Three view modes with icons
 * - Active state styling
 * - Responsive labels (hidden on small screens)
 * - Tooltips for clarity
 */
export default function ViewModeSelector({
  mode,
  onChange,
  className = ''
}: ViewModeSelectorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Full View */}
      <button
        onClick={() => onChange('full')}
        className={`p-2 rounded-lg font-medium transition-colors ${
          mode === 'full'
            ? 'bg-olive-green text-white'
            : 'bg-morning-mist text-forest-shadow hover:bg-weathered-wood/20'
        }`}
        title="Full view - Complete details"
        aria-label="Full view"
      >
        <LayoutGrid size={18} />
      </button>

      {/* Compact View */}
      <button
        onClick={() => onChange('compact')}
        className={`p-2 rounded-lg font-medium transition-colors ${
          mode === 'compact'
            ? 'bg-olive-green text-white'
            : 'bg-morning-mist text-forest-shadow hover:bg-weathered-wood/20'
        }`}
        title="Compact view - Quick overview"
        aria-label="Compact view"
      >
        <LayoutList size={18} />
      </button>

      {/* List View */}
      <button
        onClick={() => onChange('list')}
        className={`p-2 rounded-lg font-medium transition-colors ${
          mode === 'list'
            ? 'bg-olive-green text-white'
            : 'bg-morning-mist text-forest-shadow hover:bg-weathered-wood/20'
        }`}
        title="List view - Table format"
        aria-label="List view"
      >
        <Table size={18} />
      </button>
    </div>
  )
}
