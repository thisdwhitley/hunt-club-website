'use client'

// src/components/stands/StandCardSimple.tsx
// Simplified StandCard without zod dependencies - for immediate testing

import React from 'react'
import { formatDate } from '@/lib/utils/date'
import { 
  MapPin, 
  Eye, 
  Clock, 
  Users, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Navigation,
  TrainTrack as LadderIcon,
  Omega as BaleIcon, 
  Box as BoxIcon,
  Pyramid as TripodIcon,
  Sun as AMIcon,
  Moon as PMIcon,
  SunMoon as AllDayIcon,
  Droplet as WaterIcon,
  Wheat as FieldIcon,
  HandPlatter as FeederIcon,
  Camera as CameraIcon,
  Target as HuntsIcon,
  Award as HarvestsIcon,
  Calendar as SeasonIcon,
  Footprints as WalkingIcon,
  Ruler as HeightIcon,
  BowArrow as ArcheryIcon
} from 'lucide-react'

// Test import in any component
import { z } from 'zod'

// Add this right after the import
const TestSchema = z.object({
  name: z.string(),
  test: z.boolean()
})

try {
  const result = TestSchema.parse({ name: "test", test: true })
  console.log('✅ Zod working in component!', result)
} catch (error) {
  console.error('❌ Zod error:', error)
}

// Simplified types (no zod)
export type StandType = 'ladder_stand' | 'bale_blind' | 'box_stand' | 'tripod'
export type TimeOfDay = 'AM' | 'PM' | 'ALL'
export type FoodSourceType = 'field' | 'feeder'

export interface SimpleStand {
  id: string
  name: string
  description: string | null
  type: StandType
  active: boolean
  latitude: number | null
  longitude: number | null
  height_feet: number | null
  capacity: number | null
  trail_name: string | null
  walking_time_minutes: number | null
  access_notes: string | null
  view_distance_yards: number | null
  total_harvests: number | null
  total_hunts: number | null
  season_hunts: number | null
  last_used_date: string | null
  time_of_day: TimeOfDay | null
  archery_season: boolean | null
  nearby_water_source: boolean | null
  food_source: FoodSourceType | null
  trail_camera_name: string | null
  created_at: string
  updated_at: string
}

interface StandCardSimpleProps {
  stand: SimpleStand
  mode?: 'full' | 'compact' | 'popup'
  onClick?: (stand: SimpleStand) => void
  onEdit?: (stand: SimpleStand) => void
  onDelete?: (stand: SimpleStand) => void
  onNavigate?: (stand: SimpleStand) => void
  showLocation?: boolean
  showStats?: boolean
  showActions?: boolean
  className?: string
  popupWidth?: number
}

// Simplified constants (no external dependencies)
const STAND_TYPES = {
  ladder_stand: { label: 'Ladder Stand', icon: LadderIcon, color: '#FA7921' },
// I want all the stand icons to be orange to match the map icon for stands
  bale_blind: { label: 'Bale Blind', icon: BaleIcon, color: '#FA7921' },
  box_stand: { label: 'Box Stand', icon: BoxIcon, color: '#FA7921' },
  tripod: { label: 'Tripod', icon: TripodIcon, color: '#FA7921' }
//   bale_blind: { label: 'Bale Blind', icon: BaleIcon, color: '#B9A44C' },
//   box_stand: { label: 'Box Stand', icon: BoxIcon, color: '#A0653A' },
//   tripod: { label: 'Tripod', icon: TripodIcon, color: '#566E3D' }
}

const TIME_OF_DAY_OPTIONS = {
  AM: { label: 'Morning', icon: AMIcon, color: '#B9A44C' },
  PM: { label: 'Evening', icon: PMIcon, color: '#4F46E5' },
  ALL: { label: 'All Day', icon: AllDayIcon, color: '#059669' }
}

const FOOD_SOURCE_OPTIONS = {
  field: { label: 'Food Plot', icon: FieldIcon, color: '#65A30D' },
  feeder: { label: 'Feeder', icon: FeederIcon, color: '#DC2626' }
}

