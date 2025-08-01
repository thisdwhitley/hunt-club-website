// src/components/modals/ModalSystem.tsx

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, Calendar, MapPin, Eye, Target, Clock, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import HuntEntryForm from '@/components/hunt-logging/HuntEntryForm'
import { type HuntFormData } from '@/lib/hunt-logging/hunt-validation'

// ===========================================
// TYPES & INTERFACES
// ===========================================

interface Stand {
  id: string
  name: string
  description?: string | null
  type?: string
  active: boolean
  latitude?: number | null
  longitude?: number | null
  last_used?: string | null
  hunt_count?: number
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

interface Sighting {
  id: string
  animal_type: string
  count: number
  gender?: string | null
  behavior?: string | null
  time_observed?: string | null
  hunt_date: string
  stand_name: string
}

type ModalType = 'hunt-form' | 'stands' | 'hunts' | 'sightings' | 'harvests' | 'login' | null

interface ModalContextType {
  currentModal: ModalType
  showModal: (type: ModalType) => void
  hideModal: () => void
  refreshData: () => void
}

// Modal size system - standardized across the app
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const modalSizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',      // Simple forms, alerts, confirmations
  md: 'max-w-md',      // Standard forms, login modal
  lg: 'max-w-lg',      // Hunt logging, complex forms
  xl: 'max-w-xl',      // Detailed forms, extended content
  full: 'max-w-4xl'    // Hunt details, property views, wide tables
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Helper function to extract meaningful error messages from various error types
const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.message) {
    return error.message
  }
  
  if (error?.details) {
    return error.details
  }
  
  if (error?.hint) {
    return error.hint
  }
  
  if (error?.code) {
    return `Database error (${error.code}): ${error.message || 'Unknown error'}`
  }
  
  // For Supabase errors that might have nested properties
  if (error?.error) {
    return extractErrorMessage(error.error)
  }
  
  // If we still can't extract a message, stringify the error
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return 'Unknown error occurred'
  }
}

// ===========================================
// CONTEXT
// ===========================================

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

