// src/components/hunt-logging/HuntCardV2.tsx
// PREVIEW ONLY - Hunt card using universal base components
// This is a demonstration of how Hunt management could use the new card system

'use client'

import React from 'react'
import { BaseCard, CardHeader } from '@/components/shared/cards'
import { formatHuntDate, getHuntTypeBadge, parseDBDate } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils'
import { getStandIcon } from '@/lib/utils/standUtils'

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

// Helper function to convert moon phase decimal to phase name
const getMoonPhaseDisplay = (phase: number | null) => {
  if (phase === null) return null
  const phaseNames = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
  const index = Math.round(phase * 8) % 8
  return phaseNames[index]
}

// Helper function to calculate legal shooting times
const getLegalShootingTimes = (hunt: HuntWithDetails) => {
  if (!hunt.sunrise_time && !hunt.sunset_time) return null

  const addMinutes = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, mins + minutes, 0)
    return date.toTimeString().slice(0, 5)
  }

  if (hunt.hunt_type === 'AM' && hunt.sunrise_time) {
    const legalStart = addMinutes(hunt.sunrise_time, -30)
    return `Legal: ${legalStart} (30 min before sunrise)`
  }

  if (hunt.hunt_type === 'PM' && hunt.sunset_time) {
    const legalEnd = addMinutes(hunt.sunset_time, 30)
    return `Legal until: ${legalEnd} (30 min after sunset)`
  }

  return null
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
        icon: getIcon('trophy'),
        className: 'bg-bright-orange/10 text-bright-orange border border-bright-orange/30'
      })
    }

    // Sightings badge with hover tooltip showing animals seen
    if (hunt.sightings && hunt.sightings.length > 0) {
      const sightingsSummary = hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')
      badges.push({
        label: `${hunt.sightings.length} Sighting${hunt.sightings.length > 1 ? 's' : ''}`,
        icon: getIcon('binoculars'),
        className: 'bg-dark-teal/10 text-dark-teal border border-dark-teal/30',
        title: sightingsSummary // This will be used for hover tooltip
      })
    }

    return badges
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
            {(hunt as any).windspeed && (
              <span className="flex items-center gap-0.5" title={`Wind: ${(hunt as any).windspeed}mph ${(hunt as any).winddir ? `${(hunt as any).winddir}°` : ''}`}>
                {React.createElement(getIcon('wind'), { size: 10, className: 'text-dark-teal' })}
                {(hunt as any).windspeed} mph
              </span>
            )}
            {(hunt as any).moonphase !== null && (
              <span className="flex items-center gap-0.5" title={getMoonPhaseDisplay((hunt as any).moonphase) || undefined}>
                {React.createElement(getIcon('moon'), { size: 10, className: 'text-muted-gold' })}
                {getMoonPhaseDisplay((hunt as any).moonphase)}
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
                {formatHuntDate(hunt.hunt_date)}
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
      {/* Header - Date icon and title with badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Custom Date Icon */}
          <DateIcon hunt={hunt} />

          {/* Title and Badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-forest-shadow" style={{ color: '#566E3D' }}>
                {formatHuntDate(hunt.hunt_date)}
              </h3>

              {/* Badges */}
              {getBadges().map((badge, index) => {
                const BadgeIcon = badge.icon
                return (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${badge.className}`}
                    title={(badge as any).title} // Hover tooltip for sightings
                  >
                    {BadgeIcon && <BadgeIcon size={12} className="mr-1" />}
                    {badge.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && getActions().length > 0 && (
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
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
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick()
                  }}
                  className={`p-2 rounded-md transition-colors ${
                    variantStyles[action.variant || 'edit']
                  }`}
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

      {/* Hunt Details Section - Like Stand Features (thin dark-teal border) */}
      <div className="mb-3 p-2 rounded-md border" style={{ borderColor: '#0C4767', borderWidth: '1px' }}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Hunter */}
          <div className="flex items-center gap-1.5">
            {React.createElement(getIcon('user'), { size: 14, style: { color: '#566E3D' } })}
            <span className="text-forest-shadow">
              <strong>Hunter:</strong> {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
            </span>
          </div>

          {/* Stand */}
          {hunt.stand && (
            <div className="flex items-center gap-1.5">
              <StandIcon size={14} className="text-weathered-wood" />
              <span className="text-forest-shadow">
                <strong>Stand:</strong> {hunt.stand.name}
              </span>
            </div>
          )}

          {/* Start Time */}
          {hunt.start_time && (
            <div className="flex items-center gap-1.5">
              {React.createElement(getIcon('clock'), { size: 14, style: { color: '#0C4767' } })}
              <span className="text-forest-shadow">
                <strong>Start:</strong> {formatTime(hunt.start_time)}
              </span>
            </div>
          )}

          {/* End Time */}
          {hunt.end_time && (
            <div className="flex items-center gap-1.5">
              {React.createElement(getIcon('clock'), { size: 14, style: { color: '#0C4767' } })}
              <span className="text-forest-shadow">
                <strong>End:</strong> {formatTime(hunt.end_time)}
              </span>
            </div>
          )}

          {/* Duration */}
          {hunt.hunt_duration_minutes && (
            <div className="flex items-center gap-1.5">
              {React.createElement(getIcon('timer'), { size: 14, style: { color: '#0C4767' } })}
              <span className="text-forest-shadow">
                <strong>Duration:</strong> {Math.floor(hunt.hunt_duration_minutes / 60)}h {hunt.hunt_duration_minutes % 60}m
              </span>
            </div>
          )}

          {/* Sunrise Time (for AM hunts) */}
          {hunt.hunt_type === 'AM' && hunt.sunrise_time && (
            <div className="flex items-center gap-1.5">
              {React.createElement(getIcon('sunrise'), { size: 14, style: { color: '#FE9920' } })}
              <span className="text-forest-shadow">
                <strong>Sunrise:</strong> {formatTime(hunt.sunrise_time)}
              </span>
            </div>
          )}

          {/* Sunset Time (for PM hunts) */}
          {hunt.hunt_type === 'PM' && hunt.sunset_time && (
            <div className="flex items-center gap-1.5">
              {React.createElement(getIcon('sunset'), { size: 14, style: { color: '#B9A44C' } })}
              <span className="text-forest-shadow">
                <strong>Sunset:</strong> {formatTime(hunt.sunset_time)}
              </span>
            </div>
          )}

          {/* Legal Shooting Time (for AM hunts - 30 min before sunrise) */}
          {hunt.hunt_type === 'AM' && hunt.sunrise_time && (() => {
            const [hours, mins] = formatTime(hunt.sunrise_time).split(':').map(Number)
            const totalMins = hours * 60 + mins - 30
            const newHours = Math.floor(totalMins / 60)
            const newMins = totalMins % 60
            return (
              <div className="flex items-center gap-1.5">
                {React.createElement(getIcon('target'), { size: 14, style: { color: '#FA7921' } })}
                <span className="text-forest-shadow">
                  <strong>Legal Start:</strong> {`${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`}
                </span>
              </div>
            )
          })()}

          {/* Legal Shooting Time (for PM hunts - 30 min after sunset) */}
          {hunt.hunt_type === 'PM' && hunt.sunset_time && (() => {
            const [hours, mins] = formatTime(hunt.sunset_time).split(':').map(Number)
            const totalMins = hours * 60 + mins + 30
            const newHours = Math.floor(totalMins / 60)
            const newMins = totalMins % 60
            return (
              <div className="flex items-center gap-1.5">
                {React.createElement(getIcon('target'), { size: 14, style: { color: '#FA7921' } })}
                <span className="text-forest-shadow">
                  <strong>Legal End:</strong> {`${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`}
                </span>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Weather Conditions Section */}
      {(tempContext.temperature !== null || (hunt as any).windspeed || (hunt as any).moonphase !== null || hunt.precipitation !== null) && (
        <div className="mb-3 p-2 rounded-md border border-weathered-wood/20 bg-morning-mist">
          <div className="flex items-center gap-1 mb-2 text-xs font-medium">
            {React.createElement(getIcon('cloudSun'), { size: 12, style: { color: '#566E3D' } })}
            <span style={{ color: '#566E3D', fontWeight: 'bold' }}>WEATHER CONDITIONS</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Temperature */}
            {tempContext.temperature !== null && (
              <div className="flex items-center font-medium">
                {React.createElement(getIcon('thermometer'), { size: 14, className: 'text-burnt-orange mr-1' })}
                <span className="text-burnt-orange">{tempContext.fullDisplay}</span>
              </div>
            )}

            {/* Wind */}
            {(hunt as any).windspeed !== null && (
              <div className="flex items-center">
                {React.createElement(getIcon('wind'), { size: 14, className: 'text-dark-teal mr-1' })}
                <span className="text-forest-shadow">{(hunt as any).windspeed} mph</span>
              </div>
            )}

            {/* Humidity */}
            {hunt.weather_conditions && typeof hunt.weather_conditions === 'object' && !Array.isArray(hunt.weather_conditions) && 'humidity' in hunt.weather_conditions && typeof hunt.weather_conditions.humidity === 'number' && (
              <div className="flex items-center">
                {React.createElement(getIcon('droplets'), { size: 14, className: 'text-dark-teal mr-1' })}
                <span className="text-forest-shadow">{hunt.weather_conditions.humidity}% humidity</span>
              </div>
            )}

            {/* Precipitation */}
            {hunt.precipitation !== null && hunt.precipitation > 0 && (
              <div className="flex items-center">
                {React.createElement(getIcon('rain'), { size: 14, className: 'text-dark-teal mr-1' })}
                <span className="text-forest-shadow">{hunt.precipitation}" rain</span>
              </div>
            )}

            {/* Moon Phase - Show phase name instead of percentage */}
            {(hunt as any).moonphase !== null && getMoonPhaseDisplay((hunt as any).moonphase) && (
              <div className="flex items-center">
                {React.createElement(getIcon('moon'), { size: 14, className: 'text-muted-gold mr-1' })}
                <span className="text-forest-shadow">{getMoonPhaseDisplay((hunt as any).moonphase)}</span>
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

      {/* Notes */}
      {hunt.notes && (
        <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center gap-1 mb-1 text-xs font-medium">
            {React.createElement(getIcon('fileText'), { size: 12, style: { color: '#566E3D' } })}
            <span style={{ color: '#566E3D', fontWeight: 'bold' }}>NOTES</span>
          </div>
          <p className="text-xs italic">"{hunt.notes}"</p>
        </div>
      )}
    </BaseCard>
  )
}
