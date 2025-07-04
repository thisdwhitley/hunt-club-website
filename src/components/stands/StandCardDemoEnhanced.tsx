'use client'

// src/components/stands/StandCardDemoEnhanced.tsx
// Enhanced demo showcasing the hunting club styling

import React, { useState } from 'react'
import StandCard from './StandCard'
import type { Stand } from '@/lib/stands'
import { 
  TreePine, 
  Compass,
  Target,
  MapPin,
  Settings
} from 'lucide-react'

// Enhanced sample data with more variety
const huntingClubStands: Stand[] = [
  {
    id: '1',
    name: 'North Ridge Ladder',
    description: 'Premium elevated position overlooking the main food plot with excellent morning visibility and wind patterns.',
    type: 'ladder_stand',
    active: true,
    latitude: 36.42800,
    longitude: -79.51000,
    height_feet: 18,
    capacity: 2,
    trail_name: 'North Ridge Trail',
    walking_time_minutes: 8,
    access_notes: 'Use caution on wet mornings - approach from east side',
    view_distance_yards: 175,
    total_harvests: 15,
    total_hunts: 52,
    season_hunts: 8,
    last_used_date: '2024-11-15',
    time_of_day: 'AM',
    archery_season: true,
    nearby_water_source: false,
    food_source: 'field',
    trail_camera_name: 'Ridge Cam Pro',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-11-15T08:30:00Z'
  },
  {
    id: '2', 
    name: 'Creek Crossing Ground',
    description: 'Strategic round bale blind positioned at the main creek crossing where deer travel between bedding and feeding areas.',
    type: 'bale_blind',
    active: true,
    latitude: 36.42650,
    longitude: -79.51150,
    height_feet: null,
    capacity: 1,
    trail_name: 'Creek Trail',
    walking_time_minutes: 12,
    access_notes: 'Always approach from downwind side - deer very sensitive here',
    view_distance_yards: 85,
    total_harvests: 12,
    total_hunts: 38,
    season_hunts: 6,
    last_used_date: '2024-10-28',
    time_of_day: 'PM',
    archery_season: true,
    nearby_water_source: true,
    food_source: null,
    trail_camera_name: 'Creek Monitor',
    created_at: '2024-02-01T14:00:00Z',
    updated_at: '2024-10-28T18:45:00Z'
  },
  {
    id: '3',
    name: 'South Boundary Box',
    description: 'Enclosed box stand on the southern property line with heater and shooting windows.',
    type: 'box_stand',
    active: true,
    latitude: 36.42500,
    longitude: -79.51200,
    height_feet: 12,
    capacity: 2,
    trail_name: 'South Perimeter',
    walking_time_minutes: 18,
    access_notes: 'Recently maintained - new carpet and shooting rest installed',
    view_distance_yards: 120,
    total_harvests: 8,
    total_hunts: 29,
    season_hunts: 4,
    last_used_date: '2024-11-02',
    time_of_day: 'ALL',
    archery_season: false,
    nearby_water_source: false,
    food_source: 'feeder',
    trail_camera_name: null,
    created_at: '2023-08-10T12:00:00Z',
    updated_at: '2024-11-02T16:15:00Z'
  },
  {
    id: '4',
    name: 'Old Oak Tripod',
    description: 'Classic tripod stand under the massive oak tree - legendary spot.',
    type: 'tripod',
    active: true,
    latitude: 36.42720,
    longitude: -79.51080,
    height_feet: 14,
    capacity: 1,
    trail_name: 'Heritage Trail',
    walking_time_minutes: 6,
    access_notes: 'Check ladder stability before each use',
    view_distance_yards: 95,
    total_harvests: 22,
    total_hunts: 67,
    season_hunts: 12,
    last_used_date: '2024-11-18',
    time_of_day: 'PM',
    archery_season: true,
    nearby_water_source: true,
    food_source: 'field',
    trail_camera_name: 'Oak Tree Cam',
    created_at: '2020-03-15T09:00:00Z',
    updated_at: '2024-11-18T17:30:00Z'
  },
  {
    id: '5',
    name: 'Maintenance Needed Stand',
    description: 'Stand needs repairs before next season.',
    type: 'ladder_stand',
    active: false,
    latitude: 36.42600,
    longitude: -79.50950,
    height_feet: 16,
    capacity: 2,
    trail_name: 'Back Forty',
    walking_time_minutes: 25,
    access_notes: 'DO NOT USE - ladder needs replacement',
    view_distance_yards: 140,
    total_harvests: 3,
    total_hunts: 15,
    season_hunts: 0,
    last_used_date: '2023-11-20',
    time_of_day: 'AM',
    archery_season: true,
    nearby_water_source: false,
    food_source: null,
    trail_camera_name: null,
    created_at: '2022-06-01T10:00:00Z',
    updated_at: '2024-01-10T12:00:00Z'
  }
]

