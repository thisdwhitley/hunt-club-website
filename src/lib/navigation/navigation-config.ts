// src/lib/navigation/navigation-config.ts
// Centralized navigation configuration for Caswell County Yacht Club

import { 
  Home, 
  MapPin, 
  Target, 
  Wrench, 
  Camera, 
  Calendar,
  CheckSquare,
  User,
  Settings,
  type LucideIcon
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  description: string
  badge?: number | string
  requiresAuth?: boolean
}

export interface UserMenuItem {
  name: string
  href: string
  icon: LucideIcon
}

// Main navigation items
export const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Overview and recent activity'
  },
  {
    name: 'Stands',
    href: '/stands',
    icon: Target,
    description: 'Manage hunting stands'
  },
  {
    name: 'Hunt Logs',
    href: '/hunts',
    icon: Target,
    description: 'Log and track hunts'
  },
  {
    name: 'Property Map',
    href: '/map',
    icon: MapPin,
    description: 'Interactive property map'
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    description: 'Track maintenance tasks'
  },
  {
    name: 'Trail Cameras',
    href: '/cameras',
    icon: Camera,
    description: 'Manage trail cameras and deployments'
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'Hunt calendar and events'
  },
  {
    name: 'Camp Supplies',
    href: '/supplies',
    icon: CheckSquare,
    description: 'Shared todo and supply lists'
  }
]

// User menu items
export const userMenuItems: UserMenuItem[] = [
  {
    name: 'Profile',
    href: '/profile',
    icon: User
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

// Brand configuration
export const brandConfig = {
  name: 'Caswell County',
  subtitle: 'Yacht Club',
  description: 'Hunting Club Management',
  shortName: 'CCYC',
  shortDescription: 'Hunting Club'
}

// Theme colors (can be moved to separate theme config if needed)
export const navigationTheme = {
  desktop: {
    background: 'bg-olive-green',
    text: 'text-white',
    activeBackground: 'bg-pine-needle',
    activeText: 'text-white',
    inactiveText: 'text-green-100',
    hoverBackground: 'hover:bg-pine-needle',
    hoverText: 'hover:text-white',
    border: 'border-pine-needle',
    shadow: 'shadow-club-lg'
  },
  mobile: {
    background: 'bg-olive-green',
    text: 'text-white',
    activeBackground: 'bg-pine-needle',
    activeText: 'text-white',
    inactiveText: 'text-green-100',
    hoverBackground: 'hover:bg-pine-needle',
    hoverText: 'hover:text-white',
    backdropBackground: 'bg-black bg-opacity-50',
    shadow: 'shadow-club-xl'
  }
}