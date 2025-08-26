'use client'

// src/components/stands/StandCard.tsx
// Enhanced stand display component with hunting club styling
// Fixed version of your superior design

import React, { useState } from 'react'
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

// Import your Stand type from database service
import type { Stand } from '@/lib/database/stands'

// Fallback helper functions if @/lib/stands doesn't exist
const formatWalkingTime = (minutes: number | null): string => {
  if (!minutes) return 'Unknown'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

const formatDistance = (yards: number | null): string => {
  if (!yards) return 'Unknown'
  if (yards >= 1000) return `${(yards / 1000).toFixed(1)}k yards`
  return `${yards} yards`
}

const formatHeight = (feet: number | null): string => {
  if (!feet) return 'Ground level'
  return `${feet} ft`
}

// const formatDate = (dateString: string | null): string => {
//   if (!dateString) return 'Never'
//   const date = new Date(dateString)
//   return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
// }

interface StandCardProps {
  stand: Stand
  
  // Display mode
  mode?: 'full' | 'compact' | 'popup'
  
  // Interaction options
  onClick?: (stand: Stand) => void
  onEdit?: (stand: Stand) => void
  onDelete?: (stand: Stand) => void
  onNavigate?: (stand: Stand) => void
  
  // Display options
  showLocation?: boolean
  showStats?: boolean
  showActions?: boolean
  
  // Layout options
  className?: string
  
  // Popup specific options
  popupWidth?: number
}

// Enhanced STAND_TYPES with hunting club styling (all orange icons)
const HUNTING_CLUB_STAND_TYPES = {
  ladder_stand: { 
    label: 'Ladder Stand', 
    icon: LadderIcon, 
    color: '#FA7921',  // Hunting orange for all stands
    description: 'Elevated ladder stand with platform'
  },
  bale_blind: { 
    label: 'Bale Blind', 
    icon: BaleIcon, 
    color: '#FA7921', 
    description: 'Round hay bale ground blind'
  },
  box_stand: { 
    label: 'Box Stand', 
    icon: BoxIcon, 
    color: '#FA7921',
    description: 'Enclosed box blind with windows'
  },
  tripod: { 
    label: 'Tripod', 
    icon: TripodIcon, 
    color: '#FA7921',
    description: 'Tripod stand with platform'
  }
}

// Time of day options
const TIME_OF_DAY_OPTIONS = {
  AM: { label: 'Morning', icon: AMIcon, color: '#FE9920' },
  PM: { label: 'Evening', icon: PMIcon, color: '#B9A44C' },
  ALL: { label: 'All Day', icon: AllDayIcon, color: '#566E3D' }
}

// Food source options
const FOOD_SOURCE_OPTIONS = {
  field: { label: 'Field', icon: FieldIcon, color: '#B9A44C' },
  feeder: { label: 'Feeder', icon: FeederIcon, color: '#FA7921' }
}

// Hunting club color palette
const HUNTING_COLORS = {
  forestGreen: '#566E3D',
  huntingOrange: '#FA7921',
  morningMist: '#E8E6E0',
  darkTeal: '#0C4767',
  mutedGold: '#B9A44C',
  forestShadow: '#2D3E1F',
  pineNeedle: '#4A5D32',
  weatheredWood: '#8B7355'
}

export default function StandCard({
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
}: StandCardProps) {
  // FIXED: Renamed state variable to avoid conflict with prop
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  
  const standType = HUNTING_CLUB_STAND_TYPES[stand.type]
  
  // Icon components
  const StandTypeIcon = standType.icon
  const TimeIcon = stand.time_of_day ? TIME_OF_DAY_OPTIONS[stand.time_of_day].icon : Clock
  const FoodIcon = stand.food_source ? FOOD_SOURCE_OPTIONS[stand.food_source].icon : null

  // Base styles for different modes with hunting club theme
  const getCardStyles = () => {
    const baseStyles = `
      bg-white rounded-lg border-2 border-gray-200 shadow-sm
      transition-all duration-200 hover:shadow-md relative
    `
    
    switch (mode) {
      case 'compact':
        return `${baseStyles} p-3`
      case 'popup':
        return `${baseStyles} p-4 max-w-none`
      default: // full
        return `${baseStyles} p-4 hover:border-gray-300`
    }
  }

  // Handle card click
  const handleCardClick = () => {
    if (onClick) {
      onClick(stand)
    }
  }

  // Render action buttons
  const renderActions = () => {
    if (!showActions || mode != 'full') return null

  return (
    <div className="absolute top-4 right-4" >
      <div className="flex items-center gap-1 justify-end">
        {mode === 'full' && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(stand) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            // style={{
            //   background: HUNTING_COLORS.forestGreen,
            //   color: 'white',
            //   border: `2px solid ${HUNTING_COLORS.forestShadow}`,
            // }}
            title="Edit stand details"
          >
            <Edit3 size={16} />
          </button>
        )}
                {mode === 'full' && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(stand) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
            // style={{
            //   background: HUNTING_COLORS.forestGreen,
            //   color: 'white',
            //   border: `2px solid ${HUNTING_COLORS.forestShadow}`,
            // }}
            title="Delete stand"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
    
          
    //       {onDelete && (
    //         <button
    //           onClick={(e) => { e.stopPropagation(); onDelete(stand) }}
    //           className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200"
    //           style={{
    //             background: HUNTING_COLORS.weatheredWood,
    //             color: 'white',
    //             border: `2px solid ${HUNTING_COLORS.forestShadow}`,
    //           }}
    //           title="Delete stand"
    //         >
    //           <Trash2 size={14} />
    //           Delete
    //         </button>
    //       )}
    //     </div>
    //   </div>
    // </div>
  )
  }

  // Render key details section (hunting club styled)
  const renderKeyDetails = () => {
    if (mode === 'compact') return null

    const details = []

    if (stand.capacity) {
      details.push(
        <div key="capacity" className="flex items-center gap-2">
          <Users size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Seats:</strong> {stand.capacity}
          </span>
        </div>
      )
    }

    if (stand.walking_time_minutes) {
      details.push(
        <div key="walk" className="flex items-center gap-2">
          <WalkingIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Walk:</strong> {formatWalkingTime(stand.walking_time_minutes)}
          </span>
        </div>
      )
    }

    if (stand.view_distance_yards) {
      details.push(
        <div key="view" className="flex items-center gap-2">
          <Eye size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Visibility:</strong> {formatDistance(stand.view_distance_yards)}
          </span>
        </div>
      )
    }

    if (stand.height_feet) {
      details.push(
        <div key="height" className="flex items-center gap-2">
          <HeightIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Height:</strong> {formatHeight(stand.height_feet)}
          </span>
        </div>
      )
    }

    if (stand.trail_camera_name) {
      details.push(
        <div key="camera" className="flex items-center gap-2" style={{ gridColumn: '1/-1' }}>
          <CameraIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Camera:</strong> {stand.trail_camera_name}
          </span>
        </div>
      )
    }

    if (details.length === 0) return null

    return (
      <div 
        className="grid grid-cols-2 gap-2 mb-3 text-xs"
        style={{ padding: '8px 10px' }}
      >
        {details}
      </div>
    )
  }

  // Render enhanced history section (hunting club styled)
  const renderHistorySection = () => {
    if (mode === 'compact') return null

    return (
      <div
        style={{
          background: '#F5F4F0',
          border: '1px solid #E8E6E0',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px',
            color: HUNTING_COLORS.forestGreen,
            fontWeight: '600',
            fontSize: '12px',
          }}
        >
          <HuntsIcon size={14} /> HISTORY
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            textAlign: 'center',
            fontSize: '11px',
            marginBottom: '8px',
          }}
        >
          <div>
            <div style={{ 
              fontWeight: '700', 
              color: HUNTING_COLORS.huntingOrange, 
              fontSize: '16px' 
            }}>
              {stand.total_harvests || 0}
            </div>
            <div style={{ color: HUNTING_COLORS.forestShadow }}>
              Total Harvests
            </div>
          </div>

          <div style={{
            gridColumn: '2/-1',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            textAlign: 'center',
            fontSize: '11px',
            borderRadius: '6px',
            backgroundColor: 'white'
          }}>
            <div>
              <div style={{ 
                fontWeight: '700', 
                color: HUNTING_COLORS.mutedGold, 
                fontSize: '16px' 
              }}>
                {stand.season_hunts || 0}
              </div>
              <div style={{ color: HUNTING_COLORS.forestShadow }}>
                [2025] Hunts
              </div>
            </div>

            <div>
              <div style={{ 
                fontWeight: '700', 
                color: HUNTING_COLORS.forestGreen, 
                fontSize: '16px' 
              }}>
                {stand.total_hunts || 0}
              </div>
              <div style={{ color: HUNTING_COLORS.forestShadow }}>
                All-Time Hunts
              </div>
            </div>
          </div>
        </div>

        {stand.last_used_date && (
          <div
            style={{
              display: 'flex',
              background: HUNTING_COLORS.forestGreen,
              color: 'white',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              justifyContent: 'center',
            }}
          >
            <strong>Last Hunted:</strong> {formatDate(stand.last_used_date)} - [AM/PM]
          </div>
        )}
      </div>
    )
  }

  // Render features for compact mode
  const renderFeatures = () => {
    if (mode === 'full') return null

    const features = []

    if (stand.time_of_day) {
      const timeOption = TIME_OF_DAY_OPTIONS[stand.time_of_day]
      const TimeIcon = timeOption.icon
      features.push(
        <div key="time" className="flex items-center gap-1" title={`Best time: ${timeOption.label}`}>
          <TimeIcon size={14} style={{ color: timeOption.color }} />
        </div>
      )
    }

    if (stand.nearby_water_source) {
      features.push(
        <div key="water" className="flex items-center gap-1" title="Near water source">
          <WaterIcon size={14} style={{ color: HUNTING_COLORS.darkTeal }} />
        </div>
      )
    }

    if (stand.food_source && FoodIcon) {
      const foodOption = FOOD_SOURCE_OPTIONS[stand.food_source]
      features.push(
        <div key="food" className="flex items-center gap-1" title={`Food source: ${foodOption.label}`}>
          <FoodIcon size={14} style={{ color: foodOption.color }} />
        </div>
      )
    }

    if (stand.archery_season) {
      features.push(
        <div key="archery" className="flex items-center gap-1" title="Good for archery season">
          <ArcheryIcon size={14} style={{ color: HUNTING_COLORS.huntingOrange }} />
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

  // Render features for full mode
  const renderFeaturesFull = () => {
    if (mode !== 'full') return null

    const features = []

    if (stand.time_of_day) {
      const timeOption = TIME_OF_DAY_OPTIONS[stand.time_of_day]
      const TimeIcon = timeOption.icon
      features.push(
        <div key="time" className="flex items-center gap-2">
          <TimeIcon size={14} style={{ color: timeOption.color }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Ideal time:</strong> {timeOption.label}
          </span>
        </div>
      )
    }

    if (stand.nearby_water_source) {
      features.push(
        <div key="water" className="flex items-center gap-2">
          <WaterIcon size={14} style={{ color: HUNTING_COLORS.darkTeal }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Near water source</strong>
          </span>
        </div>
      )
    }

    if (stand.food_source && FoodIcon) {
      const foodOption = FOOD_SOURCE_OPTIONS[stand.food_source]
      features.push(
        <div key="food" className="flex items-center gap-2">
          <FoodIcon size={14} style={{ color: foodOption.color }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Food source:</strong> {foodOption.label}
          </span>
        </div>
      )
    }

    if (stand.archery_season) {
      features.push(
        <div key="archery" className="flex items-center gap-2">
          <ArcheryIcon size={14} style={{ color: HUNTING_COLORS.huntingOrange }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Good for archery season</strong>
          </span>
        </div>
      )
    }

    if (features.length === 0) return null

    return (
      <div
        style={{
          padding: '8px 10px',
          borderRadius: '6px',
          border: `1px solid ${HUNTING_COLORS.darkTeal}`,
        }}
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
          {features}
        </div>
      </div>
    )
  }

  // Render location info
  const renderLocationInfo = () => {
    if (!showLocation || (!stand.latitude && !stand.longitude) || mode === 'compact') return null

    return (
      <div className="flex justify-center gap-1 text-xs" style={{ color: HUNTING_COLORS.darkTeal }}>
        <MapPin size={12} />
        <span>
          {stand.latitude?.toFixed(4)}, {stand.longitude?.toFixed(4)}
        </span>
      </div>
    )
  }

  // Render full or popup mode with enhanced hunting club styling
  return (
    <div 
      className={`${getCardStyles()} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      style={{
        // background: HUNTING_COLORS.morningMist,
        background: '#FFFFFF',
        ...(popupWidth && mode === 'popup' ? { width: popupWidth } : {})
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${standType.color}20` }}
          >
            <StandTypeIcon 
              size={24} 
              style={{ color: standType.color }}
            />
          </div>
          
          <div className="min-w-0">
            <h3 
              className="truncate"
              style={{
                color: HUNTING_COLORS.forestGreen,
                fontWeight: '700',
                fontSize: '16px',
              }}
            >
              {stand.name} {renderFeatures()} 
            </h3> 
          </div>
        </div>
      </div>
    
      {/* Description */}
      {stand.description && mode === 'full' && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {stand.description}
        </p>
      )}

      {/* Features Full */}
      {renderFeaturesFull()}

      {/* Key Details */}
      {renderKeyDetails()}

      {/* History Section */}
      {renderHistorySection()}

      {/* Location Row */}
      {renderLocationInfo()}

      {renderActions()}
    </div>
  )
}
