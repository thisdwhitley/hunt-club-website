'use client'

// src/components/cameras/CameraCard.tsx
// Enhanced camera display component with hunting club styling to match StandCard
//
// DATA STRATEGY:
// - Always Available: location_name, device_id, hardware info, deployment settings
// - Report Data: battery, signal, photos - may be missing or stale, always show timestamps
// - Mode-Specific Display:
//   * Popup: Basic ID info + status + "View Details" button
//   * Compact: Name + device + basic status indicator  
//   * Full: All data with clear report data timestamps and freshness indicators

import React from 'react'
import { 
  MapPin, 
  Camera, 
  Battery as BatteryIcon,
  BatteryCharging as BatteryBankIcon,
  Wifi,
  WifiOff,
  Edit3,
  Trash2,
  Navigation,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Signal,
  HardDrive,
  Calendar,
  Eye,
  Zap as SolarIcon,
  Images as ImagesIcon,
  GalleryHorizontalEnd as QueueIcon,
  Waypoints as LinksIcon,
  CalendarFold as SeasonIcon,
} from 'lucide-react'

import type { CameraWithStatus } from '@/lib/cameras/types'

// Power source options
const POWER_SOURCE_OPTIONS = {
  battery: { label: 'Internal Battery', icon: BatteryIcon, color: '#B9A44C' },
  bank: { label: 'Battery Bank', icon: BatteryBankIcon, color: '#FA7921' },
  solar: { label: 'Solar Panel', icon: SolarIcon, color: '#FA7921' }
}

// Hunting club color constants (matching StandCard)
const HUNTING_COLORS = {
  forestGreen: '#566E3D',
  forestShadow: '#2D3E1F', 
  burntOrange: '#FA7921',
  darkTeal: '#0C4767',
  morningMist: '#E8E6E0'
}

const tealSquareStyle = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const, 
  justifyContent: 'center' as const,
  width: '32px',
  height: '32px',
  // backgroundColor: 'rgba(12, 71, 103, 0.25)', // Adjust here
  color: '#0C4767',
  // border: '2px solid rgba(12, 71, 103, 0.4)',
  borderRadius: '6px',
  fontWeight: 'bold' as const,
  fontSize: '20px',
  // boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
}

