// src/app/map-test/page.tsx
// Complete debug version with layer controls and corrected coordinates
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Target, AlertCircle, CheckCircle, Clock } from 'lucide-react'

// Property coordinates for 3843 Quick Rd, Ruffin, NC 27326 (corrected from Google Maps)
const PROPERTY_CENTER: [number, number] = [36.427270297571546, -79.51088069325365]

interface Stand {
  id: string
  name: string
  description: string | null
  latitude: number | null
  longitude: number | null
  type: string
  active: boolean
  created_at: string
  updated_at: string
}

// Global reference to loaded Leaflet library
let L: any = null

export default function MapTestPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const [stands, setStands] = useState<Stand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStands, setShowStands] = useState(true)
  const [currentLayer, setCurrentLayer] = useState<'satellite' | 'street' | 'terrain' | 'google' | 'bing'>('satellite')
  const [mapReady, setMapReady] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  
  // Debug states
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [cssLoaded, setCssLoaded] = useState(false)
  const [jsLoaded, setJsLoaded] = useState(false)
  const [tilesLoaded, setTilesLoaded] = useState(0)
  const [tilesErrored, setTilesErrored] = useState(0)
  const [currentTileLayer, setCurrentTileLayer] = useState<any>(null)

  const addDebugInfo = (message: string) => {
    console.log(`[MapDebug] ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Load Leaflet from CDN with detailed debugging
  useEffect(() => {
    const loadLeafletFromCDN = async () => {
      if (typeof window === 'undefined') {
        addDebugInfo('❌ Window is undefined (SSR)')
        return
      }

      addDebugInfo('🚀 Starting Leaflet CDN load process')

      try {
        // Check if Leaflet is already loaded
        if ((window as any).L) {
          L = (window as any).L
          setLeafletLoaded(true)
          setCssLoaded(true) // If L exists, CSS must be loaded
          setJsLoaded(true)  // If L exists, JS must be loaded
          addDebugInfo('✅ Leaflet already loaded from window.L')
          return
        }

        // Load CSS first
        addDebugInfo('📝 Loading CSS from CDN...')
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        cssLink.crossOrigin = ''
        
        cssLink.onload = () => {
          setCssLoaded(true)
          addDebugInfo('✅ CSS loaded successfully')
        }
        
        cssLink.onerror = (err) => {
          addDebugInfo('❌ CSS failed to load')
          console.error('CSS load error:', err)
        }
        
        document.head.appendChild(cssLink)

        // Load JavaScript
        addDebugInfo('📦 Loading JavaScript from CDN...')
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        
        script.onload = () => {
          setJsLoaded(true)
          addDebugInfo('✅ JavaScript loaded successfully')
          
          L = (window as any).L
          
          if (!L) {
            addDebugInfo('❌ Leaflet not found in window after script load')
            setError('Leaflet failed to initialize')
            return
          }

          addDebugInfo('🔧 Configuring Leaflet default icons...')
          
          // Fix for default markers
          try {
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })
            addDebugInfo('✅ Leaflet icons configured')
          } catch (iconErr) {
            addDebugInfo('⚠️ Icon configuration failed but continuing...')
            console.error('Icon config error:', iconErr)
          }

          setLeafletLoaded(true)
          addDebugInfo('🎉 Leaflet fully loaded and ready!')
        }

        script.onerror = (err) => {
          setJsLoaded(false)
          addDebugInfo('❌ JavaScript failed to load from CDN')
          console.error('Failed to load Leaflet from CDN:', err)
          setError('Failed to load map library from CDN')
        }

        document.head.appendChild(script)

      } catch (err) {
        addDebugInfo('❌ Exception during CDN load process')
        console.error('Error loading Leaflet from CDN:', err)
        setError('Failed to load map library')
      }
    }

    loadLeafletFromCDN()
  }, [])

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !L || !mapRef.current || leafletMapRef.current) return

    addDebugInfo('🗺️ Initializing map...')

    try {
      // Check if mapRef.current has dimensions
      const rect = mapRef.current.getBoundingClientRect()
      addDebugInfo(`📐 Map container dimensions: ${rect.width}x${rect.height}`)
      
      if (rect.width === 0 || rect.height === 0) {
        addDebugInfo('❌ Map container has zero dimensions!')
        setError('Map container is not visible')
        return
      }

      // Initialize map
      leafletMapRef.current = L.map(mapRef.current).setView(PROPERTY_CENTER, 16)
      addDebugInfo('✅ Map object created')

      // Add default satellite layer
      addDebugInfo('🛰️ Adding satellite layer...')
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, &copy; <a href="https://www.digitalglobe.com/">DigitalGlobe</a>',
          maxZoom: 19
        }
      )

      // Add tile loading event listeners for debugging
      satelliteLayer.on('tileload', () => {
        setTilesLoaded(prev => prev + 1)
        addDebugInfo('🎯 Tile loaded successfully')
      })

      satelliteLayer.on('tileerror', (e: any) => {
        setTilesErrored(prev => prev + 1)
        addDebugInfo(`❌ Tile failed to load: ${e.tile?.src || 'unknown'}`)
      })

      satelliteLayer.on('loading', () => {
        addDebugInfo('⏳ Starting to load tiles...')
      })

      satelliteLayer.on('load', () => {
        addDebugInfo('✅ All tiles loaded successfully')
      })

      satelliteLayer.addTo(leafletMapRef.current)
      setCurrentTileLayer(satelliteLayer)

      addDebugInfo('📍 Adding property center marker...')
      // Add property center marker
      L.marker(PROPERTY_CENTER)
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <h3 style="color: #16a34a; font-weight: 600; margin: 0 0 4px 0;">Caswell County Yacht Club</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">3843 Quick Rd, Ruffin, NC</p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Property Center</p>
          </div>
        `)

      setMapReady(true)
      addDebugInfo('🎉 Map fully initialized!')
    } catch (err) {
      addDebugInfo('❌ Error during map initialization')
      console.error('Error initializing map:', err)
      setError('Failed to initialize map: ' + (err as Error).message)
    }
  }, [leafletLoaded])

  useEffect(() => {
    loadStands()
  }, [])

  // Update stands on map when data changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !L) return

    addDebugInfo(`🔄 Updating ${stands.length} stands on map (showStands: ${showStands})`)

    // Clear existing stand markers (keep property center marker)
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getLatLng().lat !== PROPERTY_CENTER[0]) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    if (!showStands) return

    // Create custom icon for stands
    const standIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      `),
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    })

    let standsAdded = 0

    // Add stand markers
    stands.forEach((stand) => {
      if (stand.latitude && stand.longitude) {
        addDebugInfo(`📌 Adding marker for: ${stand.name} at ${stand.latitude}, ${stand.longitude}`)
        L.marker([stand.latitude, stand.longitude], { icon: standIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="color: #111827; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center;">
                <svg style="margin-right: 8px; color: #22c55e;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                ${stand.name}
              </h3>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">${stand.description || 'No description'}</p>
              <div style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
                <p style="margin: 0;">Type: ${stand.type}</p>
                <p style="margin: 0;">Coordinates: ${stand.latitude.toFixed(6)}, ${stand.longitude.toFixed(6)}</p>
                <p style="margin: 0;">Added: ${new Date(stand.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          `)
        standsAdded++
      } else {
        addDebugInfo(`⚠️ Stand ${stand.name} has no coordinates`)
      }
    })

    addDebugInfo(`✅ Added ${standsAdded} stand markers to map`)
  }, [stands, showStands, mapReady])

  const loadStands = async () => {
    addDebugInfo('🔄 Loading stands from database...')
    try {
      const supabase = createClient()
      
      const { data: standsData, error: standsError } = await supabase
        .from('stands')
        .select('*')
        .eq('active', true)

      if (standsError) {
        addDebugInfo('❌ Database error loading stands')
        console.error('Error loading stands:', standsError)
        setError('Could not load hunting stands')
      } else {
        setStands(standsData || [])
        addDebugInfo(`✅ Loaded ${standsData?.length || 0} stands from database`)
        
        // Log each stand's coordinates for debugging
        standsData?.forEach(stand => {
          if (stand.latitude && stand.longitude) {
            addDebugInfo(`📋 Stand: ${stand.name} at ${stand.latitude}, ${stand.longitude}`)
          } else {
            addDebugInfo(`📋 Stand: ${stand.name} - NO COORDINATES`)
          }
        })
      }
    } catch (err) {
      addDebugInfo('❌ Exception loading stands')
      console.error('Error in loadStands:', err)
      setError('Database connection error')
    } finally {
      setLoading(false)
    }
  }

  const switchLayer = (layerType: 'satellite' | 'street' | 'terrain' | 'google' | 'bing') => {
    if (!leafletMapRef.current || !L) return

    addDebugInfo(`🔄 Switching to ${layerType} layer...`)

    // Remove existing tile layers
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    // Reset tile counters
    setTilesLoaded(0)
    setTilesErrored(0)

    let tileUrl = ''
    let attribution = ''

    switch (layerType) {
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        attribution = '&copy; <a href="https://www.esri.com/">Esri</a>, &copy; <a href="https://www.digitalglobe.com/">DigitalGlobe</a>'
        break
      case 'google':
        tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        attribution = '&copy; <a href="https://www.google.com/maps">Google</a>'
        break
      case 'bing':
        tileUrl = 'https://ecn.t3.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1'
        attribution = '&copy; <a href="https://www.bing.com/maps">Bing Maps</a>'
        break
      case 'street':
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        break
      case 'terrain':
        tileUrl = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'
        attribution = 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
        break
    }

    addDebugInfo(`🌐 Creating layer with URL: ${tileUrl.substring(0, 50)}...`)

    const newLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 })
    
    // Add debugging events to new layer
    newLayer.on('tileload', () => {
      setTilesLoaded(prev => prev + 1)
    })

    newLayer.on('tileerror', (e: any) => {
      setTilesErrored(prev => prev + 1)
      addDebugInfo(`❌ Tile error: ${e.tile?.src || 'unknown'}`)
    })

    newLayer.on('loading', () => {
      addDebugInfo('⏳ Loading tiles...')
    })

    newLayer.on('load', () => {
      addDebugInfo(`✅ ${layerType} tiles loaded`)
    })

    newLayer.addTo(leafletMapRef.current)
    setCurrentTileLayer(newLayer)
    setCurrentLayer(layerType as any)
  }

  const addTestStand = async () => {
    addDebugInfo('🔄 Adding test stand...')
    try {
      const supabase = createClient()
      
      // First, let's check what stand types are allowed
      const { data: existingStands } = await supabase
        .from('stands')
        .select('type')
        .limit(5)
      
      addDebugInfo(`🔍 Existing stand types: ${existingStands?.map(s => s.type).join(', ')}`)
      
      const testStand = {
        name: `Test Stand ${Date.now()}`,
        description: 'Test hunting stand added from map',
        latitude: PROPERTY_CENTER[0] + (Math.random() - 0.5) * 0.001, // Smaller random offset
        longitude: PROPERTY_CENTER[1] + (Math.random() - 0.5) * 0.001,
        type: existingStands?.[0]?.type || 'tree_stand', // Use same type as existing stand
        active: true
      }

      addDebugInfo(`📝 Inserting stand: ${testStand.name} at ${testStand.latitude}, ${testStand.longitude} (type: ${testStand.type})`)
      
      const { data, error } = await supabase
        .from('stands')
        .insert([testStand])
        .select()

      if (error) {
        addDebugInfo(`❌ Database error: ${error.message}`)
        console.error('Error adding test stand:', error)
        setError(`Could not add test stand: ${error.message}`)
      } else {
        addDebugInfo(`✅ Test stand added: ${data?.[0]?.name}`)
        console.log('Added test stand:', data)
        loadStands()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addDebugInfo(`❌ Exception: ${errorMsg}`)
      console.error('Error adding test stand:', err)
      setError(`Error adding test stand: ${errorMsg}`)
    }
  }

  const clearTestStands = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('stands')
        .delete()
        .ilike('name', 'Test Stand%')

      if (error) {
        console.error('Error clearing test stands:', error)
        setError('Could not clear test stands')
      } else {
        loadStands()
      }
    } catch (err) {
      console.error('Error clearing test stands:', err)
      setError('Error clearing test stands')
    }
  }

  const zoomToProperty = () => {
    if (!leafletMapRef.current) return
    leafletMapRef.current.setView(PROPERTY_CENTER, 18) // Zoom in closer
    addDebugInfo('📍 Zoomed to property center (level 18)')
  }

  const zoomOut = () => {
    if (!leafletMapRef.current) return
    leafletMapRef.current.setView(PROPERTY_CENTER, 14) // Zoom out for broader view
    addDebugInfo('🔍 Zoomed out for broader view (level 14)')
  }

  const testTileUrl = () => {
    addDebugInfo('🧪 Testing tile URL connectivity...')
    const testUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/300/400'
    
    const img = new Image()
    img.onload = () => {
      addDebugInfo('✅ Test tile loaded successfully - network OK')
    }
    img.onerror = () => {
      addDebugInfo('❌ Test tile failed - network/firewall issue')
    }
    img.src = testUrl
  }

  const zoomToStands = () => {
    if (!leafletMapRef.current || stands.length === 0) return
    
    // Find the center of all stands
    const validStands = stands.filter(s => s.latitude && s.longitude)
    if (validStands.length === 0) return
    
    const avgLat = validStands.reduce((sum, s) => sum + s.latitude!, 0) / validStands.length
    const avgLng = validStands.reduce((sum, s) => sum + s.longitude!, 0) / validStands.length
    
    leafletMapRef.current.setView([avgLat, avgLng], 16)
    addDebugInfo(`📍 Zoomed to stands center: ${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}`)
  }

  const testDatabaseConnection = async () => {
    addDebugInfo('🔄 Testing database connection...')
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase
        .from('stands')
        .select('count')
        .limit(1)

      if (error) {
        addDebugInfo(`❌ Database connection failed: ${error.message}`)
        setError(`Database connection error: ${error.message}`)
      } else {
        addDebugInfo('✅ Database connection successful')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addDebugInfo(`❌ Database test exception: ${errorMsg}`)
      setError(`Database test failed: ${errorMsg}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MapPin className="mr-3 text-green-600" size={24} />
                Property Map Test (Debug Mode)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                3843 Quick Rd, Ruffin, NC 27326 • Container Debug Version
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStands(!showStands)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showStands
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Target size={16} className="mr-1" />
                Stands ({stands.length})
              </button>
              <button
                onClick={addTestStand}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Add Test Stand
              </button>
              <button
                onClick={clearTestStands}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Clear Test Stands
              </button>
              <button
                onClick={zoomToProperty}
                className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                🔍 Zoom In
              </button>
              <button
                onClick={zoomToStands}
                className="flex items-center px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                📍 Find Stands
              </button>
              <button
                onClick={zoomOut}
                className="flex items-center px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
              >
                🔍 Zoom Out
              </button>
              <button
                onClick={testTileUrl}
                className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                🧪 Test Network
              </button>
              <button
                onClick={testDatabaseConnection}
                className="flex items-center px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
              >
                🗃️ Test Database
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Status Panel */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Status:</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              {cssLoaded ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-yellow-600" />}
              <span>CSS: {cssLoaded ? 'Loaded' : 'Loading...'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {jsLoaded ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-yellow-600" />}
              <span>JS: {jsLoaded ? 'Loaded' : 'Loading...'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {leafletLoaded ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-yellow-600" />}
              <span>Leaflet: {leafletLoaded ? 'Ready' : 'Loading...'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {mapReady ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-yellow-600" />}
              <span>Map: {mapReady ? 'Ready' : 'Initializing...'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {tilesLoaded > 0 ? <CheckCircle size={14} className="text-green-600" /> : <Clock size={14} className="text-yellow-600" />}
              <span>Tiles: {tilesLoaded} loaded</span>
            </div>
            <div className="flex items-center space-x-2">
              {tilesErrored > 0 ? <AlertCircle size={14} className="text-red-600" /> : <CheckCircle size={14} className="text-green-600" />}
              <span>Errors: {tilesErrored}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <AlertCircle size={16} className="text-red-400 mt-0.5 mr-3" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="h-[calc(100vh-200px)] w-full bg-gray-200 border border-gray-300"
            style={{ minHeight: '400px' }}
          />
          
          {!mapReady && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {!leafletLoaded ? 'Loading map library...' : 'Initializing map...'}
                </p>
              </div>
            </div>
          )}

          {/* Layer Control - Fixed positioning */}
          {mapReady && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200" style={{ zIndex: 1000 }}>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Map Layers</h4>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => switchLayer('satellite')}
                  className={`px-3 py-2 text-xs rounded transition-colors border ${
                    currentLayer === 'satellite'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📡 Esri Satellite
                </button>
                <button
                  onClick={() => switchLayer('google')}
                  className={`px-3 py-2 text-xs rounded transition-colors border ${
                    currentLayer === 'google'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🌎 Google Satellite
                </button>
                <button
                  onClick={() => switchLayer('street')}
                  className={`px-3 py-2 text-xs rounded transition-colors border ${
                    currentLayer === 'street'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🗺️ Street Map
                </button>
                <button
                  onClick={() => switchLayer('terrain')}
                  className={`px-3 py-2 text-xs rounded transition-colors border ${
                    currentLayer === 'terrain'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🏔️ Terrain
                </button>
              </div>
            </div>
          )}

          {/* Map info panel */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border border-gray-200" style={{ zIndex: 1000 }}>
            <h4 className="font-semibold text-gray-900 mb-2">Map Information</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Expected Location:</strong></p>
              <p>• 3843 Quick Rd, Ruffin, NC 27326</p>
              <p>• Coordinates: 36.4273, -79.5109</p>
              <p>• {stands.length} hunting stands loaded</p>
              <p>• Click stands for details</p>
              <p>• Use layer buttons to switch views</p>
              <p>• Try Google Satellite for newer imagery</p>
              <p>• Status: {leafletLoaded ? '✅ Ready' : '⏳ Loading'}</p>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto h-[calc(100vh-200px)]">
          <h4 className="font-semibold text-gray-900 mb-2">Debug Log:</h4>
          <div className="space-y-1 text-xs font-mono">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-gray-600 break-words">
                {info}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
