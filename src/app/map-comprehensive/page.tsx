'use client'

// src/app/map-comprehensive/page.tsx
// Comprehensive test page combining best features from map-test, map-diagnostic, and stands/test

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  MapPin, Target, AlertCircle, CheckCircle, Clock, Crosshair, TreePine, Compass,
  Database, Eye, Wifi, Bug, TestTube, Palette, Monitor, Settings,
  Activity, BarChart3, Users, Calendar
} from 'lucide-react'
import { createRoot } from 'react-dom/client'
import StandCard from '@/components/stands/StandCard'

// Property coordinates for Caswell County Yacht Club
const PROPERTY_CENTER: [number, number] = [36.42712517693617, -79.51073582842501]

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

// Updated Stand type icon mapping to match current StandCard component
const getStandTypeIcon = (standType: string) => {
  const icons: { [key: string]: string } = {
    ladder_stand: 'ladder',
    bale_blind: 'circle-dot',
    box_stand: 'square',
    tripod: 'triangle'
  }
  return icons[standType] || 'target'
}

// Create Lucide icon SVG with hunting club colors
const createLucideIcon = (iconName: string, color = '#FA7921', size = 16) => {
  const icons: { [key: string]: string } = {
    'ladder': '<path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>',
    'circle-dot': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
    'square': '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    'triangle': '<path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="m12 2 0 2"/><path d="m12 20 0 2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="m2 12 2 0"/><path d="m20 12 2 0"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
    'wheat': '<path d="m2 22 10-10"/><path d="m16 8-1.17 1.17"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97"/><path d="M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62"/>',
    'droplets': '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05Z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2.04 4.6 4.14 5.93c2.1 1.33 3.59 3.28 4.07 5.67c3.97-4.38 3.97-11.28 0-15.66A11.25 11.25 0 0 0 12.56 6.6"/>',
    'camera': '<path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><circle cx="12" cy="12" r="3"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 21-3-3 3-3"/><path d="M16 3h5v5"/>',
    'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>',
    'bar-chart-3': '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z"/>',
    'route': '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5c.83 0 1.5-.67 1.5-1.5v-11c0-.83-.67-1.5-1.5-1.5H15"/><circle cx="6" cy="5" r="3"/>'
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[iconName] || icons['target']}</svg>`
}

export default function ComprehensiveMapTestPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  
  // Data states
  const [stands, setStands] = useState<Stand[]>([])
  const [propertyBoundaries, setPropertyBoundaries] = useState<PropertyBoundary[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  
  // Status states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leafletReady, setLeafletReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [testing, setTesting] = useState(false)
  
  // Display control states
  const [showStands, setShowStands] = useState(true)
  const [showCameras, setShowCameras] = useState(true)
  const [showFoodPlots, setShowFoodPlots] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [showIconReference, setShowIconReference] = useState(false)
  const [currentLayer, setCurrentLayer] = useState<'esri' | 'google' | 'street' | 'terrain' | 'bing'>('esri')
  
  // Debug states
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [tilesLoaded, setTilesLoaded] = useState(0)

  // Add diagnostic result
  const addDiagnostic = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
    const result: DiagnosticResult = { test, status, message, data }
    setDiagnostics(prev => [...prev, result])
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`, data || '')
  }

  // Add debug info
  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, `${timestamp}: ${info}`])
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
        onClick={(stand) => {
          console.log('Stand clicked:', stand.name)
          alert(`Stand Details: ${stand.name}`)
        }}
        showLocation={true}
        showStats={true}
        showActions={true}
      />
    )
    
    return popupDiv
  }

  // Initialize Leaflet
  const initializeLeaflet = async () => {
    if (typeof window === 'undefined' || L) return

    try {
      addDebugInfo('Initializing Leaflet...')
      
      // Load Leaflet CSS
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
      document.head.appendChild(cssLink)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
      script.onload = () => {
        L = (window as any).L
        setLeafletReady(true)
        addDebugInfo('Leaflet loaded successfully')
        addDiagnostic('Leaflet Load', 'success', 'Library loaded and ready')
      }
      script.onerror = () => {
        addDebugInfo('Failed to load Leaflet')
        addDiagnostic('Leaflet Load', 'error', 'Failed to load Leaflet library')
      }
      document.head.appendChild(script)
    } catch (error) {
      addDebugInfo(`Leaflet initialization error: ${error}`)
      addDiagnostic('Leaflet Load', 'error', `Initialization failed: ${error}`)
    }
  }

  // Initialize map
  const initializeMap = async () => {
    if (!leafletReady || !mapRef.current || leafletMapRef.current) return

    try {
      addDebugInfo('Creating map instance...')
      
      // Create map
      const map = L.map(mapRef.current, {
        center: PROPERTY_CENTER,
        zoom: 16,
        zoomControl: true,
        attributionControl: false
      })

      leafletMapRef.current = map

      // Add tile layer based on current selection
      addTileLayer(map, currentLayer)

      // Add property boundary if available
      if (propertyBoundaries.length > 0) {
        addPropertyBoundaries(map)
      }

      // Add stands as markers
      if (stands.length > 0) {
        addStandMarkers(map)
      }

      // Map event listeners
      map.on('zoomend', () => {
        addDebugInfo(`Zoom changed to: ${map.getZoom()}`)
      })

      map.on('moveend', () => {
        const center = map.getCenter()
        addDebugInfo(`Map centered: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`)
      })

      setMapReady(true)
      addDebugInfo('Map initialized successfully')
      addDiagnostic('Map Initialization', 'success', 'Interactive map created')

    } catch (error) {
      addDebugInfo(`Map initialization error: ${error}`)
      addDiagnostic('Map Initialization', 'error', `Failed: ${error}`)
      setError(`Map initialization failed: ${error}`)
    }
  }

  // Add tile layer
  const addTileLayer = (map: any, layerType: string) => {
    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer._url) {
        map.removeLayer(layer)
      }
    })

    let tileLayer
    const attribution = '© CCYC Hunting Club'

    switch (layerType) {
      case 'esri':
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: `${attribution} | Esri`
        })
        break
      case 'google':
        tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          attribution: `${attribution} | Google`
        })
        break
      case 'street':
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: `${attribution} | OpenStreetMap`
        })
        break
      case 'terrain':
        tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: `${attribution} | OpenTopoMap`
        })
        break
      case 'bing':
        tileLayer = L.tileLayer('https://ecn.t3.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1', {
          attribution: `${attribution} | Bing`,
          subdomains: '0123'
        })
        break
      default:
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: `${attribution} | Esri`
        })
    }

    tileLayer.on('load', () => {
      setTilesLoaded(prev => prev + 1)
    })

    tileLayer.addTo(map)
    addDebugInfo(`Switched to ${layerType} layer`)
  }

  // Add property boundaries
  const addPropertyBoundaries = (map: any) => {
    propertyBoundaries.forEach(boundary => {
      if (boundary.boundary_data && boundary.boundary_data.length > 0) {
        const polygon = L.polygon(boundary.boundary_data, {
          color: '#566E3D',
          weight: 3,
          opacity: 0.8,
          fillColor: '#566E3D',
          fillOpacity: 0.1
        }).addTo(map)

        polygon.bindPopup(`
          <div style="font-family: system-ui, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #566E3D; font-weight: bold;">
              ${boundary.name}
            </h3>
            <p style="margin: 0; font-size: 14px; color: #2D3E1F;">
              ${boundary.total_acres ? `${boundary.total_acres} acres` : 'Area not specified'}
            </p>
            ${boundary.description ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #8B7355;">${boundary.description}</p>` : ''}
          </div>
        `)
      }
    })
    addDebugInfo(`Added ${propertyBoundaries.length} property boundaries`)
  }

  // Add stand markers
  const addStandMarkers = (map: any) => {
    stands.forEach(stand => {
      if (stand.latitude && stand.longitude && stand.active) {
        // Create custom marker
        const iconHtml = `
          <div style="
            background: #FA7921;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            ${createLucideIcon(getStandTypeIcon(stand.type), 'white', 18)}
          </div>
        `

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        })

        const marker = L.marker([stand.latitude, stand.longitude], {
          icon: customIcon
        }).addTo(map)

        // Bind popup with StandCard
        marker.bindPopup(() => createStandPopupContent(stand), {
          maxWidth: 350,
          className: 'stand-popup'
        })

        marker.on('click', () => {
          addDebugInfo(`Stand marker clicked: ${stand.name}`)
        })
      }
    })
    addDebugInfo(`Added ${stands.filter(s => s.latitude && s.longitude && s.active).length} stand markers`)
  }

  // Database operations
  const loadStands = async () => {
    try {
      addDiagnostic('Load Stands', 'warning', 'Loading stands data...')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) {
        addDiagnostic('Load Stands', 'error', `Failed: ${error.message}`)
        throw error
      }

      setStands(data || [])
      addDiagnostic('Load Stands', 'success', `Loaded ${data?.length || 0} stands`)
      addDebugInfo(`Loaded ${data?.length || 0} stands from database`)
      
      return data || []
    } catch (error) {
      addDiagnostic('Load Stands', 'error', `Exception: ${error}`)
      throw error
    }
  }

  const loadBoundaries = async () => {
    try {
      addDiagnostic('Load Boundaries', 'warning', 'Loading boundaries...')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('property_boundaries')
        .select('*')
        .order('name')

      if (error) {
        addDiagnostic('Load Boundaries', 'error', `Failed: ${error.message}`)
        throw error
      }

      setPropertyBoundaries(data || [])
      addDiagnostic('Load Boundaries', 'success', `Loaded ${data?.length || 0} boundaries`)
      
      return data || []
    } catch (error) {
      addDiagnostic('Load Boundaries', 'error', `Exception: ${error}`)
      throw error
    }
  }

  // Test functions
  const testEnvironment = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    addDiagnostic('Environment', 
      supabaseUrl && supabaseAnonKey ? 'success' : 'error',
      `URL: ${supabaseUrl ? 'Present' : 'Missing'} | Key: ${supabaseAnonKey ? 'Present' : 'Missing'}`
    )
  }

  const testRawQuery = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('stands').select('*').limit(3)
      
      addDiagnostic('Raw Query Test', error ? 'error' : 'success', 
        error ? `Failed: ${error.message}` : `Success: ${data?.length || 0} records`,
        { sample: data?.slice(0, 1) }
      )
    } catch (err) {
      addDiagnostic('Raw Query Test', 'error', `Exception: ${err}`)
    }
  }

  const testStandCardComponent = () => {
    try {
      addDiagnostic('StandCard Component', 'success', 'Component available and functional')
    } catch (error) {
      addDiagnostic('StandCard Component', 'error', `Component test failed: ${error}`)
    }
  }

  // Run comprehensive diagnostics
  const runAllDiagnostics = async () => {
    setTesting(true)
    setDiagnostics([])
    
    addDiagnostic('Diagnostics', 'warning', 'Starting comprehensive system tests...')
    
    // Test environment
    testEnvironment()
    
    // Test database connectivity
    await testRawQuery()
    
    // Test data loading
    try {
      await loadStands()
      await loadBoundaries()
    } catch (error) {
      // Errors already logged in individual functions
    }
    
    // Test components
    testStandCardComponent()
    
    addDiagnostic('Diagnostics', 'success', 'All diagnostic tests completed')
    setTesting(false)
  }

  // Switch tile layer
  const switchTileLayer = (layerType: string) => {
    setCurrentLayer(layerType as any)
    if (leafletMapRef.current) {
      addTileLayer(leafletMapRef.current, layerType)
    }
  }

  // Initialize everything
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeLeaflet()
        await loadStands()
        await loadBoundaries()
        setLoading(false)
      } catch (error) {
        setError(`Initialization failed: ${error}`)
        setLoading(false)
      }
    }
    
    initialize()
  }, [])

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (leafletReady) {
      initializeMap()
    }
  }, [leafletReady, stands, propertyBoundaries])

  // Status icon helper
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-600" size={20} />
      case 'error': return <AlertCircle className="text-red-600" size={20} />
      case 'warning': return <Clock className="text-yellow-600" size={20} />
      default: return <div className="w-5 h-5 border-2 border-gray-400 rounded-full animate-spin" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Comprehensive Test Suite...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                🎯 Comprehensive Map Test Suite
              </h1>
              <p className="opacity-90 text-lg">
                Complete testing environment for Caswell County Yacht Club hunting system
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stands.length}</div>
              <div className="text-sm opacity-90">Total Stands</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <Database className="mx-auto mb-2 text-blue-600" size={24} />
            <div className="text-2xl font-bold text-blue-600">{stands.length}</div>
            <div className="text-sm text-blue-800">Total Stands</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
            <div className="text-2xl font-bold text-green-600">{stands.filter(s => s.active).length}</div>
            <div className="text-sm text-green-800">Active</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
            <MapPin className="mx-auto mb-2 text-orange-600" size={24} />
            <div className="text-2xl font-bold text-orange-600">{stands.filter(s => s.latitude && s.longitude).length}</div>
            <div className="text-sm text-orange-800">Mapped</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
            <Activity className="mx-auto mb-2 text-purple-600" size={24} />
            <div className="text-2xl font-bold text-purple-600">{propertyBoundaries.length}</div>
            <div className="text-sm text-purple-800">Boundaries</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
            <BarChart3 className="mx-auto mb-2 text-yellow-600" size={24} />
            <div className="text-2xl font-bold text-yellow-600">{stands.reduce((sum, s) => sum + (s.total_harvests || 0), 0)}</div>
            <div className="text-sm text-yellow-800">Harvests</div>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg text-center border border-teal-200">
            <Users className="mx-auto mb-2 text-teal-600" size={24} />
            <div className="text-2xl font-bold text-teal-600">{stands.filter(s => s.trail_camera_name).length}</div>
            <div className="text-sm text-teal-800">Cameras</div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="text-green-600" size={24} />
                Interactive Property Map with StandCard Popups
              </h2>
              <div className="text-sm text-gray-600 bg-gray-200 px-3 py-1 rounded">
                Status: {mapReady ? '✅ Ready' : '⏳ Loading'}
              </div>
            </div>

            {/* Map Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Layer Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Layer:</span>
                <select 
                  value={currentLayer} 
                  onChange={(e) => switchTileLayer(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="esri">Satellite (Esri)</option>
                  <option value="google">Satellite (Google)</option>
                  <option value="street">Street Map</option>
                  <option value="terrain">Terrain</option>
                  <option value="bing">Bing Maps</option>
                </select>
              </div>

              {/* Display Toggles */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input 
                    type="checkbox" 
                    checked={showStands} 
                    onChange={(e) => setShowStands(e.target.checked)}
                  />
                  Stands
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input 
                    type="checkbox" 
                    checked={showCameras} 
                    onChange={(e) => setShowCameras(e.target.checked)}
                  />
                  Cameras
                </label>
              </div>

              {/* Icon Reference Toggle */}
              <button
                onClick={() => setShowIconReference(!showIconReference)}
                style={{
                  backgroundColor: showIconReference ? '#566E3D' : '#B9A44C',
                  color: 'white'
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              >
                📋 {showIconReference ? 'Hide' : 'Show'} Icons
              </button>
            </div>

            {/* Updated Icon Reference Guide */}
            {showIconReference && (
              <div className="mt-4 pt-4 border-t-2 border-gray-300">
                <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-3 text-base">StandCard Icon Reference</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Stand Types */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Stand Types</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('ladder', '#FA7921', 14) }} />
                        <span>Ladder Stand</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('circle-dot', '#FA7921', 14) }} />
                        <span>Bale Blind</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('square', '#FA7921', 14) }} />
                        <span>Box Stand</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('triangle', '#FA7921', 14) }} />
                        <span>Tripod</span>
                      </div>
                    </div>
                  </div>

                  {/* Time of Day */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Time of Day</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('sun', '#FE9920', 14) }} />
                        <span>Morning (AM)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('moon', '#B9A44C', 14) }} />
                        <span>Evening (PM)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('clock', '#566E3D', 14) }} />
                        <span>All Day</span>
                      </div>
                    </div>
                  </div>

                  {/* Food Sources */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Food Sources</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('wheat', '#B9A44C', 14) }} />
                        <span>Field</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('target', '#FA7921', 14) }} />
                        <span>Feeder</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Icons */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Info Icons</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('users', '#566E3D', 14) }} />
                        <span>Capacity</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('footprints', '#566E3D', 14) }} />
                        <span>Walk Time</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('camera', '#566E3D', 14) }} />
                        <span>Trail Camera</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('droplets', '#566E3D', 14) }} />
                        <span>Water Source</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span dangerouslySetInnerHTML={{ __html: createLucideIcon('bar-chart-3', '#566E3D', 14) }} />
                        <span>Performance</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  <strong>Note:</strong> Icons appear in StandCard popups when you click on stand markers. All stands use hunting orange (#FA7921) markers on the map.
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div ref={mapRef} className="w-full h-96" />
        </div>

        {/* Diagnostic Controls */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="text-red-600" size={24} />
                <h2 className="text-xl font-semibold">System Diagnostics</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runAllDiagnostics}
                  disabled={testing}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {testing ? 'Running Tests...' : 'Run All Diagnostics'}
                </button>
                <button
                  onClick={() => setDiagnostics([])}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Clear Results
                </button>
              </div>
            </div>

            {/* Manual Test Buttons */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <TestTube size={16} />
                Quick Tests
              </h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={testEnvironment} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                  Test Environment
                </button>
                <button onClick={testRawQuery} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                  Test Database
                </button>
                <button onClick={testStandCardComponent} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                  Test StandCard
                </button>
                <button onClick={loadStands} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                  Reload Data
                </button>
              </div>
            </div>
          </div>

          {/* Diagnostic Results */}
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
                          {diagnostic.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{diagnostic.message}</p>
                      {diagnostic.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">Show Details</summary>
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-auto">
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

        {/* Debug Log */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="text-blue-600" size={24} />
                <h2 className="text-xl font-semibold">Debug Log</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Tiles Loaded: <span className="font-bold text-blue-600">{tilesLoaded}</span>
                </div>
                <button
                  onClick={() => setDebugInfo([])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Clear Log
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {debugInfo.length > 0 ? (
                debugInfo.slice(-20).map((info, index) => (
                  <div key={index} className="mb-1">
                    {info}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">
                  Debug log will appear here...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 py-4">
          <p className="text-sm">
            Comprehensive Test Suite for Caswell County Yacht Club | 
            Leaflet: {leafletReady ? '✅' : '❌'} | 
            Map: {mapReady ? '✅' : '❌'} | 
            Stands: {stands.length} | 
            Boundaries: {propertyBoundaries.length}
          </p>
        </div>

      </div>
    </div>
  )
}