// ===========================================
// PROVIDER COMPONENT
// ===========================================

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalType>(null)
  const [stands, setStands] = useState<Stand[]>([])
  const [hunts, setHunts] = useState<HuntLog[]>([])
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [harvests, setHarvests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { user } = useAuth()
  const supabase = createClient()

  // Load all data when user changes
  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      // Clear data when user logs out
      setStands([])
      setHunts([])
      setSightings([])
      setHarvests([])
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

  // UPDATED: Add body scroll management for mobile modals
  useEffect(() => {
    if (currentModal) {
      // Prevent body scroll when modal is open (mobile fix)
      document.body.style.overflow = 'hidden'
      // Prevent viewport zoom on input focus (iOS fix)
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      }
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset'
      // Restore normal viewport behavior
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }
    }
  }, [currentModal])

  // ===========================================
  // DATA LOADING
  // ===========================================

  const refreshData = async () => {
    if (!user) {
      console.log('No user found, skipping data refresh')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Starting data refresh for user:', user.id)
      
      await Promise.all([
        loadStands(),
        loadHunts(),
        loadSightings(),
        loadHarvests()
      ])
      
      console.log('Data refresh completed successfully')
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      console.error('Error refreshing data:', errorMessage)
      setError('Failed to load data: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStands = async () => {
    try {
      console.log('Loading stands...')
      
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) {
        console.error('Supabase error loading stands:', error)
        throw error
      }

      console.log(`Loaded ${data?.length || 0} stands`)

      // Get usage statistics for each stand
      const { data: huntCounts, error: huntCountsError } = await supabase
        .from('hunt_logs')
        .select('stand_id, hunt_date')
        .not('stand_id', 'is', null)

      if (huntCountsError) {
        console.warn('Error loading hunt counts:', extractErrorMessage(huntCountsError))
        // Continue without hunt counts rather than failing completely
      }

      const standStats = huntCounts?.reduce((acc, hunt) => {
        if (!acc[hunt.stand_id]) {
          acc[hunt.stand_id] = { count: 0, lastUsed: hunt.hunt_date }
        }
        acc[hunt.stand_id].count++
        if (hunt.hunt_date > acc[hunt.stand_id].lastUsed) {
          acc[hunt.stand_id].lastUsed = hunt.hunt_date
        }
        return acc
      }, {} as Record<string, { count: number; lastUsed: string }>) || {}

      const enrichedStands = data?.map(stand => ({
        ...stand,
        hunt_count: standStats[stand.id]?.count || 0,
        last_used: standStats[stand.id]?.lastUsed || null
      })) || []

      setStands(enrichedStands)
      console.log('Stands loaded successfully')
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      console.error('Error loading stands:', errorMessage)
      // Don't throw - allow other data loading to continue
      setStands([])
    }
  }

  const loadHunts = async () => {
    if (!user) {
      console.log('No user, skipping hunt loading')
      return
    }

    try {
      console.log('Loading hunts for user:', user.id)
      
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
        .limit(50)

      if (error) {
        console.error('Supabase error loading hunts:', error)
        throw error
      }

      console.log(`Loaded ${hunts?.length || 0} hunts`)

      // Get sightings count for each hunt
      const huntIds = hunts?.map(h => h.id) || []
      let sightingsCounts: { [key: string]: number } = {}
      
      if (huntIds.length > 0) {
        const { data: sightings, error: sightingsError } = await supabase
          .from('hunt_sightings')
          .select('hunt_log_id')
          .in('hunt_log_id', huntIds)
        
        if (sightingsError) {
          console.warn('Error loading sightings counts:', extractErrorMessage(sightingsError))
          // Continue without sightings counts
        } else if (sightings) {
          sightingsCounts = sightings.reduce((acc, s) => {
            acc[s.hunt_log_id] = (acc[s.hunt_log_id] || 0) + 1
            return acc
          }, {} as { [key: string]: number })
        }
      }

      const enrichedHunts = hunts?.map(hunt => ({
        ...hunt,
        sightings_count: sightingsCounts[hunt.id] || 0
      })) || []

      setHunts(enrichedHunts)
      console.log('Hunts loaded successfully')
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      console.error('Error loading hunts:', errorMessage)
      setHunts([])
    }
  }

  const loadSightings = async () => {
    if (!user) {
      console.log('No user, skipping sightings loading')
      return
    }

    try {
      console.log('Loading sightings for user:', user.id)
      
      const { data, error } = await supabase
        .from('hunt_sightings')
        .select(`
          id,
          animal_type,
          count,
          gender,
          behavior,
          time_observed,
          created_at,
          hunt_logs!inner (
            hunt_date,
            member_id,
            stands (name)
          )
        `)
        .eq('hunt_logs.member_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Supabase error loading sightings:', error)
        throw error
      }

      console.log(`Loaded ${data?.length || 0} sightings`)

      const formattedSightings = data?.map(sighting => ({
        id: sighting.id,
        animal_type: sighting.animal_type,
        count: sighting.count,
        gender: sighting.gender,
        behavior: sighting.behavior,
        time_observed: sighting.time_observed,
        hunt_date: sighting.hunt_logs.hunt_date,
        stand_name: sighting.hunt_logs.stands?.name || 'Unknown'
      })) || []

      // Sort by hunt_date in JavaScript since we can't do it in the SQL query
      formattedSightings.sort((a, b) => new Date(b.hunt_date).getTime() - new Date(a.hunt_date).getTime())

      setSightings(formattedSightings)
      console.log('Sightings loaded successfully')
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      console.error('Error loading sightings:', errorMessage)
      setSightings([])
    }
  }

  const loadHarvests = async () => {
    if (!user) {
      console.log('No user, skipping harvests loading')
      return
    }

    try {
      console.log('Loading harvests for user:', user.id)
      
      const { data, error } = await supabase
        .from('hunt_harvests')
        .select(`
          id,
          animal_type,
          gender,
          estimated_weight,
          shot_distance_yards,
          created_at,
          hunt_logs!inner (
            hunt_date,
            member_id,
            stands (name)
          )
        `)
        .eq('hunt_logs.member_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Supabase error loading harvests:', error)
        throw error
      }

      console.log(`Loaded ${data?.length || 0} harvests`)

      // Sort by hunt_date in JavaScript since we can't do it in the SQL query
      const sortedHarvests = (data || []).sort((a, b) => 
        new Date(b.hunt_logs.hunt_date).getTime() - new Date(a.hunt_logs.hunt_date).getTime()
      )

      setHarvests(sortedHarvests)
      console.log('Harvests loaded successfully')
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      console.error('Error loading harvests:', errorMessage)
      setHarvests([])
    }
  }

  // ===========================================
  // MODAL HANDLERS
  // ===========================================

  const showModal = (type: ModalType) => {
    setCurrentModal(type)
    setError(null)
    setSuccess(null)
  }

  const hideModal = () => {
    setCurrentModal(null)
    setError(null)
    setSuccess(null)
  }

  const handleHuntSubmit = async (formData: HuntFormData) => {
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
        harvest_count: formData.had_harvest ? (formData.harvest_count || 1) : 0,
        hunt_type: formData.hunt_type || 'AM',
        notes: formData.notes || null,
        had_harvest: formData.had_harvest || false
      }

      const { data: huntLog, error: huntError } = await supabase
        .from('hunt_logs')
        .insert(huntData)
        .select()
        .single()

      if (huntError) throw huntError

      // Insert sightings if any
      if (formData.sightings && formData.sightings.length > 0) {
        const sightingsData = formData.sightings.map(sighting => ({
          hunt_log_id: huntLog.id,
          animal_type: sighting.animal_type,
          count: sighting.count,
          gender: sighting.gender || null,
          behavior: sighting.behavior || null,
          time_observed: sighting.time_observed || null
        }))

        const { error: sightingsError } = await supabase
          .from('hunt_sightings')
          .insert(sightingsData)

        if (sightingsError) throw sightingsError
      }

      // Insert harvest if any
      if (formData.had_harvest && formData.harvest) {
        const harvestData = {
          hunt_log_id: huntLog.id,
          animal_type: formData.harvest.animal_type,
          gender: formData.harvest.gender || null,
          estimated_weight: formData.harvest.estimated_weight || null,
          shot_distance_yards: formData.harvest.shot_distance_yards || null
        }

        const { error: harvestError } = await supabase
          .from('hunt_harvests')
          .insert(harvestData)

        if (harvestError) throw harvestError
      }

      setSuccess('Hunt logged successfully!')
      hideModal()
      await refreshData()
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      console.error('Error submitting hunt:', errorMessage)
      setError('Failed to save hunt: ' + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // ===========================================
  // MODAL COMPONENTS
  // ===========================================

  const StandsModal = () => (
    <div className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-forest-shadow">Hunting Stands</h2>
        <button onClick={hideModal} className="p-2 hover:bg-morning-mist rounded-lg">
          <X className="w-5 h-5 text-weathered-wood" />
        </button>
      </div>
      
      <div className="space-y-3">
        {stands.length === 0 ? (
          <div className="text-center py-8 text-weathered-wood">
            No stands found
          </div>
        ) : (
          stands.map(stand => (
            <div key={stand.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4 text-muted-gold" />
                    <h4 className="font-medium text-forest-shadow">{stand.name}</h4>
                    {!stand.active && (
                      <span className="px-2 py-1 text-xs bg-clay-earth/20 text-clay-earth rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {stand.description && (
                    <p className="text-sm text-weathered-wood mb-2">{stand.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-weathered-wood">
                    <span>Type: {stand.type || 'Unknown'}</span>
                    <span>Used: {stand.hunt_count || 0} times</span>
                    {stand.last_used && (
                      <span>Last: {new Date(stand.last_used).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const HuntsModal = () => (
    <div className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-forest-shadow">Recent Hunts</h2>
        <button onClick={hideModal} className="p-2 hover:bg-morning-mist rounded-lg">
          <X className="w-5 h-5 text-weathered-wood" />
        </button>
      </div>
      
      <div className="space-y-3">
        {hunts.length === 0 ? (
          <div className="text-center py-8 text-weathered-wood">
            No hunts logged yet
          </div>
        ) : (
          hunts.map(hunt => (
            <div key={hunt.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted-gold" />
                    <h4 className="font-medium text-forest-shadow">
                      {new Date(hunt.hunt_date).toLocaleDateString()}
                    </h4>
                    <span className="text-sm text-weathered-wood">
                      {hunt.hunt_type || 'AM'}
                    </span>
                  </div>
                  <div className="text-sm text-weathered-wood mb-2">
                    {hunt.stands?.name || 'Unknown Stand'}
                    {hunt.start_time && hunt.end_time && (
                      <span> • {hunt.start_time} - {hunt.end_time}</span>
                    )}
                  </div>
                  {hunt.notes && (
                    <p className="text-sm text-weathered-wood mb-2 italic">{hunt.notes}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`flex items-center space-x-1 ${
                      hunt.harvest_count > 0 ? 'text-burnt-orange' : 'text-weathered-wood'}`}>
                      <Target className="w-3 h-3" />
                      <span>{hunt.harvest_count} harvest{hunt.harvest_count !== 1 ? 's' : ''}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-olive-green">
                      <Eye className="w-3 h-3" />
                      <span>{hunt.sightings_count || 0} sighting{hunt.sightings_count !== 1 ? 's' : ''}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const SightingsModal = () => (
    <div className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-forest-shadow">Recent Sightings</h2>
        <button onClick={hideModal} className="p-2 hover:bg-morning-mist rounded-lg">
          <X className="w-5 h-5 text-weathered-wood" />
        </button>
      </div>
      
      <div className="space-y-3">
        {sightings.length === 0 ? (
          <div className="text-center py-8 text-weathered-wood">
            No sightings recorded yet
          </div>
        ) : (
          sightings.map(sighting => (
            <div key={sighting.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Eye className="w-4 h-4 text-muted-gold" />
                    <h4 className="font-medium text-forest-shadow">
                      {sighting.count} {sighting.animal_type}
                      {sighting.gender && sighting.gender !== 'Unknown' && ` (${sighting.gender})`}
                    </h4>
                  </div>
                  <div className="text-sm text-weathered-wood mb-1">
                    {sighting.stand_name} • {new Date(sighting.hunt_date).toLocaleDateString()}
                    {sighting.time_observed && ` • ${sighting.time_observed}`}
                  </div>
                  {sighting.behavior && (
                    <p className="text-sm text-weathered-wood italic">Behavior: {sighting.behavior}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const HarvestsModal = () => (
    <div className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-forest-shadow">Recent Harvests</h2>
        <button onClick={hideModal} className="p-2 hover:bg-morning-mist rounded-lg">
          <X className="w-5 h-5 text-weathered-wood" />
        </button>
      </div>
      
      <div className="space-y-3">
        {harvests.length === 0 ? (
          <div className="text-center py-8 text-weathered-wood">
            No harvests recorded yet
          </div>
        ) : (
          harvests.map(harvest => (
            <div key={harvest.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="w-4 h-4 text-muted-gold" />
                    <h4 className="font-medium text-forest-shadow">
                      {harvest.animal_type}
                      {harvest.gender && harvest.gender !== 'Unknown' && ` (${harvest.gender})`}
                    </h4>
                  </div>
                  <div className="text-sm text-weathered-wood mb-1">
                    {harvest.hunt_logs?.stands?.name || 'Unknown Stand'} • {new Date(harvest.hunt_logs?.hunt_date || harvest.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-weathered-wood">
                    {harvest.estimated_weight && (
                      <span>Weight: {harvest.estimated_weight} lbs</span>
                    )}
                    {harvest.shot_distance_yards && (
                      <span>Distance: {harvest.shot_distance_yards} yards</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const LoginModal = () => {
    const [localEmail, setLocalEmail] = useState('')
    const [localPassword, setLocalPassword] = useState('')
    const [localIsSignUp, setLocalIsSignUp] = useState(false)
    const [localLoading, setLocalLoading] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLocalLoading(true)
      setLocalError(null)

      try {
        if (localIsSignUp) {
          const { error } = await supabase.auth.signUp({
            email: localEmail,
            password: localPassword,
          })
          if (error) throw error
          setSuccess('Check your email for verification link!')
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: localEmail,
            password: localPassword,
          })
          if (error) throw error
          setSuccess('Signed in successfully!')
        }
        hideModal()
      } catch (err) {
        setLocalError(extractErrorMessage(err))
      } finally {
        setLocalLoading(false)
      }
    }

    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-forest-shadow">
            {localIsSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-weathered-wood mt-2">
            {localIsSignUp ? 'Join the hunting club' : 'Welcome back to the club'}
          </p>
        </div>

        {localError && (
          <div className="mb-4 p-3 bg-clay-earth/10 border border-clay-earth/30 rounded-lg text-clay-earth text-sm">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-forest-shadow mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              className="w-full px-3 py-2 border border-weathered-wood/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green"
              required
              disabled={localLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-forest-shadow mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className="w-full px-3 py-2 border border-weathered-wood/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green"
              required
              disabled={localLoading}
            />
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className="w-full bg-olive-green text-white py-2 px-4 rounded-lg hover:bg-pine-needle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {localLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </span>
            ) : (
              <span>{localIsSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setLocalIsSignUp(!localIsSignUp)
                setLocalError(null)
              }}
              className="text-sm text-olive-green hover:text-pine-needle transition-colors"
              disabled={localLoading}
            >
              {localIsSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ===========================================
  // MODAL BACKDROP & CONTAINER
  // ===========================================

  const Modal = ({ 
    size = 'md', 
    children 
  }: { 
    size?: ModalSize
    children: React.ReactNode 
  }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div 
        className="absolute inset-0 bg-forest-shadow/50 backdrop-blur-sm"
        onClick={hideModal}
      />
      <div className={`
        relative bg-white rounded-lg club-shadow w-full
        ${modalSizes[size]}
        max-h-[95vh] sm:max-h-[90vh]
        overflow-hidden
        sm:w-auto sm:max-w-[95vw]
      `}>
        {/* Close button - always visible */}
        <button
          onClick={hideModal}
          className="absolute top-3 right-3 z-10 p-1.5 text-weathered-wood hover:text-forest-shadow transition-colors bg-white/80 hover:bg-white rounded-full shadow-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Modal content with proper scrolling */}
        <div className="max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  // ===========================================
  // MAIN RENDER
  // ===========================================

  return (
    <ModalContext.Provider value={{ currentModal, showModal, hideModal, refreshData }}>
      {children}
      
      {/* Status Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-clay-earth/90 text-white rounded-lg club-shadow max-w-sm">
          <div className="text-sm">
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-bright-orange/90 text-white rounded-lg club-shadow max-w-sm">
          <div className="text-sm">
            {success}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed top-4 left-4 z-50 p-3 bg-olive-green/90 text-white rounded-lg club-shadow">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {currentModal === 'hunt-form' && (
        <Modal size="lg">
          <div className="max-w-md mx-auto">
            <HuntEntryForm
              stands={stands.filter(s => s.active)}
              onSubmit={handleHuntSubmit}
              onCancel={hideModal}
              isSubmitting={isLoading}
            />
          </div>
        </Modal>
      )}

      {currentModal === 'stands' && (
        <Modal size="xl">
          <StandsModal />
        </Modal>
      )}

      {currentModal === 'hunts' && (
        <Modal size="full">
          <HuntsModal />
        </Modal>
      )}

      {currentModal === 'sightings' && (
        <Modal size="xl">
          <SightingsModal />
        </Modal>
      )}

      {currentModal === 'harvests' && (
        <Modal size="xl">
          <HarvestsModal />
        </Modal>
      )}

      {currentModal === 'login' && (
        <Modal>
          <LoginModal />
        </Modal>
      )}

    </ModalContext.Provider>
  )
}