// Simple utility functions
function calculateSuccessRate(stand: SimpleStand): number {
  const hunts = stand.total_hunts || 0
  const harvests = stand.total_harvests || 0
  if (hunts === 0) return 0
  return Math.round((harvests / hunts) * 10000) / 100
}

function formatHeight(feet: number | null): string {
  if (!feet) return 'Ground level'
  return `${feet} ft`
}

function formatCapacity(capacity: number | null): string {
  if (!capacity) return '1 hunter'
  return capacity === 1 ? '1 hunter' : `${capacity} hunters`
}

function formatWalkingTime(minutes: number | null): string {
  if (!minutes) return 'Unknown'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

function formatDistance(yards: number | null): string {
  if (!yards) return 'Unknown'
  if (yards < 100) return `${yards} yds`
  return `${Math.round(yards / 10) * 10} yds`
}

// function formatDate(dateString: string | null): string {
//   if (!dateString) return 'Never'
//   const date = new Date(dateString)
//   const now = new Date()
//   const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
//   if (diffInDays === 0) return 'Today'
//   if (diffInDays === 1) return 'Yesterday'
//   if (diffInDays < 7) return `${diffInDays} days ago`
//   if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  
//   return date.toLocaleDateString()
// }

function getPerformanceRating(successRate: number) {
  if (successRate >= 25) return { rating: 'excellent', color: '#059669', label: 'Excellent' }
  if (successRate >= 15) return { rating: 'good', color: '#65A30D', label: 'Good' }
  if (successRate >= 5) return { rating: 'average', color: '#D97706', label: 'Average' }
  return { rating: 'poor', color: '#DC2626', label: 'Poor' }
}

export default function StandCardSimple({
  stand,
  mode = 'full',
  onClick,
  onEdit,
  onDelete,
  onNavigate,
  showLocation = true,
  showStats = true,
  showActions = true,
  className = '',
  popupWidth = 300
}: StandCardSimpleProps) {
  const standType = STAND_TYPES[stand.type]
  const successRate = calculateSuccessRate(stand)
  const performance = getPerformanceRating(successRate)
  
  const StandTypeIcon = standType.icon
  const TimeIcon = stand.time_of_day ? TIME_OF_DAY_OPTIONS[stand.time_of_day].icon : Clock
  const FoodIcon = stand.food_source ? FOOD_SOURCE_OPTIONS[stand.food_source].icon : null

  const getCardStyles = () => {
    const baseStyles = `
      bg-white rounded-lg border border-gray-200 shadow-sm
      transition-all duration-200 hover:shadow-md
    `
    
    switch (mode) {
      case 'compact':
        return `${baseStyles} p-3`
      case 'popup':
        return `${baseStyles} p-4 max-w-none`
      default:
        return `${baseStyles} p-4 hover:border-gray-300`
    }
  }

  const getTouchTargetSize = () => {
    return mode === 'popup' ? 'min-h-[44px]' : 'min-h-[56px]'
  }

  const handleCardClick = () => {
    if (onClick) onClick(stand)
  }

  const renderActions = () => {
    if (!showActions || mode === 'compact') return null

    return (
      <div className="flex items-center gap-1">
        {onNavigate && stand.latitude && stand.longitude && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(stand) }}
            className={`${getTouchTargetSize()} px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200`}
            title="Navigate to stand"
          >
            <Navigation size={16} />
          </button>
        )}
        
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(stand) }}
            className={`${getTouchTargetSize()} px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200`}
            title="Edit stand"
          >
            <Edit3 size={16} />
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(stand) }}
            className={`${getTouchTargetSize()} px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200`}
            title="Delete stand"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    )
  }

  const renderPerformanceBadge = () => {
    if (!showStats || mode === 'compact') return null
    if ((stand.total_hunts || 0) === 0) return null

    return (
      <div 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: `${performance.color}20`,
          color: performance.color 
        }}
      >
        {successRate.toFixed(1)}%
      </div>
    )
  }

  const renderKeyDetails = () => {
    // Don't show Key Details section in compact view
    if (mode === 'compact') return null

    return (
        <div className="grid grid-cols-2 gap-2 mb-1 text-xs" style={{padding: '8px 10px',}}>     
            {stand.capacity && (
            <div className="flex items-center gap-2">
                <Users size={14} style={{color: '#566E3D'}}/>
                <span style={{color: '#2D3E1F'}}><strong>Seats:</strong> {stand.capacity}</span>
            </div>
            )}
            
            {stand.walking_time_minutes && (
            <div className="flex items-center gap-2">
                <WalkingIcon size={14} style={{color: '#566E3D'}} />
                <span style={{color: '#2D3E1F'}}><strong>Walk:</strong> {formatWalkingTime(stand.walking_time_minutes)}</span>
            </div>
            )}
            
            {stand.view_distance_yards && (
            <div className="flex items-center gap-2">
                <Eye size={14} style={{color: '#566E3D'}} />
                <span className="truncate" style={{color: '#2D3E1F'}}><strong>Visibility:</strong> {formatDistance(stand.view_distance_yards)}</span>
            </div>
            )}

            {stand.height_feet && (
            <div className="flex items-center gap-2">
                <HeightIcon size={14} style={{color: '#566E3D'}} />
                <span style={{color: '#2D3E1F'}}><strong>Height:</strong> {formatHeight(stand.height_feet)}</span>
            </div>
            )}

            {stand.trail_camera_name &&
                <div key="camera" className="flex items-center gap-2" title={`Camera: ${stand.trail_camera_name}`} style={{gridColumn: '1/-1'}}>
                <CameraIcon size={14} style={{ color: '#566E3D' }} />
                <span style={{color: '#2D3E1F'}}><strong>Camera:</strong> {stand.trail_camera_name}</span>
                </div>
            }
        </div>
    )
  }

  const renderHistorySection = () => {
    // Don't show History section in compact view
    if (mode === 'compact') return null

    return (
        <div style={{
            background: '#F5F4F0',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E8E6E0',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                // justifyContent: 'center',
                gap: '6px',
                marginBottom: '6px',
                color: '#566E3D',
                fontWeight: '600',
                fontSize: '12px',
            }}>
                <HuntsIcon size={14} /> HISTORY
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    textAlign: 'center',
                    fontSize: '11px',
                    marginBottom: '8px',
                }}>
                    <div>
                        <div style={{fontWeight: '700', color: '#FA7921', fontSize: '16px'}}>{stand.total_harvests}</div>
                        <div style={{color: '#2D3E1F'}}>Total Harvested</div>
                    </div>
                    <div style={{gridColumn: '2/-1',display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    textAlign: 'center',
                    fontSize: '11px',borderRadius: '6px',backgroundColor:'white'}}>
                        
                    <div>
                        <div style={{fontWeight: '700', color: '#B9A44C', fontSize: '16px'}}>{stand.season_hunts}</div>
                        <div style={{color: '#2D3E1F'}}>[2025] Hunts</div>
                    </div>
                    <div>
                        <div style={{fontWeight: '700', color: '#566E3D', fontSize: '16px'}}>{stand.total_hunts}</div>
                        <div style={{color: '#2D3E1F'}}>All-Time Hunts</div>
                    </div>
                    </div>
            </div>
            
            {stand.last_used_date && (
                <div style={{
                    alignItems: 'center',
                    display: 'flex',
                    background: '#566E3D',
                    color: 'white',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    // marginBottom: '12px',
                    fontSize: '12px',
                    justifyContent: 'center',
                }}>
                    <strong>Last Hunted:</strong> {formatDate(stand.last_used_date)} - [AM/PM]
                </div>
            )}
        </div>
        

    )
  }

  const renderFeatures = () => {
    // Don't show Feature icons in full mode, use renderFeaturesFull()
    if (mode === 'full') return null

    const features = []

    if (stand.time_of_day) {
      features.push(
        <div key="time" className="flex items-center gap-1" title={`Best time: ${TIME_OF_DAY_OPTIONS[stand.time_of_day].label}`}>
          <TimeIcon size={14} style={{ color: TIME_OF_DAY_OPTIONS[stand.time_of_day].color }} />
        </div>
      )
    }

    if (stand.nearby_water_source) {
      features.push(
        <div key="water" className="flex items-center gap-1" title="Near water source">
          <WaterIcon size={14} style={{ color: '#0C4767' }} />
        </div>
      )
    }

    if (stand.food_source && FoodIcon) {
      features.push(
        <div key="food" className="flex items-center gap-1" title={`Food source: ${FOOD_SOURCE_OPTIONS[stand.food_source].label}`}>
          <FoodIcon size={14} style={{ color: FOOD_SOURCE_OPTIONS[stand.food_source].color }} />
        </div>
      )
    }

    if (stand.archery_season) {
      features.push(
        <div key="archery" className="flex items-center gap-1" title="Good for archery season">
          <ArcheryIcon size={14} style={{ color: '#FA7921' }} />
        </div>
      )
    }

    if (features.length === 0) return null

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {features}
      </div>
    )
  }

  const renderFeaturesFull = () => {
    // Don't show Feature icons in full mode, use renderFeaturesFull()
    if (mode != 'full') return null

    const features = []

    if (stand.time_of_day) {
      features.push(
        <div key="time" className="flex items-center gap-2" title={`Best time: ${TIME_OF_DAY_OPTIONS[stand.time_of_day].label}`}>
          <TimeIcon size={14} style={{ color: TIME_OF_DAY_OPTIONS[stand.time_of_day].color }} />
          <span style={{color: '#2D3E1F'}}><strong>Ideal time to hunt:</strong> {TIME_OF_DAY_OPTIONS[stand.time_of_day].label}</span>
        </div>
      )
    }

    if (stand.nearby_water_source) {
      features.push(
        <div key="water" className="flex items-center gap-2" title="Near water source">
          <WaterIcon size={14} style={{ color: '#0C4767' }} />
          <span style={{color: '#2D3E1F'}}><strong>Near water source</strong> {stand.nearby_water_source}</span>
        </div>
      )
    }

    if (stand.food_source && FoodIcon) {
      features.push(
        <div key="food" className="flex items-center gap-2" title={`Food source: ${FOOD_SOURCE_OPTIONS[stand.food_source].label}`}>
          <FoodIcon size={14} style={{ color: FOOD_SOURCE_OPTIONS[stand.food_source].color }} />
          <span style={{color: '#2D3E1F'}}><strong>Food source:</strong> {FOOD_SOURCE_OPTIONS[stand.food_source].label}</span>
        </div>
      )
    }

    if (stand.archery_season) {
      features.push(
        <div key="archery" className="flex items-center gap-2" title="Good for archery season">
          <ArcheryIcon size={14} style={{ color: '#FA7921' }} />
          <span style={{color: '#2D3E1F'}}><strong>Good for archery season</strong> {stand.archery}</span>
        </div>
      )
    }

    if (features.length === 0) return null

    return (
        <div style={{padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #0C4767',}}>

            <div className="grid grid-cols-2 gap-2 text-xs">
                {features}
            </div>
        </div>
    )
  }

  // 
  return (
    <div 
      className={`${getCardStyles()} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      style={popupWidth && mode === 'popup' ? { width: popupWidth,background: '#E8E6E0' } : {background: '#E8E6E0'}}
    >
      {/* Header */}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${standType.color}20` }}
          >
            <StandTypeIcon size={24} style={{ color: standType.color }} />
          </div>
          
          <div className="min-w-0">
            <h3 className="truncate" style={{color: '#566E3D', fontWeight: '700', fontSize: '16px',}}
            >
                {stand.name} {renderFeatures()}
            </h3>
          </div>
        </div>
      </div>

        {/* Description */}
        {stand.description && (mode === 'full') && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{stand.description}</p>
        )}

      {renderFeaturesFull()}

      {/* Key Details */}
      {renderKeyDetails()}
 


      {renderHistorySection()}


      {/* Location Row */}
      {showLocation && stand.latitude && stand.longitude && (mode != 'compact') && (
            <div className="flex justify-center gap-1 text-xs text-dark-teal ">
              <MapPin size={12} />
              <span>{stand.latitude.toFixed(4)}, {stand.longitude.toFixed(4)}</span>
            </div>
       )}


    </div>
  )
}
