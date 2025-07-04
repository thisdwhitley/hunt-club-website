'use client'

// src/app/map-popup-demo/page.tsx
// Demo comparing the map-styled popup with your existing map-test popup

import React from 'react'
import StandCardMapPopup, { type MapPopupStand } from '@/components/stands/StandCardMapPopup'

// Sample stand data matching your existing structure
const sampleStands: MapPopupStand[] = [
  {
    id: '1',
    name: 'North Ridge Stand',
    description: 'Elevated ladder stand overlooking the main food plot with excellent morning visibility',
    type: 'ladder_stand',
    active: true,
    latitude: 36.42800,
    longitude: -79.51000,
    height_feet: 15,
    capacity: 2,
    walking_time_minutes: 8,
    view_distance_yards: 150,
    total_harvests: 12,
    total_hunts: 48,
    season_hunts: 6,
    last_used_date: '2024-11-15',
    time_of_day: 'AM',
    archery_season: true,
    nearby_water_source: false,
    food_source: 'field',
    trail_camera_name: 'Ridge Cam 1'
  },
  {
    id: '2', 
    name: 'Creek Crossing Blind',
    description: 'Round bale blind positioned at the main creek crossing',
    type: 'bale_blind',
    active: true,
    latitude: 36.42650,
    longitude: -79.51150,
    height_feet: null,
    capacity: 1,
    walking_time_minutes: 12,
    view_distance_yards: 75,
    total_harvests: 8,
    total_hunts: 32,
    season_hunts: 4,
    last_used_date: '2024-10-28',
    time_of_day: 'PM',
    archery_season: true,
    nearby_water_source: true,
    food_source: null,
    trail_camera_name: 'Creek Cam'
  },
  {
    id: '3',
    name: 'South Box Stand',
    description: 'Enclosed box stand on the southern property line',
    type: 'box_stand',
    active: false,
    latitude: 36.42500,
    longitude: -79.51200,
    height_feet: 12,
    capacity: 2,
    walking_time_minutes: 15,
    view_distance_yards: 100,
    total_harvests: 2,
    total_hunts: 18,
    season_hunts: 0,
    last_used_date: '2023-12-10',
    time_of_day: 'ALL',
    archery_season: false,
    nearby_water_source: false,
    food_source: 'feeder',
    trail_camera_name: null
  },
  {
    id: '4',
    name: 'Tower Tripod',
    description: 'High tripod stand for excellent visibility',
    type: 'tripod',
    active: true,
    latitude: 36.42750,
    longitude: -79.51080,
    height_feet: 20,
    capacity: 1,
    walking_time_minutes: 5,
    view_distance_yards: 200,
    total_harvests: 15,
    total_hunts: 60,
    season_hunts: 8,
    last_used_date: '2024-12-01',
    time_of_day: 'ALL',
    archery_season: true,
    nearby_water_source: true,
    food_source: 'field',
    trail_camera_name: 'Tower Cam'
  }
]

