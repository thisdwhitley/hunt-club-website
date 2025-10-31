// src/components/hunt-logging/HuntCardV2.tsx
// PREVIEW ONLY - Hunt card using universal base components
// This is a demonstration of how Hunt management could use the new card system

'use client'

import React from 'react'
import { BaseCard, CardHeader } from '@/components/shared/cards'
import { formatHuntDate, getHuntTypeBadge } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import { Edit3, Trash2, Eye, Trophy, Binoculars, Thermometer, Wind, Moon, User, Clock } from 'lucide-react'
import { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils'
import { getStandIcon } from '@/lib/utils/standUtils'

interface HuntCardV2Props {
  hunt: HuntWithDetails
  mode?: 'full' | 'compact'
  onClick?: (hunt: HuntWithDetails) => void
  onEdit?: (hunt: HuntWithDetails) => void
  onDelete?: (huntId: string) => void
  showActions?: boolean
  className?: string
}

export default function HuntCardV2({
  hunt,
  mode = 'full',
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}: HuntCardV2Props) {

  const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)
  const tempContext = getTemperatureContext(hunt)
  const StandIcon = getIcon(getStandIcon(hunt.stand?.type) as IconName)

  // Format time helper
  const formatTime = (time: string | null) => {
    if (!time) return 'N/A'
    return time.slice(0, 5)
  }

  // Get badges
  const getBadges = () => {
    const badges = []

    // Hunt type badge (AM/PM/All Day)
    badges.push({
      label: huntTypeBadge.label,
      className: huntTypeBadge.className
    })

    // Harvest badge
    if (hunt.had_harvest || hunt.harvest_count > 0) {
      badges.push({
        label: `${hunt.harvest_count} Harvest${hunt.harvest_count > 1 ? 's' : ''}`,
        icon: Trophy,
        className: 'bg-bright-orange/10 text-bright-orange border border-bright-orange/30'
      })
    }

    // Sightings badge
    if (hunt.sightings && hunt.sightings.length > 0) {
      badges.push({
        label: `${hunt.sightings.length} Sighting${hunt.sightings.length > 1 ? 's' : ''}`,
        icon: Binoculars,
        className: 'bg-dark-teal/10 text-dark-teal border border-dark-teal/30'
      })
    }

    return badges
  }

  // Get actions
  const getActions = () => {
    const actions = []

    if (onClick) {
      actions.push({
        icon: Eye,
        onClick: () => onClick(hunt),
        label: 'View details',
        variant: 'view' as const
      })
    }

    if (onEdit) {
      actions.push({
        icon: Edit3,
        onClick: () => onEdit(hunt),
        label: 'Edit hunt',
        variant: 'edit' as const
      })
    }

    if (onDelete) {
      actions.push({
        icon: Trash2,
        onClick: () => onDelete(hunt.id),
        label: 'Delete hunt',
        variant: 'delete' as const
      })
    }

    return actions
  }

  return (
    <BaseCard
      mode={mode}
      onClick={onClick ? () => onClick(hunt) : undefined}
      clickable={!!onClick}
      className={`${(hunt.had_harvest || hunt.harvest_count > 0) ? 'border-l-4 border-bright-orange' : ''} ${className}`}
    >
      {/* Header */}
      <CardHeader
        icon={User}
        iconColor="#566E3D"
        title={hunt.member?.display_name || hunt.member?.full_name || 'Unknown Hunter'}
        subtitle={formatHuntDate(hunt.hunt_date)}
        badges={getBadges()}
        actions={showActions ? getActions() : []}
        showActions={showActions}
      />

      {/* Stand Information */}
      {hunt.stand && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <StandIcon size={16} className="text-weathered-wood" />
          <span className="text-forest-shadow font-medium">{hunt.stand.name}</span>
          <span className="text-weathered-wood text-xs">
            ({hunt.stand.type.replace('_', ' ')})
          </span>
        </div>
      )}

      {/* Time Information */}
      {(hunt.start_time || hunt.end_time || hunt.hunt_duration_minutes) && (
        <div className="mb-3 p-2 rounded-md border border-dark-teal/20 bg-dark-teal/5">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-forest-shadow">
              <Clock size={12} className="text-dark-teal" />
              <span><strong>Start:</strong> {formatTime(hunt.start_time)}</span>
            </div>
            <div className="flex items-center gap-1 text-forest-shadow">
              <Clock size={12} className="text-dark-teal" />
              <span><strong>End:</strong> {formatTime(hunt.end_time)}</span>
            </div>
            {hunt.hunt_duration_minutes && (
              <div className="text-forest-shadow">
                <strong>Duration:</strong> {Math.floor(hunt.hunt_duration_minutes / 60)}h {hunt.hunt_duration_minutes % 60}m
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weather Information */}
      <div className="mb-3 p-2 rounded-md border border-weathered-wood/20 bg-morning-mist">
        <div className="flex items-center gap-1 mb-2 text-xs font-medium text-forest-shadow">
          {React.createElement(getIcon('sun'), { size: 12 })}
          <span>WEATHER</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Temperature */}
          {tempContext.temperature !== null && (
            <div className="flex items-center gap-1 text-forest-shadow">
              <Thermometer size={12} className="text-burnt-orange" />
              <span>{tempContext.temperature}°</span>
            </div>
          )}

          {/* Wind */}
          {hunt.wind_speed && (
            <div className="flex items-center gap-1 text-forest-shadow">
              <Wind size={12} className="text-dark-teal" />
              <span>{hunt.wind_speed} mph</span>
            </div>
          )}

          {/* Moon Phase */}
          {hunt.moon_phase !== null && (
            <div className="flex items-center gap-1 text-forest-shadow">
              <Moon size={12} className="text-muted-gold" />
              <span>{Math.round(hunt.moon_phase * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {hunt.notes && (
        <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="line-clamp-2">{hunt.notes}</p>
        </div>
      )}
    </BaseCard>
  )
}
