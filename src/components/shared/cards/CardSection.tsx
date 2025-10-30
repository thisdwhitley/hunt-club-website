'use client'

// src/components/shared/cards/CardSection.tsx
// Generic content section for cards

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CardSectionProps } from './types'

export default function CardSection({
  title,
  titleIcon: TitleIcon,
  children,
  collapsible = false,
  defaultExpanded = true,
  bordered = false,
  background = 'white',
  padding = 'md',
  className = ''
}: CardSectionProps) {

  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const backgroundStyles = {
    white: 'bg-white',
    mist: 'bg-morning-mist',
    green: 'bg-olive-green/5',
    orange: 'bg-burnt-orange/5'
  }

  const paddingStyles = {
    none: '',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  }

  return (
    <div
      className={`rounded-lg ${backgroundStyles[background]} ${
        bordered ? 'border border-weathered-wood/20' : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {/* Title Bar */}
      {title && (
        <div
          className={`flex items-center justify-between mb-2 ${
            collapsible ? 'cursor-pointer' : ''
          }`}
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-forest-shadow">
            {TitleIcon && <TitleIcon size={14} className="text-olive-green" />}
            <span>{title}</span>
          </div>

          {collapsible && (
            <button
              className="p-1 hover:bg-weathered-wood/10 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            >
              {isExpanded ? (
                <ChevronUp size={16} className="text-weathered-wood" />
              ) : (
                <ChevronDown size={16} className="text-weathered-wood" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {(!collapsible || isExpanded) && <div>{children}</div>}
    </div>
  )
}
