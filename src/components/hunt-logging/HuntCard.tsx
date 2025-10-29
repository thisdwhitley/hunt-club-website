// src/components/hunt-logging/HuntCard.tsx
// UPDATED: Now uses contextual temperature display from temperature-utils

'use client'

import React from 'react'
import { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils' // NEW IMPORT
import { getStandIcon } from '@/lib/utils/standUtils'
import { getIcon } from '@/lib/shared/icons'
import { formatDate, formatHuntDate, formatTime, getHuntTypeBadge } from '@/lib/utils/date'
import {
  Calendar,
  MapPin,
  Clock,
  Target,
  Binoculars,
  Trophy,
  Thermometer,
  Wind,
  Moon,
  Eye,
  Edit,
  Trash2,
  User,
  Timer,
  Droplets,
  CloudSun
} from 'lucide-react'

interface HuntCardProps {
  hunt: HuntWithDetails
  mode?: 'compact' | 'full' | 'list'
  onEdit?: (hunt: HuntWithDetails) => void
  onView?: (hunt: HuntWithDetails) => void
  onDelete?: (huntId: string) => void
  isSelected?: boolean
  onSelect?: (huntId: string) => void
  showActions?: boolean
  className?: string
}

const HuntCard: React.FC<HuntCardProps> = ({ 
  hunt, 
  mode = 'full',
  onEdit,
  onView,
  onDelete,
  isSelected = false,
  onSelect,
  showActions = true,
  className = ''
}) => {
  
  const formatTime = (time: string | null) => {
    if (!time) return 'N/A'
    return time.slice(0, 5) // Remove seconds
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    } else {
      return `${mins}m`
    }
  }

  const getMoonPhaseDisplay = (phase: number | null) => {
    if (phase === null) return null
    const phaseNames = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
    const index = Math.round(phase * 8) % 8
    return phaseNames[index]
  }

  // UPDATED: Get contextual temperature
  const tempContext = getTemperatureContext(hunt)

  // Get stand-specific icon
  const StandIcon = getIcon(getStandIcon(hunt.stand?.type) as any)

  // Get hunt type badge
  const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)

  // Compact mode for lists - Option D: Colored MM/DD badge with 2-line layout
  if (mode === 'compact') {
    // Helper to get date parts
    const date = new Date(hunt.hunt_date)
    const monthNumber = String(date.getMonth() + 1).padStart(2, '0')
    const dayNumberPadded = String(date.getDate()).padStart(2, '0')
    const fullDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    const getBadgeColor = () => {
      if (huntTypeBadge.className.includes('bright-orange')) return '#FA7921'
      if (huntTypeBadge.className.includes('clay-earth')) return '#8B7355'
      return '#566E3D'
    }

    // Abbreviate stand name if needed
    const abbreviateStand = (standName: string) => {
      if (standName.length <= 12) return standName
      return standName.substring(0, 10) + '...'
    }

    return (
      <div className={`bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow p-3 ${className}`}>
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(hunt.id)}
              className="rounded border-weathered-wood text-olive-green focus:ring-olive-green"
            />
          )}

          {/* Badge with MM/DD and hunt type color */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: getBadgeColor(),
              color: 'white',
              flexShrink: 0,
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '-0.5px'
            }}
          >
            <span>{monthNumber}/{dayNumberPadded}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Line 1: Hunter - Stand */}
            <h3 className="text-base font-bold text-olive-green truncate">
              {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'} - {abbreviateStand(hunt.stand?.name || 'Unknown')}
            </h3>
            {/* Line 2: AM/PM badge, Day, Month Date, Temp, Sightings, Harvest */}
            <div className="flex items-center gap-2 text-xs text-weathered-wood">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${huntTypeBadge.className}`}>
                {huntTypeBadge.label}
              </span>
              <span className="text-[11px]">{fullDate}</span>
              {tempContext.temperature !== null && (
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-burnt-orange" />
                  <span>{tempContext.temperature}°</span>
                </div>
              )}
              {(hunt.sightings?.length || 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Binoculars className="w-3 h-3 text-dark-teal" />
                  <span>{hunt.sightings?.length}</span>
                </div>
              )}
              {(hunt.had_harvest || hunt.harvest_count > 0) && (
                <Trophy className="w-3 h-3 text-bright-orange" />
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-1">
              {onView && (
                <button
                  onClick={() => onView(hunt)}
                  className="text-dark-teal hover:text-dark-teal/80 p-1 rounded hover:bg-dark-teal/10 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(hunt)}
                  className="text-olive-green hover:text-pine-needle p-1 rounded hover:bg-olive-green/10 transition-colors"
                  title="Edit Hunt"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(hunt.id)}
                  className="text-clay-earth hover:text-clay-earth/80 p-1 rounded hover:bg-clay-earth/10 transition-colors"
                  title="Delete Hunt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // List mode for table-like display
  if (mode === 'list') {
    return (
      <tr className={`hover:bg-morning-mist transition-colors ${isSelected ? 'bg-olive-green/10' : ''} ${(hunt.had_harvest || hunt.harvest_count > 0) ? 'border-l-4 border-bright-orange' : ''} ${className}`}>
        <td className="px-4 py-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(hunt.id)}
              className="rounded border-weathered-wood text-olive-green focus:ring-olive-green"
            />
          )}
        </td>
        <td className="px-4 py-3">
          <div>
            {/* Line 1: Badges + Date + Sightings - all on one line */}
            <div className="flex items-center gap-1.5 text-sm font-medium text-forest-shadow">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${huntTypeBadge.className}`}>
                {huntTypeBadge.label}
              </span>
              {(hunt.had_harvest || hunt.harvest_count > 0) && (
                <Trophy className="w-4 h-4 text-bright-orange flex-shrink-0" />
              )}
              <span className="whitespace-nowrap">{formatHuntDate(hunt.hunt_date)}</span>
              {hunt.sightings && hunt.sightings.length > 0 && (
                <span
                  className="flex items-center gap-1 text-xs text-dark-teal cursor-help"
                  title={hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')}
                >
                  <Binoculars className="w-3 h-3" />
                  {hunt.sightings.length}
                </span>
              )}
            </div>
            {/* Line 2: Time details (only if present) */}
            {(hunt.start_time || hunt.end_time) && (
              <div className="text-xs text-weathered-wood flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(hunt.start_time) || 'N/A'} - {formatTime(hunt.end_time) || 'N/A'}
                {hunt.hunt_duration_minutes && (
                  <span className="ml-1">({formatDuration(hunt.hunt_duration_minutes)})</span>
                )}
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-forest-shadow">
            {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <StandIcon className="w-4 h-4 mr-2 text-weathered-wood" />
            <div>
              <div className="text-sm text-forest-shadow font-medium">
                {hunt.stand?.name || 'Unknown'}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {/* Horizontal compact weather display - all on one line */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {tempContext.temperature !== null && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Thermometer className="w-3 h-3 text-burnt-orange" />
                <span className="font-medium text-forest-shadow">{tempContext.fullDisplay}</span>
              </span>
            )}
            {hunt.windspeed !== null && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Wind className="w-3 h-3 text-dark-teal" />
                <span className="text-forest-shadow">{hunt.windspeed} mph</span>
              </span>
            )}
            {hunt.moonphase !== null && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Moon className="w-3 h-3 text-muted-gold" />
                <span className="text-forest-shadow">{getMoonPhaseDisplay(hunt.moonphase)}</span>
              </span>
            )}
          </div>
        </td>
        {showActions && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-end space-x-1">
              {onView && (
                <button
                  onClick={() => onView(hunt)}
                  className="text-dark-teal hover:text-dark-teal/80 p-1 rounded hover:bg-dark-teal/10 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(hunt)}
                  className="text-olive-green hover:text-pine-needle p-1 rounded hover:bg-olive-green/10 transition-colors"
                  title="Edit Hunt"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(hunt.id)}
                  className="text-clay-earth hover:text-clay-earth/80 p-1 rounded hover:bg-clay-earth/10 transition-colors"
                  title="Delete Hunt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    )
  }

  // Full card mode (default)
  return (
    <div className={`bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow club-shadow ${
      isSelected ? 'ring-2 ring-olive-green bg-olive-green/5' : 'border-weathered-wood/20'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(hunt.id)}
              className="rounded border-weathered-wood text-olive-green focus:ring-olive-green mr-3"
            />
          )}
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-medium text-forest-shadow">
                {hunt.member?.display_name || hunt.member?.full_name || 'Unknown Member'}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${huntTypeBadge.className}`}>
                {huntTypeBadge.label}
              </span>
              {(hunt.had_harvest || hunt.harvest_count > 0) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bright-orange/10 text-bright-orange">
                  <Trophy className="w-3 h-3 mr-1" />
                  Harvest
                </span>
              )}
            </div>
            <p className="text-sm text-weathered-wood">
              {formatHuntDate(hunt.hunt_date)}
            </p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex space-x-1">
            {onView && (
              <button
                onClick={() => onView(hunt)}
                className="text-dark-teal hover:text-dark-teal/80 p-1 rounded hover:bg-dark-teal/10 transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(hunt)}
                className="text-olive-green hover:text-pine-needle p-1 rounded hover:bg-olive-green/10 transition-colors"
                title="Edit Hunt"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(hunt.id)}
                className="text-clay-earth hover:text-clay-earth/80 p-1 rounded hover:bg-clay-earth/10 transition-colors"
                title="Delete Hunt"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hunt Details */}
      <div className="space-y-2">
        {/* Location and Time */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-weathered-wood">
            <StandIcon className="w-4 h-4 mr-2" />
            <span>{hunt.stand?.name || 'Unknown Stand'}</span>
          </div>
          {(hunt.start_time || hunt.end_time) && (
            <div className="flex items-center text-weathered-wood">
              <Clock className="w-4 h-4 mr-2" />
              <span>{formatTime(hunt.start_time) || 'N/A'} - {formatTime(hunt.end_time) || 'N/A'}</span>
              {hunt.hunt_duration_minutes && (
                <span className="ml-2 text-xs flex items-center">
                  <Timer className="w-3 h-3 mr-1" />
                  {formatDuration(hunt.hunt_duration_minutes)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* UPDATED: Weather Info with contextual temperature */}
        {(tempContext.temperature !== null || hunt.windspeed !== null || hunt.humidity !== null || hunt.moonphase !== null) && (
          <div className="bg-morning-mist rounded-lg p-3">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-forest-shadow flex items-center">
                <CloudSun className="w-4 h-4 mr-2" />
                Weather Conditions
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* UPDATED: Show contextual temperature prominently */}
              {tempContext.temperature !== null && (
                <div className="flex items-center font-medium">
                  <Thermometer className="w-3 h-3 mr-1 text-burnt-orange" />
                  <span className="text-burnt-orange">{tempContext.fullDisplay}</span>
                </div>
              )}
              {hunt.windspeed !== null && (
                <div className="flex items-center">
                  <Wind className="w-3 h-3 mr-1 text-dark-teal" />
                  <span className="text-forest-shadow">{hunt.windspeed} mph</span>
                </div>
              )}
              {hunt.humidity !== null && (
                <div className="flex items-center">
                  <Droplets className="w-3 h-3 mr-1 text-dark-teal" />
                  <span className="text-forest-shadow">{hunt.humidity}% humidity</span>
                </div>
              )}
              {hunt.moonphase !== null && (
                <div className="flex items-center">
                  <Moon className="w-3 h-3 mr-1 text-muted-gold" />
                  <span className="text-forest-shadow">{getMoonPhaseDisplay(hunt.moonphase)}</span>
                </div>
              )}
            </div>
            {/* Show temperature range as additional context */}
            {hunt.daily_low !== null && hunt.daily_high !== null && tempContext.context !== 'average' && (
              <div className="text-xs text-weathered-wood mt-2 border-t border-weathered-wood/20 pt-2">
                Daily range: {hunt.daily_low}°F - {hunt.daily_high}°F
              </div>
            )}
          </div>
        )}

        {/* Sightings */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-weathered-wood">
            <Binoculars className="w-4 h-4 mr-2" />
            <span>{hunt.sightings?.length || 0} sightings</span>
          </div>
          {hunt.sightings && hunt.sightings.length > 0 && (
            <div className="text-xs text-weathered-wood">
              {hunt.sightings.slice(0, 3).map(s => s.animal_type).join(', ')}
              {hunt.sightings.length > 3 && ` +${hunt.sightings.length - 3} more`}
            </div>
          )}
        </div>
        
        {/* Notes */}
        {hunt.notes && (
          <div className="text-sm text-weathered-wood italic border-l-2 border-olive-green/20 pl-3">
            "{hunt.notes}"
          </div>
        )}
        
        {/* Season Info */}
        {hunt.hunting_season && (
          <div className="text-xs text-muted-gold font-medium">
            {hunt.hunting_season} Season
          </div>
        )}
      </div>
    </div>
  )
}

export default HuntCard
