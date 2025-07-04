'use client'

// src/components/stands/StandCardMapPopup.tsx
// StandCard component that matches your existing map popup styling exactly

import React, { useState } from 'react'
import { 
  ChevronDown,
  ChevronUp,
  Navigation,
  Edit3,
  Eye,
  Users,
  Footprints,
  Target,
  Calendar,
  Clock,
  Ruler,
  Award,
  Sun,
  Moon,
  SunMoon,
  Droplet,
  Wheat,
  UtensilsCrossed,
  Camera,
  Bow
} from 'lucide-react'

// Simplified types to match your existing data
export interface MapPopupStand {
  id: string
  name: string
  description: string | null
  type: string
  latitude: number | null
  longitude: number | null
  // Optional fields that might exist in your database
  height_feet?: number | null
  capacity?: number | null
  walking_time_minutes?: number | null
  view_distance_yards?: number | null
  total_harvests?: number | null
  total_hunts?: number | null
  season_hunts?: number | null
  last_used_date?: string | null
  time_of_day?: 'AM' | 'PM' | 'ALL' | null
  archery_season?: boolean | null
  nearby_water_source?: boolean | null
  food_source?: 'field' | 'feeder' | null
  trail_camera_name?: string | null
  active: boolean
}

interface StandCardMapPopupProps {
  stand: MapPopupStand
  onEdit?: (stand: MapPopupStand) => void
  onNavigate?: (stand: MapPopupStand) => void
  onViewDetails?: (stand: MapPopupStand) => void
  className?: string
}

// Icon mapping (matches your existing getStandTypeIcon function)
const getStandTypeIcon = (standType: string) => {
  const icons: { [key: string]: React.ElementType } = {
    ladder_stand: () => <div className="w-4 h-4"><svg viewBox="0 0 24 24" fill="currentColor"><rect width="2" height="20" x="8" y="2" rx="1"/><rect width="2" height="20" x="14" y="2" rx="1"/><rect width="18" height="2" x="3" y="8" rx="1"/><rect width="18" height="2" x="3" y="14" rx="1"/></svg></div>,
    tree_stand: () => <div className="w-4 h-4"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22V3"/></svg></div>,
    box_stand: () => <div className="w-4 h-4"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg></div>,
    bale_blind: () => <div className="w-4 h-4"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg></div>,
    tripod: () => <div className="w-4 h-4"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg></div>,
    ground_blind: () => <div className="w-4 h-4"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 21 12 13.5 20.5 21 12 15.5 3.5 21Z"/><path d="M12 13.5V3.5"/></svg></div>
  }
  
  const IconComponent = icons[standType] || icons.tree_stand
  return <IconComponent />
}

// Calculate success rate
const calculateSuccessRate = (stand: MapPopupStand): number => {
  const hunts = stand.total_hunts || 0
  const harvests = stand.total_harvests || 0
  if (hunts === 0) return 0
  return Math.round((harvests / hunts) * 10000) / 100
}

// Get performance rating
const getPerformanceRating = (successRate: number) => {
  if (successRate >= 25) return { rating: 'excellent', color: '#059669', label: 'Excellent' }
  if (successRate >= 15) return { rating: 'good', color: '#65A30D', label: 'Good' }
  if (successRate >= 5) return { rating: 'average', color: '#D97706', label: 'Average' }
  return { rating: 'poor', color: '#DC2626', label: 'Poor' }
}

