// src/components/shared/cards/types.ts
// Shared TypeScript types for card components

import React from 'react'

export type CardMode = 'full' | 'compact' | 'list'

export interface BaseCardProps {
  mode?: CardMode
  onClick?: () => void
  clickable?: boolean
  isSelected?: boolean
  onSelect?: () => void
  showCheckbox?: boolean
  className?: string
  highlighted?: boolean
  highlightColor?: string
  children: React.ReactNode
  ariaLabel?: string
  role?: string
}

export interface Action {
  icon: React.ComponentType<{ size?: number; className?: string }>
  onClick: (e: React.MouseEvent) => void
  label: string
  variant?: 'edit' | 'delete' | 'view' | 'navigate'
  disabled?: boolean
}

export interface Badge {
  label: string
  className?: string
  color?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

export interface Stat {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  label: string
  value: string | number
  unit?: string
  highlighted?: boolean
  tooltip?: string
}

export interface CardHeaderProps {
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  iconColor?: string
  iconBgColor?: string
  iconSize?: number
  title: string
  subtitle?: string
  badges?: Badge[]
  actions?: Action[]
  compact?: boolean
  showActions?: boolean
  showCheckbox?: boolean
  isSelected?: boolean
  onSelect?: () => void
}

export interface CardStatsGridProps {
  stats: Stat[]
  columns?: 2 | 3 | 4
  inline?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface CardSectionProps {
  title?: string
  titleIcon?: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  bordered?: boolean
  background?: 'white' | 'mist' | 'green' | 'orange'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export interface CardBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'custom'
  color?: string
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<{ size?: number; className?: string }>
  className?: string
  onClick?: () => void
}
