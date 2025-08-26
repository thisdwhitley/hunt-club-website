// src/components/hunt-logging/HuntDataManagement.tsx
// UPDATED: Now uses contextual temperature display and highlights relevant temperatures

'use client'

import React, { useState, useEffect } from 'react'
import { huntService, type HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext, getPrimaryTemperatureExplanation, getTemperatureRange } from '@/lib/hunt-logging/temperature-utils' // NEW IMPORTS
import HuntCard from './HuntCard'
import { formatDate, formatHuntDate, formatTime } from '@/lib/utils/date'
import { 
  Table, 
  Trash2, 
  Edit, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  MapPin,
  Target,
  Clock,
  Thermometer,
  Wind,
  Moon,
  Filter,
  Download,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  X as XIcon,
  User,
  Timer,
  Binoculars,
  Trophy,
  CloudSun,
  AlertCircle,
  Info
} from 'lucide-react'

interface HuntDataManagementProps {
  hunts: HuntWithDetails[]
  onHuntUpdate: () => void
  onHuntDelete: () => void
}

// UPDATED: Hunt Details Modal Component with contextual temperature highlighting
const HuntDetailsModal: React.FC<{
  hunt: HuntWithDetails | null
  isOpen: boolean
  onClose: () => void
}> = ({ hunt, isOpen, onClose }) => {
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

  const getMoonPhaseDisplay = (phase: number | null) => {
    if (phase === null) return 'Unknown'
    const phaseNames = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
    const index = Math.round(phase * 8) % 8
    return phaseNames[index]
  }

  // UPDATED: Get contextual temperature information
  const tempContext = getTemperatureContext(hunt)
  const primaryTemp = getPrimaryTemperatureExplanation(hunt)
  const tempRange = getTemperatureRange(hunt)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-weathered-wood/20">
          <h2 className="text-xl font-semibold text-forest-shadow flex items-center">
            <Eye className="w-6 h-6 mr-2 text-olive-green" />
            {/* Hunt Details - {new Date(hunt.hunt_date).toLocaleDateString()} */}
            Hunt Details - {formatHuntDate(hunt.hunt_date)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-morning-mist rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-weathered-wood" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Hunt Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2">
                Hunt Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Date:</span>
                    {/* <span className="ml-2 text-weathered-wood">{new Date(hunt.hunt_date).toLocaleDateString()}</span> */}
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
                  <MapPin className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Stand:</span>
                    <span className="ml-2 text-weathered-wood">{hunt.stand?.name || 'Unknown Stand'}</span>
                    {hunt.stand?.type && (
                      <span className="block text-sm text-weathered-wood ml-8">Type: {hunt.stand.type}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-olive-green" />
                  <div>
                    <span className="font-medium text-forest-shadow">Time:</span>
                    <span className="ml-2 text-weathered-wood">
                      {formatTime(hunt.start_time)} - {formatTime(hunt.end_time)}
                    </span>
                    {hunt.hunt_duration_minutes && (
                      <span className="block text-sm text-weathered-wood ml-8 flex items-center">
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

            {/* UPDATED: Weather Information with contextual highlighting */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2 flex items-center">
                <CloudSun className="w-5 h-5 mr-2" />
                Weather Conditions
              </h3>
              
              {hunt.has_weather_data ? (
                <div className="bg-morning-mist rounded-lg p-4 space-y-4">
                  {/* UPDATED: Primary Temperature Highlight */}
                  {tempContext.temperature !== null && (
                    <div className="bg-burnt-orange/10 border border-burnt-orange/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center text-forest-shadow font-medium">
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Primary Hunt Temperature:
                        </span>
                        <span className="text-lg font-bold text-burnt-orange">
                          {tempContext.fullDisplay}
                        </span>
                      </div>
                      <div className="flex items-start text-xs text-forest-shadow">
                        <Info className="w-3 h-3 mr-1 mt-0.5 text-burnt-orange flex-shrink-0" />
                        <span>{primaryTemp.explanation}</span>
                      </div>
                    </div>
                  )}

                  {/* Detailed Temperature Data */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-forest-shadow">All Temperature Data</h4>
                    
                    {hunt.temp_dawn !== null && (
                      <div className={`flex items-center justify-between p-2 rounded ${
                        tempContext.context === 'dawn' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'
                      }`}>
                        <span className={`flex items-center text-forest-shadow ${
                          tempContext.context === 'dawn' ? 'font-bold' : ''
                        }`}>
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Dawn Temperature:
                          {tempContext.context === 'dawn' && <span className="ml-2 text-xs text-burnt-orange">(Primary)</span>}
                        </span>
                        <span className={`font-medium text-weathered-wood ${
                          tempContext.context === 'dawn' ? 'text-burnt-orange font-bold' : ''
                        }`}>
                          {hunt.temp_dawn}°F
                        </span>
                      </div>
                    )}

                    {hunt.temp_dusk !== null && (
                      <div className={`flex items-center justify-between p-2 rounded ${
                        tempContext.context === 'dusk' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'
                      }`}>
                        <span className={`flex items-center text-forest-shadow ${
                          tempContext.context === 'dusk' ? 'font-bold' : ''
                        }`}>
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Dusk Temperature:
                          {tempContext.context === 'dusk' && <span className="ml-2 text-xs text-burnt-orange">(Primary)</span>}
                        </span>
                        <span className={`font-medium text-weathered-wood ${
                          tempContext.context === 'dusk' ? 'text-burnt-orange font-bold' : ''
                        }`}>
                          {hunt.temp_dusk}°F
                        </span>
                      </div>
                    )}

                    {hunt.daily_high !== null && hunt.daily_low !== null && (
                      <div className={`flex items-center justify-between p-2 rounded ${
                        tempContext.context === 'average' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'
                      }`}>
                        <span className={`flex items-center text-forest-shadow ${
                          tempContext.context === 'average' ? 'font-bold' : ''
                        }`}>
                          <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                          Daily Range:
                          {tempContext.context === 'average' && <span className="ml-2 text-xs text-burnt-orange">(Primary: Avg)</span>}
                        </span>
                        <span className={`font-medium text-weathered-wood ${
                          tempContext.context === 'average' ? 'text-burnt-orange font-bold' : ''
                        }`}>
                          {hunt.daily_low}°F - {hunt.daily_high}°F
                          {tempContext.context === 'average' && (
                            <span className="ml-2 text-sm">
                              (Avg: {Math.round((hunt.daily_high + hunt.daily_low) / 2)}°F)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Other Weather Data */}
                  <div className="border-t border-weathered-wood/20 pt-3 space-y-2">
                    {hunt.windspeed !== null && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-forest-shadow">
                          <Wind className="w-4 h-4 mr-2 text-dark-teal" />
                          Wind:
                        </span>
                        <span className="font-medium text-weathered-wood">
                          {hunt.windspeed} mph {hunt.winddir ? `${hunt.winddir}°` : ''}
                        </span>
                      </div>
                    )}

                    {hunt.humidity !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Humidity:</span>
                        <span className="font-medium text-weathered-wood">{hunt.humidity}%</span>
                      </div>
                    )}

                    {hunt.precip !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Precipitation:</span>
                        <span className="font-medium text-weathered-wood">{hunt.precip}"</span>
                      </div>
                    )}

                    {hunt.moonphase !== null && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-forest-shadow">
                          <Moon className="w-4 h-4 mr-2 text-muted-gold" />
                          Moon Phase:
                        </span>
                        <span className="font-medium text-weathered-wood">
                          {getMoonPhaseDisplay(hunt.moonphase)}
                        </span>
                      </div>
                    )}

                    {hunt.sunrise && hunt.sunset && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Sun Times:</span>
                        <span className="font-medium text-weathered-wood">
                          {hunt.sunrise} - {hunt.sunset}
                        </span>
                      </div>
                    )}

                    {hunt.legal_hunting_start && hunt.legal_hunting_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-forest-shadow">Legal Hunting:</span>
                        <span className="font-medium text-weathered-wood">
                          {hunt.legal_hunting_start} - {hunt.legal_hunting_end}
                        </span>
                      </div>
                    )}

                    {hunt.data_quality_score !== null && (
                      <div className="flex items-center justify-between border-t border-weathered-wood/20 pt-2">
                        <span className="text-forest-shadow">Data Quality:</span>
                        <span className={`font-medium ${
                          hunt.data_quality_score >= 90 ? 'text-bright-orange' :
                          hunt.data_quality_score >= 75 ? 'text-olive-green' :
                          hunt.data_quality_score >= 50 ? 'text-muted-gold' : 'text-clay-earth'
                        }`}>
                          {hunt.data_quality_score}%
                        </span>
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

          {/* Harvest Information */}
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
                          <span className="text-weathered-wood">Estimated Weight:</span>
                          <span className="font-medium text-forest-shadow">{harvest.estimated_weight} lbs</span>
                        </div>
                      )}
                      {harvest.shot_distance_yards && (
                        <div className="flex justify-between">
                          <span className="text-weathered-wood">Shot Distance:</span>
                          <span className="font-medium text-forest-shadow">{harvest.shot_distance_yards} yards</span>
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

          {/* Sightings Information */}
          {hunt.sightings && hunt.sightings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2 flex items-center">
                <Binoculars className="w-5 h-5 mr-2 text-olive-green" />
                Sightings ({hunt.sightings.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hunt.sightings.map((sighting, index) => (
                  <div key={sighting.id} className="bg-olive-green/5 border border-olive-green/20 rounded-lg p-4">
                    <h4 className="font-medium text-forest-shadow mb-3">
                      {sighting.animal_type} {sighting.count && sighting.count > 1 ? `(${sighting.count})` : ''}
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
                          <span className="font-medium text-forest-shadow">{sighting.distance_yards} yards</span>
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
                          <p className="text-forest-shadow italic mt-1">"{sighting.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hunt Notes */}
          {hunt.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-forest-shadow border-b border-weathered-wood/20 pb-2">
                Hunt Notes
              </h3>
              <div className="bg-morning-mist rounded-lg p-4">
                <p className="text-forest-shadow italic">"{hunt.notes}"</p>
              </div>
            </div>
          )}

          {/* Record Information */}
          <div className="border-t border-weathered-wood/20 pt-4">
            <h3 className="text-lg font-medium text-forest-shadow mb-3">Record Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-weathered-wood">Created:</span>
                <span className="ml-2 font-medium text-forest-shadow">
                  {/* {new Date(hunt.created_at).toLocaleString()} */}
                  {formatHuntDate(hunt.created_at, { style: 'full' })}
                </span>
              </div>
              <div>
                <span className="text-weathered-wood">Last Updated:</span>
                <span className="ml-2 font-medium text-forest-shadow">
                  {/* {new Date(hunt.updated_at).toLocaleString()} */}
                  {formatHuntDate(hunt.updated_at, { style: 'full' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HuntDataManagement: React.FC<HuntDataManagementProps> = ({ 
  hunts: initialHunts, 
  onHuntUpdate, 
  onHuntDelete 
}) => {
  const [hunts, setHunts] = useState<HuntWithDetails[]>(initialHunts)
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [sortField, setSortField] = useState<keyof HuntWithDetails>('hunt_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterHarvest, setFilterHarvest] = useState<'all' | 'harvest' | 'no-harvest'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [viewingHunt, setViewingHunt] = useState<HuntWithDetails | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Update hunts when props change
  useEffect(() => {
    setHunts(initialHunts)
  }, [initialHunts])

  // Filter and search logic using actual database fields
  const filteredHunts = hunts.filter(hunt => {
    const memberName = hunt.member?.display_name || hunt.member?.full_name || ''
    const standName = hunt.stand?.name || ''
    const notes = hunt.notes || ''
    const gameType = hunt.game_type || ''
    
    const matchesSearch = searchTerm === '' || 
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      standName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gameType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterHarvest === 'all' ||
      (filterHarvest === 'harvest' && (hunt.had_harvest || hunt.harvest_count > 0)) ||
      (filterHarvest === 'no-harvest' && (!hunt.had_harvest && hunt.harvest_count === 0))

    return matchesSearch && matchesFilter
  })

  // Sorting logic
  const sortedHunts = [...filteredHunts].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    if (sortField === 'hunt_date') {
      aVal = new Date(aVal as string)
      bVal = new Date(bVal as string)
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedHunts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHunts = sortedHunts.slice(startIndex, startIndex + itemsPerPage)

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAll = () => {
    const allIds = new Set(paginatedHunts.map(h => h.id))
    setSelectedIds(allIds)
    setShowBulkActions(true)
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setShowBulkActions(false)
  }

  // Action handlers
  const handleEdit = (hunt: HuntWithDetails) => {
    // For now, just enable inline editing of notes
    handleInlineEdit(hunt.id, 'notes', hunt.notes)
  }

  const handleView = (hunt: HuntWithDetails) => {
    setViewingHunt(hunt)
    setShowDetailsModal(true)
  }

  const handleDelete = async (huntId: string) => {
    if (window.confirm('Are you sure you want to delete this hunt record? This will also delete all associated harvests and sightings.')) {
      try {
        setLoading(true)
        await huntService.deleteHunt(huntId)
        onHuntDelete() // This will refresh the parent data
        console.log('Hunt deleted successfully:', huntId)
      } catch (error) {
        console.error('Error deleting hunt:', error)
        alert('Failed to delete hunt. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} hunt records? This will also delete all associated harvests and sightings.`)) {
      try {
        setLoading(true)
        const result = await huntService.bulkDeleteHunts(Array.from(selectedIds))
        
        if (result.failed.length > 0) {
          alert(`${result.succeeded.length} hunts deleted successfully. ${result.failed.length} failed to delete.`)
        } else {
          console.log(`${result.succeeded.length} hunts deleted successfully`)
        }
        
        clearSelection()
        onHuntDelete() // This will refresh the parent data
      } catch (error) {
        console.error('Error with bulk delete:', error)
        alert('Bulk delete failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInlineEdit = (huntId: string, field: string, currentValue: any) => {
    setEditingField(`${huntId}-${field}`)
    setEditingValue(String(currentValue || ''))
  }

  const saveInlineEdit = async (huntId: string, field: string) => {
    try {
      setLoading(true)
      await huntService.updateHunt(huntId, { [field]: editingValue })
      
      setEditingField(null)
      setEditingValue('')
      onHuntUpdate() // This will refresh the parent data
      console.log(`Updated ${field} for hunt ${huntId} to: ${editingValue}`)
    } catch (error) {
      console.error('Error updating hunt:', error)
      alert('Failed to update hunt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cancelInlineEdit = () => {
    setEditingField(null)
    setEditingValue('')
  }

  const exportData = async () => {
    try {
      setLoading(true)
      const csvContent = await huntService.exportHuntsToCSV({ 
        had_harvest: filterHarvest === 'all' ? undefined : filterHarvest === 'harvest'
      })
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hunt-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const HuntTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-morning-mist">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedIds.size === paginatedHunts.length && paginatedHunts.length > 0}
                onChange={selectedIds.size === paginatedHunts.length ? clearSelection : selectAll}
                className="rounded border-weathered-wood text-olive-green focus:ring-olive-green"
              />
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider cursor-pointer hover:bg-weathered-wood/10"
              onClick={() => {
                setSortField('hunt_date')
                setSortDirection(sortField === 'hunt_date' && sortDirection === 'desc' ? 'asc' : 'desc')
              }}
            >
              Date {sortField === 'hunt_date' && (sortDirection === 'desc' ? '↓' : '↑')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Member
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Stand
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Result
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Weather
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Sightings
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-forest-shadow uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {paginatedHunts.map((hunt) => (
            <HuntCard
              key={hunt.id}
              hunt={hunt}
              mode="list"
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              isSelected={selectedIds.has(hunt.id)}
              onSelect={toggleSelection}
              showActions={true}
            />
          ))}
        </tbody>
      </table>
    </div>
  )

  const HuntCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {paginatedHunts.map((hunt) => (
        <HuntCard
          key={hunt.id}
          hunt={hunt}
          mode="full"
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          isSelected={selectedIds.has(hunt.id)}
          onSelect={toggleSelection}
          showActions={true}
        />
      ))}
    </div>
  )

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-weathered-wood/20">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-weathered-wood">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedHunts.length)} of {sortedHunts.length} results
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value))
            setCurrentPage(1)
          }}
          className="border border-weathered-wood/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-olive-green bg-morning-mist"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-2 rounded border border-weathered-wood/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-morning-mist text-forest-shadow transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded border border-weathered-wood/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-morning-mist text-forest-shadow transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="px-3 py-2 text-sm text-weathered-wood">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border border-weathered-wood/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-morning-mist text-forest-shadow transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border border-weathered-wood/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-morning-mist text-forest-shadow transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-white rounded-lg club-shadow">
        {/* Header */}
        <div className="border-b border-weathered-wood/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-forest-shadow flex items-center">
                <Table className="w-6 h-6 mr-2 text-olive-green" />
                Hunt Data Management
              </h2>
              <p className="text-weathered-wood mt-1">
                Comprehensive view and management of all hunt records ({sortedHunts.length} total)
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-bright-orange text-white rounded-lg hover:bg-burnt-orange transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  onHuntUpdate()
                  setCurrentPage(1)
                  clearSelection()
                }}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-weathered-wood/20 space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-weathered-wood w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by member, stand, notes, or game type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-weathered-wood/20 rounded-lg focus:ring-2 focus:ring-olive-green focus:border-olive-green bg-morning-mist transition-colors"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={filterHarvest}
                onChange={(e) => setFilterHarvest(e.target.value as 'all' | 'harvest' | 'no-harvest')}
                className="border border-weathered-wood/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-olive-green focus:border-olive-green bg-morning-mist transition-colors"
              >
                <option value="all">All Hunts</option>
                <option value="harvest">With Harvest</option>
                <option value="no-harvest">No Harvest</option>
              </select>
              
              <div className="flex items-center border border-weathered-wood/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-olive-green/10 text-olive-green' : 'text-weathered-wood hover:bg-morning-mist'}`}
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 border-l border-weathered-wood/20 transition-colors ${viewMode === 'cards' ? 'bg-olive-green/10 text-olive-green' : 'text-weathered-wood hover:bg-morning-mist'}`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center justify-between p-3 bg-olive-green/10 border border-olive-green/20 rounded-lg">
              <span className="text-sm text-olive-green font-medium">
                {selectedIds.size} hunt record{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="flex items-center px-3 py-1 bg-clay-earth text-white rounded hover:bg-clay-earth/80 transition-colors text-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="flex items-center px-3 py-1 bg-weathered-wood text-white rounded hover:bg-weathered-wood/80 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Display */}
        <div className="min-h-96">
          {paginatedHunts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Target className="w-16 h-16 text-weathered-wood/50 mb-4" />
              <h3 className="text-lg font-medium text-forest-shadow mb-2">No hunt records found</h3>
              <p className="text-weathered-wood text-center">
                {filteredHunts.length === 0 
                  ? "Try adjusting your search or filter criteria."
                  : "All hunt records are on other pages."
                }
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'table' ? <HuntTableView /> : <HuntCardView />}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && <PaginationControls />}
      </div>

      {/* Details Modal - Updated with temperature highlighting */}
      <HuntDetailsModal
        hunt={viewingHunt}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setViewingHunt(null)
        }}
      />
    </>
  )
}

export default HuntDataManagement
