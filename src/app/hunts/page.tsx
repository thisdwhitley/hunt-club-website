// src/app/hunts/page.tsx
// Hunt management page - works with existing Navigation component

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { huntService, type HuntWithDetails, type HuntStats, type HuntFilters } from '@/lib/hunt-logging/hunt-service'
import { HuntDetailsModal } from '@/components/hunt-logging/HuntDetailsModal'
import StandCard from '@/components/stands/StandCard'
import type { Stand } from '@/lib/database/stands'
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
  ChevronRight
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
  const [selectedHuntId, setSelectedHuntId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch data on component mount and when filters change
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [huntsData, statsData] = await Promise.all([
        huntService.getHunts(filters),
        huntService.getHuntStats()
      ])
      
      setHunts(huntsData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading hunt data:', err)
      setError('Failed to load hunt data. Please check the console for details.')
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
      hunt.member?.full_name?.toLowerCase().includes(searchLower) ||
      hunt.member?.email?.toLowerCase().includes(searchLower) ||
      hunt.notes?.toLowerCase().includes(searchLower) ||
      hunt.game_type?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    // Fix timezone issue by parsing date as local date, not UTC
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDateParts = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return {
      day: day,
      month: date.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set'
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

  const handleViewHunt = (huntId: string) => {
    setSelectedHuntId(huntId)
    setShowDetails(true)
  }

  const exportHunts = () => {
    // Basic CSV export functionality
    const csvContent = [
      ['Date', 'Hunter', 'Stand', 'Start Time', 'End Time', 'Harvests', 'Sightings', 'Notes'],
      ...filteredHunts.map(hunt => [
        hunt.hunt_date,
        hunt.member?.full_name || hunt.member?.email || 'Unknown',
        hunt.stand?.name || '',
        hunt.start_time || '',
        hunt.end_time || '',
        hunt.harvest_count || 0,
        hunt.sightings?.length || 0,
        hunt.notes || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hunt-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="bg-white rounded-lg club-shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-forest-shadow mb-4">Authentication Required</h2>
          <p className="text-weathered-wood">Please sign in to access hunt management.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-morning-mist">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-weathered-wood/20 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg h-96"></div>
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
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-white text-olive-green border border-olive-green rounded-lg hover:bg-olive-green hover:text-white transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics Cards - Removed Success Rate */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Total Hunts</p>
                  <p className="text-3xl font-bold text-forest-shadow">{stats.totalHunts}</p>
                  <p className="text-sm text-olive-green">This season: {stats.thisSeason.hunts}</p>
                </div>
                <Target className="w-8 h-8 text-olive-green" />
              </div>
            </div>

            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Total Harvests</p>
                  <p className="text-3xl font-bold text-forest-shadow">{stats.totalHarvests}</p>
                  <p className="text-sm text-olive-green">This season: {stats.thisSeason.harvests}</p>
                </div>
                <Trophy className="w-8 h-8 text-burnt-orange" />
              </div>
            </div>

            <div className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Total Sightings</p>
                  <p className="text-3xl font-bold text-forest-shadow">{stats.totalSightings}</p>
                  <p className="text-sm text-olive-green">This season: {stats.thisSeason.sightings}</p>
                </div>
                <Binoculars className="w-8 h-8 text-pine-needle" />
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg club-shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-forest-shadow">Filter Hunts</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-weathered-wood hover:text-forest-shadow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
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
              className="w-full pl-10 pr-4 py-3 border border-weathered-wood/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
            />
          </div>
        </div>

        {/* Desktop: Side-by-side layout for Recent Hunts and Most Hunted Stands */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Hunt List - Compact Design with Alternating Rows */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Recent Hunts ({filteredHunts.length})
              </h2>
            </div>

            <div className="divide-y divide-weathered-wood/10">
              {filteredHunts.length === 0 ? (
                <div className="p-8 text-center">
                  <Target className="w-12 h-12 text-weathered-wood/50 mx-auto mb-4" />
                  <p className="text-weathered-wood">
                    {hunts.length === 0 ? 'No hunts logged yet' : 'No hunts found matching your criteria'}
                  </p>
                </div>
              ) : (
                filteredHunts.slice(0, 8).map((hunt, index) => (
                  <div 
                    key={hunt.id} 
                    onClick={() => handleViewHunt(hunt.id)}
                    className={`p-3 hover:bg-morning-mist/70 transition-all duration-200 cursor-pointer group border-l-4 border-transparent hover:border-olive-green hover:shadow-sm ${
                      index % 2 === 0 ? 'bg-white' : 'bg-morning-mist/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side - Main hunt info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Date */}
                        <div className="text-center min-w-[50px] flex-shrink-0">
                          <div className="text-lg font-bold text-forest-shadow">
                            {getDateParts(hunt.hunt_date).day}
                          </div>
                          <div className="text-xs text-weathered-wood uppercase">
                            {getDateParts(hunt.hunt_date).month}
                          </div>
                        </div>

                        {/* Hunt Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <MapPin className="w-3 h-3 text-weathered-wood" />
                              <span className="font-medium text-forest-shadow text-sm truncate">
                                {hunt.stand?.name || 'Unknown Stand'}
                              </span>
                            </div>
                            
                            {hunt.start_time && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <Clock className="w-3 h-3 text-weathered-wood" />
                                <span className="text-xs text-weathered-wood">
                                  {formatTime(hunt.start_time)}
                                  {hunt.end_time && ` - ${formatTime(hunt.end_time)}`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-weathered-wood truncate">
                              Hunter: {hunt.member?.full_name || hunt.member?.email || 'Unknown'}
                            </div>

                            {hunt.notes && (
                              <p className="text-xs text-weathered-wood ml-2 truncate max-w-xs">
                                {hunt.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side - Status indicators */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {hunt.harvest_count > 0 && (
                          <div className="flex items-center space-x-1 bg-burnt-orange/10 text-burnt-orange px-2 py-1 rounded-full">
                            <Trophy className="w-3 h-3" />
                            <span className="text-xs font-medium">{hunt.harvest_count}</span>
                          </div>
                        )}

                        {hunt.sightings && hunt.sightings.length > 0 && (
                          <div className="flex items-center space-x-1 bg-pine-needle/10 text-pine-needle px-2 py-1 rounded-full">
                            <Binoculars className="w-3 h-3" />
                            <span className="text-xs font-medium">{hunt.sightings.length}</span>
                          </div>
                        )}

                        <ChevronRight className="w-4 h-4 text-weathered-wood group-hover:text-olive-green transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {filteredHunts.length > 8 && (
                <div className="p-3 text-center border-t border-weathered-wood/10">
                  <p className="text-sm text-weathered-wood">
                    Showing first 8 hunts. Use filters or search to find specific hunts.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Most Hunted Stands - Using Compact StandCard Components with Ranking Box */}
          {stats && stats.topStands.length > 0 && (
            <div className="bg-white rounded-lg club-shadow">
              <div className="p-4 border-b border-weathered-wood/10">
                <h2 className="text-lg font-semibold text-forest-shadow">
                  Most Hunted Stands
                </h2>
              </div>
              
              <div className="p-4 space-y-3">
                {stats.topStands.map((stand, index) => (
                  <div key={stand.id} className="flex items-center space-x-3">
                    {/* Ranking Box - Similar to calendar dates */}
                    <div className="text-center min-w-[50px] flex-shrink-0">
                      <div className="text-lg font-bold text-olive-green">
                        #{index + 1}
                      </div>
                      <div className="text-xs text-weathered-wood">
                        {stand.hunt_count} hunt{stand.hunt_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    {/* StandCard */}
                    <div className="flex-1">
                      <StandCard
                        stand={stand}
                        mode="compact"
                        showActions={false}
                        showStats={false}
                        showLocation={false}
                      />
                    </div>
                  </div>
                ))}
                
                {stats.topStands.length === 0 && (
                  <div className="p-8 text-center">
                    <Target className="w-12 h-12 text-weathered-wood/50 mx-auto mb-4" />
                    <p className="text-weathered-wood">No stand data available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hunt Details Modal */}
        <HuntDetailsModal
          huntId={selectedHuntId}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false)
            setSelectedHuntId(null)
          }}
        />
      </div>
    </div>
  )
}