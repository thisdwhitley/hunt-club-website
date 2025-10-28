// src/lib/utils/standUtils.ts
import type { StandInsert, HuntingSeason, StandStyle, StandCondition } from '@/lib/types/database';
import { formatDate } from '@/lib/utils/date'

// GPX Waypoint interface
export interface GPXWaypoint {
  name: string;
  lat: number;
  lon: number;
  description?: string;
  symbol?: string;
}

// GPX Parser utility
export const parseGPXFile = (gpxContent: string): GPXWaypoint[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');
  const waypoints: GPXWaypoint[] = [];

  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid GPX file format');
  }

  const wptElements = xmlDoc.getElementsByTagName('wpt');
  
  for (let i = 0; i < wptElements.length; i++) {
    const wpt = wptElements[i];
    const lat = parseFloat(wpt.getAttribute('lat') || '0');
    const lon = parseFloat(wpt.getAttribute('lon') || '0');
    
    // Skip waypoints with invalid coordinates
    if (lat === 0 && lon === 0) continue;
    
    const nameElement = wpt.getElementsByTagName('name')[0];
    const descElement = wpt.getElementsByTagName('desc')[0];
    const symElement = wpt.getElementsByTagName('sym')[0];
    
    waypoints.push({
      name: nameElement?.textContent || `Waypoint ${i + 1}`,
      lat,
      lon,
      description: descElement?.textContent || '',
      symbol: symElement?.textContent || ''
    });
  }

  return waypoints;
};

// Convert GPX waypoint to stand data
export const waypointToStand = (waypoint: GPXWaypoint): StandInsert => {
  // Try to guess stand type from name or symbol
  const name = waypoint.name.toLowerCase();
  const symbol = waypoint.symbol?.toLowerCase() || '';
  
  let standStyle: StandStyle = 'tree_stand'; // default
  
  if (name.includes('blind') || symbol.includes('blind')) {
    standStyle = 'ground_blind';
  } else if (name.includes('ladder') || symbol.includes('ladder')) {
    standStyle = 'ladder_stand';
  } else if (name.includes('box') || name.includes('tower')) {
    standStyle = 'elevated_box';
  }

  return {
    name: waypoint.name,
    description: waypoint.description || 'Imported from GPX',
    latitude: waypoint.lat,
    longitude: waypoint.lon,
    stand_style: standStyle,
    active: true,
    condition: 'good',
    best_season: 'all_seasons',
    capacity: 1,
    cover_rating: 3,
    type: standStyle
  };
};

// // Format date for display
// export const formatLastUsed = (dateString?: string | null): string => {
//   if (!dateString) return 'Never';
  
//   const date = new Date(dateString);
//   const now = new Date();
//   const diffTime = Math.abs(now.getTime() - date.getTime());
//   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
//   if (diffDays === 0) return 'Today';
//   if (diffDays === 1) return 'Yesterday';
//   if (diffDays < 7) return `${diffDays} days ago`;
//   if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
//   if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
//   return `${Math.floor(diffDays / 365)} years ago`;
// };

// Format success rate
export const formatSuccessRate = (rate?: number | null): string => {
  if (rate === null || rate === undefined) return '0.0%';
  return `${rate.toFixed(1)}%`;
};

// Get hunting season display info
export const getSeasonInfo = (season?: HuntingSeason | null) => {
  switch (season) {
    case 'archery':
      return { label: 'Archery', icon: 'target', color: 'text-olive-green' };
    case 'blackpowder':
      return { label: 'Blackpowder', icon: 'zap', color: 'text-clay-earth' };
    case 'gun':
      return { label: 'Gun', icon: 'crosshair', color: 'text-forest-shadow' };
    case 'all_seasons':
      return { label: 'All Seasons', icon: 'calendar', color: 'text-weathered-wood' };
    default:
      return { label: 'Unknown', icon: 'help-circle', color: 'text-weathered-wood' };
  }
};

