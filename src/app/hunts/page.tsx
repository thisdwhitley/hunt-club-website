// src/app/hunts/page.tsx
// UPDATED: Now uses contextual temperature display

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { huntService, type HuntWithDetails, type HuntStats, type HuntFilters } from '@/lib/hunt-logging/hunt-service'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils' // NEW IMPORT
import HuntDataManagement from '@/components/hunt-logging/HuntDataManagement'
import { formatDate, formatHuntDate, formatTime } from '@/lib/utils/date'
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Binoculars, 
  MapPin, 
  Clock,
  Trophy,
  Filter,
  Download,
  Search,
  X,
  ChevronRight,
  Database,
  BarChart3,
  Plus,
  Eye,
  Thermometer,
  Wind,
  Moon
} from 'lucide-react'

export default function HuntManagementPage() {
  const { user } = useAuth()
  const [hunts, setHunts] = useState<HuntWithDetails[]>([])
  const [stats, setStats] = useState<HuntStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<HuntFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showManagement, setShowManagement] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>(String(new Date().getFullYear()))

  // Fetch data on component mount and when filters or season change
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filters, selectedSeason])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [huntsData, statsData] = await Promise.all([
        huntService.getHunts(filters),
        huntService.getHuntStats(selectedSeason)
      ])
      
    // ADD THIS DEBUG LOG:
    console.log('🔍 Loaded hunts data:', huntsData)
    huntsData.forEach(hunt => {
      console.log(`🔍 Hunt ${hunt.hunt_date} by ${hunt.member?.display_name}: ${hunt.sightings?.length || 0} sightings`, hunt.sightings)
    })

      setHunts(huntsData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading hunt data:', err)
      setError('Failed to load hunt data. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  // Filter hunts based on search term using actual database fields
  const filteredHunts = hunts.filter(hunt => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const memberName = (hunt.member?.display_name || hunt.member?.full_name || '').toLowerCase()
    const standName = (hunt.stand?.name || '').toLowerCase()
    const notes = (hunt.notes || '').toLowerCase()
    const gameType = (hunt.game_type || '').toLowerCase()
    
    return memberName.includes(searchLower) ||
           standName.includes(searchLower) ||
           notes.includes(searchLower) ||
           gameType.includes(searchLower)
  })

  const exportHunts = async () => {
    try {
      const csvContent = await huntService.exportHuntsToCSV(filters)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hunt-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting hunts:', err)
      alert('Failed to export hunt data. Please try again.')
    }
  }

  const renderRecentHunts = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg club-shadow p-4 animate-pulse">
              <div className="h-4 bg-morning-mist rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-morning-mist rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )
    }

    if (filteredHunts.length === 0) {
      return (
        <div className="bg-white rounded-lg club-shadow p-8 text-center">
          <Target className="w-12 h-12 text-weathered-wood/50 mx-auto mb-4" />
          <p className="text-weathered-wood">
            {hunts.length === 0 ? 'No hunt records found.' : 'No hunts match your search criteria.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-olive-green hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {filteredHunts.slice(0, 10).map((hunt) => {
          // UPDATED: Get contextual temperature for this hunt
          const tempContext = getTemperatureContext(hunt)
          
          return (
            <div key={hunt.id} className="bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-weathered-wood" />
                        <span className="font-medium text-forest-shadow">
                          {/* {new Date(hunt.hunt_date).toLocaleDateString()} */}
                          {formatHuntDate(hunt.hunt_date)}
                        </span>
                      </div>
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
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-weathered-wood mb-3">
                      <div className="flex items-center">
                        <span className="font-medium mr-1">Member:</span>
                        {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {hunt.stand?.name || 'Unknown Stand'}
                        {hunt.stand?.type && <span className="ml-1 text-xs">({hunt.stand.type})</span>}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {hunt.start_time || 'N/A'} - {hunt.end_time || 'N/A'}
                        {hunt.hunt_duration_minutes && (
                          <span className="ml-1 text-xs">({hunt.hunt_duration_minutes}m)</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Binoculars className="w-3 h-3 mr-1" />
                        {hunt.sightings?.length || 0} sightings
                      </div>
                    </div>

                    {/* UPDATED: Weather and harvest info with contextual temperature */}
                    <div className="flex items-center space-x-4 text-xs text-weathered-wood mb-2">
                      {/* UPDATED: Show contextual temperature instead of hardcoded temp_dawn */}
                      {tempContext.temperature !== null && (
                        <div className="flex items-center">
                          <Thermometer className="w-3 h-3 mr-1 text-burnt-orange" />
                          <span className="font-medium">{tempContext.fullDisplay}</span>
                        </div>
                      )}
                      {hunt.windspeed !== null && (
                        <div className="flex items-center">
                          <Wind className="w-3 h-3 mr-1 text-dark-teal" />
                          <span>{hunt.windspeed} mph</span>
                        </div>
                      )}
                      {hunt.moonphase !== null && (
                        <div className="flex items-center">
                          <Moon className="w-3 h-3 mr-1 text-muted-gold" />
                          <span>
                            {/* Convert moon phase to readable text */}
                            {hunt.moonphase < 0.125 ? 'New' :
                             hunt.moonphase < 0.25 ? 'Waxing Crescent' :
                             hunt.moonphase < 0.375 ? 'First Quarter' :
                             hunt.moonphase < 0.5 ? 'Waxing Gibbous' :
                             hunt.moonphase < 0.625 ? 'Full' :
                             hunt.moonphase < 0.75 ? 'Waning Gibbous' :
                             hunt.moonphase < 0.875 ? 'Last Quarter' : 'Waning Crescent'} Moon
                          </span>
                        </div>
                      )}
                      {(hunt.had_harvest || hunt.harvest_count > 0) && hunt.game_type && (
                        <div className="flex items-center font-medium text-bright-orange">
                          <Trophy className="w-3 h-3 mr-1" />
                          {hunt.harvest_count} {hunt.game_type}
                        </div>
                      )}
                    </div>

                    {hunt.notes && (
                      <p className="text-sm text-weathered-wood line-clamp-2 italic">
                        "{hunt.notes}"
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => console.log('View hunt details:', hunt.id)}
                    className="ml-4 p-2 text-weathered-wood hover:text-olive-green hover:bg-morning-mist rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        
        {filteredHunts.length > 10 && (
          <div className="text-center py-4">
            <button
              onClick={() => setShowManagement(true)}
              className="text-olive-green hover:text-pine-needle font-medium flex items-center mx-auto"
            >
              View all {filteredHunts.length} hunts in data management →
              <Database className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    )
  }

  if (loading && hunts.length === 0) {
    return (
      <div className="min-h-screen bg-morning-mist">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg h-96"></div>
              <div className="bg-white rounded-lg h-96"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-forest-shadow flex items-center">
                <Target className="w-8 h-8 mr-3 text-olive-green" />
                Hunt Management
              </h1>
              <p className="text-weathered-wood mt-2">
                View and analyze all hunt logs, harvests, and sightings
              </p>

              {/* Season Selector */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-forest-shadow mb-2">
                  Season
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="px-4 py-2 border border-weathered-wood/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green bg-white text-forest-shadow"
                >
                  <option value="2025">2025 Season</option>
                  <option value="2024">2024 Season</option>
                  <option value="2023">2023 Season</option>
                  <option value="2022">2022 Season</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-olive-green text-white border-olive-green' 
                    : 'bg-white text-olive-green border-olive-green hover:bg-olive-green hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button 
                onClick={() => setShowManagement(!showManagement)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                  showManagement 
                    ? 'bg-burnt-orange text-white border-burnt-orange' 
                    : 'bg-white text-burnt-orange border-burnt-orange hover:bg-burnt-orange hover:text-white'
                }`}
              >
                <Database className="w-4 h-4 mr-2" />
                {showManagement ? 'Hide' : 'Show'} Data Management
              </button>
              <button
                onClick={exportHunts}
                className="flex items-center px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-clay-earth/10 border border-clay-earth/20 rounded-lg p-4 mb-6">
            <p className="text-clay-earth">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-clay-earth hover:text-clay-earth/80 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-olive-green/10 rounded-lg">
                  <Target className="w-6 h-6 text-olive-green" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-forest-shadow">{stats.totalHunts}</p>
                  <p className="text-sm text-weathered-wood">Total Hunts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-bright-orange/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-bright-orange" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-forest-shadow">{stats.totalHarvests}</p>
                  <p className="text-sm text-weathered-wood">Total Harvests</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-dark-teal/10 rounded-lg">
                  <Binoculars className="w-6 h-6 text-dark-teal" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-forest-shadow">{stats.totalSightings}</p>
                  <p className="text-sm text-weathered-wood">Deer Sightings</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-burnt-orange/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-burnt-orange" />
                </div>
                <div className="ml-4">
                  {stats.mostHuntedStand ? (
                    <>
                      <p className="text-2xl font-bold text-forest-shadow truncate max-w-[150px]">
                        {stats.mostHuntedStand.name}
                      </p>
                      <p className="text-sm text-weathered-wood">
                        Most Hunted ({stats.mostHuntedStand.hunt_count} hunts)
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-forest-shadow">—</p>
                      <p className="text-sm text-weathered-wood">Most Hunted Stand</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg club-shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-forest-shadow">Filter Hunts</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-morning-mist rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-weathered-wood" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-forest-shadow mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green bg-morning-mist"
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
                  className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green bg-morning-mist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-shadow mb-2">
                  Stand
                </label>
                <select
                  value={filters.stand_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, stand_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green bg-morning-mist"
                >
                  <option value="">All stands</option>
                  {stats?.topStands.map(stand => (
                    <option key={stand.id} value={stand.id}>
                      {stand.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green bg-morning-mist"
                >
                  <option value="">All hunts</option>
                  <option value="true">With harvest</option>
                  <option value="false">No harvest</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-weathered-wood hover:text-forest-shadow border border-weathered-wood/20 rounded-lg hover:bg-morning-mist transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg club-shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-weathered-wood w-5 h-5" />
            <input
              type="text"
              placeholder="Search hunts by stand, member, notes, or game type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green bg-morning-mist"
            />
          </div>
        </div>

        {/* Main Content - Dashboard View */}
        {!showManagement && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Hunt List - Updated with contextual temperature */}
            <div className="bg-white rounded-lg club-shadow">
              <div className="p-4 border-b border-weathered-wood/10">
                <h2 className="text-lg font-semibold text-forest-shadow">
                  Recent Hunts ({filteredHunts.length})
                </h2>
              </div>

              <div className="p-4">
                {renderRecentHunts()}
              </div>
            </div>

            {/* Top Stands - Existing Design */}
            <div className="bg-white rounded-lg club-shadow">
              <div className="p-4 border-b border-weathered-wood/10">
                <h2 className="text-lg font-semibold text-forest-shadow">Most Hunted Stands</h2>
              </div>

              <div className="p-4">
                {stats?.topStands.length ? (
                  <div className="space-y-3">
                    {stats.topStands.slice(0, 5).map((stand, index) => (
                      <div key={stand.id} className="flex items-center justify-between p-3 bg-morning-mist rounded-lg">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-olive-green text-white rounded-full text-sm font-medium mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-forest-shadow">{stand.name}</p>
                            <p className="text-sm text-weathered-wood">
                              {stand.hunt_count} hunts • {stand.type || 'Stand'}
                            </p>
                          </div>
                        </div>
                        <MapPin className="w-4 h-4 text-weathered-wood" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-weathered-wood/50 mx-auto mb-4" />
                    <p className="text-weathered-wood">No stand data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Management Interface */}
        {showManagement && (
          <div className="mb-8">
            <div className="bg-white rounded-lg club-shadow p-6 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-forest-shadow flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-olive-green" />
                  Advanced Hunt Data Management
                </h2>
                <button
                  onClick={() => setShowManagement(false)}
                  className="p-2 hover:bg-morning-mist rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-weathered-wood" />
                </button>
              </div>
              <p className="text-weathered-wood mt-2">
                Comprehensive data management interface with advanced filtering, bulk operations, and detailed analytics.
              </p>
            </div>
            
            <HuntDataManagement 
              hunts={hunts}
              onHuntUpdate={loadData}
              onHuntDelete={loadData}
            />
          </div>
        )}
      </div>
    </div>
  )
}
