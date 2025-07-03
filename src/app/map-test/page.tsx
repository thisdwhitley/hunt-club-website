// src/app/map-test2/page.tsx
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

// Stand type icon mapping
const getStandTypeIcon = (standType: string) => {
  const icons: { [key: string]: string } = {
    ladder_stand: 'railroad-track',
    tree_stand: 'tree-pine', 
    box_stand: 'box',
    ground_blind: 'tent',
    tower_stand: 'tower-control'
  }
  return icons[standType] || 'tree-pine'
}

// Create Lucide icon SVG
const createLucideIcon = (iconName: string, color = '#FA7921', size = 16) => {
  const icons: { [key: string]: string } = {
    'railroad-track': '<rect width="2" height="20" x="8" y="2" rx="1"/><rect width="2" height="20" x="14" y="2" rx="1"/><rect width="18" height="2" x="3" y="8" rx="1"/><rect width="18" height="2" x="3" y="14" rx="1"/>',
    'tree-pine': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22V18"/>',
    'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    'tent': '<path d="M3.5 21 14 3l10.5 18H3.5Z"/><path d="M12 13.5 7.5 21"/><path d="M12 13.5 16.5 21"/>',
    'tower-control': '<path d="M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .95-.73Z"/><path d="M8 13v9"/><path d="M16 22v-9"/><path d="m9 6 1 7"/><path d="m15 6-1 7"/><path d="M12 6V2"/><path d="M13 2h-2"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
    'bow': '<path d="m2 12 8-8v6h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-8v6l-8-8Z"/>',
    'zap': '<path d="m13 2-3 6h4l-3 6"/><path d="M10 14L4 8l2-2"/>',
    'crosshair': '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>',
    'droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    'wheat': '<path d="M2 12h20"/><path d="M6 8v8"/><path d="M10 8v8"/><path d="M14 8v8"/><path d="M18 8v8"/><path d="M4 4v4"/><path d="M8 4v4"/><path d="M12 4v4"/><path d="M16 4v4"/><path d="M20 4v4"/>',
    'hand-platter': '<path d="M12 3V2a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V2a1 1 0 0 1 2 0v1"/><path d="M8 7h8l-2 9H10l-2-9Z"/><circle cx="12" cy="20" r="2"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    'camera': '<path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><circle cx="12" cy="12" r="3"/>',
    'bar-chart-3': '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>'
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[iconName] || icons['tree-pine']}</svg>`
}

// Create new condensed stand popup content
const createStandPopupContent = (stand: Stand) => {
  const standTypeIcon = getStandTypeIcon(stand.type)
  
  // Mock data for fields not yet in database - replace with actual data when available
  const mockData = {
    seats: 2,
    walkTime: '5 min',
    trailCamCoverage: 'No coverage',
    totalHarvests: 3,
    huntsThisSeason: 8,
    totalHunts: 24,
    lastHuntDate: null,
    bestTime: 'AM', // 'AM', 'PM', 'ALL'
    bestSeason: 'archery', // 'archery', 'blackpowder', 'gun'
    nearbyWater: true,
    overFoodPlot: false,
    feederNearby: true,
    height: '15 ft',
    material: 'Steel',
    difficulty: 'Easy',
    coverRating: 4,
    viewDistance: '75 yards',
    maintenanceStatus: 'Good'
  }

  // Make toggle function globally available
  if (typeof window !== 'undefined') {
    (window as any).toggleStandDetails = (standId: string) => {
      const details = document.getElementById('stand-details-' + standId);
      const button = document.querySelector(`[onclick*="${standId}"]`) as HTMLButtonElement;
      if (details && button) {
        if (details.style.display === 'none') {
          details.style.display = 'block';
          button.innerHTML = `${createLucideIcon('chevron-up', '#566E3D', 12)} Hide Details`;
        } else {
          details.style.display = 'none';
          button.innerHTML = `${createLucideIcon('chevron-down', '#566E3D', 12)} Show More Details`;
        }
      }
    }
  }

  // Condition icons for header (only show if data exists)
  let conditionIcons = ''
  if (mockData.bestTime) {
    const timeIcon = mockData.bestTime === 'AM' ? 'sun' : mockData.bestTime === 'PM' ? 'moon' : 'clock'
    conditionIcons += createLucideIcon(timeIcon, '#FA7921', 14)
  }
  if (mockData.bestSeason) {
    const seasonIcon = mockData.bestSeason === 'archery' ? 'bow' : mockData.bestSeason === 'blackpowder' ? 'zap' : 'crosshair'
    conditionIcons += createLucideIcon(seasonIcon, '#FA7921', 14)
  }
  if (mockData.nearbyWater) {
    conditionIcons += createLucideIcon('droplet', '#0C4767', 14)
  }
  if (mockData.overFoodPlot || mockData.feederNearby) {
    const feedIcon = mockData.overFoodPlot ? 'wheat' : 'hand-platter'
    conditionIcons += createLucideIcon(feedIcon, '#B9A44C', 14)
  }

  return `
    <div style="min-width: 280px; max-width: 320px; font-family: system-ui, sans-serif;">
      <!-- Header Section -->
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        padding: 12px 0 8px 0; 
        border-bottom: 2px solid #E8E6E0;
        margin-bottom: 12px;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${createLucideIcon(standTypeIcon, '#FA7921', 18)}
          <h3 style="
            color: #566E3D; 
            font-weight: 700; 
            margin: 0; 
            font-size: 16px;
            line-height: 1.2;
          ">${stand.name}</h3>
        </div>
        <div style="display: flex; gap: 4px; align-items: center;">
          ${conditionIcons}
        </div>
      </div>

      <!-- Info Grid -->
      <div style="
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 8px 16px; 
        margin-bottom: 12px;
        font-size: 13px;
      ">
        <div style="display: flex; align-items: center; gap: 6px; color: #2D3E1F;">
          ${createLucideIcon('user', '#566E3D', 14)}
          <span><strong>Seats:</strong> ${mockData.seats}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; color: #2D3E1F;">
          ${createLucideIcon('footprints', '#566E3D', 14)}
          <span><strong>Walk:</strong> ${mockData.walkTime}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; color: #2D3E1F; grid-column: 1 / -1;">
          ${createLucideIcon('camera', '#566E3D', 14)}
          <span><strong>Camera:</strong> ${mockData.trailCamCoverage}</span>
        </div>
      </div>

      <!-- Performance Section -->
      <div style="
        background: #F5F4F0; 
        border: 1px solid #E8E6E0; 
        border-radius: 6px; 
        padding: 10px; 
        margin-bottom: 12px;
      ">
        <div style="
          display: flex; 
          align-items: center; 
          gap: 6px; 
          margin-bottom: 8px; 
          color: #566E3D; 
          font-weight: 600; 
          font-size: 12px;
        ">
          ${createLucideIcon('bar-chart-3', '#566E3D', 14)}
          PERFORMANCE
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 11px;">
          <div>
            <div style="font-weight: 700; color: #FA7921; font-size: 16px;">${mockData.totalHarvests}</div>
            <div style="color: #2D3E1F;">Total Harvested</div>
          </div>
          <div>
            <div style="font-weight: 700; color: #B9A44C; font-size: 16px;">${mockData.huntsThisSeason}</div>
            <div style="color: #2D3E1F;">Hunts This Season</div>
          </div>
          <div>
            <div style="font-weight: 700; color: #566E3D; font-size: 16px;">${mockData.totalHunts}</div>
            <div style="color: #2D3E1F;">All-Time Hunts</div>
          </div>
        </div>
      </div>

      <!-- Last Used -->
      ${mockData.lastHuntDate ? `
        <div style="
          background: #566E3D; 
          color: white; 
          padding: 8px 10px; 
          border-radius: 6px; 
          margin-bottom: 12px; 
          font-size: 12px;
          text-align: center;
        ">
          <strong>Last Used:</strong> ${new Date(mockData.lastHuntDate).toLocaleDateString()} PM
        </div>
      ` : ''}

      <!-- Coordinates Footer -->
      <div style="
        display: flex; 
        align-items: center; 
        gap: 6px; 
        padding-top: 8px; 
        border-top: 1px solid #E8E6E0; 
        font-size: 11px; 
        color: #8B7355;
      ">
        ${createLucideIcon('map-pin', '#8B7355', 12)}
        <span>${stand.latitude?.toFixed(6)}, ${stand.longitude?.toFixed(6)}</span>
      </div>

      <!-- Expandable Details Button -->
      <div style="margin-top: 10px;">
        <button 
          onclick="toggleStandDetails('${stand.id}')" 
          style="
            width: 100%; 
            background: #E8E6E0; 
            border: 1px solid #B9A44C; 
            color: #566E3D; 
            padding: 6px 10px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: 600; 
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          "
        >
          ${createLucideIcon('chevron-down', '#566E3D', 12)}
          Show More Details
        </button>
      </div>

      <!-- Expandable Details (Initially Hidden) -->
      <div id="stand-details-${stand.id}" style="display: none; margin-top: 10px;">
        <!-- Physical Details -->
        ${mockData.height || mockData.material ? `
          <div style="margin-bottom: 10px;">
            <div style="
              display: flex; 
              align-items: center; 
              gap: 6px; 
              margin-bottom: 6px; 
              color: #566E3D; 
              font-weight: 600; 
              font-size: 11px;
            ">
              ${createLucideIcon('box', '#566E3D', 12)}
              PHYSICAL DETAILS
            </div>
            <div style="font-size: 11px; color: #2D3E1F; line-height: 1.4;">
              ${mockData.height ? `<div><strong>Height:</strong> ${mockData.height}</div>` : ''}
              ${mockData.material ? `<div><strong>Material:</strong> ${mockData.material}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Access Details -->
        ${mockData.difficulty ? `
          <div style="margin-bottom: 10px;">
            <div style="
              display: flex; 
              align-items: center; 
              gap: 6px; 
              margin-bottom: 6px; 
              color: #566E3D; 
              font-weight: 600; 
              font-size: 11px;
            ">
              ${createLucideIcon('footprints', '#566E3D', 12)}
              ACCESS
            </div>
            <div style="font-size: 11px; color: #2D3E1F;">
              <strong>Difficulty:</strong> ${mockData.difficulty}
            </div>
          </div>
        ` : ''}

        <!-- Hunting Details -->
        ${mockData.coverRating || mockData.viewDistance ? `
          <div style="margin-bottom: 10px;">
            <div style="
              display: flex; 
              align-items: center; 
              gap: 6px; 
              margin-bottom: 6px; 
              color: #566E3D; 
              font-weight: 600; 
              font-size: 11px;
            ">
              ${createLucideIcon('crosshair', '#566E3D', 12)}
              HUNTING DETAILS
            </div>
            <div style="font-size: 11px; color: #2D3E1F; line-height: 1.4;">
              ${mockData.coverRating ? `<div><strong>Cover Rating:</strong> ${mockData.coverRating}/5</div>` : ''}
              ${mockData.viewDistance ? `<div><strong>View Distance:</strong> ${mockData.viewDistance}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Condition -->
        <div style="margin-bottom: 10px;">
          <div style="
            display: flex; 
            align-items: center; 
            gap: 6px; 
            margin-bottom: 6px; 
            color: #566E3D; 
            font-weight: 600; 
            font-size: 11px;
          ">
            ${createLucideIcon('wrench', '#566E3D', 12)}
            CONDITION
          </div>
          <div style="font-size: 11px; color: #2D3E1F;">
            <strong>Status:</strong> ${mockData.maintenanceStatus}
          </div>
        </div>
      </div>
    </div>
  `
}

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
  const [showIconReference, setShowIconReference] = useState(false)
  const [currentLayer, setCurrentLayer] = useState<'esri' | 'google' | 'street' | 'terrain' | 'bing'>('esri')
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
    console.log(`[HuntingMapDebug] ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Load Leaflet from CDN with detailed debugging
  useEffect(() => {
    const loadLeafletFromCDN = async () => {
      if (typeof window === 'undefined') {
        addDebugInfo('❌ Window is undefined (SSR)')
        return
      }

      addDebugInfo('🏹 Starting Leaflet CDN load for hunting club map')

      try {
        // Check if Leaflet is already loaded
        if ((window as any).L) {
          L = (window as any).L
          setLeafletLoaded(true)
          setCssLoaded(true)
          setJsLoaded(true)
          addDebugInfo('✅ Leaflet already loaded from window.L')
          return
        }

        // Load CSS first
        addDebugInfo('🎨 Loading hunting club map styles from CDN...')
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        cssLink.crossOrigin = ''
        
        cssLink.onload = () => {
          setCssLoaded(true)
          addDebugInfo('✅ Hunting club map styles loaded successfully')
        }
        
        cssLink.onerror = (err) => {
          addDebugInfo('❌ Hunting club map styles failed to load')
          console.error('CSS load error:', err)
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

    } catch (err) {
      addDebugInfo('❌ Error during hunting club map initialization')
      console.error('Error initializing map:', err)
      setError('Failed to initialize hunting club map: ' + (err as Error).message)
    }
  }, [leafletLoaded])

  useEffect(() => {
    loadStands()
    fetchPropertyBoundaries()
  }, [])

  // Update stands on map when data changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !L) return

    addDebugInfo(`🔄 Updating ${stands.length} hunting stands on map (visibility: ${showStands})`)

    // Clear existing stand markers (keep headquarters marker)
    leafletMapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && layer.getLatLng().lat !== PROPERTY_CENTER[0]) {
        leafletMapRef.current.removeLayer(layer)
      }
    })

    // Display property boundaries
    displayPropertyBoundaries()

    if (!showStands) return

    // Create simple hunting stand icon with color coding
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

    let standsAdded = 0

    // Add hunting stand markers with new popup content
    stands.forEach((stand) => {
      if (stand.latitude && stand.longitude) {
        addDebugInfo(`🎯 Adding hunting stand marker: ${stand.name} at ${stand.latitude}, ${stand.longitude}`)
        
        // Make toggle function globally available for this specific stand
        if (typeof window !== 'undefined') {
          (window as any).toggleStandDetails = (standId: string) => {
            const details = document.getElementById('stand-details-' + standId);
            const button = document.querySelector(`[onclick*="${standId}"]`) as HTMLButtonElement;
            if (details && button) {
              if (details.style.display === 'none') {
                details.style.display = 'block';
                button.innerHTML = `${createLucideIcon('chevron-up', '#566E3D', 12)} Hide Details`;
              } else {
                details.style.display = 'none';
                button.innerHTML = `${createLucideIcon('chevron-down', '#566E3D', 12)} Show More Details`;
              }
            }
          }
        }

        L.marker([stand.latitude, stand.longitude], { icon: huntingStandIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div style="min-width: 280px; max-width: 320px; font-family: system-ui, sans-serif;">
              <!-- Header Section -->
              <div style="
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                padding: 12px 0 8px 0; 
                border-bottom: 2px solid #E8E6E0;
                margin-bottom: 12px;
              ">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${createLucideIcon(getStandTypeIcon(stand.type), '#FA7921', 18)}
                  <h3 style="
                    color: #566E3D; 
                    font-weight: 700; 
                    margin: 0; 
                    font-size: 16px;
                    line-height: 1.2;
                  ">${stand.name}</h3>
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                  ${createLucideIcon('sun', '#FA7921', 14)}
                  ${createLucideIcon('bow', '#FA7921', 14)}
                  ${createLucideIcon('droplet', '#0C4767', 14)}
                  ${createLucideIcon('hand-platter', '#B9A44C', 14)}
                </div>
              </div>

              <!-- Info Grid -->
              <div style="
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 8px 16px; 
                margin-bottom: 12px;
                font-size: 13px;
              ">
                <div style="display: flex; align-items: center; gap: 6px; color: #2D3E1F;">
                  ${createLucideIcon('user', '#566E3D', 14)}
                  <span><strong>Seats:</strong> 2</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; color: #2D3E1F;">
                  ${createLucideIcon('footprints', '#566E3D', 14)}
                  <span><strong>Walk:</strong> 5 min</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; color: #2D3E1F; grid-column: 1 / -1;">
                  ${createLucideIcon('camera', '#566E3D', 14)}
                  <span><strong>Camera:</strong> No coverage</span>
                </div>
              </div>

              <!-- Performance Section -->
              <div style="
                background: #F5F4F0; 
                border: 1px solid #E8E6E0; 
                border-radius: 6px; 
                padding: 10px; 
                margin-bottom: 12px;
              ">
                <div style="
                  display: flex; 
                  align-items: center; 
                  gap: 6px; 
                  margin-bottom: 8px; 
                  color: #566E3D; 
                  font-weight: 600; 
                  font-size: 12px;
                ">
                  ${createLucideIcon('bar-chart-3', '#566E3D', 14)}
                  PERFORMANCE
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 11px;">
                  <div>
                    <div style="font-weight: 700; color: #FA7921; font-size: 16px;">3</div>
                    <div style="color: #2D3E1F;">Total Harvested</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: #B9A44C; font-size: 16px;">8</div>
                    <div style="color: #2D3E1F;">Hunts This Season</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: #566E3D; font-size: 16px;">24</div>
                    <div style="color: #2D3E1F;">All-Time Hunts</div>
                  </div>
                </div>
              </div>

              <!-- Last Hunted Section -->
              <div style="
                background: #566E3D; 
                color: white; 
                padding: 8px 10px; 
                border-radius: 6px; 
                margin-bottom: 12px; 
                font-size: 12px;
                text-align: center;
              ">
                <strong>Last Hunted:</strong> Nov 15, 2024 • AM
              </div>

              <!-- Coordinates Footer -->
              <div style="
                display: flex; 
                align-items: center; 
                gap: 6px; 
                padding-top: 8px; 
                border-top: 1px solid #E8E6E0; 
                font-size: 11px; 
                color: #8B7355;
              ">
                ${createLucideIcon('map-pin', '#8B7355', 12)}
                <span>${stand.latitude?.toFixed(6)}, ${stand.longitude?.toFixed(6)}</span>
              </div>

              <!-- Show More Details Button -->
              <div style="margin-top: 10px;">
                <button 
                  onclick="toggleStandDetails('${stand.id}')" 
                  style="
                    width: 100%; 
                    background: #E8E6E0; 
                    border: 1px solid #B9A44C; 
                    color: #566E3D; 
                    padding: 6px 10px; 
                    border-radius: 4px; 
                    font-size: 11px; 
                    font-weight: 600; 
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                  "
                >
                  ${createLucideIcon('chevron-down', '#566E3D', 12)}
                  Show More Details
                </button>
              </div>

              <!-- Expandable Details (Initially Hidden) -->
              <div id="stand-details-${stand.id}" style="display: none; margin-top: 10px;">
                <div style="margin-bottom: 10px;">
                  <div style="
                    display: flex; 
                    align-items: center; 
                    gap: 6px; 
                    margin-bottom: 6px; 
                    color: #566E3D; 
                    font-weight: 600; 
                    font-size: 11px;
                  ">
                    ${createLucideIcon('box', '#566E3D', 12)}
                    PHYSICAL DETAILS
                  </div>
                  <div style="font-size: 11px; color: #2D3E1F; line-height: 1.4;">
                    <div><strong>Height:</strong> 15 ft</div>
                    <div><strong>Material:</strong> Steel</div>
                  </div>
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="
                    display: flex; 
                    align-items: center; 
                    gap: 6px; 
                    margin-bottom: 6px; 
                    color: #566E3D; 
                    font-weight: 600; 
                    font-size: 11px;
                  ">
                    ${createLucideIcon('crosshair', '#566E3D', 12)}
                    HUNTING DETAILS
                  </div>
                  <div style="font-size: 11px; color: #2D3E1F; line-height: 1.4;">
                    <div><strong>Cover Rating:</strong> 4/5</div>
                    <div><strong>View Distance:</strong> 75 yards</div>
                  </div>
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="
                    display: flex; 
                    align-items: center; 
                    gap: 6px; 
                    margin-bottom: 6px; 
                    color: #566E3D; 
                    font-weight: 600; 
                    font-size: 11px;
                  ">
                    ${createLucideIcon('wrench', '#566E3D', 12)}
                    CONDITION
                  </div>
                  <div style="font-size: 11px; color: #2D3E1F;">
                    <strong>Status:</strong> Good
                  </div>
                </div>
              </div>
            </div>
          `)
        standsAdded++
      } else {
        addDebugInfo(`⚠️ Hunting stand ${stand.name} has no coordinates`)
      }
    })

    addDebugInfo(`✅ Added ${standsAdded} hunting stand markers to club property map`)
  }, [stands, showStands, mapReady, propertyBoundaries])

  const loadStands = async () => {
    addDebugInfo('🔄 Loading hunting stands from club database...')
    try {
      const supabase = createClient()
      
      const { data: standsData, error: standsError } = await supabase
        .from('stands')
        .select('*')
        .eq('active', true)

      if (standsError) {
        addDebugInfo('❌ Club database error loading hunting stands')
        console.error('Error loading stands:', standsError)
        setError('Could not load hunting stands from club database')
      } else {
        setStands(standsData || [])
        addDebugInfo(`✅ Loaded ${standsData?.length || 0} hunting stands from club database`)
        
        // Log each stand's coordinates for field testing
        standsData?.forEach(stand => {
          if (stand.latitude && stand.longitude) {
            addDebugInfo(`📋 Hunting Stand: ${stand.name} at ${stand.latitude}, ${stand.longitude}`)
          } else {
            addDebugInfo(`📋 Hunting Stand: ${stand.name} - NO COORDINATES`)
          }
        })
      }
    } catch (err) {
      addDebugInfo('❌ Exception loading hunting stands')
      console.error('Error in loadStands:', err)
      setError('Club database connection error')
    } finally {
      setLoading(false)
    }
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

  const switchLayer = (layerType: 'esri' | 'google' | 'street' | 'terrain' | 'bing') => {
    if (!leafletMapRef.current || !L) return

    addDebugInfo(`🌐 Switching to ${layerType} view for hunting club property`)

    // Remove current layer
    if (currentTileLayer) {
      leafletMapRef.current.removeLayer(currentTileLayer)
    }

    let tileUrl = ''
    let attribution = ''

    switch (layerType) {
      case 'esri':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        attribution = '&copy; <a href="https://www.esri.com/">Esri</a>'
        break
      case 'google':
        tileUrl = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        attribution = '&copy; <a href="https://www.google.com/maps">Google</a>'
        break
      case 'bing':
        tileUrl = 'https://ecn.t3.tiles.virtualearth.net/tiles/a{q}.jpeg?g=587&mkt=en-gb&n=z'
        attribution = '&copy; <a href="https://www.bing.com/maps">Bing Maps</a>'
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
      addDebugInfo(`❌ Exception: ${errorMsg}`)
      console.error('Error adding test stand:', err)
      setError(`Error adding test hunting stand: ${errorMsg}`)
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
      addDebugInfo(`❌ Club database exception: ${errorMsg}`)
      setError(`Club database error: ${errorMsg}`)
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
                      color: currentLayer === layer.key ? 'white' : '#2D3E1F',
                      transition: 'all 0.2s'
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80"
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Controls */}
            <div>
              <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Navigation</h3>
              <div className="space-y-2">
                <button
                  onClick={zoomToProperty}
                  style={{ background: '#FA7921', color: 'white' }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  🏠 Clubhouse
                </button>
                <button
                  onClick={zoomToStands}
                  style={{ background: '#B9A44C', color: '#2D3E1F' }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  🎯 Hunting Stands
                </button>
              </div>
            </div>

            {/* Stand Management */}
            <div>
              <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-2">Stand Management</h3>
              <div className="space-y-2">
                <button
                  onClick={addTestStand}
                  style={{ background: '#FA7921', color: 'white' }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  ➕ Add Test Stand
                </button>
                <button
                  onClick={clearTestStands}
                  style={{ background: '#A0653A', color: 'white' }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  🧹 Clear Test Stands
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Controls */}
          <div className="mt-4 pt-4 border-t-2 border-gray-300">
            <div className="flex flex-wrap gap-2">
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
              <button
                onClick={() => setShowIconReference(!showIconReference)}
                style={{
                  background: showIconReference ? '#566E3D' : '#B9A44C',
                  color: 'white'
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              >
                📋 {showIconReference ? 'Hide' : 'Show'} Icons
              </button>
            </div>
          </div>

          {/* Icon Reference Guide */}
          {showIconReference && (
            <div className="mt-4 pt-4 border-t-2 border-gray-300">
              <h3 style={{ color: '#2D3E1F' }} className="font-semibold mb-3 text-base">Stand Popup Icon Reference</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stand Type Icons */}
                <div>
                  <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Stand Types</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('railroad-track', '#FA7921', 14) }} />
                      <span>Ladder Stand</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('tree-pine', '#FA7921', 14) }} />
                      <span>Tree Stand</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('box', '#FA7921', 14) }} />
                      <span>Box Stand</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('tent', '#FA7921', 14) }} />
                      <span>Ground Blind</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('tower-control', '#FA7921', 14) }} />
                      <span>Tower Stand</span>
                    </div>
                  </div>
                </div>

                {/* Condition Icons */}
                <div>
                  <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Conditions</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('sun', '#FA7921', 14) }} />
                      <span>Best Time: AM</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('moon', '#FA7921', 14) }} />
                      <span>Best Time: PM</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('bow', '#FA7921', 14) }} />
                      <span>Archery Season</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('droplet', '#0C4767', 14) }} />
                      <span>Water Nearby</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('wheat', '#B9A44C', 14) }} />
                      <span>Food Plot</span>
                    </div>
                  </div>
                </div>

                {/* Info Icons */}
                <div>
                  <h4 style={{ color: '#566E3D' }} className="font-medium mb-2 text-sm">Info Icons</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('user', '#566E3D', 14) }} />
                      <span>Seats</span>
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
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('bar-chart-3', '#566E3D', 14) }} />
                      <span>Performance</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span dangerouslySetInnerHTML={{ __html: createLucideIcon('map-pin', '#8B7355', 14) }} />
                      <span>Coordinates</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                <strong>Note:</strong> Condition icons only appear when data exists. Stand type icons always show in popup header.
              </div>
            </div>
          )}
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
                    minWidth: '60px'
                  }}
                  className="hover:opacity-80"
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Component Visibility Toggle Overlay */}
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
                { key: 'stands', label: 'Stands', visible: showStands, setter: setShowStands, color: '#FA7921' },
                { key: 'cameras', label: 'Cameras', visible: showCameras, setter: setShowCameras, color: '#0C4767' },
                { key: 'plots', label: 'Food Plots', visible: showFoodPlots, setter: setShowFoodPlots, color: '#B9A44C' },
                { key: 'trails', label: 'Trails', visible: showTrails, setter: setShowTrails, color: '#4A5D32' }
              ].map((component) => (
                <button
                  key={component.key}
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
