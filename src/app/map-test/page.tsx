// src/app/map-test/page.tsx
// Hunting club themed version with Caswell County Yacht Club design system
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Target, AlertCircle, CheckCircle, Clock, Crosshair, TreePine, Compass } from 'lucide-react'

// Property coordinates for Caswell County Yacht Club clubhouse
const PROPERTY_CENTER: [number, number] = [36.42712517693617, -79.51073582842501]

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

interface PropertyBoundary {
  id: string
  name: string
  boundary_data: [number, number][]
  total_acres: number | null
  description: string | null
}

// Global reference to loaded Leaflet library
let L: any = null

export default function MapTest2Page() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const [stands, setStands] = useState<Stand[]>([])
  const [propertyBoundaries, setPropertyBoundaries] = useState<PropertyBoundary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Component visibility states
  const [showStands, setShowStands] = useState(true)
  const [showCameras, setShowCameras] = useState(true)
  const [showFoodPlots, setShowFoodPlots] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [currentLayer, setCurrentLayer] = useState<'esri' | 'google' | 'street' | 'terrain' | 'bing'>('esri')
  const [mapReady, setMapReady] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  
  // Debug states
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [cssLoaded, setCssLoaded] = useState(false)
  const [jsLoaded, setJsLoaded] = useState(false)
  const [currentTileLayer, setCurrentTileLayer] = useState<any>(null)
  const [tilesLoaded, setTilesLoaded] = useState(0)
  const [tilesErrored, setTilesErrored] = useState(0)

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const fetchPropertyBoundaries = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('property_boundaries')
        .select('id, name, boundary_data, total_acres, description')
      
      if (error) {
        addDebugInfo('⚠️ Could not load property boundaries')
        console.warn('Property boundaries error:', error)
        return
      }
      
      if (data && data.length > 0) {
        setPropertyBoundaries(data)
        addDebugInfo(`✅ Loaded ${data.length} property boundaries`)
      } else {
        addDebugInfo('ℹ️ No property boundaries found')
      }
    } catch (err) {
      addDebugInfo('⚠️ Error fetching property boundaries')
      console.warn('Error fetching boundaries:', err)
    }
  }

  const displayPropertyBoundaries = () => {
    if (!leafletMapRef.current || !L || propertyBoundaries.length === 0) return

    propertyBoundaries.forEach(boundary => {
      if (boundary.boundary_data && Array.isArray(boundary.boundary_data)) {
        // Create polyline for boundary
        const polyline = L.polyline(boundary.boundary_data, {
          color: '#FA7921',
          weight: 2,
          opacity: 0.8,
          dashArray: '2,3'
        }).addTo(leafletMapRef.current)
        
        // Add popup
        polyline.bindPopup(`
          <div style="min-width: 180px;">
            <h3 style="color: #566E3D; margin: 0 0 8px 0;">🗺️ ${boundary.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px;">${boundary.description || 'Property boundary'}</p>
            ${boundary.total_acres ? `<p style="margin: 0; font-size: 14px;"><strong>Area:</strong> ${boundary.total_acres} acres</p>` : ''}
          </div>
        `)
        
        // Center map on boundary
        const boundaryBounds = L.latLngBounds(boundary.boundary_data)
        leafletMapRef.current.fitBounds(boundaryBounds, { padding: [20, 20] })
        
        addDebugInfo(`🗺️ Added boundary: ${boundary.name}`)
      }
    })
  }

  // Load stands from database
  const loadStands = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .eq('active', true)

      if (error) {
        addDebugInfo(`❌ Club database error: ${error.message}`)
        console.error('Error loading stands:', error)
        setError('Could not load hunting stands from club database')
      } else {
        setStands(data || [])
        addDebugInfo(`✅ Loaded ${data?.length || 0} hunting stands from club database`)
        console.log('Loaded stands:', data)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addDebugInfo(`❌ Exception loading stands: ${errorMsg}`)
      console.error('Error loading stands:', err)
      setError(`Error loading hunting stands: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  // Load Leaflet from CDN
  useEffect(() => {
    const loadLeafletFromCDN = () => {
      try {
        addDebugInfo('🌐 Starting hunting club map CDN load process...')
        
        // Load CSS first
        addDebugInfo('🎨 Loading hunting club map styles from CDN...')
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        cssLink.crossOrigin = ''
        
        cssLink.onload = () => {
          setCssLoaded(true)
          addDebugInfo('✅ Hunting club map styles loaded from CDN')
        }
        
        cssLink.onerror = () => {
          setCssLoaded(false)
          addDebugInfo('❌ Hunting club map styles failed to load from CDN')
        }
        
        document.head.appendChild(cssLink)

        // Load JavaScript
        addDebugInfo('🗺️ Loading hunting club map engine from CDN...')
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        
        script.onload = () => {
          setJsLoaded(true)
          addDebugInfo('✅ Hunting club map engine loaded successfully')
          
          L = (window as any).L
          
          if (!L) {
            addDebugInfo('❌ Leaflet not found in window after script load')
            setError('Hunting club map engine failed to initialize')
            return
          }

          addDebugInfo('🔧 Configuring hunting club map icons...')
          
          // Fix for default markers
          try {
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })
            addDebugInfo('✅ Hunting club map icons configured')
          } catch (iconErr) {
            addDebugInfo('⚠️ Icon configuration failed but continuing...')
            console.error('Icon config error:', iconErr)
          }

          setLeafletLoaded(true)
          addDebugInfo('🎉 Hunting club map fully loaded and ready!')
        }

        script.onerror = (err) => {
          setJsLoaded(false)
          addDebugInfo('❌ Hunting club map engine failed to load from CDN')
          console.error('Failed to load Leaflet from CDN:', err)
          setError('Failed to load hunting club map engine from CDN')
        }

        document.head.appendChild(script)

      } catch (err) {
        addDebugInfo('❌ Exception during hunting club map CDN load process')
        console.error('Error loading Leaflet from CDN:', err)
        setError('Failed to load hunting club map engine')
      }
    }

    loadLeafletFromCDN()
  }, [])

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !L || !mapRef.current || leafletMapRef.current) return

    addDebugInfo('🗺️ Initializing hunting club property map...')

    try {
      const rect = mapRef.current.getBoundingClientRect()
      addDebugInfo(`📐 Hunting club map container dimensions: ${rect.width}x${rect.height}`)
      
      if (rect.width === 0 || rect.height === 0) {
        addDebugInfo('❌ Hunting club map container has zero dimensions!')
        setError('Map container not ready')
        return
      }

      // Create the map without zoom controls
      leafletMapRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView(PROPERTY_CENTER, 16)
      addDebugInfo('🏗️ Hunting club map object created')

      // Add clubhouse marker with simple styling
      const clubhouseIcon = L.divIcon({
        html: `
          <div style="
            background: #566E3D; 
            border: 2px solid #FA7921; 
            border-radius: 50%; 
            width: 20px; 
            height: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            <div style="
              background: white; 
              border-radius: 50%; 
              width: 6px; 
              height: 6px;
            "></div>
          </div>
        `,
        className: 'hunting-club-clubhouse-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10],
      })

      L.marker(PROPERTY_CENTER, { icon: clubhouseIcon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="min-width: 220px; font-family: sans-serif;">
            <h3 style="color: #566E3D; font-weight: 700; margin: 0 0 12px 0; display: flex; align-items: center; font-size: 16px;">
              <svg style="margin-right: 8px; color: #FA7921;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Caswell County Yacht Club
            </h3>
            <p style="color: #2D3E1F; font-size: 14px; margin: 0 0 12px 0; line-height: 1.4;">
              <strong>Clubhouse</strong><br>
              100-acre hunting property with stands, trails, and trail cameras
            </p>
            <div style="background: #E8E6E0; padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 12px; color: #566E3D;">
              <p style="margin: 0 0 4px 0;"><strong>Coordinates:</strong> ${PROPERTY_CENTER[0].toFixed(6)}, ${PROPERTY_CENTER[1].toFixed(6)}</p>
              <p style="margin: 0;"><strong>Property Size:</strong> 100 acres</p>
            </div>
          </div>
        `)

      // Initialize with Esri satellite layer
      switchLayer('esri')

      setMapReady(true)
      addDebugInfo('✅ Hunting club property map ready for field testing!')
      fetchPropertyBoundaries()

    } catch (err) {
      addDebugInfo('❌ Exception during hunting club map initialization')
      console.error('Error initializing map:', err)
      setError('Failed to initialize hunting club property map')
    }
  }, [leafletLoaded])

  // Load stands when component mounts - ORIGINAL TIMING RESTORED
  useEffect(() => {
    loadStands()
  }, [])

  // Display stands on map when data changes - ORIGINAL LOGIC RESTORED
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !L) return

    addDebugInfo(`🔄 Updating ${stands.length} hunting stands on map (visibility: ${showStands})`)

    // Clear existing stand markers (keep headquarters marker)
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getLatLng().lat !== PROPERTY_CENTER[0]) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    if (!showStands) return

    // Create simple hunting stand icon with original color coding
    const huntingStandIcon = L.divIcon({
      html: `
        <div style="
          background: #FA7921; 
          border: 2px solid #2D3E1F; 
          border-radius: 50%; 
          width: 16px; 
          height: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'hunting-stand-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    })

    let standsAdded = 0

    // Add hunting stand markers
    stands.forEach((stand) => {
      if (stand.latitude && stand.longitude) {
        addDebugInfo(`🎯 Adding hunting stand marker: ${stand.name} at ${stand.latitude}, ${stand.longitude}`)
        L.marker([stand.latitude, stand.longitude], { icon: huntingStandIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div style="min-width: 220px; font-family: sans-serif;">
              <h3 style="color: #566E3D; font-weight: 700; margin: 0 0 10px 0; display: flex; align-items: center; font-size: 15px;">
                <svg style="margin-right: 8px; color: #FA7921;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="m21 12-3-3-3 3-3-3-3 3"/>
                </svg>
                ${stand.name}
              </h3>
              <p style="color: #2D3E1F; font-size: 14px; margin: 0 0 10px 0; line-height: 1.4;">
                <strong>Type:</strong> ${stand.type}<br>
                ${stand.description || 'Hunting stand'}
              </p>
              <div style="background: #E8E6E0; padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 12px; color: #566E3D;">
                <p style="margin: 0;"><strong>Coordinates:</strong> ${stand.latitude.toFixed(6)}, ${stand.longitude.toFixed(6)}</p>
              </div>
            </div>
          `)
        standsAdded++
      }
    })

    addDebugInfo(`✅ Added ${standsAdded} hunting stand markers to map`)
  }, [stands, showStands, mapReady])

  // Display property boundaries when data is loaded
  useEffect(() => {
    if (mapReady && propertyBoundaries.length > 0) {
      displayPropertyBoundaries()
    }
  }, [mapReady, propertyBoundaries])

  const switchLayer = (layerType: 'esri' | 'google' | 'street' | 'terrain') => {
    if (!leafletMapRef.current || !L) return

    // Remove current tile layer
    if (currentTileLayer) {
      leafletMapRef.current.removeLayer(currentTileLayer)
      addDebugInfo(`🗑️ Removed ${currentLayer} layer from hunting club map`)
    }

    // Reset tile counters
    setTilesLoaded(0)
    setTilesErrored(0)

    let tileUrl = ''
    let attribution = ''

    switch (layerType) {
      case 'esri':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        break
      case 'google':
        tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        attribution = '&copy; Google'
        break
      case 'street':
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution = '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        break
      case 'terrain':
        tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        attribution = '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> (&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>)'
        break
    }

    addDebugInfo(`🌐 Creating ${layerType} layer for hunting club property`)

    const newLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 })
    
    // Add debugging events to new layer
    newLayer.on('tileload', () => {
      setTilesLoaded(prev => prev + 1)
    })

    newLayer.on('tileerror', (e: any) => {
      setTilesErrored(prev => prev + 1)
      addDebugInfo(`❌ Tile error on hunting club map: ${e.tile?.src || 'unknown'}`)
    })

    newLayer.on('loading', () => {
      addDebugInfo('⏳ Loading hunting club property tiles...')
    })

    newLayer.on('load', () => {
      addDebugInfo(`✅ ${layerType} tiles loaded for hunting club property`)
    })

    newLayer.addTo(leafletMapRef.current)
    setCurrentTileLayer(newLayer)
    setCurrentLayer(layerType as any)
  }

  const addTestStand = async () => {
    addDebugInfo('🎯 Adding test hunting stand...')
    try {
      const supabase = createClient()
      
      // Check existing stand types
      const { data: existingStands } = await supabase
        .from('stands')
        .select('type')
        .limit(5)
      
      addDebugInfo(`🔍 Existing hunting stand types: ${existingStands?.map(s => s.type).join(', ')}`)
      
      const testStand = {
        name: `Test Stand ${Date.now()}`,
        description: 'Test hunting stand added from property map',
        latitude: PROPERTY_CENTER[0] + (Math.random() - 0.5) * 0.001,
        longitude: PROPERTY_CENTER[1] + (Math.random() - 0.5) * 0.001,
        type: existingStands?.[0]?.type || 'tree_stand',
        active: true
      }

      addDebugInfo(`📝 Adding hunting stand: ${testStand.name} at ${testStand.latitude}, ${testStand.longitude} (type: ${testStand.type})`)
      
      const { data, error } = await supabase
        .from('stands')
        .insert([testStand])
        .select()

      if (error) {
        addDebugInfo(`❌ Club database error: ${error.message}`)
        console.error('Error adding test stand:', error)
        setError(`Could not add test hunting stand: ${error.message}`)
      } else {
        addDebugInfo(`✅ Test hunting stand added: ${data?.[0]?.name}`)
        console.log('Added test stand:', data)
        loadStands()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addDebugInfo(`❌ Club database exception: ${errorMsg}`)
      setError(`Club database error: ${errorMsg}`)
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
        setError('Could not clear test hunting stands')
      } else {
        addDebugInfo('🧹 Cleared test hunting stands from club database')
        loadStands()
      }
    } catch (err) {
      console.error('Error clearing test stands:', err)
      setError('Error clearing test hunting stands')
    }
  }

  const zoomToProperty = () => {
    if (!leafletMapRef.current) return
    leafletMapRef.current.setView(PROPERTY_CENTER, 18)
    addDebugInfo('📍 Zoomed to clubhouse (level 18)')
  }

  const zoomOut = () => {
    if (!leafletMapRef.current) return
    leafletMapRef.current.setView(PROPERTY_CENTER, 14)
    addDebugInfo('🔍 Zoomed out for broader property view (level 14)')
  }

  const testTileUrl = () => {
    addDebugInfo('🧪 Testing hunting club map connectivity...')
    const testUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/300/400'
    
    const img = new Image()
    img.onload = () => {
      addDebugInfo('✅ Test tile loaded successfully - hunting club map network OK')
    }
    img.onerror = () => {
      addDebugInfo('❌ Test tile failed - hunting club map network/firewall issue')
    }
    img.src = testUrl
  }

  const zoomToStands = () => {
    if (!leafletMapRef.current || stands.length === 0) return
    
    const validStands = stands.filter(s => s.latitude && s.longitude)
    if (validStands.length === 0) return
    
    const avgLat = validStands.reduce((sum, s) => sum + s.latitude!, 0) / validStands.length
    const avgLng = validStands.reduce((sum, s) => sum + s.longitude!, 0) / validStands.length
    
    leafletMapRef.current.setView([avgLat, avgLng], 16)
    addDebugInfo(`📍 Zoomed to hunting stands center: ${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}`)
  }

  const testDatabaseConnection = async () => {
    addDebugInfo('🔄 Testing club database connection...')
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('stands')
        .select('count')
        .limit(1)

      if (error) {
        addDebugInfo(`❌ Club database connection failed: ${error.message}`)
        setError(`Club database connection error: ${error.message}`)
      } else {
        addDebugInfo('✅ Club database connection successful')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      addDebugInfo(`❌ Exception: ${errorMsg}`)
      console.error('Error testing database connection:', err)
      setError(`Error testing club database connection: ${errorMsg}`)
    }
  }

  return (
    <div className="hunting-club-container">
      {/* Hunting Club Header */}
      <div style={{ background: '#566E3D', color: 'white', padding: '1rem', borderBottom: '3px solid #FA7921' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-orange-400" />
            Caswell County Yacht Club - Property Map Test
          </h1>
          <p className="text-sm text-gray-200 mt-1">Field Testing Mode • 100-acre hunting property with stands, trails, and cameras</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Status Banner */}
        {error && (
          <div style={{ background: '#A0653A', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }} className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loading && (
          <div style={{ background: '#FE9920', color: 'white', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }} className="flex items-center gap-2">
            <Clock className="w-5 h-5 animate-spin" />
            <span className="font-medium">Loading hunting club property data...</span>
          </div>
        )}

        {/* Field Testing Controls */}
        <div style={{ background: '#E8E6E0', border: '2px solid #2D3E1F', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#566E3D' }} className="text-lg font-bold mb-4 flex items-center gap-2">
            <TreePine className="w-5 h-5" />
            Hunting Club Property Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Layer Controls */}
            <div>
              <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Property View</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'esri', label: 'Esri Satellite' },
                  { key: 'google', label: 'Google Satellite' },
                  { key: 'street', label: 'Street' },
                  { key: 'terrain', label: 'Terrain' }
                ].map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => switchLayer(layer.key as any)}
                    style={{
                      background: currentLayer === layer.key ? '#566E3D' : '#B9A44C',
                      color: currentLayer === layer.key ? 'white' : '#2D3E1F'
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stand Controls */}
            <div>
              <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Hunting Stands ({stands.length})</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={addTestStand}
                  style={{ background: '#4A5D32', color: 'white' }}
                  className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  ➕ Add Test Stand
                </button>
                <button
                  onClick={clearTestStands}
                  style={{ background: '#A0653A', color: 'white' }}
                  className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  🧹 Clear Test Stands
                </button>
              </div>
            </div>

            {/* Navigation Controls */}
            <div>
              <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Navigation</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={zoomToProperty}
                  style={{ background: '#566E3D', color: 'white' }}
                  className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  🏕️ Clubhouse
                </button>
                <button
                  onClick={zoomToStands}
                  style={{ background: '#566E3D', color: 'white' }}
                  className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                >
                  🎯 View Stands
                </button>
              </div>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setShowStands(!showStands)}
              style={{
                background: showStands ? '#4A5D32' : '#8B7355',
                color: 'white'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {showStands ? '👁️ Stands Visible' : '🔒 Stands Hidden'}
            </button>
            <button
              onClick={zoomOut}
              style={{ background: '#B9A44C', color: '#2D3E1F' }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            >
              🔍 Zoom Out
            </button>
            <button
              onClick={testTileUrl}
              style={{ background: '#8B7355', color: 'white' }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            >
              🧪 Test Network
            </button>
            <button
              onClick={testDatabaseConnection}
              style={{ background: '#8B7355', color: 'white' }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            >
              🔄 Test Database
            </button>
          </div>
        </div>

        {/* Map Container with Overlays */}
        <div style={{ 
          background: '#2D3E1F', 
          border: '3px solid #566E3D', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{ background: '#566E3D', color: 'white', padding: '0.75rem' }}>
            <h3 className="font-semibold flex items-center gap-2">
              <Compass className="w-5 h-5" />
              Caswell County Yacht Club Property Map
            </h3>
          </div>
          
          {/* Map Layer Toggle Overlay */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(232, 230, 224, 0.95)',
            border: '2px solid #566E3D',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ color: '#2D3E1F', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              MAP LAYERS
            </div>
            <div className="flex flex-col gap-1">
              {[
                { key: 'esri', label: 'Esri', color: '#0C4767' },
                { key: 'google', label: 'Google', color: '#4A5D32' },
                { key: 'street', label: 'Street', color: '#8B7355' },
                { key: 'terrain', label: 'Terrain', color: '#A0653A' }
              ].map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => switchLayer(layer.key as any)}
                  style={{
                    background: currentLayer === layer.key ? layer.color : 'white',
                    color: currentLayer === layer.key ? 'white' : '#2D3E1F',
                    border: `1px solid ${layer.color}`,
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    minWidth: '70px',
                    opacity: currentLayer === layer.key ? 1 : 0.6
                  }}
                  className="hover:opacity-80"
                >
                  {currentLayer === layer.key ? '👁️' : '🔒'} {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Component Visibility Overlay */}
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '12px',
            zIndex: 1000,
            background: 'rgba(232, 230, 224, 0.95)',
            border: '2px solid #566E3D',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ color: '#2D3E1F', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              COMPONENTS
            </div>
            <div className="flex flex-col gap-1">
              {[
                { key: 'stands', label: 'Stands', visible: showStands, toggle: () => setShowStands(!showStands), color: '#566E3D' },
                { key: 'cameras', label: 'Cameras', visible: showCameras, toggle: () => setShowCameras(!showCameras), color: '#A0653A' },
                { key: 'plots', label: 'Food Plots', visible: showFoodPlots, toggle: () => setShowFoodPlots(!showFoodPlots), color: '#B9A44C' },
                { key: 'trails', label: 'Trails', visible: showTrails, toggle: () => setShowTrails(!showTrails), color: '#8B7355' }
              ].map((component) => (
                <button
                  key={component.key}
                  onClick={component.toggle}
                  style={{
                    background: component.visible ? component.color : 'white',
                    color: component.visible ? 'white' : '#2D3E1F',
                    border: `1px solid ${component.color}`,
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    minWidth: '70px',
                    opacity: component.visible ? 1 : 0.6
                  }}
                  className="hover:opacity-80"
                >
                  {component.visible ? '👁️' : '🔒'} {component.label}
                </button>
              ))}
            </div>
          </div>
          
          <div ref={mapRef} className="w-full h-96 md:h-[500px]" />
        </div>

        {/* Field Testing Debug Info */}
        <div style={{ background: '#E8E6E0', border: '2px solid #8B7355', borderRadius: '12px', marginTop: '1.5rem' }}>
          <div style={{ background: '#8B7355', color: 'white', padding: '0.75rem' }}>
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Field Testing Log
            </h3>
          </div>
          
          <div className="p-4">
            {/* Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div style={{ background: cssLoaded ? '#FE9920' : '#A0653A' }} className="p-3 rounded-lg text-white text-center">
                <div className="text-xs font-medium">Map Styles</div>
                <div className="text-lg font-bold">{cssLoaded ? '✅' : '❌'}</div>
              </div>
              <div style={{ background: jsLoaded ? '#FE9920' : '#A0653A' }} className="p-3 rounded-lg text-white text-center">
                <div className="text-xs font-medium">Map Engine</div>
                <div className="text-lg font-bold">{jsLoaded ? '✅' : '❌'}</div>
              </div>
              <div style={{ background: stands.length > 0 ? '#FE9920' : '#A0653A' }} className="p-3 rounded-lg text-white text-center">
                <div className="text-xs font-medium">Hunting Stands</div>
                <div className="text-lg font-bold">{stands.length}</div>
              </div>
              <div style={{ background: tilesLoaded > 0 ? '#FE9920' : '#A0653A' }} className="p-3 rounded-lg text-white text-center">
                <div className="text-xs font-medium">Tiles Loaded</div>
                <div className="text-lg font-bold">{tilesLoaded}</div>
              </div>
            </div>

            {/* Debug Log */}
            <div style={{ 
              background: 'white', 
              border: '1px solid #8B7355', 
              borderRadius: '8px', 
              maxHeight: '200px', 
              overflowY: 'auto',
              padding: '0.75rem'
            }}>
              {debugInfo.length > 0 ? (
                debugInfo.slice(-10).map((info, index) => (
                  <div key={index} style={{ color: '#2D3E1F', fontSize: '12px', fontFamily: 'monospace', marginBottom: '2px' }}>
                    {info}
                  </div>
                ))
              ) : (
                <div style={{ color: '#8B7355', fontSize: '12px', fontStyle: 'italic' }}>
                  Field testing log will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
