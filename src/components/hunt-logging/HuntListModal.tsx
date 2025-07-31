// src/components/hunt-logging/HuntListModal.tsx
// Modal for displaying lists of hunts with filters

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
  Target,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react'
import { huntService, type HuntWithDetails, type HuntFilters } from '@/lib/hunt-logging/hunt-service'

interface HuntListModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initialFilters?: HuntFilters
  onHuntSelect?: (huntId: string) => void
}

export function HuntListModal({ 
  isOpen, 
  onClose, 
  title, 
  initialFilters = {},
  onHuntSelect 
}: HuntListModalProps) {
  const [hunts, setHunts] = useState<HuntWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<HuntFilters>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadHunts()
    }
  }, [isOpen, filters])

  const loadHunts = async () => {
    try {
      setLoading(true)
      setError(null)
      const huntData = await huntService.getHunts(filters)
      setHunts(huntData)
    } catch (err) {
      console.error('Error loading hunts:', err)
      setError('Failed to load hunts')
    } finally {
      setLoading(false)
    }
  }

  // Filter hunts by search term
  const filteredHunts = hunts.filter(hunt => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      hunt.stand?.name?.toLowerCase().includes(searchLower) ||
      hunt.member?.display_name?.toLowerCase().includes(searchLower) ||
      hunt.notes?.toLowerCase().includes(searchLower) ||
      hunt.game_type?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return null
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

  const handleHuntClick = (huntId: string) => {
    if (onHuntSelect) {
      onHuntSelect(huntId)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-weathered-wood/10">
          <h2 className="text-2xl font-bold text-forest-shadow flex items-center">
            <Target className="w-6 h-6 mr-3 text-olive-green" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-weathered-wood hover:text-forest-shadow transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-weathered-wood/10 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-weathered-wood w-5 h-5" />
            <input
              type="text"
              placeholder="Search hunts by stand, member, notes, or game type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
            />
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-1.5 text-sm bg-morning-mist text-olive-green rounded-lg hover:bg-weathered-wood/10 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <span className="text-sm text-weathered-wood">
              {filteredHunts.length} hunt{filteredHunts.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-morning-mist rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-forest-shadow mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-forest-shadow mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-shadow mb-2">
                    Harvest Status
                  </label>
                  <select
                    value={filters.had_harvest === undefined ? '' : filters.had_harvest.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      had_harvest: e.target.value === '' ? undefined : e.target.value === 'true'
                    }))}
                    className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
                  >
                    <option value="">All hunts</option>
                    <option value="true">With harvest</option>
                    <option value="false">No harvest</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-sm text-weathered-wood hover:text-forest-shadow border border-weathered-wood/20 rounded-lg hover:bg-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green"></div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={loadHunts}
                  className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="p-6">
              {filteredHunts.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-weathered-wood/50 mx-auto mb-4" />
                  <p className="text-weathered-wood">No hunts found matching your criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredHunts.map((hunt) => (
                    <div 
                      key={hunt.id} 
                      onClick={() => handleHuntClick(hunt.id)}
                      className="bg-morning-mist rounded-lg p-6 border border-weathered-wood/10 hover:border-olive-green cursor-pointer transition-all duration-200 hover:shadow-club"
                    >
                      {/* Hunt Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-olive-green" />
                          <div>
                            <p className="font-semibold text-forest-shadow">
                              {formatDate(hunt.hunt_date)}
                            </p>
                            <p className="text-sm text-weathered-wood">
                              {hunt.member?.display_name || 'Unknown hunter'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-weathered-wood" />
                      </div>

                      {/* Hunt Details */}
                      <div className="space-y-3">
                        {/* Location and Time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-weathered-wood" />
                            <span className="text-sm text-forest-shadow">
                              {hunt.stand?.name || 'Unknown stand'}
                            </span>
                          </div>
                          
                          {hunt.start_time && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-weathered-wood" />
                              <span className="text-sm text-forest-shadow">
                                {formatTime(hunt.start_time)}
                                {hunt.end_time && ` - ${formatTime(hunt.end_time)}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Success Indicators */}
                        <div className="flex items-center space-x-4">
                          {hunt.harvest_count > 0 && (
                            <div className="flex items-center space-x-1 bg-burnt-orange/10 text-burnt-orange px-2 py-1 rounded-full">
                              <Trophy className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {hunt.harvest_count} harvest{hunt.harvest_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {hunt.sightings && hunt.sightings.length > 0 && (
                            <div className="flex items-center space-x-1 bg-pine-needle/10 text-pine-needle px-2 py-1 rounded-full">
                              <Eye className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {hunt.sightings.length} sighting{hunt.sightings.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Weather Summary */}
                        {(hunt.temperature_high || hunt.wind_speed || hunt.moon_phase) && (
                          <div className="text-xs text-weathered-wood bg-white/50 rounded p-2">
                            {hunt.temperature_high && `${hunt.temperature_high}°F`}
                            {hunt.wind_speed && ` • Wind: ${hunt.wind_speed} mph`}
                            {hunt.moon_phase && ` • Moon: ${hunt.moon_phase}`}
                          </div>
                        )}

                        {/* Notes Preview */}
                        {hunt.notes && (
                          <p className="text-sm text-weathered-wood line-clamp-2">
                            {hunt.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
