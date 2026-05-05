// src/components/hunt-logging/HuntCardV2.tsx

'use client'

import React from 'react'
import { BaseCard } from '@/components/shared/cards'
import { formatHuntDate, formatHuntCardTitle, getHuntTypeBadge, parseDBDate } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils'
import { getStandIcon } from '@/lib/utils/standUtils'

const HUNTING_COLORS = {
  oliveGreen: '#566E3D',
  burntOrange: '#FA7921',
  brightOrange: '#FE9920',
  mutedGold: '#B9A44C',
  darkTeal: '#0C4767',
  forestShadow: '#2D3E1F',
  weatheredWood: '#8B7355',
  clayEarth: '#A0653A',
}

// Compact pill chip — matches CameraCardV2's PowerChip sizing
const HuntChip = ({ label, color }: { label: string; color: string }) => (
  <span
    className="inline-flex items-center rounded-full font-semibold flex-shrink-0 px-1.5 py-px"
    style={{
      fontSize: '10px',
      backgroundColor: `${color}18`,
      color,
      border: `1px solid ${color}30`,
    }}
  >
    {label}
  </span>
)

interface HuntCardV2Props {
  hunt: HuntWithDetails
  mode?: 'full' | 'compact' | 'list'
  onClick?: (hunt: HuntWithDetails) => void
  onEdit?: (hunt: HuntWithDetails) => void
  onDelete?: (huntId: string) => void
  showActions?: boolean
  className?: string
}

