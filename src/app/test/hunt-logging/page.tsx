'use client'

// src/test/hunt-logging/page.tsx
// Comprehensive test page for hunt logging form with mobile preview and cleanup

import React, { useState, useEffect } from 'react'
import { Trash2, Smartphone, Monitor, RefreshCw, Database, TestTube, AlertTriangle, CheckCircle, Calendar, MapPin } from 'lucide-react'
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
}

interface TestHuntLog {
  id: string
  hunt_date: string
  stand_name: string
  harvest_count: number
  notes?: string
  created_at: string
  sightings_count?: number
}

interface TestStats {
  total_hunts: number
  total_sightings: number
  total_harvests: number
  test_session_start: string
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function HuntLoggingTestPage() {
  const { user, loading: authLoading } = useAuth()
  const [stands, setStands] = useState<Stand[]>([])
  const [testHunts, setTestHunts] = useState<TestHuntLog[]>([])
  const [testStats, setTestStats] = useState<TestStats | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const supabase = createClient()

  // Load stands and test data on mount
  useEffect(() => {
    if (user) {
      loadStands()
      loadTestData()
      initializeTestSession()
    }
  }, [user])

  // ===========================================
  // DATA LOADING FUNCTIONS
  // ===========================================

  const loadStands = async () => {
    try {
      setLoadingText('Loading hunting stands...')
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) throw error

      setStands(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading stands:', err)
      setError('Failed to load stands. Check console for details.')
    } finally {
      setLoadingText('')
    }
  }

  const loadTestData = async () => {
    if (!user) return

    try {
      setLoadingText('Loading test hunt logs...')
      
      // Get hunt logs from current session (today)
      const today = new Date().toISOString().split('T')[0]
      
      const { data: hunts, error: huntsError } = await supabase
        .from('hunt_logs')
        .select(`
          id,
          hunt_date,
          harvest_count,
          notes,
          created_at,
          stands (name)
        `)
        .eq('member_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })

      if (huntsError) throw huntsError

      // Get sightings count for each hunt
      const huntIds = hunts?.map(h => h.id) || []
      let sightingsCounts: { [key: string]: number } = {}
      
      if (huntIds.length > 0) {
        const { data: sightings, error: sightingsError } = await supabase
          .from('hunt_sightings')
          .select('hunt_log_id')
          .in('hunt_log_id', huntIds)
        
        if (!sightingsError && sightings) {
          sightingsCounts = sightings.reduce((acc, s) => {
            acc[s.hunt_log_id] = (acc[s.hunt_log_id] || 0) + 1
            return acc
          }, {} as { [key: string]: number })
        }
      }

      // Transform data for display
      const testHunts: TestHuntLog[] = hunts?.map(hunt => ({
        id: hunt.id,
        hunt_date: hunt.hunt_date,
        stand_name: hunt.stands?.name || 'Unknown Stand',
        harvest_count: hunt.harvest_count || 0,
        notes: hunt.notes,
        created_at: hunt.created_at,
        sightings_count: sightingsCounts[hunt.id] || 0
      })) || []

      setTestHunts(testHunts)
      setError(null)
    } catch (err) {
      console.error('Error loading test data:', err)
      setError('Failed to load test data. Check console for details.')
    } finally {
      setLoadingText('')
    }
  }

  const initializeTestSession = () => {
    const sessionStart = sessionStorage.getItem('hunt_test_session_start')
    if (!sessionStart) {
      sessionStorage.setItem('hunt_test_session_start', new Date().toISOString())
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
      setLoadingText('Saving hunt log...')
      setError(null)

      // Insert hunt log
      const huntData = {
        member_id: user.id,
        stand_id: formData.stand_id,
        hunt_date: formData.hunt_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        harvest_count: formData.had_harvest ? 1 : 0, // Convert boolean to count for database
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
        setLoadingText('Saving sightings...')
        
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

      setSuccess(`Hunt log saved successfully! ${formData.sightings?.length || 0} sightings added.`)
      setShowForm(false)
      
      // Reload test data
      await loadTestData()
      updateTestStats()

    } catch (err) {
      console.error('Error saving hunt log:', err)
      setError('Failed to save hunt log. Check console for details.')
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setError(null)
  }

  // ===========================================
  // CLEANUP FUNCTIONS
  // ===========================================

  const cleanupTestData = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'This will delete ALL hunt logs and sightings created today during testing. Are you sure?'
    )
    
    if (!confirmed) return

    try {
      setIsLoading(true)
      setLoadingText('Cleaning up test data...')
      setError(null)

      const today = new Date().toISOString().split('T')[0]

      // Delete hunt logs (cascade will handle sightings and harvests)
      const { error: deleteError } = await supabase
        .from('hunt_logs')
        .delete()
        .eq('member_id', user.id)
        .gte('created_at', `${today}T00:00:00`)

      if (deleteError) throw deleteError

      setSuccess('Test data cleaned up successfully!')
      setTestHunts([])
      updateTestStats()

    } catch (err) {
      console.error('Error cleaning up test data:', err)
      setError('Failed to cleanup test data. Check console for details.')
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  const updateTestStats = () => {
    const sessionStart = sessionStorage.getItem('hunt_test_session_start') || new Date().toISOString()
    
    setTestStats({
      total_hunts: testHunts.length,
      total_sightings: testHunts.reduce((sum, hunt) => sum + (hunt.sightings_count || 0), 0),
      total_harvests: testHunts.reduce((sum, hunt) => sum + hunt.harvest_count, 0),
      test_session_start: sessionStart
    })
  }

  useEffect(() => {
    updateTestStats()
  }, [testHunts])

  // ===========================================
  // RENDER HELPERS
  // ===========================================

  const renderStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
        <div className="text-2xl font-bold text-burnt-orange">{testStats?.total_hunts || 0}</div>
        <div className="text-sm text-weathered-wood">Test Hunts</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
        <div className="text-2xl font-bold text-olive-green">{testStats?.total_sightings || 0}</div>
        <div className="text-sm text-weathered-wood">Sightings</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
        <div className="text-2xl font-bold text-muted-gold">{testStats?.total_harvests || 0}</div>
        <div className="text-sm text-weathered-wood">Harvests</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-weathered-wood/20 club-shadow">
        <div className="text-2xl font-bold text-forest-shadow">{stands.filter(s => s.active).length}</div>
        <div className="text-sm text-weathered-wood">Active Stands</div>
      </div>
    </div>
  )

  const renderTestHunts = () => (
    <div className="bg-white rounded-lg border border-weathered-wood/20 club-shadow">
      <div className="p-4 border-b border-weathered-wood/20">
        <h3 className="font-semibold text-forest-shadow">Test Hunt Logs (Today)</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {testHunts.length === 0 ? (
          <div className="p-4 text-center text-weathered-wood">
            No test hunts logged yet. Start testing!
          </div>
        ) : (
          testHunts.map((hunt) => (
            <div key={hunt.id} className="p-4 border-b border-weathered-wood/10 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-forest-shadow">{hunt.stand_name}</div>
                  <div className="text-sm text-weathered-wood">
                    <Calendar className="inline w-3 h-3 mr-1" />
                    {hunt.hunt_date} • {new Date(hunt.created_at).toLocaleTimeString()}
                  </div>
                  {hunt.notes && (
                    <div className="text-sm text-weathered-wood mt-1 italic">"{hunt.notes}"</div>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div className="text-burnt-orange font-medium">{hunt.harvest_count} harvests</div>
                  <div className="text-olive-green">{hunt.sightings_count || 0} sightings</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderMobileFrame = (content: React.ReactNode) => (
    <div className="mx-auto" style={{ width: '375px', maxWidth: '100%' }}>
      <div className="border-8 border-gray-800 rounded-3xl bg-gray-800 p-2 club-shadow-lg">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ height: '667px' }}>
          <div className="h-full overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    </div>
  )

  // ===========================================
  // MAIN RENDER
  // ===========================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-olive-green mx-auto mb-2" />
          <p className="text-weathered-wood">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-clay-earth mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-forest-shadow mb-2">Authentication Required</h1>
          <p className="text-weathered-wood mb-4">You must be logged in to test the hunt logging system.</p>
          <a 
            href="/auth"
            className="inline-block bg-burnt-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <TestTube className="w-6 h-6 mr-2" />
                Hunt Logging Test
              </h1>
              <p className="text-olive-green/80 text-sm">Test form functionality and mobile layout</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Status Messages */}
        {loadingText && (
          <div className="mb-4 p-3 bg-dark-teal/10 border border-dark-teal/20 rounded-lg flex items-center">
            <RefreshCw className="w-4 h-4 animate-spin text-dark-teal mr-2" />
            <span className="text-dark-teal">{loadingText}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-clay-earth/10 border border-clay-earth/20 rounded-lg flex items-center">
            <AlertTriangle className="w-4 h-4 text-clay-earth mr-2" />
            <span className="text-clay-earth">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-bright-orange/10 border border-bright-orange/20 rounded-lg flex items-center">
            <CheckCircle className="w-4 h-4 text-bright-orange mr-2" />
            <span className="text-bright-orange">{success}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls & Data */}
          <div className="space-y-6">
            {/* Stats */}
            {renderStats()}

            {/* Controls */}
            <div className="bg-white p-6 rounded-lg border border-weathered-wood/20 club-shadow">
              <h2 className="text-lg font-semibold text-forest-shadow mb-4">Test Controls</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowForm(true)}
                  disabled={isLoading || showForm}
                  className="w-full bg-burnt-orange text-white py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start New Hunt Log Test
                </button>

                <button
                  onClick={loadTestData}
                  disabled={isLoading}
                  className="w-full bg-muted-gold text-forest-shadow py-3 rounded-lg font-medium hover:bg-sunset-amber transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Test Data
                </button>

                <button
                  onClick={cleanupTestData}
                  disabled={isLoading || testHunts.length === 0}
                  className="w-full bg-clay-earth text-white py-3 rounded-lg font-medium hover:bg-forest-shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup Test Data
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-weathered-wood/20">
                <h3 className="text-sm font-medium text-forest-shadow mb-2">Database Info</h3>
                <div className="text-xs text-weathered-wood space-y-1">
                  <div>• {stands.length} stands loaded ({stands.filter(s => s.active).length} active)</div>
                  <div>• Test data from today's session only</div>
                  <div>• Cleanup removes ALL today's hunt logs for your user</div>
                  <div>• Sightings and harvests cascade delete automatically</div>
                </div>
              </div>
            </div>

            {/* Test Hunt Logs */}
            {renderTestHunts()}
          </div>

          {/* Right Panel - Form Preview */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-weathered-wood/20 club-shadow">
              <h2 className="text-lg font-semibold text-forest-shadow mb-4 flex items-center">
                {viewMode === 'mobile' ? <Smartphone className="w-5 h-5 mr-2" /> : <Monitor className="w-5 h-5 mr-2" />}
                {viewMode === 'mobile' ? 'Mobile' : 'Desktop'} Preview
              </h2>
              
              {!showForm ? (
                <div className="text-center py-12 text-weathered-wood">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Click "Start New Hunt Log Test" to begin</p>
                  <p className="text-sm mt-1">Form will appear here for testing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {viewMode === 'mobile' ? (
                    renderMobileFrame(
                      <div className="p-4">
                        <HuntEntryForm
                          stands={stands}
                          onSubmit={handleFormSubmit}
                          onCancel={handleFormCancel}
                          isSubmitting={isLoading}
                        />
                      </div>
                    )
                  ) : (
                    <div className="max-w-lg mx-auto">
                      <HuntEntryForm
                        stands={stands}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        isSubmitting={isLoading}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
