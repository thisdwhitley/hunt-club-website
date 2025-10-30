'use client'

// src/components/shared/cards/CardStatsGrid.tsx
// Grid or inline display of statistics

import React from 'react'
import type { CardStatsGridProps } from './types'

export default function CardStatsGrid({
  stats,
  columns = 2,
  inline = false,
  size = 'md',
  className = ''
}: CardStatsGridProps) {

  if (stats.length === 0) return null

  const sizeStyles = {
    sm: { text: 'text-xs', value: 'text-sm', icon: 12 },
    md: { text: 'text-xs', value: 'text-sm', icon: 14 },
    lg: { text: 'text-sm', value: 'text-base', icon: 16 }
  }

  const currentSize = sizeStyles[size]

  // Inline mode (for list/table rows)
  if (inline) {
    return (
      <div className={`flex items-center gap-3 flex-wrap ${className}`}>
        {stats.map((stat, index) => {
          const StatIcon = stat.icon
          return (
            <div
              key={index}
              className={`flex items-center gap-1 ${
                stat.highlighted ? 'font-bold' : ''
              }`}
              title={stat.tooltip}
            >
              {StatIcon && (
                <StatIcon
                  size={currentSize.icon}
                  style={{ color: stat.iconColor || '#566E3D' }}
                />
              )}
              <span className={`${currentSize.value} text-forest-shadow whitespace-nowrap`}>
                {stat.value}{stat.unit && stat.unit}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Grid mode
  return (
    <div
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {stats.map((stat, index) => {
        const StatIcon = stat.icon
        return (
          <div
            key={index}
            className={`flex items-center gap-2 ${
              stat.highlighted ? 'bg-burnt-orange/10 p-2 rounded-md' : ''
            }`}
            title={stat.tooltip}
          >
            {StatIcon && (
              <StatIcon
                size={currentSize.icon}
                style={{ color: stat.iconColor || '#566E3D' }}
                className="flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className={`${currentSize.text} text-forest-shadow`}>
                {stat.label}
              </div>
              <div
                className={`${currentSize.value} font-medium ${
                  stat.highlighted ? 'text-burnt-orange' : 'text-forest-shadow'
                }`}
              >
                {stat.value}{stat.unit && ` ${stat.unit}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
