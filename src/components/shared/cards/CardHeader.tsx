'use client'

// src/components/shared/cards/CardHeader.tsx
// Card header with icon, title, badges, and actions

import React from 'react'
import type { CardHeaderProps } from './types'

export default function CardHeader({
  icon: Icon,
  iconColor = '#566E3D',
  iconBgColor,
  iconSize = 24,
  title,
  titleColor, // Optional separate title color
  subtitle,
  badges = [],
  actions = [],
  compact = false,
  showActions = true,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: CardHeaderProps) {

  const bgColor = iconBgColor || `${iconColor}20`
  const displayTitleColor = titleColor || iconColor // Use titleColor if provided, otherwise default to iconColor

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox (if enabled) */}
        {showCheckbox && onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-weathered-wood text-olive-green focus:ring-olive-green flex-shrink-0"
          />
        )}

        {/* Icon */}
        {Icon && (
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            <Icon size={iconSize} style={{ color: iconColor }} />
          </div>
        )}

        {/* Title, Subtitle, and Badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-bold text-forest-shadow truncate ${
                compact ? 'text-base' : 'text-lg'
              }`}
              style={{ color: displayTitleColor || '#566E3D' }}
            >
              {title}
            </h3>

            {/* Badges */}
            {badges.map((badge, index) => {
              const BadgeIcon = badge.icon
              return (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                    badge.className || 'bg-olive-green/10 text-olive-green'
                  }`}
                  style={badge.color ? {
                    backgroundColor: `${badge.color}20`,
                    color: badge.color,
                    border: `1px solid ${badge.color}40`
                  } : undefined}
                >
                  {BadgeIcon && <BadgeIcon size={12} className="mr-1" />}
                  {badge.label}
                </span>
              )
            })}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className={`text-weathered-wood mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && actions.length > 0 && (
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {actions.map((action, index) => {
            const ActionIcon = action.icon
            const variantStyles = {
              view: 'text-dark-teal hover:text-dark-teal/80 hover:bg-dark-teal/10',
              edit: 'text-olive-green hover:text-pine-needle hover:bg-olive-green/10',
              delete: 'text-clay-earth hover:text-clay-earth/80 hover:bg-clay-earth/10',
              navigate: 'text-gray-600 hover:text-dark-teal hover:bg-dark-teal/10'
            }

            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(e)
                }}
                className={`p-2 rounded-md transition-colors ${
                  variantStyles[action.variant || 'edit']
                } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
              >
                <ActionIcon size={16} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
