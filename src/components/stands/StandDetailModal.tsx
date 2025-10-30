// src/components/stands/StandDetailModal.tsx
// Read-only detailed view of stand information

'use client'

import React from 'react'
import { X, MapPin, Edit3, Users, Eye, Calendar } from 'lucide-react'
import { formatDate, parseDBDate } from '@/lib/utils/date'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons'
import type { Stand } from '@/lib/database/stands'

// Stand type mappings
const STAND_TYPES = {
  ladder_stand: { label: 'Ladder Stand', iconName: 'ladderStand' as IconName, color: '#FA7921' },
  bale_blind: { label: 'Bale Blind', iconName: 'baleBlind' as IconName, color: '#FA7921' },
  box_stand: { label: 'Box Stand', iconName: 'boxStand' as IconName, color: '#FA7921' },
  tripod: { label: 'Tripod', iconName: 'tripodStand' as IconName, color: '#FA7921' },
  ground_blind: { label: 'Ground Blind', iconName: 'groundBlind' as IconName, color: '#FA7921' }
}

interface StandDetailModalProps {
  stand: Stand
  onClose: () => void
  onEdit?: (stand: Stand) => void
  // Optional: pass dynamic history stats and last hunt data
  historyStats?: Array<{ label: string; value: number | string; color: string }>
  lastActivity?: { date: string; timeOfDay?: string; label?: string }
}

export function StandDetailModal({
  stand,
  onClose,
  onEdit,
  historyStats,
  lastActivity
}: StandDetailModalProps) {
  const standType = STAND_TYPES[stand.type] || STAND_TYPES.ladder_stand
  const StandIcon = getIcon(standType.iconName)

  // Helper to check if date is from prior season/year
  const isPriorSeason = (dateString: string): boolean => {
    const huntDate = parseDBDate(dateString)
    const currentYear = new Date().getFullYear()
    return huntDate.getFullYear() < currentYear
  }

  // Default history stats if not provided
  const displayStats = historyStats || [
    { label: 'Total Harvests', value: stand.total_harvests || 0, color: 'text-burnt-orange' },
    { label: `${new Date().getFullYear()} Hunts`, value: stand.season_hunts || 0, color: 'text-muted-gold' },
    { label: 'All-Time Hunts', value: stand.total_hunts || 0, color: 'text-olive-green' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-olive-green text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <StandIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{stand.name}</h2>
              <p className="text-green-100 opacity-90">{standType.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => onEdit(stand)}
                className="p-2 hover:bg-pine-needle rounded-lg transition-colors flex items-center gap-2"
                title="Edit Stand"
              >
                <Edit3 size={18} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-pine-needle rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Description */}
            {stand.description && (
              <div className="bg-morning-mist rounded-lg p-4">
                <p className="text-forest-shadow">{stand.description}</p>
              </div>
            )}

            {/* Stand Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-olive-green">
                <MapPin size={20} />
                Stand Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Capacity */}
                {stand.capacity && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Capacity</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Users size={16} className="text-olive-green" />
                      {stand.capacity} {stand.capacity === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                )}

                {/* Walking Time */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Walking Time</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    {React.createElement(getIcon('walking'), { size: 16, className: 'text-olive-green' })}
                    {stand.walking_time_minutes ? `${stand.walking_time_minutes} minutes` : 'Unknown'}
                  </p>
                </div>

                {/* Height */}
                {stand.height_feet && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Height</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {React.createElement(getIcon('height'), { size: 16, className: 'text-olive-green' })}
                      {stand.height_feet} feet
                    </p>
                  </div>
                )}

                {/* View Distance */}
                {stand.view_distance_yards && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">View Distance</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Eye size={16} className="text-dark-teal" />
                      {stand.view_distance_yards} yards
                    </p>
                  </div>
                )}

                {/* Time of Day */}
                {stand.time_of_day && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Best Time</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {React.createElement(getIcon(
                        stand.time_of_day === 'AM' ? 'sun' : stand.time_of_day === 'PM' ? 'moon' : 'clock'
                      ), { size: 16, className: 'text-bright-orange' })}
                      {stand.time_of_day === 'AM' ? 'Morning' : stand.time_of_day === 'PM' ? 'Evening' : 'All Day'}
                    </p>
                  </div>
                )}

                {/* Water Source */}
                {stand.nearby_water_source && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Water Source</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {React.createElement(getIcon('water'), { size: 16, className: 'text-dark-teal' })}
                      Near water
                    </p>
                  </div>
                )}

                {/* Food Source */}
                {stand.food_source && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Food Source</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {React.createElement(getIcon(stand.food_source === 'field' ? 'field' : 'feeder'), {
                        size: 16,
                        className: 'text-muted-gold'
                      })}
                      {stand.food_source === 'field' ? 'Field' : 'Feeder'}
                    </p>
                  </div>
                )}

                {/* Archery Season */}
                {stand.archery_season && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Season</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {React.createElement(getIcon('archery'), { size: 16, className: 'text-burnt-orange' })}
                      Good for archery
                    </p>
                  </div>
                )}

                {/* Trail Camera */}
                {stand.trail_camera_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Trail Camera</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      {React.createElement(getIcon('camera'), { size: 16, className: 'text-olive-green' })}
                      {stand.trail_camera_name}
                    </p>
                  </div>
                )}

                {/* GPS Coordinates */}
                {stand.latitude && stand.longitude && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">GPS Coordinates</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <MapPin size={16} className="text-dark-teal" />
                      {stand.latitude.toFixed(6)}, {stand.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Access Notes */}
                {stand.access_notes && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Access Notes</label>
                    <p className="text-gray-900">{stand.access_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Hunt History */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-olive-green">
                {React.createElement(getIcon('target'), { size: 20 })}
                Hunt History
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {displayStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Last Hunt */}
              {(lastActivity || stand.last_used_date) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <Calendar size={16} />
                    <strong>Last Hunted:</strong>
                    {lastActivity ? (
                      isPriorSeason(lastActivity.date) ? (
                        <span>
                          <span className="italic text-weathered-wood">Prior season</span>
                          <span className="text-xs text-weathered-wood/70"> ({formatDate(lastActivity.date)})</span>
                        </span>
                      ) : (
                        <span>
                          {formatDate(lastActivity.date)}
                          {lastActivity.timeOfDay && ` - ${lastActivity.timeOfDay}`}
                        </span>
                      )
                    ) : stand.last_used_date ? (
                      isPriorSeason(stand.last_used_date) ? (
                        <span>
                          <span className="italic text-weathered-wood">Prior season</span>
                          <span className="text-xs text-weathered-wood/70"> ({formatDate(stand.last_used_date)})</span>
                        </span>
                      ) : (
                        <span>{formatDate(stand.last_used_date)}</span>
                      )
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                stand.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {stand.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
