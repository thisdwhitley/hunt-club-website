'use client'

// src/app/hunt-logging/page.tsx
// Main hunt logging page with form entry and recent hunts

import React, { useState, useEffect } from 'react'
import { 
  Target, 
  Plus, 
  Calendar, 
  MapPin, 
  Eye, 
  Clock, 
  ArrowLeft,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import HuntEntryForm from '@/components/hunt-logging/HuntEntryForm'
import { HuntFormData } from '@/lib/hunt-logging/hunt-validation'

// ===========================================
// TYPES
// ===========================================

interface Stand {
  id: string
  name: string
  description?: string | null
  type?: string
  active: boolean
}

interface HuntLog {
  id: string
  hunt_date: string
  start_time?: string | null
  end_time?: string | null
  hunt_type?: string
  harvest_count: number
  notes?: string | null
  created_at: string
  stands: {
    name: string
    type?: string
  } | null
  sightings_count?: number
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function HuntLoggingPage() {
  const { user, loading: authLoading } = useAuth()
  const [stands, setStands] = useState<Stand[]>([])
  const [recentHunts, setRecentHunts] = useState<HuntLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadStands()
      loadRecentHunts()
    }
  }, [user])

  // Clear messages after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // ===========================================
  // DATA LOADING
  // ===========================================

  const loadStands = async () => {
    try {
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setStands(data || [])
    } catch (err) {
      console.error('Error loading stands:', err)
      setError('Failed to load hunting stands')
    }
  }

  const loadRecentHunts = async () => {
    if (!user) return

    try {
      const { data: hunts, error } = await supabase
        .from('hunt_logs')
        .select(`
          id,
          hunt_date,
          start_time,
          end_time,
          hunt_type,
          harvest_count,
          notes,
          created_at,
          stands (name, type)
        `)
        .eq('member_id', user.id)
        .order('hunt_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Get sightings count for each hunt
      const huntIds = hunts?.map(h => h.id) || []
      let sightingsCounts: { [key: string]: number } = {}
      
      if (huntIds.length > 0) {
        const { data: sightings } = await supabase
          .from('hunt_sightings')
          .select('hunt_log_id')
          .in('hunt_log_id', huntIds)
        
        if (sightings) {
          sightingsCounts = sightings.reduce((acc, s) => {
            acc[s.hunt_log_id] = (acc[s.hunt_log_id] || 0) + 1
            return acc
          }, {} as { [key: string]: number })
        }
      }

      // Add sightings count to hunt data
      const enrichedHunts = hunts?.map(hunt => ({
        ...hunt,
        sightings_count: sightingsCounts[hunt.id] || 0
      })) || []

      setRecentHunts(enrichedHunts)
    } catch (err) {
      console.error('Error loading recent hunts:', err)
      setError('Failed to load recent hunts')
    }
  }

  // ===========================================
  // FORM HANDLERS
  // ===========================================

  const handleFormSubmit = async (formData: HuntFormData) => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Insert hunt log
      const huntData = {
        member_id: user.id,
        stand_id: formData.stand_id,
        hunt_date: formData.hunt_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        harvest_count: formData.had_harvest ? 1 : 0,
        hunt_type: formData.hunt_type || 'AM',
        notes: formData.notes || null,
      }

      const { data: huntLog, error: huntError } = await supabase
        .from('hunt_logs')
        .insert([huntData])
        .select()
        .single()

      if (huntError) throw huntError

      // Insert sightings if any
      if (formData.sightings && formData.sightings.length > 0) {
        const sightingsData = formData.sightings.map(sighting => ({
          hunt_log_id: huntLog.id,
          animal_type: sighting.animal_type,
          count: sighting.count || 1,
          gender: sighting.gender || null,
          estimated_age: sighting.estimated_age || null,
          behavior: sighting.behavior || null,
          distance_yards: sighting.distance_yards || null,
          direction: sighting.direction || null,
          time_observed: sighting.time_observed || null,
          notes: sighting.notes || null,
        }))

        const { error: sightingsError } = await supabase
          .from('hunt_sightings')
          .insert(sightingsData)

        if (sightingsError) throw sightingsError
      }

      setSuccess(
        `Hunt log saved successfully! ${formData.sightings?.length || 0} sightings added.`
      )
      setShowForm(false)
      
      // Reload recent hunts
      await loadRecentHunts()

    } catch (err) {
      console.error('Error saving hunt log:', err)
      setError('Failed to save hunt log. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setError(null)
  }

  // ===========================================
  // RENDER HELPERS
  // ===========================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return null
    const [hour, minute] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hour), parseInt(minute))
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const renderRecentHunts = () => (
    <div className="space-y-4">
      {recentHunts.length === 0 ? (
        <div className="text-center py-8 text-weathered-wood">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No hunts logged yet</p>
          <p className="text-sm">Click "Log New Hunt" to get started</p>
        </div>
      ) : (
        recentHunts.map((hunt) => (
          <div key={hunt.id} className="bg-white rounded-lg border border-weathered-wood/20 club-shadow">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-olive-green/10 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-olive-green" />
                    </div>
                    <div>
                      <h4 className="font-medium text-forest-shadow">
                        {hunt.stands?.name || 'Unknown Stand'}
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-weathered-wood">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(hunt.hunt_date)}
                        </span>
                        {(hunt.start_time || hunt.end_time) && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(hunt.start_time)} - {formatTime(hunt.end_time)}
                          </span>
                        )}
                        {hunt.hunt_type && (
                          <span className="bg-morning-mist px-2 py-0.5 rounded text-xs">
                            {hunt.hunt_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {hunt.notes && (
                    <p className="text-sm text-weathered-wood mb-2 italic">
                      "{hunt.notes}"
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`flex items-center font-medium ${
                      hunt.harvest_count > 0 ? 'text-burnt-orange' : 'text-weathered-wood'
                    }`}>
                      <Target className="w-3 h-3 mr-1" />
                      {hunt.harvest_count} harvest{hunt.harvest_count !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center text-olive-green">
                      <Eye className="w-3 h-3 mr-1" />
                      {hunt.sightings_count || 0} sighting{hunt.sightings_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-morning-mist rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-weathered-wood" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // ===========================================
  // MAIN RENDER
  // ===========================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-olive-green border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-weathered-wood">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Target className="w-16 h-16 text-olive-green mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-forest-shadow mb-2">Hunt Logging</h1>
          <p className="text-weathered-wood mb-6">
            Sign in to log your hunts and track your success over time.
          </p>
          <a 
            href="/auth"
            className="inline-block bg-burnt-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors"
          >
            Sign In to Continue
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Target className="w-6 h-6 mr-2" />
                Hunt Logging
              </h1>
              <p className="text-olive-green/80 text-sm">
                Track your hunts, sightings, and success rates
              </p>
            </div>
            <a 
              href="/"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-clay-earth/10 border border-clay-earth/20 rounded-lg text-clay-earth text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-bright-orange/10 border border-bright-orange/20 rounded-lg text-bright-orange text-sm">
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Form or Quick Actions */}
          <div className="space-y-6">
            {showForm ? (
              <div>
                <div className="bg-white rounded-lg club-shadow overflow-hidden">
                  <HuntEntryForm
                    stands={stands}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isSubmitting={isLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
                    <div className="text-2xl font-bold text-burnt-orange">
                      {recentHunts.reduce((sum, hunt) => sum + hunt.harvest_count, 0)}
                    </div>
                    <div className="text-sm text-weathered-wood">Total Harvests</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
                    <div className="text-2xl font-bold text-olive-green">
                      {recentHunts.length}
                    </div>
                    <div className="text-sm text-weathered-wood">Total Hunts</div>
                  </div>
                </div>

                {/* Log New Hunt Button */}
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-burnt-orange text-white py-4 rounded-lg font-medium hover:bg-clay-earth transition-colors flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Log New Hunt
                </button>

                {/* Quick Filters */}
                <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
                  <h3 className="font-medium text-forest-shadow mb-3">Quick Filters</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="text-left p-2 hover:bg-morning-mist rounded text-sm text-weathered-wood">
                      This Week
                    </button>
                    <button className="text-left p-2 hover:bg-morning-mist rounded text-sm text-weathered-wood">
                      This Month
                    </button>
                    <button className="text-left p-2 hover:bg-morning-mist rounded text-sm text-weathered-wood">
                      Successful Hunts
                    </button>
                    <button className="text-left p-2 hover:bg-morning-mist rounded text-sm text-weathered-wood">
                      By Stand
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recent Hunts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-forest-shadow">Recent Hunts</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                  <Search className="w-4 h-4 text-weathered-wood" />
                </button>
                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-weathered-wood" />
                </button>
              </div>
            </div>
            {renderRecentHunts()}
          </div>
        </div>
      </div>
    </div>
  )
}
