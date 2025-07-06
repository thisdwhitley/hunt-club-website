'use client'

// src/app/map-diagnostic/page.tsx
// Fresh diagnostic page to test current database schema and StandCard popup integration

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createRoot } from 'react-dom/client'
import StandCard from '@/components/stands/StandCard'
import { AlertCircle, CheckCircle, Database, MapPin, Eye, Wifi, Clock } from 'lucide-react'

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

export default function MapDiagnosticPage() {
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

  // Initialize map
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

      setMapReady(true)
      addDiagnostic('Map Init', 'success', `Map initialized at ${PROPERTY_CENTER[0]}, ${PROPERTY_CENTER[1]}`)

    } catch (error) {
      addDiagnostic('Map Init', 'error', `Map initialization failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }, [leafletReady])

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    setTesting(true)
    setDiagnostics([])
    
    // Test 1: Database Connection
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('stands').select('count').limit(1)
      
      if (error) {
        addDiagnostic('Database', 'error', `Connection failed: ${error.message}`)
      } else {
        addDiagnostic('Database', 'success', 'Connection successful')
      }
    } catch (error) {
      addDiagnostic('Database', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 2: Stands Table Schema
    try {
      const supabase = createClient()
      const { data: standsData, error } = await supabase
        .from('stands')
        .select('*')
        .limit(1)

      if (error) {
        addDiagnostic('Stands Schema', 'error', `Query failed: ${error.message}`)
      } else if (standsData && standsData.length > 0) {
        const columns = Object.keys(standsData[0])
        addDiagnostic('Stands Schema', 'success', `Table accessible with ${columns.length} columns`, { columns })
      } else {
        addDiagnostic('Stands Schema', 'warning', 'Table exists but no data found')
      }
    } catch (error) {
      addDiagnostic('Stands Schema', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 3: Property Boundaries Table
    try {
      const supabase = createClient()
      const { data: boundariesData, error } = await supabase
        .from('property_boundaries')
        .select('*')
        .limit(1)

      if (error) {
        addDiagnostic('Boundaries Schema', 'error', `Query failed: ${error.message}`)
      } else if (boundariesData && boundariesData.length > 0) {
        const columns = Object.keys(boundariesData[0])
        addDiagnostic('Boundaries Schema', 'success', `Table accessible with ${columns.length} columns`, { columns })
      } else {
        addDiagnostic('Boundaries Schema', 'warning', 'Table exists but no data found')
      }
    } catch (error) {
      addDiagnostic('Boundaries Schema', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 4: Load All Stands
    try {
      const supabase = createClient()
      const { data: allStands, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) {
        addDiagnostic('Load Stands', 'error', `Failed to load: ${error.message}`)
      } else {
        setStands(allStands || [])
        const activeStands = allStands?.filter(s => s.active) || []
        const mappedStands = allStands?.filter(s => s.latitude && s.longitude) || []
        addDiagnostic('Load Stands', 'success', `Loaded ${allStands?.length || 0} stands (${activeStands.length} active, ${mappedStands.length} mapped)`, { 
          total: allStands?.length || 0,
          active: activeStands.length,
          mapped: mappedStands.length,
          stands: allStands?.map(s => ({ name: s.name, type: s.type, lat: s.latitude, lng: s.longitude, active: s.active }))
        })
      }
    } catch (error) {
      addDiagnostic('Load Stands', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 5: Load Boundaries
    try {
      const supabase = createClient()
      const { data: allBoundaries, error } = await supabase
        .from('property_boundaries')
        .select('*')
        .order('name')

      if (error) {
        addDiagnostic('Load Boundaries', 'error', `Failed to load: ${error.message}`)
      } else {
        setBoundaries(allBoundaries || [])
        addDiagnostic('Load Boundaries', 'success', `Loaded ${allBoundaries?.length || 0} property boundaries`, {
          boundaries: allBoundaries?.map(b => ({ name: b.name, acres: b.total_acres, points: b.boundary_data?.length }))
        })
      }
    } catch (error) {
      addDiagnostic('Load Boundaries', 'error', `Exception: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Test 6: StandCard Component
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
      iconSize: [16, 16],
      iconAnchor: [8, 8]
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
          popupWidth={320}
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
          .bindPopup(createStandPopupContent(stand))
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
          color: '#566E3D',
          weight: 3,
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
          🔍 Map & Database Diagnostic Tool
        </h1>
        <p className="opacity-90">
          Fresh diagnostic page to test current database schema and StandCard popup integration
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