export default function StandCardMapPopup({
  stand,
  onEdit,
  onNavigate,
  onViewDetails,
  className = ''
}: StandCardMapPopupProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Calculate stats
  const successRate = calculateSuccessRate(stand)
  const performance = getPerformanceRating(successRate)

  // Mock data for missing fields (replace with actual data when available)
  const mockData = {
    seats: stand.capacity || 2,
    walkTime: stand.walking_time_minutes ? `${stand.walking_time_minutes} min` : '5 min',
    trailCamCoverage: stand.trail_camera_name || 'No coverage',
    totalHarvests: stand.total_harvests || 3,
    huntsThisSeason: stand.season_hunts || 8,
    totalHunts: stand.total_hunts || 24,
    lastHuntDate: stand.last_used_date,
    bestTime: stand.time_of_day || 'AM',
    bestSeason: stand.archery_season ? 'archery' : 'gun',
    nearbyWater: stand.nearby_water_source || true,
    overFoodPlot: stand.food_source === 'field',
    feederNearby: stand.food_source === 'feeder',
    height: stand.height_feet ? `${stand.height_feet} ft` : '15 ft',
    viewDistance: stand.view_distance_yards ? `${stand.view_distance_yards} yards` : '75 yards',
    maintenanceStatus: 'Good'
  }

  // Render condition icons (matches your existing header icons)
  const renderConditionIcons = () => {
    const icons = []
    
    // Time icon
    if (mockData.bestTime === 'AM') {
      icons.push(<Sun key="time" size={14} style={{ color: '#FA7921' }} />)
    } else if (mockData.bestTime === 'PM') {
      icons.push(<Moon key="time" size={14} style={{ color: '#FA7921' }} />)
    } else {
      icons.push(<SunMoon key="time" size={14} style={{ color: '#FA7921' }} />)
    }

    // // Season icon
    // if (mockData.bestSeason === 'archery') {
    //   icons.push(<Bow key="season" size={14} style={{ color: '#FA7921' }} />)
    // }

    // Water icon
    if (mockData.nearbyWater) {
      icons.push(<Droplet key="water" size={14} style={{ color: '#0C4767' }} />)
    }

    // Food source icon
    if (mockData.overFoodPlot) {
      icons.push(<Wheat key="food" size={14} style={{ color: '#B9A44C' }} />)
    } else if (mockData.feederNearby) {
      icons.push(<UtensilsCrossed key="food" size={14} style={{ color: '#B9A44C' }} />)
    }

    return icons
  }

  return (
    <div 
      className={`bg-white font-sans ${className}`}
      style={{ 
        minWidth: '280px', 
        maxWidth: '320px',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {/* Header Section - matches your existing style exactly */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0 8px 0',
          borderBottom: '2px solid #E8E6E0',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: '#FA7921' }}>
            {getStandTypeIcon(stand.type)}
          </div>
          <h3 
            style={{
              color: '#566E3D',
              fontWeight: '700',
              margin: '0',
              fontSize: '16px',
              lineHeight: '1.2'
            }}
          >
            {stand.name}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {renderConditionIcons()}
        </div>
      </div>

      {/* Info Grid - matches your existing grid layout */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 16px',
          marginBottom: '12px',
          fontSize: '13px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D3E1F' }}>
          <Users size={14} style={{ color: '#566E3D' }} />
          <span><strong>Seats:</strong> {mockData.seats}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D3E1F' }}>
          <Footprints size={14} style={{ color: '#566E3D' }} />
          <span><strong>Walk:</strong> {mockData.walkTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D3E1F' }}>
          <Eye size={14} style={{ color: '#566E3D' }} />
          <span><strong>View:</strong> {mockData.viewDistance}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D3E1F' }}>
          <Ruler size={14} style={{ color: '#566E3D' }} />
          <span><strong>Height:</strong> {mockData.height}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D3E1F' }}>
          <Calendar size={14} style={{ color: '#566E3D' }} />
          <span><strong>Hunts:</strong> {mockData.huntsThisSeason}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2D3E1F' }}>
          <Award size={14} style={{ color: '#566E3D' }} />
          <span><strong>Harvests:</strong> {mockData.totalHarvests}</span>
        </div>
      </div>

      {/* Last used box
      <div 
        style={{
          display: 'flex',
          background: #566E3D,
          color: white,
          padding: 8px 10px,
          border-radius: 6px,
          margin-bottom: 12px,
          font-size: 12px,
          text-align: center
        }}>
          <strong>Last Hunted:</strong> Nov 15, 2024 • AM
        </div> */}

         {stand.latitude && stand.longitude && (
            <div style={{ 
              alignItems: 'center',
              display: 'flex',
              background: '#566E3D',
              color: 'white',
              padding: '8px 10px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '12px',
              textAlign: 'center',
            }}>
                <center><strong>Last Hunted:</strong> {stand.last_used_date} - [LAST HUNT TIME]</center>
              {/* <Award size={14} style={{ color: '#6B7280' }} /> {stand.latitude.toFixed(6)}, {stand.longitude.toFixed(6)} */}
            </div>
          )}

      {/* Performance Bar - matches your existing style */}
      <div style={{
        background: '#F5F4F0', 
        border: '1px solid #E8E6E0', 
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '12px',
      }}>
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            textAlign: 'center',
            fontSize: '11px',
        }}>
            <div>Total Harvested</div>
            <div>Hunts This Season</div>
            <div>All-Time Hunts</div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '4px',
          fontSize: '12px'
        }}>
          <span style={{ color: '#566E3D', fontWeight: '600' }}>Success Rate</span>
          <span style={{ color: performance.color, fontWeight: '700' }}>
            {successRate.toFixed(1)}% ({performance.label})
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: '#E8E6E0', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div 
            style={{ 
              width: `${Math.min(successRate, 100)}%`, 
              height: '100%', 
              backgroundColor: performance.color,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Collapsible Details Section */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: '#F3F4F6',
          border: 'none',
          borderRadius: '6px',
          color: '#566E3D',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          marginBottom: showDetails ? '12px' : '0',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#E5E7EB'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#F3F4F6'
        }}
      >
        {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showDetails ? 'Hide Details' : 'Show More Details'}
      </button>

      {/* Extended Details (collapsible) */}
      {showDetails && (
        <div style={{ 
          fontSize: '12px',
          color: '#2D3E1F',
          marginBottom: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #E8E6E0'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#566E3D' }}>Trail Camera:</strong> {mockData.trailCamCoverage}
          </div>
          {stand.description && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#566E3D' }}>Description:</strong> {stand.description}
            </div>
          )}
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#566E3D' }}>Maintenance:</strong> {mockData.maintenanceStatus}
          </div>
          {stand.latitude && stand.longitude && (
            <div style={{ 
              fontFamily: 'Monaco, Menlo, monospace',
              fontSize: '11px',
              color: '#6B7280',
              marginTop: '8px'
            }}>
              📍 {stand.latitude.toFixed(6)}, {stand.longitude.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        justifyContent: 'stretch'
      }}>
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(stand)}
            style={{
              flex: '1',
              padding: '8px 12px',
              backgroundColor: '#566E3D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#4A5D32'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#566E3D'
            }}
          >
            <Eye size={12} />
            View
          </button>
        )}
        
        {onEdit && (
          <button
            onClick={() => onEdit(stand)}
            style={{
              flex: '1',
              padding: '8px 12px',
              backgroundColor: '#FA7921',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#EA6A0A'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#FA7921'
            }}
          >
            <Edit3 size={12} />
            Edit
          </button>
        )}
        
        {onNavigate && stand.latitude && stand.longitude && (
          <button
            onClick={() => onNavigate(stand)}
            style={{
              flex: '1',
              padding: '8px 12px',
              backgroundColor: '#0C4767',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#0A3A54'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#0C4767'
            }}
          >
            <Navigation size={12} />
            Navigate
          </button>
        )}
      </div>
    </div>
  )
}