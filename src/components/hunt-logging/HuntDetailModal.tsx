'use client'

import React from 'react'
import type { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext, getPrimaryTemperatureExplanation } from '@/lib/hunt-logging/temperature-utils'
import { getStandIcon } from '@/lib/utils/standUtils'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import { formatHuntDate } from '@/lib/utils/date'
import {
  Eye,
  X as XIcon,
  Calendar,
  User,
  Clock,
  Timer,
  Target,
  CloudSun,
  Thermometer,
  Info,
  Wind,
  Moon,
  AlertCircle,
  Trophy,
  Binoculars,
} from 'lucide-react'

interface HuntDetailModalProps {
  hunt: HuntWithDetails | null
  isOpen: boolean
  onClose: () => void
}

export default function HuntDetailModal({ hunt, isOpen, onClose }: HuntDetailModalProps) {
  if (!isOpen || !hunt) return null

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A'
    return time.slice(0, 5)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getMoonPhaseDisplay = (phase: number | string | null) => {
    if (phase === null) return 'Unknown'
    const numPhase = typeof phase === 'string' ? parseFloat(phase) : phase
    if (isNaN(numPhase)) return String(phase)
    const phaseNames = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
    const index = Math.round(numPhase * 8) % 8
    return phaseNames[index]
  }

  const tempContext = getTemperatureContext(hunt)
  const primaryTemp = getPrimaryTemperatureExplanation(hunt)
  const StandIcon = getIcon(getStandIcon(hunt.stand?.type) as IconName)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-weathered-wood/20">
          <h2 className="text-xl font-semibold text-forest-shadow flex items-center">
            <Eye className="w-6 h-6 mr-2 text-olive-green" />
            Hunt Details — {formatHuntDate(hunt.hunt_date)}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-morning-mist rounded-lg transition-colors">
            <XIcon className="w-5 h-5 text-weathered-wood" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hunt Info + Weather */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Hunt Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2">
                Hunt Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Date:</span>
                    <span className="ml-2 text-weathered-wood">{formatHuntDate(hunt.hunt_date)}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Hunter:</span>
                    <span className="ml-2 text-weathered-wood">
                      {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
                    </span>
                    {hunt.member?.email && (
                      <span className="block text-sm text-weathered-wood ml-8">{hunt.member.email}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <StandIcon className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Stand:</span>
                    <span className="ml-2 text-weathered-wood">{hunt.stand?.name || 'Unknown Stand'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Time:</span>
                    <span className="ml-2 text-weathered-wood">
                      {formatTime(hunt.start_time)} – {formatTime(hunt.end_time)}
                    </span>
                    {hunt.hunt_duration_minutes && (
                      <span className="flex items-center text-sm text-weathered-wood ml-8 mt-0.5">
                        <Timer className="w-3 h-3 mr-1" />
                        Duration: {formatDuration(hunt.hunt_duration_minutes)}
                      </span>
                    )}
                  </div>
                </div>
                {hunt.hunt_type && (
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-3 text-olive-green" />
                    <div>
                      <span className="font-medium text-forest-shadow">Hunt Type:</span>
                      <span className="ml-2 text-weathered-wood">{hunt.hunt_type}</span>
                    </div>
                  </div>
                )}
                {hunt.hunting_season && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-olive-green" />
                    <div>
                      <span className="font-medium text-forest-shadow">Season:</span>
                      <span className="ml-2 text-weathered-wood">{hunt.hunting_season}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Weather */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2 flex items-center">
                <CloudSun className="w-5 h-5 mr-2" />
                Weather Conditions
              </h3>
              {hunt.has_weather_data ? (
                <div className="bg-morning-mist rounded-lg p-4 space-y-4">
                  {tempContext.temperature !== null && (
                    <div className="bg-burnt-orange/10 border border-burnt-orange/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center text-forest-shadow font-medium">
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Primary Hunt Temperature:
                        </span>
                        <span className="text-lg font-bold text-burnt-orange">{tempContext.fullDisplay}</span>
                      </div>
                      <div className="flex items-start text-xs text-forest-shadow">
                        <Info className="w-3 h-3 mr-1 mt-0.5 text-burnt-orange flex-shrink-0" />
                        <span>{primaryTemp.explanation}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-forest-shadow">All Temperature Data</h4>
                    {hunt.temp_dawn !== null && (
                      <div className={`flex items-center justify-between p-2 rounded ${tempContext.context === 'dawn' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'}`}>
                        <span className={`flex items-center text-forest-shadow ${tempContext.context === 'dawn' ? 'font-bold' : ''}`}>
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Dawn Temperature:
                          {tempContext.context === 'dawn' && <span className="ml-2 text-xs text-burnt-orange">(Primary)</span>}
                        </span>
                        <span className={`font-medium text-weathered-wood ${tempContext.context === 'dawn' ? 'text-burnt-orange font-bold' : ''}`}>
                          {hunt.temp_dawn}°F
                        </span>
                      </div>
                    )}
                    {hunt.temp_dusk !== null && (
                      <div className={`flex items-center justify-between p-2 rounded ${tempContext.context === 'dusk' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'}`}>
                        <span className={`flex items-center text-forest-shadow ${tempContext.context === 'dusk' ? 'font-bold' : ''}`}>
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Dusk Temperature:
                          {tempContext.context === 'dusk' && <span className="ml-2 text-xs text-burnt-orange">(Primary)</span>}
                        </span>
                        <span className={`font-medium text-weathered-wood ${tempContext.context === 'dusk' ? 'text-burnt-orange font-bold' : ''}`}>
                          {hunt.temp_dusk}°F
                        </span>
                      </div>
                    )}
                    {hunt.daily_high !== null && hunt.daily_low !== null && (
                      <div className={`flex items-center justify-between p-2 rounded ${tempContext.context === 'average' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'}`}>
                        <span className={`flex items-center text-forest-shadow ${tempContext.context === 'average' ? 'font-bold' : ''}`}>
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Daily Range:
                          {tempContext.context === 'average' && <span className="ml-2 text-xs text-burnt-orange">(Primary: Avg)</span>}
                        </span>
                        <span className={`font-medium text-weathered-wood ${tempContext.context === 'average' ? 'text-burnt-orange font-bold' : ''}`}>
                          {hunt.daily_low}°F – {hunt.daily_high}°F
                          {tempContext.context === 'average' && (
                            <span className="ml-2 text-sm">(Avg: {Math.round((hunt.daily_high + hunt.daily_low) / 2)}°F)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-weathered-wood/20 pt-3 space-y-2">
                    {hunt.wind_speed !== null && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-forest-shadow">
                          <Wind className="w-4 h-4 mr-2 text-dark-teal" />
                          Wind:
                        </span>
                        <span className="font-medium text-weathered-wood">
                          {hunt.wind_speed} mph{hunt.wind_direction ? ` ${hunt.wind_direction}` : ''}
                        </span>
                      </div>
                    )}
                    {hunt.precipitation !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Precipitation:</span>
                        <span className="font-medium text-weathered-wood">{hunt.precipitation}&quot;</span>
                      </div>
                    )}
                    {hunt.moon_phase !== null && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-forest-shadow">
                          <Moon className="w-4 h-4 mr-2 text-muted-gold" />
                          Moon Phase:
                        </span>
                        <span className="font-medium text-weathered-wood">{getMoonPhaseDisplay(hunt.moon_phase)}</span>
                      </div>
                    )}
                    {hunt.sunrise_time && hunt.sunset_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Sun Times:</span>
                        <span className="font-medium text-weathered-wood">{hunt.sunrise_time} – {hunt.sunset_time}</span>
                      </div>
                    )}
                    {hunt.legal_hunting_start && hunt.legal_hunting_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Legal Hunting:</span>
                        <span className="font-medium text-weathered-wood">{hunt.legal_hunting_start} – {hunt.legal_hunting_end}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 bg-morning-mist rounded-lg">
                  <AlertCircle className="w-8 h-8 text-weathered-wood/50 mr-3" />
                  <span className="text-weathered-wood">No weather data available for this date</span>
                </div>
              )}
            </div>
          </div>

          {/* Harvest Details */}
          {(hunt.had_harvest || hunt.harvest_count > 0) && hunt.harvests && hunt.harvests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-bright-orange" />
                Harvest Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hunt.harvests.map((harvest, index) => (
                  <div key={harvest.id} className="bg-bright-orange/5 border border-bright-orange/20 rounded-lg p-4">
                    <h4 className="font-medium text-forest-shadow mb-3">
                      Harvest #{index + 1}: {harvest.animal_type}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {harvest.gender && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Gender:</span>
                          <span className="font-medium text-forest-shadow">{harvest.gender}</span>
                        </div>
                      )}
                      {harvest.estimated_age && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Estimated Age:</span>
                          <span className="font-medium text-forest-shadow">{harvest.estimated_age}</span>
                        </div>
                      )}
                      {harvest.estimated_weight && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Est. Weight:</span>
                          <span className="font-medium text-forest-shadow">{harvest.estimated_weight} lbs</span>
                        </div>
                      )}
                      {harvest.shot_distance_yards && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Shot Distance:</span>
                          <span className="font-medium text-forest-shadow">{harvest.shot_distance_yards} yds</span>
                        </div>
                      )}
                      {harvest.weapon_used && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Weapon:</span>
                          <span className="font-medium text-forest-shadow">{harvest.weapon_used}</span>
                        </div>
                      )}
                      {harvest.antler_points && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Antler Points:</span>
                          <span className="font-medium text-forest-shadow">{harvest.antler_points}</span>
                        </div>
                      )}
                      {harvest.processor_name && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Processor:</span>
                          <span className="font-medium text-forest-shadow">{harvest.processor_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sightings */}
          {hunt.sightings && hunt.sightings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2 flex items-center">
                <Binoculars className="w-5 h-5 mr-2 text-olive-green" />
                Sightings ({hunt.sightings.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hunt.sightings.map((sighting) => (
                  <div key={sighting.id} className="bg-olive-green/5 border border-olive-green/20 rounded-lg p-4">
                    <h4 className="font-medium text-forest-shadow mb-3">
                      {sighting.animal_type}{sighting.count && sighting.count > 1 ? ` (${sighting.count})` : ''}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {sighting.gender && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Gender:</span>
                          <span className="font-medium text-forest-shadow">{sighting.gender}</span>
                        </div>
                      )}
                      {sighting.behavior && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Behavior:</span>
                          <span className="font-medium text-forest-shadow">{sighting.behavior}</span>
                        </div>
                      )}
                      {sighting.distance_yards && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Distance:</span>
                          <span className="font-medium text-forest-shadow">{sighting.distance_yards} yds</span>
                        </div>
                      )}
                      {sighting.direction && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Direction:</span>
                          <span className="font-medium text-forest-shadow">{sighting.direction}</span>
                        </div>
                      )}
                      {sighting.time_observed && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Time:</span>
                          <span className="font-medium text-forest-shadow">{sighting.time_observed}</span>
                        </div>
                      )}
                      {sighting.notes && (
                        <div className="mt-2">
                          <span className="text-weathered-wood">Notes:</span>
                          <p className="text-forest-shadow italic mt-1">&quot;{sighting.notes}&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {hunt.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2">
                Hunt Notes
              </h3>
              <div className="bg-morning-mist rounded-lg p-4">
                <p className="text-forest-shadow italic">&quot;{hunt.notes}&quot;</p>
              </div>
            </div>
          )}

          {/* Record Info */}
          <div className="border-t border-weathered-wood/20 pt-4">
            <h3 className="text-lg font-medium text-forest-shadow mb-3">Record Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-weathered-wood">Created:</span>
                <span className="ml-2 font-medium text-forest-shadow">{formatHuntDate(hunt.created_at)}</span>
              </div>
              <div>
                <span className="text-weathered-wood">Last Updated:</span>
                <span className="ml-2 font-medium text-forest-shadow">{formatHuntDate(hunt.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