export default function MapPopupDemoPage() {
  const handleEditStand = (stand: MapPopupStand) => {
    console.log('Edit stand:', stand.name)
    alert(`Edit ${stand.name} - would open edit form`)
  }

  const handleNavigateToStand = (stand: MapPopupStand) => {
    console.log('Navigate to stand:', stand.name)
    if (stand.latitude && stand.longitude) {
      const url = `https://maps.google.com/?q=${stand.latitude},${stand.longitude}`
      window.open(url, '_blank')
    }
  }

  const handleViewDetails = (stand: MapPopupStand) => {
    console.log('View details for stand:', stand.name)
    alert(`View details for ${stand.name} - would open detail page`)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🗺️ Map Popup Stand Cards
        </h1>
        <p className="text-gray-600">
          StandCard component styled to match your existing map-test popup design
        </p>
        <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 text-sm rounded-lg inline-block">
          ✅ Matches your existing popup styling exactly!
        </div>
      </div>

      {/* Style Comparison */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          🎨 Design Features (Matching Your map-test Popup)
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h3 className="font-medium mb-2">Visual Elements</h3>
            <ul className="space-y-1 text-xs">
              <li>• Header with stand type icon and condition badges</li>
              <li>• 2-column info grid layout</li>
              <li>• Performance bar with color-coded ratings</li>
              <li>• Collapsible details section</li>
              <li>• Action buttons (View, Edit, Navigate)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Hunting Club Colors</h3>
            <ul className="space-y-1 text-xs">
              <li>• <span style={{color: '#566E3D'}}>Forest Green (#566E3D)</span></li>
              <li>• <span style={{color: '#FA7921'}}>Hunting Orange (#FA7921)</span></li>
              <li>• <span style={{color: '#0C4767'}}>Dark Teal (#0C4767)</span></li>
              <li>• <span style={{color: '#B9A44C'}}>Muted Gold (#B9A44C)</span></li>
              <li>• Border: Morning Mist (#E8E6E0)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo Popups */}
      <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Map Popup Style Stand Cards
          </h2>
          <p className="text-gray-600 mb-6">
            These cards are styled to match your existing map popup design and can be used directly in Leaflet popups.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sampleStands.map((stand) => (
              <div key={stand.id} className="relative">
                <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                  Leaflet Popup
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-2 bg-white shadow-lg">
                  <StandCardMapPopup
                    stand={stand}
                    onEdit={handleEditStand}
                    onNavigate={handleNavigateToStand}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="mt-12 bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🔧 How to Use in Your Map
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">1. In your PropertyMap component:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import StandCardMapPopup from '@/components/stands/StandCardMapPopup'

// In your marker popup:
<Marker position={[stand.latitude, stand.longitude]}>
  <Popup>
    <StandCardMapPopup
      stand={stand}
      onEdit={handleEditStand}
      onNavigate={handleNavigateToStand}
      onViewDetails={handleViewStandDetails}
    />
  </Popup>
</Marker>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">2. For your existing HTML popup content:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Replace your createStandPopupContent function with:
const createStandPopupContent = (stand) => {
  // Create a container div
  const popupDiv = document.createElement('div');
  
  // Render React component into it
  const root = createRoot(popupDiv);
  root.render(
    <StandCardMapPopup
      stand={stand}
      onEdit={handleEditStand}
      onNavigate={handleNavigateToStand}
      onViewDetails={handleViewStandDetails}
    />
  );
  
  return popupDiv;
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">3. Key Benefits:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>Consistent styling</strong> - Matches your existing map-test design exactly</li>
              <li>✅ <strong>Reactive</strong> - Real React component with proper state management</li>
              <li>✅ <strong>Interactive</strong> - Collapsible sections and action buttons</li>
              <li>✅ <strong>Performance</strong> - Shows success rates and hunting statistics</li>
              <li>✅ <strong>Mobile-friendly</strong> - Optimized for touch interactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Color Reference */}
      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🎨 Hunting Club Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-full h-12 rounded" style={{ backgroundColor: '#566E3D' }}></div>
            <div className="text-xs mt-1 font-mono">#566E3D</div>
            <div className="text-xs text-gray-600">Forest Green</div>
          </div>
          <div className="text-center">
            <div className="w-full h-12 rounded" style={{ backgroundColor: '#FA7921' }}></div>
            <div className="text-xs mt-1 font-mono">#FA7921</div>
            <div className="text-xs text-gray-600">Hunting Orange</div>
          </div>
          <div className="text-center">
            <div className="w-full h-12 rounded" style={{ backgroundColor: '#0C4767' }}></div>
            <div className="text-xs mt-1 font-mono">#0C4767</div>
            <div className="text-xs text-gray-600">Dark Teal</div>
          </div>
          <div className="text-center">
            <div className="w-full h-12 rounded" style={{ backgroundColor: '#B9A44C' }}></div>
            <div className="text-xs mt-1 font-mono">#B9A44C</div>
            <div className="text-xs text-gray-600">Muted Gold</div>
          </div>
          <div className="text-center">
            <div className="w-full h-12 rounded border" style={{ backgroundColor: '#E8E6E0' }}></div>
            <div className="text-xs mt-1 font-mono">#E8E6E0</div>
            <div className="text-xs text-gray-600">Morning Mist</div>
          </div>
        </div>
      </div>
    </div>
  )
}