export default function StandCardDemoEnhanced() {
  const [selectedMode, setSelectedMode] = useState<'full' | 'compact' | 'popup'>('full')
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null)
  const [showInactiveStands, setShowInactiveStands] = useState(true)
  
  const handleStandClick = (stand: Stand) => {
    console.log('🎯 Stand clicked:', stand.name)
    setSelectedStand(stand)
  }

  const handleEditStand = (stand: Stand) => {
    console.log('✏️ Edit stand:', stand.name)
    alert(`Edit "${stand.name}" - Would open edit form in real app`)
  }

  const handleDeleteStand = (stand: Stand) => {
    console.log('🗑️ Delete stand:', stand.name)
    if (confirm(`Are you sure you want to delete "${stand.name}"?`)) {
      alert('Stand would be deleted from database')
    }
  }

  const handleNavigateToStand = (stand: Stand) => {
    console.log('🧭 Navigate to stand:', stand.name)
    if (stand.latitude && stand.longitude) {
      const url = `https://maps.google.com/?q=${stand.latitude},${stand.longitude}`
      window.open(url, '_blank')
    }
  }

  const filteredStands = showInactiveStands 
    ? huntingClubStands 
    : huntingClubStands.filter(s => s.active)

  const activeStands = huntingClubStands.filter(s => s.active)
  const totalHarvests = huntingClubStands.reduce((sum, s) => sum + (s.total_harvests || 0), 0)
  const thisSeasonHunts = huntingClubStands.reduce((sum, s) => sum + (s.season_hunts || 0), 0)

  return (
    <div 
      className="min-h-screen p-6"
      style={{ 
        background: 'linear-gradient(135deg, #E8E6E0 0%, #f5f4f0 100%)',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div 
          className="mb-8 p-6 rounded-lg border-2"
          style={{
            background: '#566E3D',
            borderColor: '#2D3E1F',
            color: 'white'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <TreePine size={32} style={{ color: '#FA7921' }} />
            <div>
              <h1 className="text-3xl font-bold">
                Caswell County Yacht Club
              </h1>
              <p className="text-lg opacity-90">
                Stand Management System - Component Demo
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 rounded" style={{ background: 'rgba(250, 121, 33, 0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#FA7921' }}>
                {activeStands.length}
              </div>
              <div className="text-sm">Active Stands</div>
            </div>
            <div className="text-center p-3 rounded" style={{ background: 'rgba(185, 164, 76, 0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#B9A44C' }}>
                {totalHarvests}
              </div>
              <div className="text-sm">Total Harvests</div>
            </div>
            <div className="text-center p-3 rounded" style={{ background: 'rgba(12, 71, 103, 0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#0C4767' }}>
                {thisSeasonHunts}
              </div>
              <div className="text-sm">2025 Season Hunts</div>
            </div>
            <div className="text-center p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="text-2xl font-bold">
                100
              </div>
              <div className="text-sm">Acres</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg border-2" style={{ borderColor: '#E8E6E0' }}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Mode Selector */}
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#566E3D' }}>
                <Settings className="inline mr-2" size={16} />
                Display Mode
              </h3>
              <div className="flex gap-2">
                {(['full', 'compact', 'popup'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
                    style={{
                      background: selectedMode === mode ? '#FA7921' : '#E8E6E0',
                      color: selectedMode === mode ? 'white' : '#566E3D',
                      border: `2px solid ${selectedMode === mode ? '#2D3E1F' : '#566E3D'}`
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toggle */}
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#566E3D' }}>
                <Target className="inline mr-2" size={16} />
                Filters
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactiveStands}
                  onChange={(e) => setShowInactiveStands(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: '#2D3E1F' }}>
                  Show inactive stands
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="space-y-8">
          {selectedMode === 'full' && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#566E3D' }}>
                📋 Full Mode - Main Stand List
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStands.map((stand) => (
                  <StandCard
                    key={stand.id}
                    stand={stand}
                    mode="full"
                    onClick={handleStandClick}
                    onEdit={handleEditStand}
                    onDelete={handleDeleteStand}
                    onNavigate={handleNavigateToStand}
                    showLocation={true}
                    showStats={true}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedMode === 'compact' && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#566E3D' }}>
                📱 Compact Mode - Mobile/Sidebar Lists
              </h2>
              <div className="max-w-md space-y-2">
                {filteredStands.map((stand) => (
                  <StandCard
                    key={stand.id}
                    stand={stand}
                    mode="compact"
                    onClick={handleStandClick}
                    showActions={false}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedMode === 'popup' && (
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#566E3D' }}>
                🗺️ Popup Mode - Map Overlays
              </h2>
              <div className="flex flex-wrap gap-6">
                {filteredStands.map((stand) => (
                  <div key={stand.id} className="relative">
                    <div 
                      className="absolute -top-3 -left-3 px-3 py-1 rounded text-xs font-bold"
                      style={{ 
                        background: '#0C4767',
                        color: 'white'
                      }}
                    >
                      Map Popup
                    </div>
                    <StandCard
                      stand={stand}
                      mode="popup"
                      popupWidth={320}
                      onClick={handleStandClick}
                      onEdit={handleEditStand}
                      onNavigate={handleNavigateToStand}
                      showLocation={true}
                      showStats={true}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Stand Info */}
        {selectedStand && (
          <div 
            className="mt-8 p-6 rounded-lg border-2"
            style={{
              background: '#0C4767',
              borderColor: '#2D3E1F',
              color: 'white'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Compass size={24} style={{ color: '#FA7921' }} />
              <h3 className="text-xl font-bold">
                Selected: {selectedStand.name}
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Type:</strong> {selectedStand.type.replace('_', ' ')}</p>
                <p><strong>Status:</strong> {selectedStand.active ? '✅ Active' : '❌ Inactive'}</p>
                <p><strong>Total Hunts:</strong> {selectedStand.total_hunts || 0}</p>
              </div>
              <div>
                <p><strong>Harvests:</strong> {selectedStand.total_harvests || 0}</p>
                <p><strong>This Season:</strong> {selectedStand.season_hunts || 0} hunts</p>
                <p><strong>Success Rate:</strong> {selectedStand.total_hunts ? ((selectedStand.total_harvests || 0) / selectedStand.total_hunts * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
            <p className="text-xs mt-3 opacity-75">
              💡 Check browser console for interaction logs. Click coordinates to open Google Maps.
            </p>
          </div>
        )}

        {/* Usage Guide */}
        <div className="mt-12 p-6 bg-white rounded-lg border-2" style={{ borderColor: '#B9A44C' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#566E3D' }}>
            🏹 Component Usage Examples
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-bold mb-2" style={{ color: '#FA7921' }}>
                Stand Lists & Grids:
              </h3>
              <code className="block p-3 rounded text-xs" style={{ background: '#F5F4F0' }}>
{`<StandCard 
  stand={stand} 
  mode="full" 
  onClick={viewDetails} 
  onEdit={editStand} 
/>`}
              </code>
            </div>
            
            <div>
              <h3 className="font-bold mb-2" style={{ color: '#FA7921' }}>
                Map Popups:
              </h3>
              <code className="block p-3 rounded text-xs" style={{ background: '#F5F4F0' }}>
{`<StandCard 
  stand={stand} 
  mode="popup" 
  popupWidth={300} 
  onNavigate={getDirections} 
/>`}
              </code>
            </div>
            
            <div>
              <h3 className="font-bold mb-2" style={{ color: '#FA7921' }}>
                Mobile Lists:
              </h3>
              <code className="block p-3 rounded text-xs" style={{ background: '#F5F4F0' }}>
{`<StandCard 
  stand={stand} 
  mode="compact" 
  onClick={selectStand} 
  showActions={false} 
/>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
