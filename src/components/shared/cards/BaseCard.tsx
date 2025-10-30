'use client'

// src/components/shared/cards/BaseCard.tsx
// Base card wrapper component supporting full, compact, and list modes

import React from 'react'
import type { BaseCardProps } from './types'

export default function BaseCard({
  mode = 'full',
  onClick,
  clickable = false,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  className = '',
  highlighted = false,
  highlightColor,
  children,
  ariaLabel,
  role
}: BaseCardProps) {

  // Determine if card should be clickable
  const isClickable = clickable || !!onClick

  // Get mode-specific styles
  const getModeStyles = () => {
    const baseStyles = 'transition-all duration-200'

    switch (mode) {
      case 'full':
        return `${baseStyles} bg-white rounded-lg border-2 border-gray-200 p-4 hover:shadow-lg club-shadow ${
          isClickable ? 'cursor-pointer hover:border-gray-300' : ''
        }`

      case 'compact':
        return `${baseStyles} bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md shadow-sm ${
          isClickable ? 'cursor-pointer' : ''
        }`

      case 'list':
        return `${baseStyles} hover:bg-morning-mist ${
          isSelected ? 'bg-olive-green/10' : ''
        } ${isClickable ? 'cursor-pointer' : ''}`

      default:
        return baseStyles
    }
  }

  // Get highlight styles if highlighted
  const getHighlightStyles = () => {
    if (!highlighted) return ''

    if (highlightColor) {
      return `border-l-4`
    }
    return 'border-l-4 border-burnt-orange'
  }

  // Handle card click
  const handleClick = () => {
    if (onClick && !showCheckbox) {
      onClick()
    }
  }

  // For list mode, render as table row
  if (mode === 'list') {
    return (
      <tr
        className={`${getModeStyles()} ${getHighlightStyles()} ${className}`}
        onClick={handleClick}
        role={role}
        aria-label={ariaLabel}
        style={highlighted && highlightColor ? { borderLeftColor: highlightColor } : undefined}
      >
        {showCheckbox && onSelect && (
          <td className="px-4 py-3 w-12">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect()}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-weathered-wood text-olive-green focus:ring-olive-green"
              aria-label={`Select ${ariaLabel || 'item'}`}
            />
          </td>
        )}
        {children}
      </tr>
    )
  }

  // For full and compact modes, render as div
  return (
    <div
      className={`${getModeStyles()} ${getHighlightStyles()} ${
        isSelected ? 'ring-2 ring-olive-green bg-olive-green/5' : ''
      } ${className} relative`}
      onClick={handleClick}
      role={role}
      aria-label={ariaLabel}
      style={highlighted && highlightColor ? { borderLeftColor: highlightColor } : undefined}
    >
      {showCheckbox && onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-weathered-wood text-olive-green focus:ring-olive-green w-5 h-5"
            aria-label={`Select ${ariaLabel || 'item'}`}
          />
        </div>
      )}
      {children}
    </div>
  )
}
