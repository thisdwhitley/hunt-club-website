'use client'

// src/components/cameras/CameraCard.tsx
// Mobile-first camera card component with multiple display modes
// Phase 3, Step 3.1: Core component following StandCard patterns

import React from 'react'
import { 
  Camera, 
  MapPin, 
  Battery, 
  Signal, 
  AlertTriangle, 
  Eye,
  Calendar,
  HardDrive,
  Wifi,
  Navigation,
  Edit3,
  Trash2,
  Sun,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { CameraWithStatus } from '@/lib/cameras/types'

// ============================================================================
// INTERFACES
// ============================================================================

interface CameraCardProps {
  camera: CameraWithStatus
  mode?: 'full' | 'compact' | 'popup'
  popupWidth?: number
  onClick?: (camera: CameraWithStatus) => void
  onEdit?: (camera: CameraWithStatus) => void
  onDelete?: (camera: CameraWithStatus) => void
  onNavigate?: (camera: CameraWithStatus) => void
  showLocation?: boolean
  showStats?: boolean
  showActions?: boolean
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getBatteryColor = (batteryStatus: string | null): string => {
  if (!batteryStatus) return '#6B7280' // gray-500
  
  switch (batteryStatus.toLowerCase()) {
    case 'full': return '#10B981' // green-500
    case 'good': return '#34D399' // green-400
    case 'ok': return '#F59E0B' // amber-500
    case 'low': return '#EF4444' // red-500
    case 'critical': return '#B91C1C' // red-700
    case 'ext ok': return '#8B5CF6' // purple-500 (external power)
    default: return '#6B7280'
  }
}

const getBatteryIcon = (batteryStatus: string | null, hasSolar: boolean) => {
  if (hasSolar) return <Sun size={14} />
  return <Battery size={14} />
}

const getSignalColor = (signalLevel: number | null): string => {
  if (!signalLevel) return '#6B7280'
  if (signalLevel >= 80) return '#10B981' // green-500
  if (signalLevel >= 60) return '#34D399' // green-400
  if (signalLevel >= 40) return '#F59E0B' // amber-500
  if (signalLevel >= 20) return '#EF4444' // red-500
  return '#B91C1C' // red-700
}

const getAlertLevel = (camera: CameraWithStatus): 'none' | 'warning' | 'critical' => {
  const { deployment, latest_report, days_since_last_report } = camera
  
  // Critical alerts
  if (deployment?.is_missing) return 'critical'
  if (latest_report?.needs_attention) return 'critical'
  if (latest_report?.battery_status === 'Critical') return 'critical'
  if ((days_since_last_report || 0) > 7) return 'critical'
  
  // Warning alerts
  if (latest_report?.battery_status === 'Low') return 'warning'
  if ((days_since_last_report || 0) > 3) return 'warning'
  if (latest_report?.signal_level && latest_report.signal_level < 30) return 'warning'
  
  return 'none'
}

const formatLastSeen = (days: number | null): string => {
  if (!days) return 'Today'
  if (days === 1) return '1 day ago'
  if (days <= 7) return `${days} days ago`
  if (days <= 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CameraCard({
  camera,
  mode = 'full',
  popupWidth = 320,
  onClick,
  onEdit,
  onDelete,
  onNavigate,
  showLocation = true,
  showStats = true,
  showActions = true,
  className = ''
}: CameraCardProps) {
  const { hardware, deployment, latest_report, days_since_last_report } = camera
  
  const alertLevel = getAlertLevel(camera)
  const hasLocation = deployment?.latitude && deployment?.longitude
  
  // ============================================================================
  // STYLES
  // ============================================================================
  
  const getCardStyles = () => {
    let baseStyles = `
      bg-white rounded-lg border shadow-sm
      transition-all duration-200 hover:shadow-md cursor-pointer
    `
    
    // Alert styling
    switch (alertLevel) {
      case 'critical':
        baseStyles += ` border-red-300 bg-red-50 hover:bg-red-100`
        break
      case 'warning':
        baseStyles += ` border-amber-300 bg-amber-50 hover:bg-amber-100`
        break
      default:
        baseStyles += ` border-gray-200 hover:border-gray-300`
    }
    
    // Mode-specific sizing
    switch (mode) {
      case 'compact':
        return `${baseStyles} p-3`
      case 'popup':
        return `${baseStyles} p-4 w-full max-w-none`
      default:
        return `${baseStyles} p-4`
    }
  }
  
  const getTouchTargetSize = () => {
    return mode === 'popup' ? 'min-h-[44px]' : 'min-h-[56px]'
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return
    if (onClick) onClick(camera)
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderHeader = () => (
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <Camera 
            size={mode === 'compact' ? 16 : 20} 
            className={`
              ${alertLevel === 'critical' ? 'text-red-600' : 
                alertLevel === 'warning' ? 'text-amber-600' : 'text-gray-600'}
            `}
          />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium text-gray-900 truncate ${
            mode === 'compact' ? 'text-sm' : 'text-base'
          }`}>
            {deployment?.location_name || 'Unknown Location'}
          </h3>
          
          {mode !== 'compact' && hardware.device_id && (
            <p className="text-xs text-gray-500">
              Device {hardware.device_id} • {hardware.brand || 'Unknown Brand'}
            </p>
          )}
        </div>
      </div>

      {/* Alert indicator */}
      {alertLevel !== 'none' && (
        <div className="flex-shrink-0 ml-2">
          {alertLevel === 'critical' ? (
            <AlertTriangle size={16} className="text-red-500" />
          ) : (
            <AlertTriangle size={16} className="text-amber-500" />
          )}
        </div>
      )}
    </div>
  )
  
  const renderStatusIndicators = () => {
    if (mode === 'compact') return null
    
    const batteryColor = getBatteryColor(latest_report?.battery_status || null)
    const signalColor = getSignalColor(latest_report?.signal_level || null)
    
    return (
      <div className="flex items-center gap-3 text-xs">
        {/* Battery Status */}
        {latest_report?.battery_status && (
          <div className="flex items-center gap-1">
            <div style={{ color: batteryColor }}>
              {getBatteryIcon(latest_report.battery_status, deployment?.has_solar_panel || false)}
            </div>
            <span style={{ color: batteryColor }} className="font-medium">
              {latest_report.battery_status}
            </span>
          </div>
        )}
        
        {/* Signal Level */}
        {latest_report?.signal_level !== null && latest_report?.signal_level !== undefined && (
          <div className="flex items-center gap-1">
            <Signal size={14} style={{ color: signalColor }} />
            <span style={{ color: signalColor }} className="font-medium">
              {latest_report.signal_level}%
            </span>
          </div>
        )}
        
        {/* Network Links */}
        {latest_report?.network_links && (
          <div className="flex items-center gap-1 text-gray-600">
            <Wifi size={14} />
            <span>{latest_report.network_links}</span>
          </div>
        )}
      </div>
    )
  }
  
  const renderKeyDetails = () => {
    if (mode === 'compact') return null
    
    const details = []
    
    // Last seen
    if (days_since_last_report !== null) {
      details.push({
        icon: <Calendar size={14} />,
        label: 'Last seen',
        value: formatLastSeen(days_since_last_report),
        critical: days_since_last_report > 7
      })
    }
    
    // Photos on SD card
    if (latest_report?.sd_images_count) {
      details.push({
        icon: <HardDrive size={14} />,
        label: 'SD Photos',
        value: latest_report.sd_images_count.toLocaleString(),
        critical: false
      })
    }
    
    // Image queue
    if (latest_report?.image_queue) {
      details.push({
        icon: <Eye size={14} />,
        label: 'Queue',
        value: latest_report.image_queue.toLocaleString(),
        critical: latest_report.image_queue > 100
      })
    }
    
    if (details.length === 0) return null
    
    return (
      <div className="space-y-1">
        {details.map((detail, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className={detail.critical ? 'text-red-500' : 'text-gray-500'}>
              {detail.icon}
            </span>
            <span className="text-gray-600">{detail.label}:</span>
            <span className={`font-medium ${detail.critical ? 'text-red-600' : 'text-gray-900'}`}>
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  
  const renderLocation = () => {
    if (!showLocation || !hasLocation || mode === 'compact') return null
    
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <MapPin size={14} />
        <span>
          {deployment!.latitude.toFixed(6)}, {deployment!.longitude.toFixed(6)}
        </span>
      </div>
    )
  }
  
  const renderActions = () => {
    if (!showActions || mode === 'compact') return null
    
    return (
      <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
        {onNavigate && hasLocation && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(camera) }}
            className={`${getTouchTargetSize()} px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200`}
            title="Navigate to camera"
          >
            <Navigation size={16} />
          </button>
        )}
        
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(camera) }}
            className={`${getTouchTargetSize()} px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200`}
            title="Edit camera"
          >
            <Edit3 size={16} />
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(camera) }}
            className={`${getTouchTargetSize()} px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200`}
            title="Delete camera"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    )
  }
  
  const renderMissingAlert = () => {
    if (!deployment?.is_missing) return null
    
    return (
      <div className="bg-red-100 border border-red-200 rounded-md p-2 text-xs">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle size={14} />
          <span className="font-medium">Camera Missing</span>
        </div>
        {deployment.consecutive_missing_days > 0 && (
          <p className="text-red-700 mt-1">
            Missing for {deployment.consecutive_missing_days} days
          </p>
        )}
      </div>
    )
  }
  
  const renderNeedsAttentionAlert = () => {
    if (!latest_report?.needs_attention || deployment?.is_missing) return null
    
    return (
      <div className="bg-amber-100 border border-amber-200 rounded-md p-2 text-xs">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle size={14} />
          <span className="font-medium">Needs Attention</span>
        </div>
        {latest_report.alert_reason && (
          <p className="text-amber-700 mt-1">
            {latest_report.alert_reason}
          </p>
        )}
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div 
      className={`${getCardStyles()} ${className}`}
      style={mode === 'popup' ? { width: `${popupWidth}px` } : undefined}
      onClick={handleCardClick}
    >
      {renderHeader()}
      {renderStatusIndicators()}
      
      {mode !== 'compact' && (
        <div className="space-y-2 mt-2">
          {renderMissingAlert()}
          {renderNeedsAttentionAlert()}
          {renderKeyDetails()}
          {renderLocation()}
        </div>
      )}
      
      {renderActions()}
    </div>
  )
}
