'use client'

// src/components/modals/ModalSystem.tsx
// Centralized modal system for hunt logging and data displays

import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, Target, MapPin, Eye, Calendar } from 'lucide-react'
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

type ModalType = 'hunt-form' | 'stands' | 'hunts' | 'sightings' | 'harvests' | null

interface ModalContextType {
  currentModal: ModalType
  showModal: (type: ModalType) => void
  hideModal: () => void
  refreshData: () => void
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

  const refreshData = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      await Promise.all([
        loadStands(),
        loadHunts(),
        loadSightings(),
        loadHarvests()
      ])
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStands = async () => {
    try {
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) throw error

      // Get usage statistics for each stand
      const { data: huntCounts } = await supabase
        .from('hunt_logs')
        .select('stand_id, hunt_date')
        .not('stand_id', 'is', null)

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
    } catch (err) {
      console.error('Error loading stands:', err)
    }
  }

  const loadHunts = async () => {
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
        .limit(50)

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

      const enrichedHunts = hunts?.map(hunt => ({
        ...hunt,
        sightings_count: sightingsCounts[hunt.id] || 0
      })) || []

      setHunts(enrichedHunts)
    } catch (err) {
      console.error('Error loading hunts:', err)
    }
  }

  const loadSightings = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('hunt_sightings')
        .select(`
          id,
          animal_type,
          count,
          gender,
          behavior,
          time_observed,
          hunt_logs!inner (
            hunt_date,
            member_id,
            stands (name)
          )
        `)
        .eq('hunt_logs.member_id', user.id)
        .order('hunt_logs.hunt_date', { ascending: false })
        .limit(100)

      if (error) throw error

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

      setSightings(formattedSightings)
    } catch (err) {
      console.error('Error loading sightings:', err)
    }
  }

  const loadHarvests = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('hunt_harvests')
        .select(`
          id,
          animal_type,
          gender,
          estimated_weight,
          shot_distance_yards,
          hunt_logs!inner (
            hunt_date,
            member_id,
            stands (name)
          )
        `)
        .eq('hunt_logs.member_id', user.id)
        .order('hunt_logs.hunt_date', { ascending: false })
        .limit(50)

      if (error) throw error

      setHarvests(data || [])
    } catch (err) {
      console.error('Error loading harvests:', err)
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

      setSuccess(`Hunt logged successfully! ${formData.sightings?.length || 0} sightings added.`)
      hideModal()
      await refreshData()

    } catch (err) {
      console.error('Error saving hunt log:', err)
      setError('Failed to save hunt log. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ===========================================
  // MODAL CONTENT COMPONENTS
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
        {stands.map(stand => (
          <div key={stand.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-4 h-4 text-olive-green" />
                  <h4 className="font-medium text-forest-shadow">{stand.name}</h4>
                  {stand.type && (
                    <span className="bg-olive-green/10 text-olive-green px-2 py-0.5 rounded text-xs">
                      {stand.type.replace('_', ' ')}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    stand.active ? 'bg-bright-orange/10 text-bright-orange' : 'bg-clay-earth/10 text-clay-earth'
                  }`}>
                    {stand.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {stand.description && (
                  <p className="text-sm text-weathered-wood mb-2">{stand.description}</p>
                )}
                <div className="flex items-center space-x-4 text-xs text-weathered-wood">
                  <span>{stand.hunt_count || 0} hunts</span>
                  {stand.last_used && (
                    <span>Last used: {new Date(stand.last_used).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
        {hunts.map(hunt => (
          <div key={hunt.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-olive-green" />
                  <h4 className="font-medium text-forest-shadow">{hunt.stands?.name || 'Unknown Stand'}</h4>
                  <span className="bg-olive-green/10 text-olive-green px-2 py-0.5 rounded text-xs">
                    {hunt.hunt_type || 'AM'}
                  </span>
                </div>
                <div className="text-sm text-weathered-wood mb-2">
                  {new Date(hunt.hunt_date).toLocaleDateString()} 
                  {hunt.start_time && hunt.end_time && (
                    <span> • {hunt.start_time} - {hunt.end_time}</span>
                  )}
                </div>
                {hunt.notes && (
                  <p className="text-sm text-weathered-wood mb-2 italic">"{hunt.notes}"</p>
                )}
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`font-medium ${hunt.harvest_count > 0 ? 'text-burnt-orange' : 'text-weathered-wood'}`}>
                    {hunt.harvest_count} harvest{hunt.harvest_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-olive-green">
                    {hunt.sightings_count || 0} sighting{hunt.sightings_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
        {sightings.map(sighting => (
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
        ))}
      </div>
    </div>
  )

  const HarvestsModal = () => (
    <div className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-forest-shadow">Harvest Records</h2>
        <button onClick={hideModal} className="p-2 hover:bg-morning-mist rounded-lg">
          <X className="w-5 h-5 text-weathered-wood" />
        </button>
      </div>
      
      <div className="space-y-3">
        {harvests.map(harvest => (
          <div key={harvest.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-burnt-orange" />
                  <h4 className="font-medium text-forest-shadow">
                    {harvest.animal_type}
                    {harvest.gender && ` (${harvest.gender})`}
                  </h4>
                </div>
                <div className="text-sm text-weathered-wood mb-1">
                  {harvest.hunt_logs.stands?.name} • {new Date(harvest.hunt_logs.hunt_date).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-4 text-sm text-weathered-wood">
                  {harvest.estimated_weight && <span>{harvest.estimated_weight} lbs</span>}
                  {harvest.shot_distance_yards && <span>{harvest.shot_distance_yards} yards</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ===========================================
  // MODAL BACKDROP & CONTAINER
  // ===========================================

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-forest-shadow/50 backdrop-blur-sm"
        onClick={hideModal}
      />
      <div className="relative bg-white rounded-lg club-shadow max-w-[90vw] overflow-hidden">
        <div className="p-6">
          {children}
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
        <div className="fixed top-4 right-4 z-50 p-3 bg-clay-earth/90 text-white rounded-lg club-shadow">
          {error}
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-bright-orange/90 text-white rounded-lg club-shadow">
          {success}
        </div>
      )}

      {/* Modals */}
      {currentModal === 'hunt-form' && (
        <Modal>
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
        <Modal>
          <StandsModal />
        </Modal>
      )}

      {currentModal === 'hunts' && (
        <Modal>
          <HuntsModal />
        </Modal>
      )}

      {currentModal === 'sightings' && (
        <Modal>
          <SightingsModal />
        </Modal>
      )}

      {currentModal === 'harvests' && (
        <Modal>
          <HarvestsModal />
        </Modal>
      )}
    </ModalContext.Provider>
  )
}