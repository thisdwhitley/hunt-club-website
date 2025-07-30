'use client'

// src/components/modals/ModalSystem.tsx
// Centralized modal system for hunt logging and data displays

import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, Target, MapPin, Eye, Calendar, EyeOff, Loader2, LogIn } from 'lucide-react'
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

type ModalType = 'hunt-form' | 'stands' | 'hunts' | 'sightings' | 'harvests' | 'login' | null

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
//   // extending to Login modal
//   const [loginEmail, setLoginEmail] = useState('')
//   const [loginPassword, setLoginPassword] = useState('')
//   const [showPassword, setShowPassword] = useState(false)
//   const [isSignUp, setIsSignUp] = useState(false)

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

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!loginEmail || !loginPassword) {
//         setError('Please fill in all fields')
//         return
//     }

//     try {
//         setIsLoading(true)
//         setError(null)

//         if (isSignUp) {
//         const { error } = await supabase.auth.signUp({
//             email: loginEmail,
//             password: loginPassword,
//             options: {
//             data: {
//                 full_name: loginEmail.split('@')[0],
//             },
//             },
//         })
        
//         if (error) throw error
        
//         // After successful signup, sign them in
//         const { error: signInError } = await supabase.auth.signInWithPassword({
//             email: loginEmail,
//             password: loginPassword,
//         })
        
//         if (signInError) throw signInError
        
//         } else {
//         const { error } = await supabase.auth.signInWithPassword({
//             email: loginEmail,
//             password: loginPassword,
//         })
        
//         if (error) throw error
//         }
        
//         setSuccess(isSignUp ? 'Account created successfully!' : 'Signed in successfully!')
//         hideModal()
        
//         // Clear form
//         setLoginEmail('')
//         setLoginPassword('')
//         setShowPassword(false)
//         setIsSignUp(false)
        
//     } catch (err: any) {
//         setError(err.message || 'Authentication failed')
//     } finally {
//         setIsLoading(false)
//     }
//   }

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
  // LOGIN MODAL COMPONENT - FIXED VERSION
  // ===========================================

  const LoginModal = () => {
    // LOCAL state management to prevent parent re-renders
    const [localEmail, setLocalEmail] = useState('')
    const [localPassword, setLocalPassword] = useState('')
    const [localShowPassword, setLocalShowPassword] = useState(false)
    const [localIsSignUp, setLocalIsSignUp] = useState(false)
    const [localLoading, setLocalLoading] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!localEmail || !localPassword) {
        setLocalError('Please fill in all fields')
        return
      }

      try {
        setLocalLoading(true)
        setLocalError(null)

        if (localIsSignUp) {
          const { error } = await supabase.auth.signUp({
            email: localEmail,
            password: localPassword,
            options: {
              data: {
                full_name: localEmail.split('@')[0],
              },
            },
          })
          
          if (error) throw error
          
          // After successful signup, sign them in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: localEmail,
            password: localPassword,
          })
          
          if (signInError) throw signInError
          
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: localEmail,
            password: localPassword,
          })
          
          if (error) throw error
        }
        
        // setSuccess(localIsSignUp ? 'Account created successfully!' : 'Signed in successfully!')
        // hideModal()
        
        // After successful login in ModalSystem.tsx:
        const redirect = sessionStorage.getItem('loginRedirect')
        if (redirect) {
            sessionStorage.removeItem('loginRedirect')
            window.location.href = redirect
        } else {
            // Normal success flow
            setSuccess(localIsSignUp ? 'Account created successfully!' : 'Signed in successfully!')
            hideModal()
        }

        // Clear form
        setLocalEmail('')
        setLocalPassword('')
        setLocalShowPassword(false)
        setLocalIsSignUp(false)
        
      } catch (err: any) {
        setLocalError(err.message || 'Authentication failed')
      } finally {
        setLocalLoading(false)
      }
    }

    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-olive-green rounded-lg flex items-center justify-center">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-forest-shadow">
                {localIsSignUp ? 'Join the Club' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-weathered-wood">
                {localIsSignUp ? 'Create your account' : 'Sign in to continue'}
              </p>
            </div>
          </div>
          <button onClick={hideModal} className="p-2 hover:bg-morning-mist rounded-lg">
            <X className="w-5 h-5 text-weathered-wood" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {localError && (
            <div className="bg-clay-earth/10 border border-clay-earth/20 text-clay-earth px-4 py-3 rounded-lg text-sm">
              {localError}
            </div>
          )}

          <div>
            <label htmlFor="modal-email" className="block text-sm font-medium text-forest-shadow mb-1">
              Email Address
            </label>
            <input
              id="modal-email"
              type="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              className="w-full px-3 py-2 border border-weathered-wood/30 rounded-lg bg-morning-mist/50 focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              placeholder="your@email.com"
              required
              disabled={localLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-sm font-medium text-forest-shadow mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="modal-password"
                type={localShowPassword ? "text" : "password"}
                value={localPassword}
                onChange={(e) => setLocalPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-weathered-wood/30 rounded-lg bg-morning-mist/50 focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                placeholder="Enter your password"
                required
                disabled={localLoading}
                autoComplete={localIsSignUp ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setLocalShowPassword(!localShowPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={localLoading}
              >
                {localShowPassword ? (
                  <EyeOff className="w-4 h-4 text-weathered-wood" />
                ) : (
                  <Eye className="w-4 h-4 text-weathered-wood" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className="w-full bg-olive-green hover:bg-pine-needle text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {localLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{localIsSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </>
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

  // UPDATED: Mobile-optimized modal backdrop & container
  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-forest-shadow/50 backdrop-blur-sm"
        onClick={hideModal}
      />
      <div className="relative bg-white rounded-lg club-shadow max-w-[90vw] max-h-[90vh] overflow-hidden w-full sm:w-auto">
        <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
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

      {currentModal === 'login' && (
        <Modal>
            <LoginModal />
        </Modal>
      )}

    </ModalContext.Provider>
  )
}