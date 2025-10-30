'use client'

// src/components/shared/cards/CardBadge.tsx
// Status badge/pill component

import React from 'react'
import type { CardBadgeProps } from './types'

export default function CardBadge({
  label,
  variant = 'neutral',
  color,
  size = 'md',
  icon: Icon,
  className = '',
  onClick
}: CardBadgeProps) {

  const variantStyles = {
    success: 'bg-bright-orange/10 text-bright-orange border-bright-orange/20',
    warning: 'bg-muted-gold/10 text-muted-gold border-muted-gold/20',
    error: 'bg-clay-earth/10 text-clay-earth border-clay-earth/20',
    info: 'bg-dark-teal/10 text-dark-teal border-dark-teal/20',
    neutral: 'bg-weathered-wood/10 text-weathered-wood border-weathered-wood/20',
    custom: '' // Will use color prop
  }

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  }

  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-bold border transition-colors'
  const clickableStyles = onClick ? 'cursor-pointer hover:opacity-80' : ''
  const variantStyle = variant === 'custom' && color
    ? ''
    : variantStyles[variant]

  const customStyle = variant === 'custom' && color ? {
    backgroundColor: `${color}20`,
    color: color,
    borderColor: `${color}40`
  } : undefined

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyle} ${clickableStyles} ${className}`}
      style={customStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {Icon && <Icon size={iconSizes[size]} />}
      {label}
    </span>
  )
}