// Helper functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDaysAgo = (days: number | null): string => {
  if (days === null) return 'Unknown'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const formatStorageSpace = (mb: number | null): string => {
  if (!mb) return 'Unknown'
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

interface CameraCardProps {
  camera: CameraWithStatus
  
  // Display mode
  mode?: 'full' | 'compact' | 'popup'
  
  // Interaction options
  onClick?: (camera: CameraWithStatus) => void
  onEdit?: (camera: CameraWithStatus) => void
  onDelete?: (camera: CameraWithStatus) => void
  onNavigate?: (camera: CameraWithStatus) => void
  
  // Display options
  showLocation?: boolean
  showStats?: boolean
  showActions?: boolean
  
  // Layout options
  className?: string
  
  // Popup specific options
  popupWidth?: number
}

export default function CameraCard({
  camera,
  mode = 'full',
  onClick,
  onEdit,
  onDelete,
  onNavigate,
  showLocation = true,
  showStats = true,
  showActions = true,
  className = '',
  popupWidth
}: CameraCardProps) {

  // Get power icon based on source
  const getPowerSourceIcon = () => {
    // Determine power source based on camera data
    let powerSource: keyof typeof POWER_SOURCE_OPTIONS = 'battery' // default
    
    if (camera.deployment?.has_solar_panel) {
      powerSource = 'solar'
    } else if (camera.latest_report?.battery_status === 'Ext OK') {
      powerSource = 'bank'
    }
  
  return POWER_SOURCE_OPTIONS[powerSource]
}

  // Determine alert status and color
  const getAlertStatus = () => {
    if (camera.deployment?.is_missing) {
      return { status: 'missing', color: '#DC2626', label: 'MISSING' }
    }
    if (camera.latest_report?.needs_attention) {
      return { status: 'critical', color: '#DC2626', label: 'CRITICAL' }
    }
    if (camera.latest_report?.battery_status === 'Low' || camera.days_since_last_report && camera.days_since_last_report > 3) {
      return { status: 'warning', color: '#D97706', label: 'WARNING' }
    }
    return { status: 'good', color: '#059669', label: 'GOOD' }
  }

  const alertStatus = getAlertStatus()

  const getCardStyles = () => {
    const baseStyles = `
      bg-white rounded-lg border border-gray-200 shadow-sm
      transition-all duration-200 hover:shadow-md
    `
    
    switch (mode) {
      case 'compact':
        return `${baseStyles} p-3 min-w-[240px] sm:min-w-[280px]`
      case 'popup':
        return `${baseStyles} p-4 max-w-none min-w-[280px] sm:min-w-[330px]`
      default:
        return `${baseStyles} p-4 hover:border-gray-300 min-w-[320px] sm:min-w-[380px] ${showActions ? 'pb-12' : ''}`
    }
  }

  const getTouchTargetSize = () => {
    return mode === 'popup' ? 'min-h-[44px]' : 'min-h-[56px]'
  }

  const handleCardClick = () => {
    if (onClick) onClick(camera)
  }

  // Render status badge (shows overall camera health)
  const renderStatusBadge = () => {
    if (mode === 'compact') return null

    const badgeText = mode === 'popup' ? 
      (alertStatus.status === 'good' ? '●' : alertStatus.status === 'warning' ? '⚠' : '●') : 
      alertStatus.label

    return (
      <div className="absolute top-5 right-4" >
        <div className="flex items-center gap-1 justify-end">
          {mode === 'full' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(camera) }}
                className={`min-h-[28px] px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200`}
                title="Edit camera"
              >
                <Edit3 size={16} />
              </button>
          )}
          {/* Delete button - second in the row */}
          {mode === 'full' && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(camera) }}
              className="min-h-[28px] px-3 rounded-md flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
              title="Delete camera"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="px-2 py-1 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: `${alertStatus.color}20`,
              color: alertStatus.color,
              border: `1px solid ${alertStatus.color}40`
            }}
          >
            {badgeText}
          </div>

        </div>
      </div>
    )
  }

  // Render hardware highlight details for compact and popup
  const renderHardwareHighlights = () => {
    const hardware = []

    // Hardware info (always available)
    if (camera.hardware.brand && camera.hardware.model) {
      hardware.push(
        <div key="hardware" className="flex items-center gap-1 text-xs">
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            {[camera.hardware.brand, camera.hardware.model].filter(Boolean).join(' ')}
          </span>
        </div>
      )
    }

    // Solar panel status (always available)
    if (camera.deployment?.has_solar_panel) {
      hardware.push(
        <div key="solar" className="flex items-center gap-1">
          <SolarIcon size={12} style={{ color: HUNTING_COLORS.forestGreen }} />
        </div>
      )
    }

    if (hardware.length === 0) return null

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {hardware}
      </div>
    )
  }

  // Render hardware in box
  const renderHardwareFull = () => {
    const hardware = []

    if (camera.hardware.brand && camera.hardware.model) {
      hardware.push(
        <div key="camera" className="flex items-center gap-2">
          <Camera size={14} style={{ color: HUNTING_COLORS.darkTeal }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Model:</strong> {[camera.hardware.brand, camera.hardware.model].filter(Boolean).join(' ')}
          </span>
        </div>
      )
    }

    const powerConfig = getPowerSourceIcon()
    const PowerIcon = powerConfig.icon
    if (PowerIcon) {
      hardware.push(
        <div key="power" className="flex items-center gap-2">
          <PowerIcon size={14} style={{ color: HUNTING_COLORS.darkTeal }} />
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Power:</strong> {powerConfig.label}
          </span>
        </div>
      )
    }

    if (hardware.length === 0) return null

    return (
      <div className="mb-2" 
        style={{
          padding: '8px 10px',
          borderRadius: '6px',
          border: `1px solid ${HUNTING_COLORS.darkTeal}`,
        }}
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
          {hardware}
        </div>
      </div>
    )
  }

  // Render compact mode info
  const renderCompactInfo = () => {
    if (mode !== 'compact') return null

    return (
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: HUNTING_COLORS.forestShadow }}>
          Device {camera.hardware.device_id}
        </span>
        
        <div className="flex items-center gap-2">
          {camera.deployment?.has_solar_panel && (
            <SolarIcon size={12} style={{ color: HUNTING_COLORS.darkTeal }} />
          )}
          <span style={{ 
            color: alertStatus.color,
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {camera.latest_report ? 
              (camera.days_since_last_report === 0 ? 'Today' : `${camera.days_since_last_report}d ago`) : 
              'Not data'
            }
          </span>
        </div>
      </div>
    )
  }

  // Render key details section (hardware/deployment data - always available)
  const renderKeyDetails = () => {
    const details = []

    // Hardware info (always available)
    if (camera.hardware.brand && camera.hardware.model) {
      details.push(
        <div key="hardware" className="flex items-center gap-2">
          {/* <Camera size={14} style={{ color: HUNTING_COLORS.forestGreen }} /> */}
          <span style={{ color: HUNTING_COLORS.forestShadow }}>
            {[camera.hardware.brand, camera.hardware.model].filter(Boolean).join(' ')}
          </span>
        </div>
      )
    }

    // Solar panel status (always available)
    if (camera.deployment?.has_solar_panel) {
      details.push(
        <div key="solar" className="flex items-center gap-2">
          <SolarIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
          {/* <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Power:</strong> Solar Panel Equipped
          </span> */}
        </div>
      )
    }

    // Only show report-dependent data in full mode with timestamps
    if (mode === 'full') {
      // Battery Status (report data)
      if (camera.latest_report?.battery_status) {
        const batteryIcon = camera.deployment?.has_solar_panel ? SolarIcon : BatteryIcon
        details.push(
          <div key="battery" className="flex items-center gap-2">
            {React.createElement(batteryIcon, { 
              size: 14, 
              style: { color: HUNTING_COLORS.forestGreen } 
            })}
            <span style={{ color: HUNTING_COLORS.forestShadow }}>
              <strong>Battery:</strong> {camera.latest_report.battery_status}
            </span>
          </div>
        )
      }

      // Signal Level (report data)
      if (camera.latest_report?.signal_level !== null && camera.latest_report?.signal_level !== undefined) {
        details.push(
          <div key="signal" className="flex items-center gap-2">
            <Signal size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
            <span style={{ color: HUNTING_COLORS.forestShadow }}>
              <strong>Signal:</strong> {camera.latest_report.signal_level}%
            </span>
          </div>
        )
      }


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

  // Render report data section (only in full mode)
  const renderReportDataSection = () => {
    if (mode === 'compact' || !showStats) return null

    // Show section even if no report data, but indicate data freshness
    const hasReportData = camera.latest_report !== null
    const reportDate = camera.latest_report?.report_date
    const reportAge = camera.days_since_last_report

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
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: HUNTING_COLORS.forestGreen,
              fontWeight: '600',
              fontSize: '12px',
            }}
          >
            <Camera size={14} /> CAMERA REPORT DATA
          </div>
          


          {/* Data freshness indicator */}
            <div className="text-xs" style={{ 
              color: reportAge && reportAge > 7 ? '#DC2626' : reportAge && reportAge > 3 ? '#D97706' : '#059669',
              fontWeight: '600'
            }}>
              {!hasReportData ? 'No data' : null }
              {/* //   reportAge === 0 ? 'Today' : 
              //   reportAge === 1 ? '1 day ago' :
              //   `${reportAge} days ago`
              // ) : 'Nop data'} */}
            </div>
        </div>

        {hasReportData ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Season (year) (report data) */}
            {camera.deployment?.season_year && (
              <div key="season" className="flex items-center gap-2">
                <SeasonIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Season:</strong> {camera.deployment.season_year}
                </span>
              </div>
            )}

            {/* Power Status (report data) */}
            {/* const powerConfig = getPowerSourceIcon()
            const PowerIcon = powerConfig.icon */}
            {camera.latest_report?.battery_status && (
              <div key="battery" className="flex items-center gap-2">
                <BatteryIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Power status:</strong> {camera.latest_report.battery_status}
                </span>
              </div>
            )}

            {/* Image Count (report data) */} 
            {camera.latest_report.sd_images_count && (
              <div key="images" className="flex items-center gap-2">
                <ImagesIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Photos:</strong> {camera.latest_report.sd_images_count.toLocaleString()}
                </span>
              </div>
            )}

            {/* Storage Space (report data) */}
            {camera.latest_report?.sd_free_space_mb && (
              <div key="storage" className="flex items-center gap-2">
                <HardDrive size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Storage:</strong> {formatStorageSpace(camera.latest_report.sd_free_space_mb)} free
                </span>
              </div>
            )}

            {/* Signal Level (report data) */} 
            {camera.latest_report?.signal_level !== null && camera.latest_report?.signal_level !== undefined && (
              <div key="signal" className="flex items-center gap-2">
                <Signal size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Signal:</strong> {camera.latest_report.signal_level}%
                </span>
              </div>
            )}

            {/* Link Count (report data) */} 
            {camera.latest_report.network_links && (
              <div key="links" className="flex items-center gap-2">
                <LinksIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Links:</strong> {camera.latest_report.network_links}
                </span>
              </div>
            )}


    
            {/* Image Queue (report data) */} 
            {camera.latest_report.image_queue && (
              <div key="queue" className="flex items-center gap-2">
                <QueueIcon size={14} style={{ color: HUNTING_COLORS.forestGreen }} />
                <span style={{ color: HUNTING_COLORS.forestShadow }}>
                  <strong>Queue:</strong> {camera.latest_report.image_queue}
                </span>
              </div>
            )}

          </div>
        ) : (
          <div className="text-xs text-gray-500 italic justify-center">
            <strong>No report data available - camera may not be transmitting</strong>
          </div>
        )}
          {hasReportData && (
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
              <strong>Report Data From: </strong> 
              <div style={{ 
              color: reportAge && reportAge > 7 ? '#FA7921' : reportAge && reportAge > 3 ? '#D97706' : '#FFFFFF',
              fontWeight: '600'
            }}>
              {hasReportData ? (
                reportAge === 0 ? ' Today' : 
                reportAge === 1 ? ' 1 day ago' :
                ` ${reportAge} days ago`
              ) : 'Nog data'}
            </div>
            </div>
          )}

        {camera.latest_report?.alert_reason && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-xs">
              <AlertTriangle size={12} style={{ color: alertStatus.color }} />
              <span style={{ color: alertStatus.color }}>
                <strong>Alert:</strong> {camera.latest_report.alert_reason}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render simple status for popup mode
  const renderSimpleStatus = () => {
    if (mode !== 'popup') return null

    const reportAge = camera.days_since_last_report
    const hasRecentData = camera.latest_report && reportAge !== null && reportAge <= 3

    return (
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm">
          {/* <span style={{ color: HUNTING_COLORS.forestShadow }}>
            <strong>Device:</strong> {camera.hardware.device_id}
          </span>
          
          {camera.deployment?.has_solar_panel && (
            <div className="flex items-center gap-1" style={{ color: HUNTING_COLORS.darkTeal }}>
              <SolarIcon size={12} />
              <span className="text-xs">Solar</span>
            </div>
          )} */}
        </div>
        
        <div className="flex items-center justify-between text-xs mt-1">
          <span style={{ 
            color: hasRecentData ? '#059669' : reportAge && reportAge > 7 ? '#DC2626' : '#D97706' 
          }}>
            {camera.latest_report ? (
              reportAge === 0 ? '✓ Reported today' : 
              reportAge === 1 ? '⚠ Last report: 1 day ago' :
              `⚠ Last report: ${reportAge} days ago`
            ) : '✗ No recent reports'}
          </span>
          
        </div>
      </div>
    )
  }

  // Render location info except in compact mode
  const renderLocationInfo = () => {
    if (!showLocation || !camera.deployment?.latitude || !camera.deployment?.longitude || mode === 'compact') {
      return null
    }
    return (
      <div className="flex justify-center gap-1 text-xs" style={{ color: HUNTING_COLORS.darkTeal}}>
        <MapPin size={12} />
        <span>
          {camera.deployment.latitude.toFixed(4)}, {camera.deployment.longitude.toFixed(4)}
        </span>
      </div>
    )
    return null
  }

  // Render actions
  const renderActions = () => {
    if (!showActions || mode === 'compact') return null

    return (
      <div className="flex items-center gap-1">
        {onNavigate && camera.deployment?.latitude && camera.deployment?.longitude && (
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

  return (
    <div
      className={`${getCardStyles()} ${className} ${
        onClick ? 'cursor-pointer' : ''
      } relative`}
      onClick={handleCardClick}
      style={{
        ...(popupWidth && mode === 'popup' ? { width: popupWidth } : {})
      }}
    >
      {/* Status Badge */}
      {renderStatusBadge()}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className="p-1 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${HUNTING_COLORS.darkTeal}20` }}
          >
            <span style={tealSquareStyle}>{camera.hardware.device_id}</span>
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
              {camera.deployment?.location_name || 'Unknown Location'}
            </h3>
            {mode != 'full' && renderHardwareHighlights()}
          </div>
        </div>
      </div>

      {/* Description on full mode*/}
      {mode === 'full' && camera.deployment?.notes && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {camera.deployment.notes}
        </p>
      )}

      {/* Hardware in full mode */}
      {mode === 'full' && renderHardwareFull()}

      {/* Report Data Section (except in compact mode) */}
      {mode === 'full' && renderReportDataSection()}

      {/* Compact Mode Info */}
      {/* {renderCompactInfo()} */}

      {/* Simple Status for Popup Mode */}
      {/* {renderSimpleStatus()} */}

      {/* Key Details (only in full and popup modes) */}
      {/* {mode === 'full' && renderKeyDetails()} */}


      {/* Location Row */}
      {renderLocationInfo()}

      {/* Actions */}
      {/* {mode === 'full' && renderActions()} */}
    </div>
  )
}
