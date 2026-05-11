// src/components/hunt-logging/HuntCardV2.tsx

'use client'

import React from 'react'
import { BaseCard } from '@/components/shared/cards'
import { formatHuntDate, formatHuntCardTitle, parseDBDate } from '@/lib/utils/date'
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
const DateIcon = ({ hunt, small = false }: { hunt: HuntWithDetails; small?: boolean }) => {
  const date = parseDBDate(hunt.hunt_date)
  if (!date) return null
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('en-US', { month: 'short' })

  const getTextColor = () => {
    if (hunt.hunt_type === 'AM') return '#FE9920'
    if (hunt.hunt_type === 'PM') return '#A0653A'
    return '#566E3D'
  }

  return (
    <div
      className={`${small ? 'p-1 rounded' : 'p-2 rounded-lg'} flex-shrink-0`}
      style={{ backgroundColor: '#FA792120' }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: small ? '16px' : '24px', height: small ? '16px' : '24px', color: getTextColor() }}
      >
        <div className="text-center leading-none">
          <div style={{ fontSize: small ? '11px' : '16px', lineHeight: small ? '11px' : '16px', fontWeight: 'bold' }}>{day}</div>
          <div style={{ fontSize: small ? '5px' : '7px', lineHeight: small ? '6px' : '8px', fontWeight: 'normal', marginTop: '1px' }}>{month}</div>
        </div>
      </div>
    </div>
  )
}

// Moon phase position (0–1 cycle) → illumination percentage string
// Phase 0 = new moon, 0.5 = full moon, 1 = new moon again
// Formula: illumination = (1 - cos(2π × phase)) / 2
const getMoonIllumination = (phase: number | null): string | null => {
  if (phase === null || phase === undefined) return null
  const illumination = (1 - Math.cos(2 * Math.PI * Number(phase))) / 2
  return `${Math.round(illumination * 100)}%`
}

