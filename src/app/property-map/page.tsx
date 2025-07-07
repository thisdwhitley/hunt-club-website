'use client'

// src/app/property-map/page.tsx
// Standalone Property Map Page using the reusable PropertyMap component

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Target, AlertCircle, Crosshair } from 'lucide-react'
import PropertyMap from '@/components/map/PropertyMap'
// Optional: import enhanced popup styles
// import '@/styles/popup-styles.css'

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

export default function PropertyMapPage() {
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const router = useRouter()

  // Handle stand clicks - can navigate to stand details page or show modal
  const handleStandClick = (stand: Stand) => {
    console.log('Stand clicked:', stand.name)
    
    // Example integrations you could implement:
    // router.push(`/stands/${stand.id}`) // Navigate to stand details
    // setSelectedStand(stand) // Open modal with stand details
    // router.push(`/hunts/new?standId=${stand.id}`) // Start hunt log for this stand
    
    // For now, show a detailed alert
    const details = [
      `🎯 ${stand.name}`,
      stand.description ? `📝 ${stand.description}` : '',
      stand.type ? `🏗️ Type: ${stand.type.replace('_', ' ')}` : '',
      stand.capacity ? `👥 Capacity: ${stand.capacity} hunters` : '',
      stand.height_feet ? `📏 Height: ${stand.height_feet} ft` : '',
      stand.walking_time_minutes ? `🚶 Walk: ${stand.walking_time_minutes} min` : '',
      stand.total_hunts ? `🎯 Total Hunts: ${stand.total_hunts}` : '',
      stand.total_harvests ? `🦌 Total Harvests: ${stand.total_harvests}` : '',
      stand.trail_camera_name ? `📷 Camera: ${stand.trail_camera_name}` : ''
    ].filter(Boolean).join('\n')
    
    alert(details)
  }

  // Handle map ready event
  const handleMapReady = () => {
    setMapReady(true)
    console.log('Property map is ready')
  }

  // Handle map errors
  const handleMapError = (errorMessage: string) => {
    setError(errorMessage)
    console.error('Property map error:', errorMessage)
  }

  return (
    <div className="hunting-club-container min-h-screen">
      {/* Hunting Club Header */}
      <div style={{ 
        background: '#566E3D', 
        color: 'white', 
        padding: '1rem', 
        borderBottom: '3px solid #FA7921' 
      }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-orange-400" />
            Caswell County Yacht Club - Property Map
          </h1>
          <p className="text-sm text-gray-200 mt-1">
            Interactive map • 100-acre hunting property centered on boundary with stands, trails, and cameras
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Status Banner */}
        {error && (
          <div style={{ 
            background: '#A0653A', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem' 
          }} className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {mapReady && !error && (
          <div style={{ 
            background: '#FE9920', 
            color: 'white', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            marginBottom: '1rem' 
          }} className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <span className="font-medium">✅ Property map loaded successfully! Click on stand markers to view details.</span>
          </div>
        )}

        {/* Map Component */}
        <PropertyMap
          showControls={true}
          showIconReference={false}
          height="h-96 md:h-[600px]"
          onStandClick={handleStandClick}
          onMapReady={handleMapReady}
          onError={handleMapError}
          defaultLayer="esri"
          defaultShowStands={true}
          defaultShowCameras={true}
          defaultShowFoodPlots={true}
          defaultShowTrails={true}
        />

        {/* Usage Instructions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              🎯 Hunting Stands
            </h3>
            <p className="text-sm text-gray-600">
              Orange markers show active hunting stands. Click any marker to view detailed information including capacity, recent activity, and trail camera data.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              🗺️ Map Controls
            </h3>
            <p className="text-sm text-gray-600">
              Map automatically centers on property boundary (bright orange, 2px line). Switch between satellite, street, and terrain views. Toggle visibility of stands, cameras, food plots, and trails using the control panel.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              📋 Reference Guide
            </h3>
            <p className="text-sm text-gray-600">
              Use "Show Icons" to display the reference guide for all icons used in stand popup cards. Helpful for understanding stand types and information.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-orange-50 p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">🏕️ Property Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">100</div>
              <div className="text-sm text-gray-600">Total Acres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">🎯</div>
              <div className="text-sm text-gray-600">Hunting Stands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">📷</div>
              <div className="text-sm text-gray-600">Trail Cameras</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">🛤️</div>
              <div className="text-sm text-gray-600">Trail Network</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
