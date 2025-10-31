'use client'

// src/components/stands/StandCardV2.tsx
// New stand card using universal base components
// Drop-in replacement for StandCard.tsx

import React from 'react'
import { BaseCard, CardHeader, CardStatsGrid } from '@/components/shared/cards'
import { formatDate, getHuntTypeBadge, parseDBDate } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import type { Stand } from '@/lib/database/stands'

// Stand type mappings - orange icons, green titles
const STAND_TYPES = {
  ladder_stand: { label: 'Ladder Stand', iconName: 'ladderStand' as IconName, iconColor: '#FA7921', titleColor: '#566E3D' },
  bale_blind: { label: 'Bale Blind', iconName: 'baleBlind' as IconName, iconColor: '#FA7921', titleColor: '#566E3D' },
  box_stand: { label: 'Box Stand', iconName: 'boxStand' as IconName, iconColor: '#FA7921', titleColor: '#566E3D' },
  tripod: { label: 'Tripod', iconName: 'tripodStand' as IconName, iconColor: '#FA7921', titleColor: '#566E3D' },
  ground_blind: { label: 'Ground Blind', iconName: 'groundBlind' as IconName, iconColor: '#FA7921', titleColor: '#566E3D' }
}

// Flexible history stat for different card types
interface HistoryStat {
  label: string
  value: number | string
  color: string // Tailwind color class like 'text-burnt-orange'
}

// Last activity info (flexible for different contexts)
interface LastActivityInfo {
  date: string
  timeOfDay?: string // e.g., "AM", "PM"
  label?: string // e.g., "Last Hunted", "Last Upload"
}

interface StandCardV2Props {
  stand: Stand
  mode?: 'full' | 'compact' | 'list'
  onClick?: (stand: Stand) => void
  onEdit?: (stand: Stand) => void
  onDelete?: (stand: Stand) => void
  onNavigate?: (stand: Stand) => void
  showLocation?: boolean
  showStats?: boolean
  showActions?: boolean
  className?: string
  // Optional: Override default history stats (for flexibility with cameras, etc.)
  historyStats?: HistoryStat[]
  lastActivity?: LastActivityInfo
}

