// src/components/hunt-logging/HuntCard.tsx
// UPDATED: Now uses contextual temperature display from temperature-utils

'use client'

import React from 'react'
import { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext, getWeatherQuality } from '@/lib/hunt-logging/temperature-utils' // NEW IMPORT
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

  // UPDATED: Get contextual temperature and weather quality
  const tempContext = getTemperatureContext(hunt)
  const weatherQuality = getWeatherQuality(hunt)

  const weatherColors = {
    excellent: 'text-bright-orange',
    good: 'text-olive-green',
    fair: 'text-muted-gold',
    poor: 'text-clay-earth'
  }

  // Compact mode for lists
  if (mode === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 bg-white border border-weathered-wood/20 rounded-lg hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center space-x-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(hunt.id)}
              className="rounded border-weathered-wood text-olive-green focus:ring-olive-green"
            />
          )}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-weathered-wood" />
            <span className="font-medium text-forest-shadow">
              {new Date(hunt.hunt_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-weathered-wood" />
            <span className="text-sm text-forest-shadow">
              {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-weathered-wood" />
            <span className="text-sm text-forest-shadow">
              {hunt.stand?.name || 'Unknown Stand'}
            </span>
          </div>
          {/* UPDATED: Show contextual temperature */}
          {tempContext.temperature !== null && (
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-burnt-orange" />
              <span className="text-sm text-forest-shadow font-medium">
                {tempContext.fullDisplay}
              </span>
            </div>
          )}
          {(hunt.had_harvest || hunt.harvest_count > 0) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bright-orange/10 text-bright-orange">
              <Trophy className="w-3 h-3 mr-1" />
              {hunt.harvest_count}
            </span>
          )}
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
    )
  }

  // List mode for table-like display
  if (mode === 'list') {
    return (
      <tr className={`hover:bg-morning-mist transition-colors ${isSelected ? 'bg-olive-green/10' : ''} ${className}`}>
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
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-weathered-wood" />
            <div>
              <div className="text-sm font-medium text-forest-shadow">
                {new Date(hunt.hunt_date).toLocaleDateString()}
              </div>
              {hunt.hunt_type && (
                <div className="text-xs text-weathered-wood">{hunt.hunt_type}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-forest-shadow">
            {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
          </div>
          {hunt.member?.email && (
            <div className="text-xs text-weathered-wood">{hunt.member.email}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-weathered-wood" />
            <div>
              <div className="text-sm text-forest-shadow font-medium">
                {hunt.stand?.name || 'Unknown'}
              </div>
              {hunt.stand?.type && (
                <div className="text-xs text-weathered-wood">{hunt.stand.type}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-weathered-wood" />
            <div className="text-sm text-forest-shadow">
              <div>{formatTime(hunt.start_time)} - {formatTime(hunt.end_time)}</div>
              {hunt.hunt_duration_minutes && (
                <div className="text-xs text-weathered-wood flex items-center">
                  <Timer className="w-3 h-3 mr-1" />
                  {formatDuration(hunt.hunt_duration_minutes)}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {(hunt.had_harvest || hunt.harvest_count > 0) ? (
            <div className="flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-bright-orange" />
              <div>
                <div className="text-sm text-bright-orange font-medium">
                  {hunt.harvest_count} {hunt.game_type || 'harvest'}
                </div>
                {hunt.harvests?.[0]?.estimated_weight && (
                  <div className="text-xs text-weathered-wood">
                    ~{hunt.harvests[0].estimated_weight} lbs
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center text-weathered-wood">
              <Target className="w-4 h-4 mr-2" />
              <span className="text-sm">No harvest</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          {/* UPDATED: Weather display with contextual temperature */}
          <div className="space-y-1">
            {tempContext.temperature !== null && (
              <div className="flex items-center text-xs">
                <Thermometer className="w-3 h-3 mr-1 text-burnt-orange" />
                <span className="font-medium">{tempContext.fullDisplay}</span>
              </div>
            )}
            {hunt.windspeed !== null && (
              <div className="flex items-center text-xs">
                <Wind className="w-3 h-3 mr-1 text-dark-teal" />
                <span>{hunt.windspeed} mph</span>
              </div>
            )}
            {hunt.moonphase !== null && (
              <div className="flex items-center text-xs">
                <Moon className="w-3 h-3 mr-1 text-muted-gold" />
                <span>{getMoonPhaseDisplay(hunt.moonphase)}</span>
              </div>
            )}
            {weatherQuality.score && (
              <div className={`text-xs font-medium ${weatherColors[weatherQuality.score]}`}>
                {weatherQuality.score.toUpperCase()}
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <Binoculars className="w-4 h-4 mr-2 text-weathered-wood" />
            <span className="text-sm text-forest-shadow">
              {hunt.sightings?.length || 0}
            </span>
          </div>
          {hunt.sightings && hunt.sightings.length > 0 && (
            <div className="text-xs text-weathered-wood mt-1">
              {hunt.sightings.slice(0, 2).map(s => s.animal_type).join(', ')}
              {hunt.sightings.length > 2 && '...'}
            </div>
          )}
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
              {(hunt.had_harvest || hunt.harvest_count > 0) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bright-orange/10 text-bright-orange">
                  <Trophy className="w-3 h-3 mr-1" />
                  Harvest
                </span>
              )}
              {hunt.hunt_type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-olive-green/10 text-olive-green">
                  {hunt.hunt_type}
                </span>
              )}
            </div>
            <p className="text-sm text-weathered-wood flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(hunt.hunt_date).toLocaleDateString()}
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
            <MapPin className="w-4 h-4 mr-2" />
            <span>{hunt.stand?.name || 'Unknown Stand'}</span>
            {hunt.stand?.type && <span className="ml-2 text-xs">({hunt.stand.type})</span>}
          </div>
          <div className="flex items-center text-weathered-wood">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatTime(hunt.start_time)} - {formatTime(hunt.end_time)}</span>
            {hunt.hunt_duration_minutes && (
              <span className="ml-2 text-xs flex items-center">
                <Timer className="w-3 h-3 mr-1" />
                {formatDuration(hunt.hunt_duration_minutes)}
              </span>
            )}
          </div>
        </div>
        
        {/* Harvest Info */}
        <div className="flex items-center text-sm">
          {(hunt.had_harvest || hunt.harvest_count > 0) ? (
            <>
              <Target className="w-4 h-4 mr-2 text-bright-orange" />
              <span className="text-bright-orange font-medium">
                {hunt.harvest_count} {hunt.game_type || 'harvest'}
              </span>
              {hunt.harvests?.[0]?.estimated_weight && (
                <span className="ml-2 text-xs text-weathered-wood">
                  (~{hunt.harvests[0].estimated_weight} lbs)
                </span>
              )}
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2 text-weathered-wood" />
              <span className="text-weathered-wood">No harvest</span>
            </>
          )}
        </div>

        {/* UPDATED: Weather Info with contextual temperature */}
        {(tempContext.temperature !== null || hunt.windspeed !== null || hunt.humidity !== null || hunt.moonphase !== null) && (
          <div className="bg-morning-mist rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-forest-shadow flex items-center">
                <CloudSun className="w-4 h-4 mr-2" />
                Weather Conditions
              </h4>
              {weatherQuality.score && (
                <span className={`text-xs font-medium px-2 py-1 rounded ${weatherColors[weatherQuality.score]} bg-white`}>
                  {weatherQuality.score.toUpperCase()}
                </span>
              )}
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
                  <span>{hunt.windspeed} mph</span>
                </div>
              )}
              {hunt.humidity !== null && (
                <div className="flex items-center">
                  <Droplets className="w-3 h-3 mr-1 text-dark-teal" />
                  <span>{hunt.humidity}% humidity</span>
                </div>
              )}
              {hunt.moonphase !== null && (
                <div className="flex items-center">
                  <Moon className="w-3 h-3 mr-1 text-muted-gold" />
                  <span>{getMoonPhaseDisplay(hunt.moonphase)}</span>
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
