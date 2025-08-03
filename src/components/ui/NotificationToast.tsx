// src/components/ui/NotificationToast.tsx
// WIP notification system - non-layout-affecting toast with session-based dismissal
// Displays development notifications without shifting page content

'use client'

import React, { useState, useEffect } from 'react'
import { ICONS } from '@/lib/shared/icons'

interface NotificationToastProps {
  /** Custom message to display. Defaults to development message */
  message?: string
  /** Whether to show in production. Defaults to development only */
  showInProduction?: boolean
  /** Custom duration before auto-hide (ms). Set to 0 to disable auto-hide */
  autoHideDuration?: number
  /** Custom CSS classes */
  className?: string
}

/**
 * NotificationToast - Session-based dismissible notification
 * 
 * Features:
 * - Non-layout-affecting (overlay positioning)
 * - Session-based dismissal (no localStorage)
 * - Development environment detection
 * - Mobile-responsive design
 * - Auto-hide with optional duration
 * - Hunting club design system integration
 */
export default function NotificationToast({
  message = "🚧 System under development. Features may change.",
  showInProduction = false,
  autoHideDuration = 0, // 0 = no auto-hide
  className = ""
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Get icons from registry
  const BellIcon = ICONS.bell
  const CloseIcon = ICONS.close

  // Check environment and initialize visibility
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const shouldShow = isDevelopment || showInProduction
    
    if (shouldShow) {
      // Small delay for smooth initial animation
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [showInProduction])

  // Auto-hide functionality
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoHideDuration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideDuration])

  // Handle dismiss
  const handleClose = () => {
    setIsAnimating(false)
    // Delay removal for smooth exit animation
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  // Don't render if not visible
  if (!isVisible) return null

  return (
    <div 
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-sm w-full sm:w-auto
        pointer-events-auto
        ${className}
      `}
    >
      {/* Toast Container */}
      <div 
        className={`
          bg-olive-green text-white shadow-club-xl rounded-lg border border-pine-needle
          transition-all duration-300 ease-out
          ${isAnimating 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-full opacity-0 scale-95'
          }
        `}
      >
        {/* Toast Content */}
        <div className="flex items-start gap-3 p-4">
          
          {/* Notification Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 bg-muted-gold rounded-full flex items-center justify-center">
              <BellIcon size={14} className="text-forest-shadow" />
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white leading-relaxed">
              {message}
            </div>
            
            {/* Environment Badge */}
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-burnt-orange text-white">
                Development Mode
              </span>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="p-1 hover:bg-pine-needle rounded-lg transition-colors text-green-200 hover:text-white"
              aria-label="Dismiss notification"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar (if auto-hide enabled) */}
        {autoHideDuration > 0 && (
          <div className="h-1 bg-pine-needle rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-burnt-orange transition-all ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${autoHideDuration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      {/* CSS Animation for Progress Bar */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

/**
 * Usage Examples:
 * 
 * // Basic usage (development only)
 * <NotificationToast />
 * 
 * // Custom message
 * <NotificationToast message="🔄 Syncing data..." />
 * 
 * // Show in production with auto-hide
 * <NotificationToast 
 *   message="📢 New features available!" 
 *   showInProduction={true}
 *   autoHideDuration={5000}
 * />
 * 
 * // Custom styling
 * <NotificationToast 
 *   className="top-20 right-6"
 *   message="Custom positioned notification"
 * />
 */
