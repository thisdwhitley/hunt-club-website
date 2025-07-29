// src/lib/stands/constants.ts
// Constants and configuration for stand management

import { 
  RailSymbol as LadderIcon,
  CircleDot as BaleIcon, 
  Square as BoxIcon,
  Triangle as TripodIcon,
  Sun as AMIcon,
  Moon as PMIcon,
  SunMoon as AllDayIcon,
  Droplet as WaterIcon,
  Wheat as FieldIcon,
  UtensilsCrossed as FeederIcon,
  Camera as CameraIcon,
  Target as HuntsIcon,
  Award as HarvestsIcon,
  Calendar as SeasonIcon,
  Footprints as WalkingIcon,
  Users as CapacityIcon,
  Ruler as HeightIcon,
  BowArrow as ArcheryIcon,
  type LucideIcon
} from 'lucide-react'

import type { StandType, TimeOfDay, FoodSourceType } from './types'

// Stand Type Configuration
export const STAND_TYPES: Record<StandType, {
  label: string
  icon: LucideIcon
  description: string
  color: string
}> = {
  ladder_stand: {
    label: 'Ladder Stand',
    icon: LadderIcon,
    description: 'Fixed ladder stand with platform',
    color: '#FA7921' // Hunting orange
  },
  bale_blind: {
    label: 'Bale Blind',
    icon: BaleIcon,
    description: 'Round hay bale ground blind',
    color: '#B9A44C' // Field tan
  },
  box_stand: {
    label: 'Box Stand',
    icon: BoxIcon,
    description: 'Enclosed box blind with windows',
    color: '#566E3D' // Forest green
  },
  tripod: {
    label: 'Tripod',
    icon: TripodIcon,
    description: 'Tripod stand with platform',
    color: '#A0653A' // Wood brown
  }
}

// Time of Day Configuration
export const TIME_OF_DAY_OPTIONS: Record<TimeOfDay, {
  label: string
  icon: LucideIcon
  description: string
  color: string
}> = {
  AM: {
    label: 'Morning',
    icon: AMIcon,
    description: 'Best for morning hunts',
    color: '#B9A44C' // Muted gold
  },
  PM: {
    label: 'Evening',
    icon: PMIcon,
    description: 'Best for evening hunts',
    color: '#4F46E5' // Evening blue
  },
  ALL: {
    label: 'All Day',
    icon: AllDayIcon,
    description: 'Good for any time',
    color: '#059669' // All day green
  }
}

// Food Source Configuration
export const FOOD_SOURCE_OPTIONS: Record<FoodSourceType, {
  label: string
  icon: LucideIcon
  description: string
  color: string
}> = {
  field: {
    label: 'Food Plot',
    icon: FieldIcon,
    description: 'Natural or planted food plot',
    color: '#65A30D' // Crop green
  },
  feeder: {
    label: 'Feeder',
    icon: FeederIcon,
    description: 'Mechanical or gravity feeder',
    color: '#DC2626' // Feeder red
  }
}

// Feature Icons
export const FEATURE_ICONS = {
  water: WaterIcon,
  camera: CameraIcon,
  hunts: HuntsIcon,
  harvests: HarvestsIcon,
  season: SeasonIcon,
  walking: WalkingIcon,
  capacity: CapacityIcon,
  height: HeightIcon,
  archery: ArcheryIcon
} as const

// Color Scheme (matching your hunting club theme)
export const COLORS = {
  primary: '#2D3E1F',      // Dark forest green
  secondary: '#566E3D',     // Medium forest green
  accent: '#FA7921',        // Hunting orange
  field: '#B9A44C',         // Field tan
  success: '#059669',       // Success green
  warning: '#D97706',       // Warning orange
  error: '#DC2626',         // Error red
  water: '#0C4767',         // Water blue
  text: {
    primary: '#1F2937',     // Dark gray
    secondary: '#6B7280',   // Medium gray
    light: '#9CA3AF'        // Light gray
  },
  background: {
    white: '#FFFFFF',
    light: '#F9FAFB',
    gray: '#F3F4F6'
  }
} as const

// Default Values
export const DEFAULTS = {
  capacity: 1,
  height_feet: 12,
  walking_time_minutes: 5,
  view_distance_yards: 100,
  archery_season: true,
  nearby_water_source: false,
  active: true
} as const

// Validation Constants
export const VALIDATION_LIMITS = {
  name: {
    min: 2,
    max: 100
  },
  description: {
    max: 500
  },
  height_feet: {
    min: 1,
    max: 50
  },
  capacity: {
    min: 1,
    max: 8
  },
  walking_time_minutes: {
    min: 1,
    max: 60
  },
  view_distance_yards: {
    min: 10,
    max: 500
  },
  trail_name: {
    max: 100
  },
  access_notes: {
    max: 300
  },
  trail_camera_name: {
    max: 100
  }
} as const

// Sort Options
export const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'last_used_date', label: 'Last Used' },
  { value: 'total_harvests', label: 'Harvests' },
  { value: 'total_hunts', label: 'Total Hunts' },
  { value: 'season_hunts', label: 'Season Hunts' },
  { value: 'walking_time_minutes', label: 'Walk Time' },
  { value: 'height_feet', label: 'Height' },
  { value: 'created_at', label: 'Date Added' }
] as const

// Filter Groups for UI
export const FILTER_GROUPS = {
  type: {
    label: 'Stand Type',
    options: Object.keys(STAND_TYPES) as StandType[]
  },
  time_of_day: {
    label: 'Best Time',
    options: Object.keys(TIME_OF_DAY_OPTIONS) as TimeOfDay[]
  },
  food_source: {
    label: 'Food Source',
    options: Object.keys(FOOD_SOURCE_OPTIONS) as FoodSourceType[]
  },
  features: {
    label: 'Features',
    options: [
      { key: 'archery_season', label: 'Archery Season' },
      { key: 'nearby_water_source', label: 'Near Water' },
      { key: 'has_camera', label: 'Has Camera' },
      { key: 'active', label: 'Active Only' }
    ]
  }
} as const

// Mobile breakpoints (for responsive design)
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280
} as const

// Touch target sizes (for mobile-first design)
export const TOUCH_TARGETS = {
  minimum: 44,      // Minimum touch target size in px
  comfortable: 56,  // Comfortable touch target size
  large: 64        // Large touch target for primary actions
} as const

// Property boundaries (for your 100-acre property)
export const PROPERTY_CONFIG = {
  center: {
    latitude: 36.42723576739513,
    longitude: -79.51088069325365
  },
  bounds: {
    // Approximate 100-acre boundary (adjust as needed)
    north: 36.43,
    south: 36.424,
    east: -79.506,
    west: -79.516
  }
} as const

// Performance thresholds for stand statistics
export const PERFORMANCE_THRESHOLDS = {
  success_rate: {
    excellent: 25,    // 25%+ harvest rate is excellent
    good: 15,        // 15%+ is good
    average: 5       // 5%+ is average
  },
  hunts_per_season: {
    high: 10,        // 10+ hunts per season is high usage
    medium: 5,       // 5+ is medium usage
    low: 1          // 1+ is low usage
  }
} as const