// Custom Date Icon Component - Shows dd/mmm with color based on AM/PM
// Size matches Stand card icon: 40x40px (24px icon + 8px padding)
const DateIcon = ({ hunt }: { hunt: HuntWithDetails }) => {
  const date = parseDBDate(hunt.hunt_date)
  if (!date) return null
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('en-US', { month: 'short' }) // 3-letter abbreviation

  // Determine color based on hunt type (AM/PM) - matching badge colors
  const getTextColor = () => {
    if (hunt.hunt_type === 'AM') return '#FE9920' // bright-orange (matches AM badge)
    if (hunt.hunt_type === 'PM') return '#A0653A' // clay-earth (matches PM badge)
    return '#566E3D' // olive-green for All Day
  }

  return (
    <div
      className="p-2 rounded-lg flex-shrink-0"
      style={{
        backgroundColor: '#FA792120' // light orange background
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: '24px',
          height: '24px',
          color: getTextColor()
        }}
      >
        <div className="text-center leading-none">
          <div style={{ fontSize: '16px', lineHeight: '16px', fontWeight: 'bold' }}>{day}</div>
          <div style={{ fontSize: '7px', lineHeight: '8px', fontWeight: 'normal', marginTop: '1px' }}>{month}</div>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert moon phase to phase name
const getMoonPhaseDisplay = (phase: number | string | null) => {
  if (phase === null || phase === undefined) return null
  const numPhase = typeof phase === 'string' ? parseFloat(phase) : phase
  if (isNaN(numPhase)) return null
  const phaseNames = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
  const index = Math.round(numPhase * 8) % 8
  return phaseNames[index]
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

  // Get actions
  const getActions = () => {
    const actions = []

    if (onClick) {
      actions.push({
        icon: getIcon('eye'),
        onClick: () => onClick(hunt),
        label: 'View details',
        variant: 'view' as const
      })
    }

    if (onEdit) {
      actions.push({
        icon: getIcon('edit'),
        onClick: () => onEdit(hunt),
        label: 'Edit hunt',
        variant: 'edit' as const
      })
    }

    if (onDelete) {
      actions.push({
        icon: getIcon('delete'),
        onClick: () => onDelete(hunt.id),
        label: 'Delete hunt',
        variant: 'delete' as const
      })
    }

    return actions
  }

  // List mode - render as table row
  if (mode === 'list') {
    const EyeIcon = getIcon('eye')
    const EditIcon = getIcon('edit')
    const DeleteIcon = getIcon('delete')
    const TrophyIcon = getIcon('trophy')
    const BinocularsIcon = getIcon('binoculars')

    // Get sightings summary for hover tooltip
    const sightingsSummary = hunt.sightings && hunt.sightings.length > 0
      ? hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')
      : ''

    return (
      <tr className={`border-b border-gray-200 hover:bg-morning-mist transition-colors ${(hunt.had_harvest || hunt.harvest_count > 0) ? 'border-l-[6px] border-l-bright-orange bg-bright-orange/5' : ''}`}>
        {/* Date Column with AM/PM badge and result icons */}
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-forest-shadow font-medium">{formatHuntDate(hunt.hunt_date)}</span>
            {/* AM/PM Badge */}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${huntTypeBadge.className}`}>
              {huntTypeBadge.label}
            </span>
            {/* Harvests icon */}
            {(hunt.had_harvest || hunt.harvest_count > 0) && (
              <span className="flex items-center gap-1 text-bright-orange font-semibold" title="Harvests">
                <TrophyIcon size={12} />
                <span className="text-xs">{hunt.harvest_count}</span>
              </span>
            )}
            {/* Sightings icon with hover tooltip */}
            {hunt.sightings && hunt.sightings.length > 0 && (
              <span className="flex items-center gap-1 text-dark-teal font-semibold" title={sightingsSummary}>
                <BinocularsIcon size={12} />
                <span className="text-xs">{hunt.sightings.length}</span>
              </span>
            )}
          </div>
        </td>

        {/* Member Column */}
        <td className="px-4 py-3 text-sm text-forest-shadow">
          {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
        </td>

        {/* Stand Column */}
        <td className="px-4 py-3 text-sm">
          {hunt.stand ? (
            <div className="flex items-center gap-2">
              {React.createElement(getIcon(getStandIcon(hunt.stand.type) as IconName), {
                size: 14,
                className: 'text-weathered-wood'
              })}
              <span className="text-forest-shadow">{hunt.stand.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">No stand</span>
          )}
        </td>

        {/* Weather Column */}
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-xs text-forest-shadow flex-wrap">
            {tempContext.temperature !== null && (
              <span className="flex items-center gap-0.5" title={tempContext.fullDisplay}>
                {React.createElement(getIcon('thermometer'), { size: 10, className: 'text-burnt-orange' })}
                {tempContext.temperature}° {tempContext.displayText}
              </span>
            )}
            {hunt.wind_speed !== null && (
              <span className="flex items-center gap-0.5" title={`Wind: ${hunt.wind_speed}mph${hunt.wind_direction ? ` ${hunt.wind_direction}` : ''}`}>
                {React.createElement(getIcon('wind'), { size: 10, className: 'text-dark-teal' })}
                {hunt.wind_speed} mph
              </span>
            )}
            {hunt.moon_phase !== null && (
              <span className="flex items-center gap-0.5" title={getMoonPhaseDisplay(hunt.moon_phase) || undefined}>
                {React.createElement(getIcon('moon'), { size: 10, className: 'text-muted-gold' })}
                {getMoonPhaseDisplay(hunt.moon_phase)}
              </span>
            )}
          </div>
        </td>

        {/* Actions Column - matching Stand card style */}
        {showActions && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-end space-x-1">
              {onClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClick(hunt) }}
                  className="text-dark-teal hover:text-dark-teal/80 p-1 rounded hover:bg-dark-teal/10 transition-colors"
                  title="View Details"
                >
                  <EyeIcon size={16} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(hunt) }}
                  className="text-olive-green hover:text-pine-needle p-1 rounded hover:bg-olive-green/10 transition-colors"
                  title="Edit Hunt"
                >
                  <EditIcon size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(hunt.id) }}
                  className="text-clay-earth hover:text-clay-earth/80 p-1 rounded hover:bg-clay-earth/10 transition-colors"
                  title="Delete Hunt"
                >
                  <DeleteIcon size={16} />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    )
  }

  // Compact mode - minimal layout with key info
  if (mode === 'compact') {
    const TrophyIcon = getIcon('trophy')
    const BinocularsIcon = getIcon('binoculars')
    const UserIcon = getIcon('user')
    const ThermometerIcon = getIcon('thermometer')

    // Get sightings summary for hover tooltip
    const sightingsSummary = hunt.sightings && hunt.sightings.length > 0
      ? hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')
      : ''

    return (
      <BaseCard
        mode={mode}
        onClick={onClick ? () => onClick(hunt) : undefined}
        clickable={!!onClick}
        className={`${(hunt.had_harvest || hunt.harvest_count > 0) ? 'border-l-4 border-bright-orange' : ''} ${className}`}
      >
        <div className="flex items-start gap-2.5">
          {/* Custom Date Icon */}
          <DateIcon hunt={hunt} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row with date and AM/PM badge */}
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-base truncate" style={{ color: '#566E3D' }}>
                {formatHuntCardTitle(hunt.hunt_date)}
              </h3>
              {/* Hunt type badge */}
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${huntTypeBadge.className}`}>
                {huntTypeBadge.label}
              </span>
            </div>

            {/* Key info icons row */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs text-forest-shadow">
              {/* Hunter */}
              <div className="flex items-center gap-1" title="Hunter">
                <UserIcon size={12} className="text-olive-green" />
                <span className="truncate max-w-[100px]">
                  {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
                </span>
              </div>

              {/* Stand */}
              {hunt.stand && (
                <div className="flex items-center gap-1" title="Stand">
                  <StandIcon size={12} className="text-weathered-wood" />
                  <span className="truncate max-w-[80px]">{hunt.stand.name}</span>
                </div>
              )}

              {/* Temperature */}
              {tempContext.temperature !== null && (
                <div className="flex items-center gap-1" title={`Temperature: ${tempContext.fullDisplay}`}>
                  <ThermometerIcon size={12} className="text-burnt-orange" />
                  <span>{tempContext.temperature}°</span>
                </div>
              )}

              {/* Harvests */}
              {(hunt.had_harvest || hunt.harvest_count > 0) && (
                <div className="flex items-center gap-1 text-bright-orange font-semibold" title="Harvests">
                  <TrophyIcon size={12} />
                  <span>{hunt.harvest_count}</span>
                </div>
              )}

              {/* Sightings with hover tooltip */}
              {hunt.sightings && hunt.sightings.length > 0 && (
                <div className="flex items-center gap-1 text-dark-teal font-semibold" title={sightingsSummary}>
                  <BinocularsIcon size={12} />
                  <span>{hunt.sightings.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseCard>
    )
  }

  // Full mode - complete detailed view
  return (
    <BaseCard
      mode={mode}
      onClick={onClick ? () => onClick(hunt) : undefined}
      clickable={!!onClick}
      className={`${(hunt.had_harvest || hunt.harvest_count > 0) ? 'border-l-4 border-bright-orange' : ''} ${className}`}
    >
      {/* Header — DateIcon + title + season chip + AM/PM chip + actions, single row, never wraps */}
      <div className="flex items-center gap-3 mb-3">
        <DateIcon hunt={hunt} />
        <h3 className="font-bold text-lg truncate flex-1" style={{ color: HUNTING_COLORS.oliveGreen }}>
          {formatHuntCardTitle(hunt.hunt_date)}
        </h3>
        <HuntChip
          label={hunt.hunt_date.substring(0, 4)}
          color={HUNTING_COLORS.mutedGold}
        />
        <HuntChip
          label={hunt.hunt_type === 'AM' ? 'AM' : hunt.hunt_type === 'PM' ? 'PM' : 'All'}
          color={hunt.hunt_type === 'AM' ? HUNTING_COLORS.brightOrange : hunt.hunt_type === 'PM' ? HUNTING_COLORS.clayEarth : HUNTING_COLORS.oliveGreen}
        />
        {showActions && getActions().length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {getActions().map((action, index) => {
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
                  onClick={(e) => { e.stopPropagation(); action.onClick() }}
                  className={`p-2 rounded-md transition-colors ${variantStyles[action.variant || 'edit']}`}
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

      {/* Hunt Details Section */}
      <div className="mb-3 p-2 rounded-md border" style={{ borderColor: HUNTING_COLORS.darkTeal, borderWidth: '1px' }}>
        <div className="grid grid-cols-2 gap-2 text-xs">

          {/* Row 1: Hunter (col 1) | Sunrise or Sunset (col 2, always occupies the slot) */}
          <div className="flex items-start gap-1.5">
            {React.createElement(getIcon('user'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
            <span style={{ color: HUNTING_COLORS.forestShadow }}>
              <strong>Hunter:</strong> {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
            </span>
          </div>
          {hunt.hunt_type === 'AM' && hunt.sunrise_time ? (
            <div className="flex items-start gap-1.5">
              {React.createElement(getIcon('sunrise'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>Sunrise:</strong> {formatTime(hunt.sunrise_time)}
              </span>
            </div>
          ) : hunt.hunt_type === 'PM' && hunt.sunset_time ? (
            <div className="flex items-start gap-1.5">
              {React.createElement(getIcon('sunset'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>Sunset:</strong> {formatTime(hunt.sunset_time)}
              </span>
            </div>
          ) : <div />}

          {/* Row 2: Start (col 1) | End (col 2) */}
          {hunt.start_time && (
            <div className="flex items-start gap-1.5">
              {React.createElement(getIcon('clock'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>Start:</strong> {formatTime(hunt.start_time)}
              </span>
            </div>
          )}
          {hunt.end_time && (
            <div className="flex items-start gap-1.5">
              {React.createElement(getIcon('clock'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>End:</strong> {formatTime(hunt.end_time)}
              </span>
            </div>
          )}

          {/* Duration (col 1, standalone if present) */}
          {hunt.hunt_duration_minutes && (
            <div className="flex items-start gap-1.5">
              {React.createElement(getIcon('timer'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>Duration:</strong> {Math.floor(hunt.hunt_duration_minutes / 60)}h {hunt.hunt_duration_minutes % 60}m
              </span>
            </div>
          )}

          {/* Stand — col-span-2, no background, same colors as other rows */}
          <div className="col-span-2 flex items-start gap-1.5">
            {hunt.stand ? (
              <>
                <StandIcon size={14} style={{ color: HUNTING_COLORS.oliveGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Stand:</strong> {hunt.stand.name}
                </span>
              </>
            ) : (
              <>
                {React.createElement(getIcon('mapPin'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.weatheredWood }}>No stand selected</span>
              </>
            )}
          </div>

          {/* Results — col-span-2, centered chips row; only rendered if present */}
          {(hunt.had_harvest || hunt.harvest_count > 0 || (hunt.sightings && hunt.sightings.length > 0)) && (
            <div className="col-span-2 flex items-center justify-center gap-1.5 pt-1 border-t border-weathered-wood/20">
              {(hunt.had_harvest || hunt.harvest_count > 0) && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-bright-orange/10 text-bright-orange border border-bright-orange/30"
                  title={`${hunt.harvest_count} Harvest${hunt.harvest_count > 1 ? 's' : ''}`}
                >
                  {React.createElement(getIcon('trophy'), { size: 11 })}
                  <span>{hunt.harvest_count} Harvest{hunt.harvest_count > 1 ? 's' : ''}</span>
                </span>
              )}
              {hunt.sightings && hunt.sightings.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-dark-teal/10 text-dark-teal border border-dark-teal/30"
                  title={hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')}
                >
                  {React.createElement(getIcon('binoculars'), { size: 11 })}
                  <span>{hunt.sightings.length} Sighting{hunt.sightings.length > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Weather Conditions Section */}
      {(tempContext.temperature !== null || hunt.wind_speed !== null || hunt.moon_phase !== null || hunt.precipitation !== null) && (
        <div className="mb-3 p-2 rounded-md" style={{ background: '#F5F4F0', border: '1px solid #E8E6E0' }}>
          <div className="flex items-center gap-1 mb-2">
            {React.createElement(getIcon('cloudSun'), { size: 12, style: { color: HUNTING_COLORS.oliveGreen } })}
            <span style={{ color: HUNTING_COLORS.oliveGreen, fontWeight: 'bold', fontSize: '12px' }}>WEATHER CONDITIONS</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {tempContext.temperature !== null && (
              <div className="flex items-start gap-1.5">
                {React.createElement(getIcon('thermometer'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Temp:</strong> {tempContext.fullDisplay}
                </span>
              </div>
            )}
            {hunt.wind_speed !== null && (
              <div className="flex items-start gap-1.5">
                {React.createElement(getIcon('wind'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Wind:</strong> {hunt.wind_speed} mph{hunt.wind_direction ? ` ${hunt.wind_direction}` : ''}
                </span>
              </div>
            )}
            {hunt.weather_conditions && typeof hunt.weather_conditions === 'object' && !Array.isArray(hunt.weather_conditions) && 'humidity' in hunt.weather_conditions && typeof hunt.weather_conditions.humidity === 'number' && (
              <div className="flex items-start gap-1.5">
                {React.createElement(getIcon('droplets'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Humidity:</strong> {hunt.weather_conditions.humidity}%
                </span>
              </div>
            )}
            {hunt.precipitation !== null && hunt.precipitation > 0 && (
              <div className="flex items-start gap-1.5">
                {React.createElement(getIcon('rain'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Precip:</strong> {hunt.precipitation}&quot; rain
                </span>
              </div>
            )}
            {hunt.moon_phase !== null && getMoonPhaseDisplay(hunt.moon_phase) && (
              <div className="flex items-start gap-1.5">
                {React.createElement(getIcon('moon'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Moon:</strong> {getMoonPhaseDisplay(hunt.moon_phase)}
                </span>
              </div>
            )}
          </div>
          {hunt.daily_low !== null && hunt.daily_high !== null && tempContext.context !== 'average' && (
            <div className="text-xs text-weathered-wood mt-2 pt-2 border-t border-weathered-wood/20 text-center">
              <strong className="text-forest-shadow">Daily Range:</strong>{' '}
              {hunt.daily_low}°F – {hunt.daily_high}°F
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {hunt.notes && (
        <div className="p-2 rounded-md" style={{ background: '#F5F4F0', border: '1px solid #E8E6E0' }}>
          <div className="flex items-center gap-1 mb-1">
            {React.createElement(getIcon('fileText'), { size: 12, style: { color: HUNTING_COLORS.oliveGreen } })}
            <span style={{ color: HUNTING_COLORS.oliveGreen, fontWeight: 'bold', fontSize: '12px' }}>NOTES</span>
          </div>
          <p className="text-xs italic" style={{ color: HUNTING_COLORS.forestShadow }}>&quot;{hunt.notes}&quot;</p>
        </div>
      )}
    </BaseCard>
  )
}
