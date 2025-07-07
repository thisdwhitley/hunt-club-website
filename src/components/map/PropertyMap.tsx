'use client'

// src/components/map/PropertyMap.tsx
// Reusable Property Map Component for Caswell County Yacht Club

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Target, TreePine, Compass } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import StandCard from '@/components/stands/StandCard'

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
}

interface PropertyMapProps {
  // Display options
  showControls?: boolean
  showIconReference?: boolean
  className?: string
  height?: string
  
  // Event handlers
  onStandClick?: (stand: Stand) => void
  onMapReady?: () => void
  onError?: (error: string) => void
  
  // Initial settings
  defaultLayer?: 'esri' | 'google' | 'street' | 'terrain' | 'bing'
  defaultShowStands?: boolean
  defaultShowCameras?: boolean
  defaultShowFoodPlots?: boolean
  defaultShowTrails?: boolean
}

// Global reference to loaded Leaflet library
let L: any = null

// Note: Icons are handled by StandCard component using lucide-react
// No need to recreate them here

export default function PropertyMap({
  showControls = true,
  showIconReference = false,
  className = '',
  height = 'h-96 md:h-[500px]',
  onStandClick,
  onMapReady,
  onError,
  defaultLayer = 'esri',
  defaultShowStands = true,
  defaultShowCameras = true,
  defaultShowFoodPlots = true,
  defaultShowTrails = true
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  
  // Data states
  const [stands, setStands] = useState<Stand[]>([])
  const [propertyBoundaries, setPropertyBoundaries] = useState<PropertyBoundary[]>([])
  
  // Map states
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Control states
  const [showStands, setShowStands] = useState(defaultShowStands)
  const [showCameras, setShowCameras] = useState(defaultShowCameras)
  const [showFoodPlots, setShowFoodPlots] = useState(defaultShowFoodPlots)
  const [showTrails, setShowTrails] = useState(defaultShowTrails)
  const [showIconRef, setShowIconRef] = useState(showIconReference)
  const [currentLayer, setCurrentLayer] = useState<'esri' | 'google' | 'street' | 'terrain' | 'bing'>(defaultLayer)

  // Load data from Supabase
  const loadStands = async () => {
    try {
      const supabase = createClient()
      const { data, error: supabaseError } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (supabaseError) throw supabaseError
      setStands(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load stands'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  const fetchPropertyBoundaries = async () => {
    try {
      const supabase = createClient()
      const { data, error: supabaseError } = await supabase
        .from('property_boundaries')
        .select('*')
        .order('name')

      if (supabaseError) throw supabaseError
      setPropertyBoundaries(data || [])
    } catch (err) {
      console.error('Failed to load boundaries:', err)
    }
  }

  // Add popup styling
  useEffect(() => {
    // Add CSS for popup styling
    const style = document.createElement('style')
    style.textContent = `
      .leaflet-popup-content-wrapper {
        padding: 8px !important;
        border-radius: 12px !important;
        background: #FFFFFF !important;
      }
      
      .leaflet-popup-content {
        margin: 0 !important;
        min-width: 320px !important;
      }
      
      .stand-popup .leaflet-popup-content-wrapper {
        box-shadow: 0 8px 24px rgba(45, 62, 31, 0.15) !important;
        border: 2px solid #E8E6E0 !important;
      }
      
      .stand-popup .leaflet-popup-tip {
        background: #FFFFFF !important;
        border: 2px solid #E8E6E0 !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Initialize Leaflet
  useEffect(() => {
    const initializeLeaflet = async () => {
      if (typeof window === 'undefined' || L) return

      try {
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
          setLeafletLoaded(true)
        }
        document.head.appendChild(script)
      } catch (err) {
        const errorMsg = 'Failed to load Leaflet'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }

    initializeLeaflet()
  }, [onError])

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!leafletLoaded || !mapRef.current || leafletMapRef.current) return

      try {
        // Create map - start with clubhouse center but will be adjusted when boundaries load
        leafletMapRef.current = L.map(mapRef.current, {
          zoomControl: false
        }).setView(PROPERTY_CENTER, 18)  // Slightly zoomed out to accommodate boundary fitting

        // Add clubhouse marker
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

        // Initialize with selected layer
        switchLayer(currentLayer)

        setMapReady(true)
        onMapReady?.()
      } catch (err) {
        const errorMsg = `Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }

    initializeMap()
  }, [leafletLoaded, currentLayer, onMapReady, onError])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await Promise.all([loadStands(), fetchPropertyBoundaries()])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Switch tile layer
  const switchLayer = (layerKey: string) => {
    if (!leafletMapRef.current || !L) return

    // Remove existing tile layers
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer._url) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    let tileLayer
    switch (layerKey) {
      case 'esri':
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© CCYC | Esri',
          maxZoom: 18
        })
        break
      case 'google':
        tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          attribution: '© CCYC | Google',
          maxZoom: 20
        })
        break
      case 'street':
        tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© CCYC | OpenStreetMap',
          maxZoom: 19
        })
        break
      case 'terrain':
        tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© CCYC | OpenTopoMap',
          maxZoom: 17
        })
        break
      default:
        tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© CCYC | Esri',
          maxZoom: 18
        })
    }

    tileLayer.addTo(leafletMapRef.current)
    setCurrentLayer(layerKey as any)
  }

  // Create StandCard popup content with proper centering
  const createStandPopupContent = (stand: Stand) => {
    const popupDiv = document.createElement('div')
    
    // Add CSS styling to center the StandCard in the popup
    popupDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      min-width: 330px;
      padding: 0;
      margin: 0;
    `
    
    const root = createRoot(popupDiv)
    
    root.render(
      <StandCard
        stand={stand}
        mode="popup"
        popupWidth={330}
        onClick={onStandClick || ((stand) => {
          console.log('Stand clicked:', stand.name)
        })}
        showLocation={true}
        showStats={true}
        showActions={true}
      />
    )
    
    return popupDiv
  }

  // Display property boundaries with updated styling
  const displayPropertyBoundaries = () => {
    if (!mapReady || !leafletMapRef.current || !L) return

    const boundaryBounds = []

    propertyBoundaries.forEach(boundary => {
      if (boundary.boundary_data && Array.isArray(boundary.boundary_data) && boundary.boundary_data.length > 0) {
        const polyline = L.polyline(boundary.boundary_data, {
          color: '#FE9920',  // Updated to bright orange
          weight: 2,         // Updated to 2px
          opacity: 0.8,
          dashArray: '5,5'
        }).addTo(leafletMapRef.current)
        
        polyline.bindPopup(`
          <div style="min-width: 200px; font-family: sans-serif;">
            <h3 style="color: #566E3D; margin: 0 0 8px 0;">🗺️ ${boundary.name}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px;">${boundary.description || 'Property boundary'}</p>
            ${boundary.total_acres ? `<p style="margin: 0; font-size: 12px; color: #666;"><strong>Area:</strong> ${boundary.total_acres} acres</p>` : ''}
          </div>
        `)

        // Collect boundary points for centering the map
        boundaryBounds.push(...boundary.boundary_data)
      }
    })

    // Center map on boundary bounds if boundaries exist
    if (boundaryBounds.length > 0) {
      const bounds = L.latLngBounds(boundaryBounds)
      leafletMapRef.current.fitBounds(bounds, { padding: [10, 10] })
    }
  }

  // Update stands and boundaries on map when data changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !L) return

    // Clear existing stand markers (keep clubhouse marker)
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getLatLng().lat !== PROPERTY_CENTER[0]) {
        leafletMapRef.current.removeLayer(layer)
      }
      // Also clear any existing polylines (boundaries)
      if (layer instanceof L.Polyline) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    // Display property boundaries first (this will center the map)
    displayPropertyBoundaries()

    if (!showStands) return

    // Create simple hunting stand icon
    const huntingStandIcon = L.divIcon({
      html: `
        <div style="
          background: #FA7921; 
          border: 2px solid #E8E6E0; 
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

    // Add hunting stand markers
    stands.forEach((stand) => {
      if (stand.latitude && stand.longitude && stand.active) {
        const marker = L.marker([stand.latitude, stand.longitude], { icon: huntingStandIcon })
          .addTo(leafletMapRef.current)
        
        // Bind popup with StandCard and proper styling
        marker.bindPopup(() => createStandPopupContent(stand), {
          maxWidth: 350,
          minWidth: 330,
          className: 'stand-popup',
          closeButton: true,
          autoPan: true,
          keepInView: true
        })
      }
    })
  }, [mapReady, stands, showStands, propertyBoundaries])

  // Component visibility controls
  const mapComponents = [
    { label: 'Stands', visible: showStands, setter: setShowStands, color: '#FA7921' },
    { label: 'Cameras', visible: showCameras, setter: setShowCameras, color: '#566E3D' },
    { label: 'Food Plots', visible: showFoodPlots, setter: setShowFoodPlots, color: '#B9A44C' },
    { label: 'Trails', visible: showTrails, setter: setShowTrails, color: '#8B7355' }
  ]

  return (
    <div className={`${className}`}>
      {/* Map Container with hunting club styling */}
      <div style={{ 
        background: '#E8E6E0', 
        border: '2px solid #2D3E1F', 
        borderRadius: '12px'
      }}>
        {/* Header */}
        <div style={{ 
          background: '#2D3E1F', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '10px 10px 0 0' 
        }}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Caswell County Yacht Club Property Map
          </h2>
          <p className="text-sm text-gray-200 mt-1">
            Interactive property map with hunting stands, trails, and cameras
          </p>
        </div>

        {showControls && (
          <div style={{ padding: '1rem', borderBottom: '1px solid #8B7355' }}>
            {/* Layer Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                      onClick={() => switchLayer(layer.key)}
                      style={{
                        background: currentLayer === layer.key ? '#566E3D' : '#B9A44C',
                        color: currentLayer === layer.key ? 'white' : '#2D3E1F',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      className="hover:opacity-80"
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Component Toggles */}
              <div>
                <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Show/Hide</h3>
                <div className="grid grid-cols-2 gap-2">
                  {mapComponents.map((component) => (
                    <button
                      key={component.label}
                      onClick={() => component.setter(!component.visible)}
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
                        opacity: component.visible ? 1 : 0.6,
                        cursor: 'pointer'
                      }}
                      className="hover:opacity-80"
                    >
                      {component.visible ? '👁️' : '🔒'} {component.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Reference Toggle */}
              <div>
                <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Reference</h3>
                <button
                  onClick={() => setShowIconRef(!showIconRef)}
                  style={{
                    backgroundColor: showIconRef ? '#566E3D' : '#B9A44C',
                    color: 'white'
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  📋 {showIconRef ? 'Hide' : 'Show'} Icons
                </button>
              </div>
            </div>

            {/* Icon Reference Guide - Using actual lucide-react icons */}
            {showIconRef && (
              <div className="pt-4 border-t-2 border-gray-300">
                <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-3 text-base">Stand Popup Icon Reference</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stand Types - These come from StandCard's lucide-react icons */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Stand Types</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 text-orange-600">🚂</span>
                        <span>Ladder Stand</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 text-orange-600">⭕</span>
                        <span>Bale Blind</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 text-orange-600">📦</span>
                        <span>Box Stand</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 text-orange-600">📐</span>
                        <span>Tripod</span>
                      </div>
                    </div>
                  </div>

                  {/* Time Icons */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Time of Day</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span>🌅</span>
                        <span>Morning (AM)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>🌙</span>
                        <span>Evening (PM)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>🕐</span>
                        <span>All Day</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Icons */}
                  <div>
                    <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Info Icons</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span>👥</span>
                        <span>Capacity</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>👣</span>
                        <span>Walk Time</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>📷</span>
                        <span>Trail Camera</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>💧</span>
                        <span>Water Source</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>📊</span>
                        <span>Performance</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  <strong>Note:</strong> Icons appear in StandCard popups when you click on stand markers. All stand types use hunting orange (#FA7921) styling.
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Map */}
        <div ref={mapRef} className={`w-full ${height}`} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Loading display */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-gray-800">Loading property data...</p>
          </div>
        </div>
      )}
    </div>
  )
}