export default function StandCardV2({
  stand,
  mode = 'full',
  onClick,
  onEdit,
  onDelete,
  showLocation = true,
  showStats = true,
  showActions = true,
  className = '',
  historyStats,
  lastActivity
}: StandCardV2Props) {

  const standType = STAND_TYPES[stand.type] || STAND_TYPES.ladder_stand
  const StandIcon = getIcon(standType.iconName)

  // Helper to check if date is from prior season/year
  const isPriorSeason = (dateString: string): boolean => {
    const huntDate = parseDBDate(dateString)
    const currentYear = new Date().getFullYear()
    return huntDate.getFullYear() < currentYear
  }

  // Get current season year dynamically
  const currentYear = new Date().getFullYear()

  // Default history stats for Stands (can be overridden via props)
  // TODO: These should be calculated from actual hunt_logs table data, not stand aggregates
  const defaultHistoryStats: HistoryStat[] = [
    {
      label: 'Total Harvests',
      value: stand.total_harvests || 0,
      color: 'text-burnt-orange'
    },
    {
      label: `${currentYear} Hunts`,
      value: stand.season_hunts || 0,
      color: 'text-muted-gold'
    },
    {
      label: 'All-Time Hunts',
      value: stand.total_hunts || 0,
      color: 'text-olive-green'
    }
  ]

  // Use provided stats or defaults
  const displayHistoryStats = historyStats || defaultHistoryStats

  // Default last activity for Stands
  // TODO: Should fetch most recent hunt_log entry for this stand_id
  const defaultLastActivity: LastActivityInfo | undefined = stand.last_used_date
    ? {
        date: stand.last_used_date,
        timeOfDay: undefined, // TODO: Get from most recent hunt_log
        label: 'Last Hunted'
      }
    : undefined

  const displayLastActivity = lastActivity || defaultLastActivity

  // Get badges for compact/list modes (NO badges in full mode)
  const getBadges = () => {
    const badges = []

    // Only show badges in compact/list modes, NOT in full mode
    if (mode === 'full') {
      return []
    }

    if (stand.time_of_day) {
      badges.push({
        label: stand.time_of_day,
        className: 'bg-bright-orange text-white'
      })
    }

    if (stand.total_harvests && stand.total_harvests > 0) {
      badges.push({
        label: `${stand.total_harvests} Harvests`,
        icon: getIcon('target'),
        className: 'bg-olive-green/10 text-olive-green'
      })
    }

    return badges
  }

  // Get features for the thin-bordered box (ALL stand details combined)
  // Order: Seats and Walk first, Camera last
  const getFeatures = () => {
    const features = []

    // ROW 1: Capacity (always show if present)
    if (stand.capacity) {
      features.push({
        key: 'capacity',
        icon: getIcon('users'),
        iconColor: '#566E3D',
        label: 'Seats:',
        value: stand.capacity
      })
    }

    // ROW 1: Walking time (ALWAYS show, even if unknown - per user request)
    const WalkingIcon = getIcon('walking')
    features.push({
      key: 'walk',
      icon: WalkingIcon,
      iconColor: '#566E3D',
      label: 'Walk:',
      value: stand.walking_time_minutes ? `${stand.walking_time_minutes} min` : '[unknown]'
    })

    // ROW 2: Height
    if (stand.height_feet) {
      const HeightIcon = getIcon('height')
      features.push({
        key: 'height',
        icon: HeightIcon,
        iconColor: '#566E3D',
        label: 'Height:',
        value: `${stand.height_feet} ft`
      })
    }

    // ROW 2: View distance
    if (stand.view_distance_yards) {
      features.push({
        key: 'view',
        icon: getIcon('eye'),
        iconColor: '#0C4767',
        label: 'View:',
        value: `${stand.view_distance_yards} yards`
      })
    }

    // ROW 3: Time of day
    if (stand.time_of_day) {
      const timeLabels = { AM: 'Morning', PM: 'Evening', ALL: 'All Day' }
      const timeIcons = { AM: 'sun', PM: 'moon', ALL: 'clock' }
      const timeColors = { AM: '#FE9920', PM: '#B9A44C', ALL: '#566E3D' }

      const TimeIcon = getIcon(timeIcons[stand.time_of_day] as IconName)
      features.push({
        key: 'time',
        icon: TimeIcon,
        iconColor: timeColors[stand.time_of_day],
        label: 'Ideal time:',
        value: timeLabels[stand.time_of_day]
      })
    }

    // ROW 3: Water source
    if (stand.nearby_water_source) {
      const WaterIcon = getIcon('water')
      features.push({
        key: 'water',
        icon: WaterIcon,
        iconColor: '#0C4767',
        label: 'Near water source',
        value: null
      })
    }

    // ROW 4: Food source
    if (stand.food_source) {
      const foodLabels = { field: 'Field', feeder: 'Feeder' }
      const foodIcons = { field: 'field', feeder: 'feeder' }
      const FoodIcon = getIcon(foodIcons[stand.food_source] as IconName)

      features.push({
        key: 'food',
        icon: FoodIcon,
        iconColor: '#B9A44C',
        label: 'Food source:',
        value: foodLabels[stand.food_source]
      })
    }

    // ROW 4: Archery season
    if (stand.archery_season) {
      const ArcheryIcon = getIcon('archery')
      features.push({
        key: 'archery',
        icon: ArcheryIcon,
        iconColor: '#FA7921',
        label: 'Good for archery season',
        value: null
      })
    }

    // LAST ROW: Trail camera (always last)
    if (stand.trail_camera_name) {
      const CameraIcon = getIcon('camera')
      features.push({
        key: 'camera',
        icon: CameraIcon,
        iconColor: '#566E3D',
        label: 'Camera:',
        value: stand.trail_camera_name
      })
    }

    return features
  }

  // Get stats for the grid
  const getStats = () => {
    const stats = []

    if (stand.capacity) {
      stats.push({
        icon: getIcon('users'),
        iconColor: '#566E3D',
        label: 'Capacity',
        value: stand.capacity
      })
    }

    if (stand.view_distance_yards) {
      stats.push({
        icon: getIcon('eye'),
        iconColor: '#0C4767',
        label: 'View',
        value: stand.view_distance_yards,
        unit: ' yards'
      })
    }

    if (stand.walking_time_minutes) {
      const WalkingIcon = getIcon('walking')
      stats.push({
        icon: WalkingIcon,
        iconColor: '#566E3D',
        label: 'Walk',
        value: stand.walking_time_minutes,
        unit: ' min'
      })
    }

    if (stand.height_feet) {
      const HeightIcon = getIcon('height')
      stats.push({
        icon: HeightIcon,
        iconColor: '#566E3D',
        label: 'Height',
        value: stand.height_feet,
        unit: ' ft'
      })
    }

    return stats
  }

  // Get actions with proper hunt-style colors
  const getActions = () => {
    const actions = []

    // View action (if onClick is provided)
    if (onClick) {
      actions.push({
        icon: getIcon('eye'),
        onClick: () => onClick(stand),
        label: 'View details',
        variant: 'view' as const
      })
    }

    if (onEdit) {
      actions.push({
        icon: getIcon('edit'),
        onClick: () => onEdit(stand),
        label: 'Edit stand',
        variant: 'edit' as const
      })
    }

    if (onDelete) {
      actions.push({
        icon: getIcon('delete'),
        onClick: () => onDelete(stand),
        label: 'Delete stand',
        variant: 'delete' as const
      })
    }

    return actions
  }

  // For list mode (table row) - matches Hunt log table structure
  if (mode === 'list') {
    return (
      <tr className={`hover:bg-morning-mist transition-colors ${className}`}>
        {/* Name column - Icon + Stand name */}
        <td className="px-4 py-3">
          <div className="flex items-center">
            <div
              className="p-1 rounded flex-shrink-0 mr-2"
              style={{ backgroundColor: `${standType.iconColor}20` }}
            >
              <StandIcon size={16} style={{ color: standType.iconColor }} />
            </div>
            <div>
              <div className="text-sm text-forest-shadow font-medium">
                {stand.name}
              </div>
            </div>
          </div>
        </td>

        {/* Details column - Compact horizontal feature icons */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Capacity */}
            {stand.capacity && (
              <span className="flex items-center gap-1 whitespace-nowrap text-forest-shadow">
                {React.createElement(getIcon('users'), { size: 12, className: 'text-olive-green' })}
                {stand.capacity}
              </span>
            )}

            {/* Walking Time */}
            {stand.walking_time_minutes && (
              <span className="flex items-center gap-1 whitespace-nowrap text-forest-shadow">
                {React.createElement(getIcon('walking'), { size: 12, className: 'text-olive-green' })}
                {stand.walking_time_minutes}m
              </span>
            )}

            {/* View Distance */}
            {stand.view_distance_yards && (
              <span className="flex items-center gap-1 whitespace-nowrap text-forest-shadow">
                {React.createElement(getIcon('eye'), { size: 12, className: 'text-dark-teal' })}
                {stand.view_distance_yards}y
              </span>
            )}

            {/* Time of Day */}
            {stand.time_of_day && (
              <span className="flex items-center gap-1" title={`Best time: ${stand.time_of_day === 'AM' ? 'Morning' : stand.time_of_day === 'PM' ? 'Evening' : 'All Day'}`}>
                {React.createElement(getIcon(
                  stand.time_of_day === 'AM' ? 'sun' : stand.time_of_day === 'PM' ? 'moon' : 'clock'
                ), {
                  size: 12,
                  className: stand.time_of_day === 'AM' ? 'text-bright-orange' : stand.time_of_day === 'PM' ? 'text-muted-gold' : 'text-olive-green'
                })}
              </span>
            )}

            {/* Water Source */}
            {stand.nearby_water_source && (
              <span title="Near water">
                {React.createElement(getIcon('water'), { size: 12, className: 'text-dark-teal' })}
              </span>
            )}

            {/* Food Source */}
            {stand.food_source && (
              <span title={`Food: ${stand.food_source === 'field' ? 'Field' : 'Feeder'}`}>
                {React.createElement(getIcon(stand.food_source === 'field' ? 'field' : 'feeder'), {
                  size: 12,
                  className: 'text-muted-gold'
                })}
              </span>
            )}

            {/* Archery Season */}
            {stand.archery_season && (
              <span title="Good for archery">
                {React.createElement(getIcon('archery'), { size: 12, className: 'text-burnt-orange' })}
              </span>
            )}
          </div>
        </td>

        {/* Last Hunted column */}
        <td className="px-4 py-3 text-sm text-forest-shadow">
          {displayLastActivity ? (
            isPriorSeason(displayLastActivity.date) ? (
              <div className="flex items-center gap-1.5">
                <span className="text-weathered-wood italic">Prior season</span>
                <span className="text-xs text-weathered-wood/70">({formatDate(displayLastActivity.date)})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">{formatDate(displayLastActivity.date)}</span>
                {displayLastActivity.timeOfDay && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${getHuntTypeBadge(displayLastActivity.timeOfDay).className}`}>
                    {getHuntTypeBadge(displayLastActivity.timeOfDay).label}
                  </span>
                )}
              </div>
            )
          ) : stand.last_used_date ? (
            isPriorSeason(stand.last_used_date) ? (
              <div className="flex items-center gap-1.5">
                <span className="text-weathered-wood italic">Prior season</span>
                <span className="text-xs text-weathered-wood/70">({formatDate(stand.last_used_date)})</span>
              </div>
            ) : (
              <div className="whitespace-nowrap">{formatDate(stand.last_used_date)}</div>
            )
          ) : (
            <span className="text-gray-400">Never</span>
          )}
        </td>

        {/* Location column */}
        <td className="px-4 py-3 text-sm text-weathered-wood">
          {stand.latitude && stand.longitude ? (
            <div className="flex items-center gap-1 whitespace-nowrap">
              {React.createElement(getIcon('mapPin'), { size: 12 })}
              <span>{stand.latitude.toFixed(4)}, {stand.longitude.toFixed(4)}</span>
            </div>
          ) : (
            <span className="text-gray-400">No coordinates</span>
          )}
        </td>

        {/* Actions column - matching Hunt table */}
        {showActions && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-end space-x-1">
              {onClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClick(stand) }}
                  className="text-dark-teal hover:text-dark-teal/80 p-1 rounded hover:bg-dark-teal/10 transition-colors"
                  title="View Details"
                >
                  {React.createElement(getIcon('eye'), { size: 16 })}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(stand) }}
                  className="text-olive-green hover:text-pine-needle p-1 rounded hover:bg-olive-green/10 transition-colors"
                  title="Edit Stand"
                >
                  {React.createElement(getIcon('edit'), { size: 16 })}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(stand) }}
                  className="text-clay-earth hover:text-clay-earth/80 p-1 rounded hover:bg-clay-earth/10 transition-colors"
                  title="Delete Stand"
                >
                  {React.createElement(getIcon('delete'), { size: 16 })}
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    )
  }

  // For full and compact modes (card view)
  return (
    <BaseCard
      mode={mode}
      onClick={onClick ? () => onClick(stand) : undefined}
      clickable={!!onClick}
      className={className}
    >
      {/* Compact Mode - Simple title + feature icons */}
      {mode === 'compact' && (
        <div className="flex items-start gap-3">
          {/* Stand Icon */}
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${standType.iconColor}20` }}
          >
            <StandIcon size={24} style={{ color: standType.iconColor }} />
          </div>

          {/* Title and Feature Icons */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-base truncate mb-1"
              style={{ color: standType.titleColor }}
            >
              {stand.name}
            </h3>

            {/* Feature Icons Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {stand.time_of_day && (
                <div title={`Best time: ${stand.time_of_day === 'AM' ? 'Morning' : stand.time_of_day === 'PM' ? 'Evening' : 'All Day'}`}>
                  {React.createElement(getIcon(
                    stand.time_of_day === 'AM' ? 'sun' : stand.time_of_day === 'PM' ? 'moon' : 'clock'
                  ), {
                    size: 14,
                    style: { color: stand.time_of_day === 'AM' ? '#FE9920' : stand.time_of_day === 'PM' ? '#B9A44C' : '#566E3D' }
                  })}
                </div>
              )}

              {stand.nearby_water_source && (
                <div title="Near water source">
                  {React.createElement(getIcon('water'), { size: 14, style: { color: '#0C4767' } })}
                </div>
              )}

              {stand.food_source && (
                <div title={`Food source: ${stand.food_source === 'field' ? 'Field' : 'Feeder'}`}>
                  {React.createElement(getIcon(stand.food_source === 'field' ? 'field' : 'feeder'), {
                    size: 14,
                    style: { color: '#B9A44C' }
                  })}
                </div>
              )}

              {stand.archery_season && (
                <div title="Good for archery season">
                  {React.createElement(getIcon('archery'), { size: 14, style: { color: '#FA7921' } })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Mode - Complete header with badges and actions */}
      {mode === 'full' && (
        <CardHeader
          icon={StandIcon}
          iconColor={standType.iconColor}
          titleColor={standType.titleColor}
          iconBgColor={`${standType.iconColor}20`}
          title={stand.name}
          subtitle={undefined} // No subtitle in full mode
          badges={getBadges()}
          actions={showActions ? getActions() : []}
          showActions={showActions}
        />
      )}

      {/* Description */}
      {stand.description && mode === 'full' && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {stand.description}
        </p>
      )}

      {/* Features Section (thin teal border box) - ALL details in one place */}
      {mode === 'full' && getFeatures().length > 0 && (
        <div
          className="mb-3 p-2 rounded-md border"
          style={{ borderColor: '#0C4767', borderWidth: '1px' }}
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            {getFeatures().map((feature) => {
              const FeatureIcon = feature.icon
              return (
                <div key={feature.key} className="flex items-center gap-2">
                  <FeatureIcon size={14} style={{ color: feature.iconColor }} />
                  <span className="text-forest-shadow">
                    <strong>{feature.label}</strong> {feature.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History Section - Flexible for different card types */}
      {mode === 'full' && showStats && displayHistoryStats.length > 0 && (
        <div className="bg-morning-mist border border-weathered-wood/20 rounded-md p-2 mb-1">
          <div className="flex items-center gap-1 mb-2 text-xs font-medium text-forest-shadow">
            {React.createElement(getIcon('target'), { size: 12 })}
            <span>HISTORY</span>
          </div>

          <div className="grid gap-2 text-center text-xs" style={{ gridTemplateColumns: `repeat(${displayHistoryStats.length}, minmax(0, 1fr))` }}>
            {displayHistoryStats.map((stat, index) => (
              <div key={index}>
                <div className={`text-base font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-weathered-wood text-[10px]">{stat.label}</div>
              </div>
            ))}
          </div>

          {displayLastActivity && (
            <div className="text-xs text-weathered-wood mt-2 pt-2 border-t border-weathered-wood/20 text-center">
              <strong className="text-forest-shadow">{displayLastActivity.label || 'Last Activity'}:</strong>{' '}
              {isPriorSeason(displayLastActivity.date) ? (
                <>
                  <span className="italic">Prior season</span>
                  <span className="text-weathered-wood/70"> ({formatDate(displayLastActivity.date)})</span>
                </>
              ) : (
                <>
                  {formatDate(displayLastActivity.date)}
                  {displayLastActivity.timeOfDay && (
                    <span> - {displayLastActivity.timeOfDay}</span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location */}
      {showLocation && stand.latitude && stand.longitude && mode === 'full' && (
        <div className="flex justify-center gap-1 text-xs text-dark-teal mt-2">
          {React.createElement(getIcon('mapPin'), { size: 12 })}
          <span>
            {stand.latitude.toFixed(4)}, {stand.longitude.toFixed(4)}
          </span>
        </div>
      )}
    </BaseCard>
  )
}