// Extract sky condition summary string from weather_conditions JSONB
const getSkyCondition = (conditions: unknown): string | null => {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) return null
  const c = conditions as Record<string, unknown>
  return typeof c.summary === 'string' ? c.summary : null
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

    const hasHarvest = hunt.had_harvest || hunt.harvest_count > 0
    const amPmColor = hunt.hunt_type === 'AM'
      ? HUNTING_COLORS.brightOrange
      : hunt.hunt_type === 'PM'
        ? HUNTING_COLORS.clayEarth
        : HUNTING_COLORS.oliveGreen
    const amPmLabel = hunt.hunt_type === 'AM' ? 'AM' : hunt.hunt_type === 'PM' ? 'PM' : 'All'
    const sightingsSummary = hunt.sightings && hunt.sightings.length > 0
      ? hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')
      : ''

    return (
      <tr className={`border-b border-gray-200 hover:bg-morning-mist transition-colors ${hasHarvest ? 'border-l-4 border-l-bright-orange bg-bright-orange/5' : ''}`}>
        {/* Date Column — DateIcon + date text + chips, all on one line */}
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <DateIcon hunt={hunt} small />
            <span className="text-forest-shadow font-medium">{formatHuntDate(hunt.hunt_date)}</span>
            <HuntChip label={amPmLabel} color={amPmColor} />
            {hasHarvest && (
              <span
                className="inline-flex items-center gap-0.5 px-1 py-px rounded-full font-semibold"
                style={{ fontSize: '10px', backgroundColor: `${HUNTING_COLORS.brightOrange}18`, color: HUNTING_COLORS.brightOrange, border: `1px solid ${HUNTING_COLORS.brightOrange}30` }}
                title={`${hunt.harvest_count} harvest${hunt.harvest_count !== 1 ? 's' : ''}`}
              >
                <TrophyIcon size={10} />
                <span>{hunt.harvest_count}</span>
              </span>
            )}
            {hunt.sightings && hunt.sightings.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1 py-px rounded-full font-semibold"
                style={{ fontSize: '10px', backgroundColor: `${HUNTING_COLORS.darkTeal}18`, color: HUNTING_COLORS.darkTeal, border: `1px solid ${HUNTING_COLORS.darkTeal}30` }}
                title={sightingsSummary}
              >
                <BinocularsIcon size={10} />
                <span>{hunt.sightings.length}</span>
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
            <div className="flex items-center gap-2" title={hunt.stand.name}>
              {React.createElement(getIcon(getStandIcon(hunt.stand.type) as IconName), {
                size: 14,
                style: { color: HUNTING_COLORS.weatheredWood }
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
                {React.createElement(getIcon('thermometer'), { size: 16, style: { color: HUNTING_COLORS.burntOrange } })}
                {tempContext.temperature}° {tempContext.displayText}
              </span>
            )}
            {hunt.wind_speed !== null && (
              <span className="flex items-center gap-0.5" title={`Wind: ${hunt.wind_speed}mph${hunt.wind_direction ? ` ${hunt.wind_direction}` : ''}`}>
                {React.createElement(getIcon('wind'), { size: 16, style: { color: HUNTING_COLORS.darkTeal } })}
                {hunt.wind_speed} mph
              </span>
            )}
            {getSkyCondition(hunt.weather_conditions) && (
              <span className="flex items-center gap-0.5">
                {React.createElement(getIcon('cloudSun'), { size: 16, style: { color: HUNTING_COLORS.oliveGreen } })}
                {getSkyCondition(hunt.weather_conditions)}
              </span>
            )}
            {hunt.moon_illumination !== null && (
              <span className="flex items-center gap-0.5" title={hunt.moon_phase ?? undefined}>
                {React.createElement(getIcon('moon'), { size: 16, style: { color: HUNTING_COLORS.mutedGold } })}
                {getMoonIllumination(hunt.moon_illumination)}
              </span>
            )}
          </div>
        </td>

        {/* Actions Column */}
        {showActions && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-end space-x-1">
              {onClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClick(hunt) }}
                  className="text-dark-teal p-1.5 rounded hover:bg-dark-teal/10 transition-colors"
                  title="View Details"
                >
                  <EyeIcon size={16} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(hunt) }}
                  className="text-olive-green p-1.5 rounded hover:bg-olive-green/10 transition-colors"
                  title="Edit Hunt"
                >
                  <EditIcon size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(hunt.id) }}
                  className="text-clay-earth p-1.5 rounded hover:bg-clay-earth/10 transition-colors"
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

    const amPmColor = hunt.hunt_type === 'AM'
      ? HUNTING_COLORS.brightOrange
      : hunt.hunt_type === 'PM'
        ? HUNTING_COLORS.clayEarth
        : HUNTING_COLORS.oliveGreen
    const amPmLabel = hunt.hunt_type === 'AM' ? 'AM' : hunt.hunt_type === 'PM' ? 'PM' : 'All'

    const sightingsSummary = hunt.sightings && hunt.sightings.length > 0
      ? hunt.sightings.map(s => `${s.count} ${s.animal_type}`).join(', ')
      : ''

    return (
      <BaseCard
        mode={mode}
        onClick={onClick ? () => onClick(hunt) : undefined}
        clickable={!!onClick}
        highlighted={hunt.had_harvest || hunt.harvest_count > 0}
        highlightColor={HUNTING_COLORS.brightOrange}
        className={className}
      >
        <div className="flex items-start gap-2.5">
          <DateIcon hunt={hunt} />

          <div className="flex-1 min-w-0">
            {/* Title row: weekday + temp chip + AM/PM chip */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-base truncate flex-1" style={{ color: HUNTING_COLORS.oliveGreen }}>
                {formatHuntCardTitle(hunt.hunt_date)}
              </h3>
              {tempContext.temperature !== null && (
                <HuntChip label={`${tempContext.temperature}°`} color={HUNTING_COLORS.mutedGold} />
              )}
              <HuntChip label={amPmLabel} color={amPmColor} />
            </div>

            {/* Info row: hunter · stand · result chips */}
            <div className="flex items-center gap-2 text-xs text-forest-shadow min-w-0">
              {/* Hunter — never truncated, names are short */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <UserIcon size={12} style={{ color: HUNTING_COLORS.oliveGreen }} />
                <span>{hunt.member?.display_name || hunt.member?.full_name || '?'}</span>
              </div>

              {/* Stand — truncates if needed */}
              {hunt.stand && (
                <>
                  <span className="text-weathered-wood/40 flex-shrink-0">·</span>
                  <div className="flex items-center gap-1 min-w-0 flex-1" title={hunt.stand.name}>
                    <StandIcon size={12} style={{ color: HUNTING_COLORS.weatheredWood, flexShrink: 0 }} />
                    <span className="truncate">{hunt.stand.name}</span>
                  </div>
                </>
              )}

              {/* Result chips — pushed to the right, never truncated */}
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                {(hunt.had_harvest || hunt.harvest_count > 0) && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1 py-px rounded-full font-semibold"
                    style={{ fontSize: '10px', backgroundColor: `${HUNTING_COLORS.brightOrange}18`, color: HUNTING_COLORS.brightOrange, border: `1px solid ${HUNTING_COLORS.brightOrange}30` }}
                    title={`${hunt.harvest_count} harvest${hunt.harvest_count !== 1 ? 's' : ''}`}
                  >
                    <TrophyIcon size={10} />
                    <span>{hunt.harvest_count}</span>
                  </span>
                )}
                {hunt.sightings && hunt.sightings.length > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1 py-px rounded-full font-semibold"
                    style={{ fontSize: '10px', backgroundColor: `${HUNTING_COLORS.darkTeal}18`, color: HUNTING_COLORS.darkTeal, border: `1px solid ${HUNTING_COLORS.darkTeal}30` }}
                    title={sightingsSummary}
                  >
                    <BinocularsIcon size={10} />
                    <span>{hunt.sightings.length}</span>
                  </span>
                )}
              </div>
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
      highlighted={hunt.had_harvest || hunt.harvest_count > 0}
      highlightColor={HUNTING_COLORS.brightOrange}
      className={className}
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
                view: 'text-dark-teal hover:bg-dark-teal/10',
                edit: 'text-olive-green hover:bg-olive-green/10',
                delete: 'text-clay-earth hover:bg-clay-earth/10',
                navigate: 'text-gray-600 hover:bg-dark-teal/10'
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
      {!(tempContext.temperature !== null || hunt.wind_speed !== null || hunt.moon_illumination !== null || getSkyCondition(hunt.weather_conditions)) && hunt.weather_fetched_at === null && (
        <div className="mb-3 p-2 rounded-md" style={{ background: '#F5F4F0', border: '1px solid #E8E6E0' }}>
          <div className="flex items-center gap-1 mb-1">
            {React.createElement(getIcon('cloudSun'), { size: 12, style: { color: HUNTING_COLORS.oliveGreen } })}
            <span style={{ color: HUNTING_COLORS.oliveGreen, fontWeight: 'bold', fontSize: '12px' }}>WEATHER CONDITIONS</span>
          </div>
          <p className="text-xs" style={{ color: HUNTING_COLORS.weatheredWood }}>Weather data not recorded for this hunt.</p>
        </div>
      )}
      {(tempContext.temperature !== null || hunt.wind_speed !== null || hunt.moon_illumination !== null || getSkyCondition(hunt.weather_conditions)) && (
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
            {getSkyCondition(hunt.weather_conditions) && (
              <div className="flex items-start gap-1.5">
                {React.createElement(getIcon('cloudSun'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Sky:</strong> {getSkyCondition(hunt.weather_conditions)}
                </span>
              </div>
            )}
            {hunt.moon_illumination !== null && (
              <div className="flex items-start gap-1.5" title={hunt.moon_phase ?? undefined}>
                {React.createElement(getIcon('moon'), { size: 14, style: { color: HUNTING_COLORS.oliveGreen } })}
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Moon:</strong> {getMoonIllumination(hunt.moon_illumination)}
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
