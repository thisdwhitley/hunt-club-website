// src/components/hunt-logging/HuntDetailsModal.tsx
// Modal for displaying detailed hunt information

'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy, 
  Eye, 
  User,
  Thermometer,
  Wind,
  Moon,
  Camera,
  Target,
  Binoculars
} from 'lucide-react'
import { huntService, type HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { parseDBDate, formatDate } from '@/lib/utils/date'

interface HuntDetailsModalProps {
  huntId: string | null
  isOpen: boolean
  onClose: () => void
}

export function HuntDetailsModal({ huntId, isOpen, onClose }: HuntDetailsModalProps) {
  const [hunt, setHunt] = useState<HuntWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (huntId && isOpen) {
      loadHuntDetails(huntId)
    }
  }, [huntId, isOpen])

  const loadHuntDetails = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const huntData = await huntService.getHuntById(id)
      setHunt(huntData)
    } catch (err) {
      console.error('Error loading hunt details:', err)
      setError('Failed to load hunt details')
    } finally {
      setLoading(false)
    }
  }

  const formatDateLong = (dateString: string) => {
    const date = parseDBDate(dateString)
    if (!date) return dateString
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not specified'
    try {
      const time = new Date(`2000-01-01T${timeString}`)
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/20 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto club-shadow-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-weathered-wood/10">
          <h2 className="text-2xl font-bold text-forest-shadow flex items-center">
            <Target className="w-6 h-6 mr-3 text-olive-green" />
            Hunt Details
          </h2>
          <button
            onClick={onClose}
            className="text-weathered-wood hover:text-forest-shadow transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {hunt && (
            <div className="space-y-6">
              
              {/* Basic Hunt Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-olive-green" />
                    <div>
                      <p className="text-sm text-weathered-wood">Hunt Date</p>
                      <p className="font-medium text-forest-shadow">
                        {formatDateLong(hunt.hunt_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-olive-green" />
                    <div>
                      <p className="text-sm text-weathered-wood">Hunter</p>
                      <p className="font-medium text-forest-shadow">
                        {hunt.member?.display_name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-olive-green" />
                    <div>
                      <p className="text-sm text-weathered-wood">Stand Location</p>
                      <p className="font-medium text-forest-shadow">
                        {hunt.stand?.name || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-olive-green" />
                    <div>
                      <p className="text-sm text-weathered-wood">Hunt Time</p>
                      <p className="font-medium text-forest-shadow">
                        {formatTime(hunt.start_time)}
                        {hunt.end_time && ` - ${formatTime(hunt.end_time)}`}
                      </p>
                      {hunt.start_time && hunt.end_time && (
                        <p className="text-sm text-weathered-wood">
                          Duration: {huntService.formatHuntDuration(hunt.start_time, hunt.end_time)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-burnt-orange" />
                    <div>
                      <p className="text-sm text-weathered-wood">Harvest</p>
                      <p className="font-medium text-forest-shadow">
                        {hunt.harvest_count > 0 
                          ? `${hunt.harvest_count} harvest${hunt.harvest_count !== 1 ? 's' : ''}`
                          : 'No harvest'
                        }
                      </p>
                      {hunt.game_type && (
                        <p className="text-sm text-weathered-wood">
                          Game type: {hunt.game_type}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Conditions */}
              {(hunt.temperature_high || hunt.wind_speed || hunt.moon_phase) && (
                <div className="bg-morning-mist rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-forest-shadow mb-4 flex items-center">
                    <Thermometer className="w-5 h-5 mr-2 text-olive-green" />
                    Weather Conditions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hunt.temperature_high && (
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-weathered-wood" />
                        <span className="text-sm text-forest-shadow">
                          {hunt.temperature_high}°F
                          {hunt.temperature_low && ` - ${hunt.temperature_low}°F`}
                        </span>
                      </div>
                    )}
                    
                    {hunt.wind_speed && (
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-weathered-wood" />
                        <span className="text-sm text-forest-shadow">
                          {hunt.wind_speed} mph
                          {hunt.wind_direction && ` ${hunt.wind_direction}`}
                        </span>
                      </div>
                    )}

                    {hunt.moon_phase && (
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4 text-weathered-wood" />
                        <span className="text-sm text-forest-shadow">
                          {hunt.moon_phase}
                          {hunt.moon_illumination && ` (${hunt.moon_illumination}%)`}
                        </span>
                      </div>
                    )}
                  </div>

                  {hunt.precipitation !== undefined && hunt.precipitation > 0 && (
                    <div className="mt-2 text-sm text-weathered-wood">
                      Precipitation: {hunt.precipitation}%
                    </div>
                  )}
                </div>
              )}

              {/* Harvest Details */}
              {hunt.harvests && hunt.harvests.length > 0 && (
                <div className="bg-morning-mist rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-forest-shadow mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-burnt-orange" />
                    Harvest Details
                  </h3>
                  <div className="space-y-4">
                    {hunt.harvests.map((harvest, index) => (
                      <div key={harvest.id} className="bg-white rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-weathered-wood">Species</p>
                            <p className="font-medium text-forest-shadow">
                              {harvest.species || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-weathered-wood">Gender</p>
                            <p className="font-medium text-forest-shadow">
                              {harvest.gender || 'Not specified'}
                            </p>
                          </div>
                          {harvest.weight && (
                            <div>
                              <p className="text-sm text-weathered-wood">Weight</p>
                              <p className="font-medium text-forest-shadow">{harvest.weight} lbs</p>
                            </div>
                          )}
                          {harvest.shot_distance && (
                            <div>
                              <p className="text-sm text-weathered-wood">Shot Distance</p>
                              <p className="font-medium text-forest-shadow">{harvest.shot_distance} yards</p>
                            </div>
                          )}
                        </div>
                        {harvest.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-weathered-wood">Notes</p>
                            <p className="text-sm text-forest-shadow">{harvest.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sightings */}
              {hunt.sightings && hunt.sightings.length > 0 && (
                <div className="bg-morning-mist rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-forest-shadow mb-4 flex items-center">
                    <Binoculars className="w-5 h-5 mr-2 text-pine-needle" />
                    Wildlife Sightings
                  </h3>
                  <div className="space-y-3">
                    {hunt.sightings.map((sighting, index) => (
                      <div key={sighting.id} className="bg-white rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-weathered-wood">Species</p>
                            <p className="font-medium text-forest-shadow">
                              {sighting.species || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-weathered-wood">Count</p>
                            <p className="font-medium text-forest-shadow">
                              {sighting.animal_count || 1}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-weathered-wood">Time</p>
                            <p className="font-medium text-forest-shadow">
                              {sighting.sighting_time ? formatTime(sighting.sighting_time) : 'Not specified'}
                            </p>
                          </div>
                        </div>
                        {sighting.behavior && (
                          <div className="mt-3">
                            <p className="text-sm text-weathered-wood">Behavior</p>
                            <p className="text-sm text-forest-shadow">{sighting.behavior}</p>
                          </div>
                        )}
                        {sighting.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-weathered-wood">Notes</p>
                            <p className="text-sm text-forest-shadow">{sighting.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hunt Notes */}
              {hunt.notes && (
                <div className="bg-morning-mist rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-forest-shadow mb-3">
                    Hunt Notes
                  </h3>
                  <p className="text-forest-shadow whitespace-pre-wrap">{hunt.notes}</p>
                </div>
              )}

              {/* Photos */}
              {hunt.photos && hunt.photos.length > 0 && (
                <div className="bg-morning-mist rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-forest-shadow mb-4 flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-olive-green" />
                    Photos ({hunt.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hunt.photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-weathered-wood/10 rounded-lg flex items-center justify-center">
                        <Camera className="w-8 h-8 text-weathered-wood" />
                        <span className="ml-2 text-sm text-weathered-wood">Photo {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Information */}
              <div className="border-t border-weathered-wood/10 pt-4 text-sm text-weathered-wood">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span>Created: </span>
                    {hunt.created_at && new Date(hunt.created_at).toLocaleString()}
                  </div>
                  {hunt.updated_at && hunt.updated_at !== hunt.created_at && (
                    <div>
                      <span>Updated: </span>
                      {new Date(hunt.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-weathered-wood/10">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}