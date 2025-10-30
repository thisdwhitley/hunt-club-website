'use client'

// src/components/stands/StandCardV2.tsx
// New stand card using universal base components
// Drop-in replacement for StandCard.tsx

import React from 'react'
import { BaseCard, CardHeader, CardStatsGrid, CardSection } from '@/components/shared/cards'
import { formatDate } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import { Edit3, Trash2, Users, Eye, MapPin } from 'lucide-react'
import type { Stand } from '@/lib/database/stands'

// Stand type mappings - using green (olive-green) as primary color
const STAND_TYPES = {
  ladder_stand: { label: 'Ladder Stand', iconName: 'ladderStand' as IconName, color: '#566E3D' },
  bale_blind: { label: 'Bale Blind', iconName: 'baleBlind' as IconName, color: '#566E3D' },
  box_stand: { label: 'Box Stand', iconName: 'boxStand' as IconName, color: '#566E3D' },
  tripod: { label: 'Tripod', iconName: 'tripodStand' as IconName, color: '#566E3D' },
  ground_blind: { label: 'Ground Blind', iconName: 'groundBlind' as IconName, color: '#566E3D' }
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
  className = ''
}: StandCardV2Props) {

  const standType = STAND_TYPES[stand.type] || STAND_TYPES.ladder_stand
  const StandIcon = getIcon(standType.iconName)

  // Get badges for time of day, harvests, etc.
  const getBadges = () => {
    const badges = []

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

  // Get features for the thin-bordered box (time of day, water, food, archery)
  const getFeatures = () => {
    const features = []

    // Time of day
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

    // Water source
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

    // Food source
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

    // Archery season
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

  // Get actions
  const getActions = () => {
    const actions = []

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
            iconColor={standType.color}
            iconSize={20}
            title={stand.name}
            subtitle={standType.label}
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
        iconColor={standType.color}
        iconBgColor={`${standType.color}20`}
        title={stand.name}
        subtitle={standType.label}
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

      {/* Features Section (thin teal border box) */}
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

      {/* Stats Grid */}
      {showStats && getStats().length > 0 && (
        <div className="mb-3">
          <CardStatsGrid stats={getStats()} columns={2} size="md" />
        </div>
      )}

      {/* History Section */}
      {mode === 'full' && showStats && (
        <CardSection
          title="History"
          titleIcon={getIcon('target')}
          background="mist"
          bordered
          padding="md"
        >
          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
            <div>
              <div className="text-lg font-bold text-burnt-orange">
                {stand.total_harvests || 0}
              </div>
              <div className="text-forest-shadow">Total Harvests</div>
            </div>

            <div>
              <div className="text-lg font-bold text-muted-gold">
                {stand.season_hunts || 0}
              </div>
              <div className="text-forest-shadow">[2025] Hunts</div>
            </div>

            <div>
              <div className="text-lg font-bold text-olive-green">
                {stand.total_hunts || 0}
              </div>
              <div className="text-forest-shadow">All-Time Hunts</div>
            </div>
          </div>

          {stand.last_used_date && (
            <div className="bg-olive-green text-white px-3 py-2 rounded-md text-xs text-center">
              <strong>Last Hunted:</strong> {formatDate(stand.last_used_date)}
            </div>
          )}
        </CardSection>
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