// Get condition display info
export const getConditionInfo = (condition?: StandCondition | null) => {
  switch (condition) {
    case 'excellent':
      return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'good':
      return { label: 'Good', color: 'text-bright-orange', bgColor: 'bg-orange-100' };
    case 'fair':
      return { label: 'Fair', color: 'text-muted-gold', bgColor: 'bg-yellow-100' };
    case 'needs_repair':
      return { label: 'Needs Repair', color: 'text-clay-earth', bgColor: 'bg-orange-100' };
    case 'unsafe':
      return { label: 'Unsafe', color: 'text-red-600', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-weathered-wood', bgColor: 'bg-gray-100' };
  }
};

// Get stand style display info
export const getStandStyleInfo = (style?: StandStyle | null) => {
  switch (style) {
    case 'tree_stand':
      return { label: 'Tree Stand', icon: 'tree-pine' };
    case 'ground_blind':
      return { label: 'Ground Blind', icon: 'target' };
    case 'elevated_box':
      return { label: 'Elevated Box', icon: 'box' };
    case 'ladder_stand':
      return { label: 'Ladder Stand', icon: 'ruler' };
    case 'climbing_stand':
      return { label: 'Climbing Stand', icon: 'mountain' };
    case 'popup_blind':
      return { label: 'Pop-up Blind', icon: 'tent' };
    case 'permanent_blind':
      return { label: 'Permanent Blind', icon: 'home' };
    default:
      return { label: 'Unknown', icon: 'map-pin' };
  }
};

// Get stand icon component from centralized icon registry
// Maps stand types to Lucide icons from /lib/shared/icons
export const getStandIcon = (standType?: string | null) => {
  if (!standType) return 'mapPin'; // Default fallback

  const type = standType.toLowerCase();

  // Map various stand type names to icon registry names
  if (type.includes('ladder')) return 'ladderStand';
  if (type.includes('bale') || type.includes('hay')) return 'baleBlind';
  if (type.includes('box') || type.includes('tower') || type.includes('elevated')) return 'boxStand';
  if (type.includes('tripod')) return 'tripodStand';
  if (type.includes('ground') || type.includes('blind') || type.includes('popup') || type.includes('permanent')) return 'groundBlind';
  if (type.includes('tree')) return 'ladderStand'; // Use ladder stand for tree stands

  return 'mapPin'; // Fallback to map pin for unknown types
};

// Validate stand data
export const validateStandData = (data: Partial<StandInsert>): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Stand name is required');
  }

  if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (data.height_feet && data.height_feet < 0) {
    errors.push('Height cannot be negative');
  }

  if (data.capacity && data.capacity < 1) {
    errors.push('Capacity must be at least 1');
  }

  if (data.cover_rating && (data.cover_rating < 1 || data.cover_rating > 5)) {
    errors.push('Cover rating must be between 1 and 5');
  }

  if (data.weight_limit_lbs && data.weight_limit_lbs < 0) {
    errors.push('Weight limit cannot be negative');
  }

  if (data.view_distance_yards && data.view_distance_yards < 0) {
    errors.push('View distance cannot be negative');
  }

  if (data.walking_time_minutes && data.walking_time_minutes < 0) {
    errors.push('Walking time cannot be negative');
  }

  return errors;
};

// Common database queries for the utilities panel
export const commonQueries = [
  {
    name: 'All Active Stands',
    description: 'List all active stands with basic info',
    sql: 'SELECT name, condition, success_rate, total_hunts FROM stands WHERE active = true ORDER BY success_rate DESC;'
  },
  {
    name: 'Stands Needing Repair',
    description: 'Find stands that need maintenance',
    sql: "SELECT name, condition, maintenance_notes, last_inspection_date FROM stands WHERE condition IN ('needs_repair', 'unsafe') ORDER BY last_inspection_date;"
  },
  {
    name: 'High Success Stands',
    description: 'Stands with >30% success rate',
    sql: 'SELECT name, success_rate, total_hunts, total_harvests FROM stands WHERE success_rate > 30 ORDER BY success_rate DESC;'
  },
  {
    name: 'Stands by Hunting Season',
    description: 'Group stands by best hunting season',
    sql: "SELECT best_season, COUNT(*) as count, AVG(success_rate) as avg_success FROM stands GROUP BY best_season;"
  },
  {
    name: 'Recently Used Stands',
    description: 'Stands used in the last year',
    sql: "SELECT name, last_used_date, total_hunts FROM stands WHERE last_used_date > '2024-01-01' ORDER BY last_used_date DESC;"
  },
  {
    name: 'Stand Locations',
    description: 'All stands with GPS coordinates',
    sql: 'SELECT name, latitude, longitude, trail_name FROM stands WHERE latitude IS NOT NULL AND longitude IS NOT NULL;'
  },
  {
    name: 'Average Stats by Style',
    description: 'Performance stats grouped by stand style',
    sql: 'SELECT stand_style, COUNT(*) as count, AVG(success_rate) as avg_success, AVG(total_hunts) as avg_hunts FROM stands GROUP BY stand_style;'
  }
];

// Export utility object for easy importing
export const standUtils = {
  parseGPXFile,
  waypointToStand,
  formatLastUsed: (dateString: string | null): string => {
    if (!dateString) return 'Never'
    return formatDate(dateString) // Use centralized utility
  },
  formatSuccessRate,
  getSeasonInfo,
  getConditionInfo,
  getStandStyleInfo,
  validateStandData,
  commonQueries
};
