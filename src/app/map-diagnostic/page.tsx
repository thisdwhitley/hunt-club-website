'use client'

// src/app/map-diagnostic/page.tsx
// Enhanced diagnostic page to debug intermittent database connectivity issues

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createRoot } from 'react-dom/client'
import StandCard from '@/components/stands/StandCard'
import { AlertCircle, CheckCircle, Database, MapPin, Eye, Wifi, Clock, TestTube, Bug } from 'lucide-react'

// Property center coordinates
const PROPERTY_CENTER: [number, number] = [36.42712517693617, -79.51073582842501]

// Types based on current database schema
interface Stand {
  id: string
  name: string
  description: string | null
  latitude: number | null
  longitude: number | null
  type: string
  active: boolean
  height_feet: number | null
  capacity: number | null
  walking_time_minutes: number | null
  view_distance_yards: number | null
  total_harvests: number | null
  total_hunts: number | null
  season_hunts: number | null
  last_used_date: string | null
  time_of_day: string | null
  archery_season: boolean | null
  nearby_water_source: boolean | null
  food_source: string | null
  trail_camera_name: string | null
  created_at: string
  updated_at: string
}

interface PropertyBoundary {
  id: string
  name: string
  boundary_data: [number, number][]
  total_acres: number | null
  description: string | null
  active: boolean
}

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: any
}

// Global Leaflet reference
let L: any = null

export default function EnhancedMapDiagnosticPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  
  // Data states
  const [stands, setStands] = useState<Stand[]>([])
  const [boundaries, setBoundaries] = useState<PropertyBoundary[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  
  // Status states
  const [leafletReady, setLeafletReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [testing, setTesting] = useState(false)

  // Add diagnostic result
  const addDiagnostic = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
    const result: DiagnosticResult = { test, status, message, data }
    setDiagnostics(prev => [...prev, result])
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`, data || '')
  }

  // NEW: Test environment variables
  const testEnvironment = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    addDiagnostic('Environment', 
      supabaseUrl && supabaseAnonKey ? 'success' : 'error',
      `URL: ${supabaseUrl ? 'Present' : 'Missing'} | Key: ${supabaseAnonKey ? 'Present' : 'Missing'}`,
      { 
        url: supabaseUrl?.slice(0, 30) + '...',
        keyLength: supabaseAnonKey?.length || 0
      }
    )
  }

  // NEW: Test Supabase client initialization
  const testSupabaseClient = async () => {
    try {
      const supabase = createClient()
      
      addDiagnostic('Supabase Client', 'warning', 'Testing client initialization...')
      
      // Test if client has proper config
      const clientUrl = supabase.supabaseUrl
      const clientKey = supabase.supabaseKey ? 'Present' : 'Missing'
      
      addDiagnostic('Supabase Config', clientUrl && clientKey === 'Present' ? 'success' : 'error', 
        `URL: ${clientUrl?.slice(0, 30)}... | Key: ${clientKey}`,
        { fullUrl: clientUrl }
      )
      
      // Test raw connection with simple query
      const { data, error } = await supabase
        .from('stands')
        .select('id')
        .limit(1)
      
      if (error) {
        addDiagnostic('Supabase Connection', 'error', `Connection test failed: ${error.message}`, error)
      } else {
        addDiagnostic('Supabase Connection', 'success', 'Raw connection working', { testResult: data })
      }
      
    } catch (err) {
      addDiagnostic('Supabase Client', 'error', `Client init failed: ${err}`)
    }
  }

  // NEW: Test RLS policies and auth state
  const testRLSPolicies = async () => {
    try {
      const supabase = createClient()
      
      // Test auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      addDiagnostic('Auth State', user ? 'success' : 'warning', 
        user ? `Logged in as: ${user.email}` : 'No authenticated user (may be OK for public tables)',
        { user: user ? { id: user.id, email: user.email } : null }
      )
      
      if (authError) {
        addDiagnostic('Auth Error', 'error', `Auth check failed: ${authError.message}`, authError)
      }
      
      // Test direct table access with specific error handling
      const { data: rawData, error: rawError } = await supabase
        .from('stands')
        .select('id, name, active')
        .limit(5)
      
      if (rawError) {
        addDiagnostic('Raw Table Access', 'error', `Direct access failed: ${rawError.message}`, rawError)
        
        // Check if it's an RLS error
        if (rawError.message.includes('policy') || rawError.message.includes('permission') || rawError.message.includes('RLS')) {
          addDiagnostic('RLS Policy', 'error', 'Row Level Security is likely blocking access - check Supabase policies')
        }
        
        if (rawError.message.includes('JWT')) {
          addDiagnostic('JWT Issue', 'error', 'Authentication token issue - may need to sign in')
        }
      } else {
        addDiagnostic('Raw Table Access', 'success', `Got ${rawData?.length || 0} records`, { sampleData: rawData })
      }
      
    } catch (err) {
      addDiagnostic('RLS Test', 'error', `Exception: ${err}`)
    }
  }

  // ENHANCED: Load stands with comprehensive debugging
  const loadStands = async () => {
    try {
      addDiagnostic('Load Stands', 'warning', 'Starting enhanced stands load...')
      
      // Force fresh client
      const supabase = createClient()
      
      // First test basic connectivity with count
      const { data: countData, error: countError, count } = await supabase
        .from('stands')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        addDiagnostic('Stands Count', 'error', `Count query failed: ${countError.message}`, countError)
        return
      }
      
      addDiagnostic('Stands Count', 'success', `Database reports ${count} total stands`, { count })
      
      if (count === 0) {
        addDiagnostic('No Data', 'warning', 'Database contains no stands - this may be expected for new setup')
        setStands([])
        return
      }
      
      // Now try full query
      const { data: allStands, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) {
        addDiagnostic('Load Stands', 'error', `Full query failed: ${error.message}`, error)
      } else {
        setStands(allStands || [])
        const activeCount = allStands?.filter(s => s.active).length || 0
        const mappedCount = allStands?.filter(s => s.latitude && s.longitude).length || 0
        
        addDiagnostic('Load Stands', 'success', 
          `Loaded ${allStands?.length || 0} stands (${activeCount} active, ${mappedCount} with coordinates)`,
          { 
            total: allStands?.length || 0,
            active: activeCount,
            mapped: mappedCount,
            sampleStands: allStands?.slice(0, 3).map(s => ({ 
              name: s.name, 
              type: s.type, 
              lat: s.latitude, 
              lng: s.longitude, 
              active: s.active 
            }))
          }
        )
      }
      
    } catch (error) {
      addDiagnostic('Load Stands', 'error', `Exception during load: ${error}`)
    }
  }

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return
      
      addDiagnostic('Leaflet Load', 'warning', 'Starting Leaflet CDN load...')
      
      try {
        // Check if already loaded
        if ((window as any).L) {
          L = (window as any).L
          setLeafletReady(true)
          addDiagnostic('Leaflet Load', 'success', 'Leaflet already available')
          return
        }

        // Load CSS
        const css = document.createElement('link')
        css.rel = 'stylesheet'
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        css.onload = () => addDiagnostic('Leaflet CSS', 'success', 'Styles loaded')
        css.onerror = () => addDiagnostic('Leaflet CSS', 'error', 'Failed to load styles')
        document.head.appendChild(css)

        // Load JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
          L = (window as any).L
          if (L) {
            // Fix default markers
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })
            setLeafletReady(true)
            addDiagnostic('Leaflet JS', 'success', 'Map engine loaded and configured')
          } else {
            addDiagnostic('Leaflet JS', 'error', 'Leaflet not found after script load')
          }
        }
        script.onerror = () => addDiagnostic('Leaflet JS', 'error', 'Failed to load map engine')
        document.head.appendChild(script)

      } catch (error) {
        addDiagnostic('Leaflet Load', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }

    loadLeaflet()
  }, [])

//   // Initialize map
// Initialize map - COMPLETE CORRECTED VERSION
useEffect(() => {
  if (!leafletReady || !L || !mapRef.current || leafletMapRef.current) return

  addDiagnostic('Map Init', 'warning', 'Initializing map...')
  
  try {
    const rect = mapRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      addDiagnostic('Map Init', 'error', 'Map container has zero dimensions')
      return
    }

    leafletMapRef.current = L.map(mapRef.current, {
      zoomControl: true
    }).setView(PROPERTY_CENTER, 16)

    // Add satellite layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri'
    }).addTo(leafletMapRef.current)

    // Add clubhouse marker
    const clubhouseIcon = L.divIcon({
      html: '<div style="background: #566E3D; border: 2px solid #FA7921; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;"><div style="background: white; border-radius: 50%; width: 6px; height: 6px;"></div></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })

    L.marker(PROPERTY_CENTER, { icon: clubhouseIcon })
      .addTo(leafletMapRef.current)
      .bindPopup('<h3>🏠 Clubhouse</h3><p>Property Center</p>')

    // Add centering styles for popups
    const style = document.createElement('style')
    style.textContent = `
      .hunting-club-popup .leaflet-popup-content {
        margin: 0 !important;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .hunting-club-popup .leaflet-popup-content > div {
        margin: 0 auto;
      }
    `
    document.head.appendChild(style)

    setMapReady(true)
    addDiagnostic('Map Init', 'success', `Map initialized at ${PROPERTY_CENTER[0]}, ${PROPERTY_CENTER[1]}`)

  } catch (error) {
    addDiagnostic('Map Init', 'error', `Map initialization failed: ${error instanceof Error ? error.message : 'Unknown'}`)
  }
}, [leafletReady])
//   useEffect(() => {
//     if (!leafletReady || !L || !mapRef.current || leafletMapRef.current) return

//     addDiagnostic('Map Init', 'warning', 'Initializing map...')
    
//     try {
//       const rect = mapRef.current.getBoundingClientRect()
//       if (rect.width === 0 || rect.height === 0) {
//         addDiagnostic('Map Init', 'error', 'Map container has zero dimensions')
//         return
//       }

//       leafletMapRef.current = L.map(mapRef.current, {
//         zoomControl: true
//       }).setView(PROPERTY_CENTER, 16)

//       // Add satellite layer
//       L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
//         attribution: '&copy; Esri'
//       }).addTo(leafletMapRef.current)

//       // Add clubhouse marker
//       const clubhouseIcon = L.divIcon({
//         html: '<div style="background: #566E3D; border: 2px solid #FA7921; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;"><div style="background: white; border-radius: 50%; width: 6px; height: 6px;"></div></div>',
//         iconSize: [20, 20],
//         iconAnchor: [10, 10]
//       })

//       L.marker(PROPERTY_CENTER, { icon: clubhouseIcon })
//         .addTo(leafletMapRef.current)
//         .bindPopup('<h3>🏠 Clubhouse</h3><p>Property Center</p>')

//       setMapReady(true)
//       addDiagnostic('Map Init', 'success', `Map initialized at ${PROPERTY_CENTER[0]}, ${PROPERTY_CENTER[1]}`)

//     } catch (error) {
//       addDiagnostic('Map Init', 'error', `Map initialization failed: ${error instanceof Error ? error.message : 'Unknown'}`)
//     }
//   }, [leafletReady])

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    setTesting(true)
    setDiagnostics([])
    
    // Test environment first
    testEnvironment()
    
    // Test Supabase client
    await testSupabaseClient()
    
    // Test RLS and auth
    await testRLSPolicies()

    // Test Database Connection
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('stands').select('count').limit(1)
      
      if (error) {
        addDiagnostic('Database', 'error', `Connection failed: ${error.message}`, error)
      } else {
        addDiagnostic('Database', 'success', 'Connection successful')
      }
    } catch (error) {
      addDiagnostic('Database', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test Stands Table Schema
    try {
      const supabase = createClient()
      const { data: standsData, error } = await supabase
        .from('stands')
        .select('*')
        .limit(1)

      if (error) {
        addDiagnostic('Stands Schema', 'error', `Query failed: ${error.message}`, error)
      } else if (standsData && standsData.length > 0) {
        const columns = Object.keys(standsData[0])
        addDiagnostic('Stands Schema', 'success', `Table accessible with ${columns.length} columns`, { columns })
      } else {
        addDiagnostic('Stands Schema', 'warning', 'Table exists but no data found')
      }
    } catch (error) {
      addDiagnostic('Stands Schema', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test Property Boundaries Table
    try {
      const supabase = createClient()
      const { data: boundariesData, error } = await supabase
        .from('property_boundaries')
        .select('*')
        .limit(1)

      if (error) {
        addDiagnostic('Boundaries Schema', 'error', `Query failed: ${error.message}`, error)
      } else if (boundariesData && boundariesData.length > 0) {
        const columns = Object.keys(boundariesData[0])
        addDiagnostic('Boundaries Schema', 'success', `Table accessible with ${columns.length} columns`, { columns })
      } else {
        addDiagnostic('Boundaries Schema', 'warning', 'Table exists but no data found')
      }
    } catch (error) {
      addDiagnostic('Boundaries Schema', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Load All Stands (using enhanced function)
    await loadStands()

    // Load Boundaries
    try {
      const supabase = createClient()
      const { data: allBoundaries, error } = await supabase
        .from('property_boundaries')
        .select('*')
        .order('name')

      if (error) {
        addDiagnostic('Load Boundaries', 'error', `Failed to load: ${error.message}`, error)
      } else {
        setBoundaries(allBoundaries || [])
        addDiagnostic('Load Boundaries', 'success', `Loaded ${allBoundaries?.length || 0} property boundaries`, {
          boundaries: allBoundaries?.map(b => ({ name: b.name, acres: b.total_acres, points: b.boundary_data?.length }))
        })
      }
    } catch (error) {
      addDiagnostic('Load Boundaries', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test StandCard Component
    try {
      if (stands.length > 0) {
        addDiagnostic('StandCard', 'success', 'Component available and ready for popup testing')
      } else {
        addDiagnostic('StandCard', 'warning', 'Component available but no stands to test with')
      }
    } catch (error) {
      addDiagnostic('StandCard', 'error', `Component test failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    setTesting(false)
  }

  // NEW: Quick test functions for manual debugging
  const testRawQuery = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('stands').select('*')
      console.log('Raw query result:', { data, error })
      addDiagnostic('Manual Raw Query', error ? 'error' : 'success', 
        error ? `Failed: ${error.message}` : `Success: ${data?.length || 0} records`,
        { data: data?.slice(0, 2), error }
      )
    } catch (err) {
      console.error('Raw query exception:', err)
      addDiagnostic('Manual Raw Query', 'error', `Exception: ${err}`)
    }
  }

  const testCountOnly = async () => {
    try {
      const supabase = createClient()
      const { count, error } = await supabase.from('stands').select('*', { count: 'exact', head: true })
      console.log('Count result:', { count, error })
      addDiagnostic('Manual Count Query', error ? 'error' : 'success',
        error ? `Failed: ${error.message}` : `Count: ${count}`,
        { count, error }
      )
    } catch (err) {
      console.error('Count query exception:', err)
      addDiagnostic('Manual Count Query', 'error', `Exception: ${err}`)
    }
  }

  const testActiveOnly = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('stands').select('*').eq('active', true)
      console.log('Active stands result:', { data, error })
      addDiagnostic('Active Stands Query', error ? 'error' : 'success',
        error ? `Failed: ${error.message}` : `Active stands: ${data?.length || 0}`,
        { data: data?.slice(0, 2), error }
      )
    } catch (err) {
      addDiagnostic('Active Stands Query', 'error', `Exception: ${err}`)
    }
  }

  // Add stands to map
  const addStandsToMap = () => {
    if (!mapReady || !leafletMapRef.current || !L || stands.length === 0) return

    addDiagnostic('Map Stands', 'warning', 'Adding stands to map...')

    // Clear existing stand markers (keep clubhouse)
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getLatLng().lat !== PROPERTY_CENTER[0]) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    const standIcon = L.divIcon({
      html: '<div style="background: #FA7921; border: 2px solid #E8E6E0; border-radius: 50%; width: 16px; height: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: 'hunting-stand-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    })

    // Handle for StandCard popup
    const handleViewStandDetails = (stand: Stand) => {
      addDiagnostic('Popup Interaction', 'success', `Clicked on ${stand.name}`)
      alert(`Stand Details: ${stand.name}`)
    }

    // Create StandCard popup content
    const createStandPopupContent = (stand: Stand) => {
      const popupDiv = document.createElement('div')
      const root = createRoot(popupDiv)
      
      root.render(
        <StandCard
          stand={stand}
          mode="popup"
          popupWidth={330}
          onClick={handleViewStandDetails}
          showLocation={true}
          showStats={true}
          showActions={true}
        />
      )
      
      return popupDiv
    }

    let addedCount = 0
    stands.forEach((stand) => {
      if (stand.latitude && stand.longitude && stand.active) {
        L.marker([stand.latitude, stand.longitude], { icon: standIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(createStandPopupContent(stand), {
  maxWidth: 330,
  minWidth: 320,
  className: 'hunting-club-popup',
  offset: [0, -50]
})
        addedCount++
      }
    })

    addDiagnostic('Map Stands', 'success', `Added ${addedCount} stand markers with StandCard popups`)

    // Fit map to stands if any exist
    if (addedCount > 0) {
      const mappedStands = stands.filter(s => s.latitude && s.longitude && s.active)
      const bounds = L.latLngBounds(mappedStands.map(s => [s.latitude!, s.longitude!]))
      leafletMapRef.current.fitBounds(bounds, { padding: [20, 20] })
    }
  }

  // Add boundaries to map
  const addBoundariesToMap = () => {
    if (!mapReady || !leafletMapRef.current || !L || boundaries.length === 0) return

    addDiagnostic('Map Boundaries', 'warning', 'Adding boundaries to map...')

    boundaries.forEach(boundary => {
      if (boundary.boundary_data && Array.isArray(boundary.boundary_data) && boundary.boundary_data.length > 0) {
        const polyline = L.polyline(boundary.boundary_data, {
          color: '#FA7921',
          weight: 2,
          opacity: 0.8,
          dashArray: '5,5'
        }).addTo(leafletMapRef.current)
        
        polyline.bindPopup(`
          <h3>🗺️ ${boundary.name}</h3>
          <p>${boundary.description || 'Property boundary'}</p>
          ${boundary.total_acres ? `<p><strong>Area:</strong> ${boundary.total_acres} acres</p>` : ''}
        `)
      }
    })

    addDiagnostic('Map Boundaries', 'success', `Added ${boundaries.length} property boundaries`)
  }

  // Auto-run diagnostics on load
  useEffect(() => {
    runDiagnostics()
  }, [])

  // Add stands/boundaries when loaded
  useEffect(() => {
    if (stands.length > 0) addStandsToMap()
  }, [stands, mapReady])

  useEffect(() => {
    if (boundaries.length > 0) addBoundariesToMap()
  }, [boundaries, mapReady])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-600" size={20} />
      case 'error': return <AlertCircle className="text-red-600" size={20} />
      case 'warning': return <Clock className="text-yellow-600" size={20} />
      default: return <Wifi className="text-gray-400 animate-pulse" size={20} />
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          🔍 Enhanced Database Connectivity Diagnostic
        </h1>
        <p className="opacity-90">
          Debug intermittent stand loading issues with comprehensive database and auth testing
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            Diagnostic Controls
          </h2>
          <div className="flex gap-2">
            <button
              onClick={runDiagnostics}
              disabled={testing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {testing ? 'Running Tests...' : 'Run All Diagnostics'}
            </button>
            <button
              onClick={() => setDiagnostics([])}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* NEW: Manual Test Buttons */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <Bug size={16} />
            Manual Database Tests
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testRawQuery}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Test Raw Query
            </button>
            <button
              onClick={testCountOnly}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Test Count Only
            </button>
            <button
              onClick={testActiveOnly}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Test Active Only
            </button>
            <button
              onClick={loadStands}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Reload Stands
            </button>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Use these buttons to test specific database queries. Check browser console for detailed results.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stands.length}</div>
            <div className="text-sm text-blue-800">Total Stands</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stands.filter(s => s.active).length}</div>
            <div className="text-sm text-green-800">Active Stands</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stands.filter(s => s.latitude && s.longitude).length}</div>
            <div className="text-sm text-orange-800">Mapped Stands</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{boundaries.length}</div>
            <div className="text-sm text-purple-800">Boundaries</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-100 p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="text-green-600" size={24} />
            Live Map Test (StandCard Popups)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on stand markers to test StandCard popup integration
          </p>
        </div>
        <div ref={mapRef} className="w-full h-96" />
      </div>

      {/* Diagnostic Results */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Eye className="text-purple-600" size={24} />
            Diagnostic Results
          </h2>
        </div>
        <div className="p-6">
          {diagnostics.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No diagnostics run yet. Click "Run All Diagnostics" to start testing.
            </div>
          ) : (
            <div className="space-y-3">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{diagnostic.test}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        diagnostic.status === 'success' ? 'bg-green-100 text-green-800' :
                        diagnostic.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {diagnostic.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{diagnostic.message}</p>
                    {diagnostic.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                          Show detailed data
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(diagnostic.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Summary */}
      {(stands.length > 0 || boundaries.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Stands Summary */}
          {stands.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">📍 Stands Found</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stands.map((stand) => (
                  <div key={stand.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{stand.name}</div>
                      <div className="text-xs text-gray-600">
                        Type: {stand.type} | Active: {stand.active ? '✅' : '❌'} | 
                        Coords: {stand.latitude && stand.longitude ? '✅' : '❌'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boundaries Summary */}
          {boundaries.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">🗺️ Boundaries Found</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {boundaries.map((boundary) => (
                  <div key={boundary.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{boundary.name}</div>
                      <div className="text-xs text-gray-600">
                        Acres: {boundary.total_acres || 'Unknown'} | 
                        Points: {boundary.boundary_data?.length || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
