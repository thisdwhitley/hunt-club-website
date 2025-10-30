'use client'

// src/components/stands/StandCardV2.tsx
// New stand card using universal base components
// Drop-in replacement for StandCard.tsx

import React from 'react'
import { BaseCard, CardHeader, CardStatsGrid } from '@/components/shared/cards'
import { formatDate } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import { Edit3, Trash2, Users, Eye, MapPin } from 'lucide-react'
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
        icon: Users,
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
        icon: Eye,
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
        icon: Users,
        iconColor: '#566E3D',
        label: 'Capacity',
        value: stand.capacity
      })
    }

    if (stand.view_distance_yards) {
      stats.push({
        icon: Eye,
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
        icon: Eye,
        onClick: () => onClick(stand),
        label: 'View details',
        variant: 'view' as const
      })
    }

    if (onEdit) {
      actions.push({
        icon: Edit3,
        onClick: () => onEdit(stand),
        label: 'Edit stand',
        variant: 'edit' as const
      })
    }

    if (onDelete) {
      actions.push({
        icon: Trash2,
        onClick: () => onDelete(stand),
        label: 'Delete stand',
        variant: 'delete' as const
      })
    }

    return actions
  }

  // For list mode (table row)
  if (mode === 'list') {
    return (
      <BaseCard
        mode="list"
        onClick={onClick ? () => onClick(stand) : undefined}
        clickable={!!onClick}
        className={className}
      >
        {/* Stand name and type */}
        <td className="px-4 py-3">
          <CardHeader
            icon={StandIcon}
            iconColor={standType.iconColor}
            titleColor={standType.titleColor}
            iconSize={20}
            title={stand.name}
            subtitle={standType.label} // Show subtitle in list mode
            badges={getBadges()}
            compact
            showActions={false}
          />
        </td>

        {/* Stats inline */}
        <td className="px-4 py-3">
          <CardStatsGrid stats={getStats()} inline size="sm" />
        </td>

        {/* Location */}
        {showLocation && (
          <td className="px-4 py-3 text-sm text-weathered-wood">
            {stand.latitude && stand.longitude ? (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{stand.latitude.toFixed(4)}, {stand.longitude.toFixed(4)}</span>
              </div>
            ) : (
              <span className="text-gray-400">No coordinates</span>
            )}
          </td>
        )}

        {/* Actions */}
        {showActions && (
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(stand) }}
                  className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Edit stand"
                >
                  <Edit3 size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(stand) }}
                  className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete stand"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </td>
        )}
      </BaseCard>
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
      {/* Header with icon, title, badges, and actions */}
      <CardHeader
        icon={StandIcon}
        iconColor={standType.iconColor}
        titleColor={standType.titleColor}
        iconBgColor={`${standType.iconColor}20`}
        title={stand.name}
        subtitle={mode === 'full' ? undefined : standType.label} // No subtitle in full mode
        badges={getBadges()}
        actions={showActions ? getActions() : []}
        showActions={showActions}
      />

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
              {formatDate(displayLastActivity.date)}
              {displayLastActivity.timeOfDay && (
                <span className="ml-1">({displayLastActivity.timeOfDay})</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location */}
      {showLocation && stand.latitude && stand.longitude && mode === 'full' && (
        <div className="flex justify-center gap-1 text-xs text-dark-teal mt-2">
          <MapPin size={12} />
          <span>
            {stand.latitude.toFixed(4)}, {stand.longitude.toFixed(4)}
          </span>
        </div>
      )}
    </BaseCard>
  )
}
