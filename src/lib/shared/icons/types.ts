// src/lib/shared/icons/types.ts
// Type definitions for centralized icon registry system

import { LucideIcon } from 'lucide-react'

/**
 * Icon Registry Type - ensures type safety for icon names
 */
export type IconName = 
  // Navigation & UI
  | 'menu'
  | 'close'
  | 'chevronDown'
  | 'chevronUp'
  | 'chevronLeft'
  | 'chevronRight'
  | 'moreHorizontal'
  | 'moreVertical'
  
  // Core Features
  | 'calendar'
  | 'map'
  | 'stands'
  | 'cameras'
  | 'hunts'
  | 'management'
  | 'analytics'
  | 'dashboard'
  
  // Actions
  | 'plus'
  | 'edit'
  | 'delete'
  | 'save'
  | 'cancel'
  | 'refresh'
  | 'download'
  | 'upload'
  | 'search'
  | 'filter'
  | 'sort'
  
  // Authentication & User
  | 'user'
  | 'login'
  | 'logout'
  | 'profile'
  | 'settings'
  
  // Status & Feedback
  | 'check'
  | 'checkCircle'
  | 'x'
  | 'xCircle'
  | 'alert'
  | 'alertCircle'
  | 'info'
  | 'bell'
  | 'warning'
  | 'error'
  | 'success'
  
  // Hunting & Outdoor
  | 'target'
  | 'eye'
  | 'binoculars'
  | 'compass'
  | 'thermometer'
  | 'wind'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'rain'
  | 'snow'
  | 'tree'
  | 'mountains'
  | 'trail'
  
  // Data & Charts
  | 'chartLine'
  | 'chartBar'
  | 'chartPie'
  | 'trendingUp'
  | 'trendingDown'
  | 'activity'
  
  // File & Document
  | 'file'
  | 'fileText'
  | 'image'
  | 'folder'
  | 'archive'
  | 'paperclip'
  
  // Communication
  | 'mail'
  | 'phone'
  | 'message'
  | 'share'
  
  // Hardware & Equipment
  | 'camera'
  | 'video'
  | 'battery'
  | 'batteryLow'
  | 'wifi'
  | 'wifiOff'
  | 'signal'
  | 'power'
  | 'powerOff'
  
  // Time & Date
  | 'clock'
  | 'timer'
  | 'sunrise'
  | 'sunset'
  
  // Location & Navigation
  | 'mapPin'
  | 'navigation'
  | 'location'
  | 'crosshair'
  
  // Misc Utility
  | 'lock'
  | 'unlock'
  | 'visible'
  | 'hidden'
  | 'copy'
  | 'link'
  | 'external'
  | 'home'
  | 'wrench'
  | 'gear'
  | 'bookmark'
  | 'star'
  | 'heart'
  | 'flag'

/**
 * Icon Component Props Interface
 */
export interface IconProps {
  size?: number
  color?: string
  className?: string
  strokeWidth?: number
}

/**
 * Icon Registry Interface
 */
export type IconRegistry = {
  [K in IconName]: LucideIcon
}

/**
 * Icon Categories for better organization
 */
export const ICON_CATEGORIES = {
  NAVIGATION: [
    'menu', 'close', 'chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight',
    'moreHorizontal', 'moreVertical'
  ] as const,
  
  FEATURES: [
    'calendar', 'map', 'stands', 'cameras', 'hunts', 'management', 'analytics', 'dashboard'
  ] as const,
  
  ACTIONS: [
    'plus', 'edit', 'delete', 'save', 'cancel', 'refresh', 'download', 'upload',
    'search', 'filter', 'sort'
  ] as const,
  
  USER: [
    'user', 'login', 'logout', 'profile', 'settings'
  ] as const,
  
  STATUS: [
    'check', 'checkCircle', 'x', 'xCircle', 'alert', 'alertCircle', 'info',
    'bell', 'warning', 'error', 'success'
  ] as const,
  
  HUNTING: [
    'target', 'eye', 'binoculars', 'compass', 'thermometer', 'wind', 'sun',
    'moon', 'cloud', 'rain', 'snow', 'tree', 'mountains', 'trail'
  ] as const,
  
  DATA: [
    'chartLine', 'chartBar', 'chartPie', 'trendingUp', 'trendingDown', 'activity'
  ] as const,
  
  HARDWARE: [
    'camera', 'video', 'battery', 'batteryLow', 'wifi', 'wifiOff', 'signal',
    'power', 'powerOff'
  ] as const,
  
  TIME: [
    'clock', 'timer', 'sunrise', 'sunset'
  ] as const,
  
  LOCATION: [
    'mapPin', 'navigation', 'location', 'crosshair'
  ] as const
} as const

/**
 * Type for icon category names
 */
export type IconCategory = keyof typeof ICON_CATEGORIES

/**
 * Helper type to get icons from a category
 */
export type IconsInCategory<T extends IconCategory> = typeof ICON_CATEGORIES[T][number]