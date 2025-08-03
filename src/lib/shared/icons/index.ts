// src/lib/shared/icons/index.ts
// Centralized icon registry for Caswell County Yacht Club
// Provides type-safe icon imports and consistent icon usage across the app

import {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  
  // Core Features
  Calendar,
  MapPin,
  Target,
  Camera,
  ClipboardList,
  Settings,
  BarChart3,
  LayoutDashboard,
  
  // Actions
  Plus,
  Edit,
  Trash2,
  Save,
  X as Cancel,
  RotateCcw,
  Download,
  Upload,
  Search,
  Filter,
  ArrowUpDown,
  
  // Authentication & User
  User,
  LogIn,
  LogOut,
  UserCircle,
  Settings as SettingsAlt,
  
  // Status & Feedback
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  AlertTriangle as Warning,
  XCircle as Error,
  CheckCircle as Success,
  
  // Hunting & Outdoor
  Eye,
  Binoculars,
  Compass,
  Thermometer,
  Wind,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Trees,
  Mountain,
  MapPin as Trail,
  
  // Data & Charts
  LineChart,
  BarChart3 as ChartBar,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  
  // File & Document
  File,
  FileText,
  Image,
  Folder,
  Archive,
  Paperclip,
  
  // Communication
  Mail,
  Phone,
  MessageCircle,
  Share,
  
  // Hardware & Equipment
  Video,
  Battery,
  BatteryLow,
  Wifi,
  WifiOff,
  Signal,
  Power,
  PowerOff,
  
  // Time & Date
  Clock,
  Timer,
  Sunrise,
  Sunset,
  
  // Location & Navigation
  Navigation,
  MapPin as Location,
  Crosshair,
  
  // Misc Utility
  Lock,
  Unlock,
  Eye as Visible,
  EyeOff,
  Copy,
  Link,
  ExternalLink,
  Home,
  Wrench,
  Settings as Gear,
  Bookmark,
  Star,
  Heart,
  Flag,

  // Additional Lucide Icons
  type LucideIcon
} from 'lucide-react'

import type { IconName, IconRegistry, IconProps } from './types'

/**
 * Main Icon Registry
 * Maps type-safe icon names to Lucide React components
 */
export const ICONS: IconRegistry = {
  // Navigation & UI
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  
  // Core Features
  calendar: Calendar,
  map: MapPin,
  stands: Target,
  cameras: Camera,
  hunts: ClipboardList,
  management: Settings,
  analytics: BarChart3,
  dashboard: LayoutDashboard,
  
  // Actions
  plus: Plus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  cancel: Cancel,
  refresh: RotateCcw,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,
  sort: ArrowUpDown,
  
  // Authentication & User
  user: User,
  login: LogIn,
  logout: LogOut,
  profile: UserCircle,
  settings: SettingsAlt,
  
  // Status & Feedback
  check: Check,
  checkCircle: CheckCircle,
  x: X,
  xCircle: XCircle,
  alert: AlertTriangle,
  alertCircle: AlertCircle,
  info: Info,
  bell: Bell,
  warning: Warning,
  error: Error,
  success: Success,
  
  // Hunting & Outdoor
  target: Target,
  eye: Eye,
  binoculars: Binoculars,
  compass: Compass,
  thermometer: Thermometer,
  wind: Wind,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  tree: Trees,
  mountains: Mountain,
  trail: Trail,
  
  // Data & Charts
  chartLine: LineChart,
  chartBar: ChartBar,
  chartPie: PieChart,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  activity: Activity,
  
  // File & Document
  file: File,
  fileText: FileText,
  image: Image,
  folder: Folder,
  archive: Archive,
  paperclip: Paperclip,
  
  // Communication
  mail: Mail,
  phone: Phone,
  message: MessageCircle,
  share: Share,
  
  // Hardware & Equipment
  camera: Camera,
  video: Video,
  battery: Battery,
  batteryLow: BatteryLow,
  wifi: Wifi,
  wifiOff: WifiOff,
  signal: Signal,
  power: Power,
  powerOff: PowerOff,
  
  // Time & Date
  clock: Clock,
  timer: Timer,
  sunrise: Sunrise,
  sunset: Sunset,
  
  // Location & Navigation
  mapPin: MapPin,
  navigation: Navigation,
  location: Location,
  crosshair: Crosshair,
  
  // Misc Utility
  lock: Lock,
  unlock: Unlock,
  visible: Visible,
  hidden: EyeOff,
  copy: Copy,
  link: Link,
  external: ExternalLink,
  home: Home,
  wrench: Wrench,
  gear: Gear,
  bookmark: Bookmark,
  star: Star,
  heart: Heart,
  flag: Flag,
} as const

/**
 * Get an icon component by name with type safety
 * @param name - The icon name from IconName type
 * @returns Lucide React icon component
 */
export function getIcon(name: IconName): LucideIcon {
  const icon = ICONS[name]
  if (!icon) {
    console.warn(`Icon "${name}" not found in registry. Available icons:`, Object.keys(ICONS))
    return ICONS.alert // Fallback icon
  }
  return icon
}

/**
 * Icon component props interface
 * For use in a separate .tsx component file
 */
export interface IconComponentProps extends IconProps {
  name: IconName
}

/**
 * Utility function to check if an icon exists in the registry
 */
export function hasIcon(name: string): name is IconName {
  return name in ICONS
}

/**
 * Get all available icon names
 */
export function getAvailableIcons(): IconName[] {
  return Object.keys(ICONS) as IconName[]
}

/**
 * Get icons by category for easier discovery
 */
export function getIconsByCategory() {
  return {
    navigation: ['menu', 'close', 'chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight'] as IconName[],
    features: ['calendar', 'map', 'stands', 'cameras', 'hunts', 'management', 'analytics', 'dashboard'] as IconName[],
    actions: ['plus', 'edit', 'delete', 'save', 'cancel', 'refresh', 'search', 'filter'] as IconName[],
    user: ['user', 'login', 'logout', 'profile', 'settings'] as IconName[],
    status: ['check', 'x', 'alert', 'info', 'bell', 'warning', 'error', 'success'] as IconName[],
    hunting: ['target', 'eye', 'binoculars', 'compass', 'wind', 'sun', 'moon', 'tree'] as IconName[],
    hardware: ['camera', 'battery', 'wifi', 'signal', 'power'] as IconName[],
  }
}

// Re-export types for convenience
export type { IconName, IconProps, IconRegistry } from './types'
export { ICON_CATEGORIES } from './types'

// Default export for convenience
export default ICONS