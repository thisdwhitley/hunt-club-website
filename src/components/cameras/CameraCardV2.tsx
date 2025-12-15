'use client'

// src/components/cameras/CameraCardV2.tsx
// Camera card component using composable card system
// Supports three display modes: full, compact, list (table row)

import React from 'react'
import BaseCard from '@/components/shared/cards/BaseCard'
import { getIcon } from '@/lib/shared/icons'
import type { CameraWithStatus } from '@/lib/cameras/types'
import type { CardMode } from '@/components/shared/cards/types'

// Hunting club color constants
const HUNTING_COLORS = {
  forestGreen: '#566E3D',
  forestShadow: '#2D3E1F',
  burntOrange: '#FA7921',
  darkTeal: '#0C4767',
  morningMist: '#E8E6E0',
  mutedGold: '#B9A44C',
  clayEarth: '#A0653A',
  weatheredWood: '#8B7355',
}

// Format storage space helper
const formatStorageSpace = (mb: number | null): string => {
  if (!mb) return 'Unknown'
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

// Custom DeviceIcon Component (like DateIcon for hunts)
// Size matches Stand card icon pattern
const DeviceIcon = ({ deviceId, mode = 'full' }: { deviceId: string, mode?: CardMode }) => {
  // Match Stand card sizing: list mode is smaller
  const isListMode = mode === 'list'
  const padding = isListMode ? 'p-1' : 'p-2'
  const rounded = isListMode ? 'rounded' : 'rounded-lg'
  const size = isListMode ? 16 : 24
  const fontSize = isListMode ? '11px' : '16px'

  return (
    <div
      className={`${padding} ${rounded} flex-shrink-0`}
      style={{ backgroundColor: '#0C476720' }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: `${size}px`, height: `${size}px`, color: '#0C4767' }}
      >
        <span style={{ fontSize, fontWeight: 'bold' }}>
          {deviceId}
        </span>
      </div>
    </div>
  )
}

interface CameraCardV2Props {
  camera: CameraWithStatus
  mode?: CardMode
  onClick?: (camera: CameraWithStatus) => void
  onEdit?: (camera: CameraWithStatus) => void
  onDelete?: (camera: CameraWithStatus) => void
  showActions?: boolean
}

export default function CameraCardV2({
  camera,
  mode = 'full',
  onClick,
  onEdit,
  onDelete,
  showActions = true,
}: CameraCardV2Props) {

  // Get power source icon based on camera data
  const getPowerSourceIcon = () => {
    if (camera.deployment?.has_solar_panel) return 'solar'
    if (camera.latest_report?.battery_status === 'Ext OK') return 'batteryCharging'
    return 'battery'
  }

  // Determine alert status and color
  const getAlertStatus = () => {
    if (camera.deployment?.is_missing) {
      return { status: 'missing', color: HUNTING_COLORS.weatheredWood, label: 'MISSING' }
    }
    if (camera.latest_report?.needs_attention) {
      return { status: 'critical', color: HUNTING_COLORS.clayEarth, label: 'CRITICAL' }
    }
    if (
      camera.latest_report?.battery_status === 'Low' ||
      (camera.days_since_last_report && camera.days_since_last_report > 3)
    ) {
      return { status: 'warning', color: HUNTING_COLORS.mutedGold, label: 'WARNING' }
    }
    return { status: 'good', color: HUNTING_COLORS.forestGreen, label: 'GOOD' }
  }

  const alertStatus = getAlertStatus()
  const powerSourceIcon = getPowerSourceIcon()

  // Get actions with proper camera-style colors (matching Stand/Hunt pattern)
  const getActions = () => {
    const actions = []

    // View action (if onClick is provided)
    if (onClick) {
      actions.push({
        icon: getIcon('eye'),
        onClick: () => onClick(camera),
        label: 'View details',
        variant: 'view' as const
      })
    }

    // Edit action
    if (onEdit) {
      actions.push({
        icon: getIcon('edit'),
        onClick: () => onEdit(camera),
        label: 'Edit camera',
        variant: 'edit' as const
      })
    }

    // Delete action
    if (onDelete) {
      actions.push({
        icon: getIcon('delete'),
        onClick: () => onDelete(camera),
        label: 'Delete camera',
        variant: 'delete' as const
      })
    }

    return actions
  }

  // Get report freshness color with better handling
  const getReportFreshnessColor = () => {
    // Camera marked as missing
    if (camera.deployment?.is_missing) {
      return HUNTING_COLORS.clayEarth // Critical
    }

    // No report data
    if (!camera.latest_report) {
      return '#9CA3AF' // Gray
    }

    const reportAge = camera.days_since_last_report

    // Unknown/null age
    if (reportAge === null || reportAge === undefined) {
      return '#9CA3AF' // Gray
    }

    // Color coding based on age
    if (reportAge <= 3) return HUNTING_COLORS.forestGreen // Green (good)
    if (reportAge <= 7) return HUNTING_COLORS.mutedGold // Yellow (warning)
    if (reportAge <= 30) return HUNTING_COLORS.burntOrange // Orange (concerning)
    return HUNTING_COLORS.clayEarth // Red (critical/stale)
  }

  const reportFreshnessColor = getReportFreshnessColor()

  // Format report age text with better handling for missing/stale data
  // TODO: Underlying timestamp data is suspect (webpage scraping issues)
  //       See docs/KNOWN_ISSUES.md - "Camera Report Data From Timestamp Accuracy"
  const formatReportAge = () => {
    // If camera is marked as missing
    if (camera.deployment?.is_missing) {
      return 'Camera Missing'
    }

    // If no report exists at all
    if (!camera.latest_report) {
      return 'No report data'
    }

    const reportAge = camera.days_since_last_report

    // If we couldn't calculate days (null/undefined)
    if (reportAge === null || reportAge === undefined) {
      return 'Unknown'
    }

    // Very old data (likely not deployed or transmitting)
    if (reportAge > 30) {
      return `${reportAge} days ago (stale)`
    }

    // Recent data
    if (reportAge === 0) return 'Today'
    if (reportAge === 1) return '1 day ago'
    return `${reportAge} days ago`
  }

  // ==================== FULL MODE ====================
  if (mode === 'full') {
    return (
      <BaseCard mode={mode} onClick={onClick ? () => onClick(camera) : undefined} clickable={!!onClick}>
        {/* Header - Simple title with actions (matches Stand/Hunt pattern) */}
        <div className="flex items-center gap-3 mb-3">
          <DeviceIcon deviceId={camera.hardware.device_id} mode={mode} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3
                className="font-bold text-lg truncate"
                style={{ color: HUNTING_COLORS.forestGreen }}
              >
                {camera.deployment?.location_name || 'Unknown Location'}
              </h3>

              {/* Action Buttons */}
              {showActions && (
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {getActions().map((action, index) => {
                    const ActionIcon = action.icon
                    const variantStyles = {
                      view: 'text-dark-teal hover:text-dark-teal/80 hover:bg-dark-teal/10',
                      edit: 'text-olive-green hover:text-pine-needle hover:bg-olive-green/10',
                      delete: 'text-clay-earth hover:text-clay-earth/80 hover:bg-clay-earth/10',
                      navigate: 'text-gray-600 hover:text-dark-teal hover:bg-dark-teal/10'
                    }

                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
                        className={`p-2 rounded-md transition-colors ${variantStyles[action.variant || 'edit']}`}
                        title={action.label}
                      >
                        <ActionIcon size={16} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description/Notes */}
        {camera.deployment?.notes && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {camera.deployment.notes}
          </p>
        )}

        {/* Hardware Info Box (no header - matches Stand card features box) */}
        <div
          className="mb-3 p-2 rounded-md border"
          style={{
            borderColor: HUNTING_COLORS.darkTeal,
            borderWidth: '1px'
          }}
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Camera Model */}
            {camera.hardware.brand && camera.hardware.model && (
              <div className="flex items-center gap-2">
                {React.createElement(getIcon('camera'), { size: 14, style: { color: HUNTING_COLORS.darkTeal } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>Model:</strong> {camera.hardware.brand} {camera.hardware.model}
              </span>
              </div>
            )}

            {/* Power Source */}
            <div className="flex items-center gap-2">
              {React.createElement(getIcon(powerSourceIcon), { size: 14, style: { color: HUNTING_COLORS.darkTeal } })}
              <span style={{ color: HUNTING_COLORS.forestShadow }}>
                <strong>Power:</strong>{' '}
                {camera.deployment?.has_solar_panel
                  ? 'Solar Panel'
                  : camera.latest_report?.battery_status === 'Ext OK'
                  ? 'Battery Bank'
                  : 'Internal Battery'}
              </span>
            </div>
          </div>
        </div>

        {/* Camera Report Data Box */}
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
              {React.createElement(getIcon('camera'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
              <span style={{ color: HUNTING_COLORS.forestGreen, fontWeight: 'bold' }}>CAMERA REPORT DATA</span>
            </div>

            {/* Data freshness indicator */}
            {!camera.latest_report && (
              <div className="text-xs" style={{ color: '#9CA3AF', fontWeight: '600' }}>
                No data
              </div>
            )}
          </div>

          {camera.latest_report ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Season */}
                {camera.deployment?.season_year && (
                  <div className="flex items-center gap-2">
                    {React.createElement(getIcon('season'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                    <span style={{ color: HUNTING_COLORS.forestShadow }}>
                      <strong>Season:</strong> {camera.deployment.season_year}
                    </span>
                  </div>
                )}

                {/* Battery Status - highlight Low (warning) or Critical (error) */}
                {camera.latest_report.battery_status && (
                  <div className="flex items-center gap-2">
                    {React.createElement(getIcon('battery'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                    <span style={{ color: HUNTING_COLORS.forestShadow }}>
                      <strong>Battery:</strong>{' '}
                      {camera.latest_report.battery_status.toUpperCase() === 'CRITICAL' ? (
                        <span className="font-bold" style={{ color: HUNTING_COLORS.clayEarth }}>
                          {camera.latest_report.battery_status}
                        </span>
                      ) : camera.latest_report.battery_status.toUpperCase() === 'LOW' ? (
                        <span className="font-bold" style={{ color: HUNTING_COLORS.mutedGold }}>
                          {camera.latest_report.battery_status}
                        </span>
                      ) : (
                        <span>{camera.latest_report.battery_status}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Photos Count */}
                {camera.latest_report.sd_images_count !== null &&
                  camera.latest_report.sd_images_count !== undefined &&
                  camera.latest_report.sd_images_count > 0 && (
                    <div className="flex items-center gap-2">
                      {React.createElement(getIcon('images'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                      <span style={{ color: HUNTING_COLORS.forestShadow }}>
                        <strong>Photos:</strong> {camera.latest_report.sd_images_count.toLocaleString()}
                      </span>
                    </div>
                  )}

                {/* Storage Space */}
                {camera.latest_report.sd_free_space_mb !== null &&
                  camera.latest_report.sd_free_space_mb !== undefined &&
                  camera.latest_report.sd_free_space_mb > 0 && (
                    <div className="flex items-center gap-2">
                      {React.createElement(getIcon('hardDrive'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                      <span style={{ color: HUNTING_COLORS.forestShadow }}>
                        <strong>Storage:</strong> {formatStorageSpace(camera.latest_report.sd_free_space_mb)} free
                      </span>
                    </div>
                  )}

                {/* Signal Level - highlight if below 20% */}
                {camera.latest_report.signal_level !== null && camera.latest_report.signal_level !== undefined && (
                  <div className="flex items-center gap-2">
                    {React.createElement(getIcon('signal'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                    <span style={{ color: HUNTING_COLORS.forestShadow }}>
                      <strong>Signal:</strong>{' '}
                      {camera.latest_report.signal_level < 20 ? (
                        <span className="font-bold" style={{ color: HUNTING_COLORS.clayEarth }}>
                          {camera.latest_report.signal_level}%
                        </span>
                      ) : (
                        <span>{camera.latest_report.signal_level}%</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Network Links - highlight if more than 1 (worse connectivity - more hops) */}
                {camera.latest_report.network_links !== null &&
                  camera.latest_report.network_links !== undefined &&
                  camera.latest_report.network_links > 0 && (
                    <div className="flex items-center gap-2">
                      {React.createElement(getIcon('links'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                      <span style={{ color: HUNTING_COLORS.forestShadow }}>
                        <strong>Links:</strong>{' '}
                        {camera.latest_report.network_links > 1 ? (
                          <span className="font-bold" style={{ color: HUNTING_COLORS.clayEarth }}>
                            {camera.latest_report.network_links}
                          </span>
                        ) : (
                          <span>{camera.latest_report.network_links}</span>
                        )}
                      </span>
                    </div>
                  )}

                {/* Upload Queue - highlight if more than 5 (backlog building up) */}
                {camera.latest_report.image_queue !== null &&
                  camera.latest_report.image_queue !== undefined &&
                  camera.latest_report.image_queue > 0 && (
                    <div className="flex items-center gap-2">
                      {React.createElement(getIcon('queue'), { size: 14, style: { color: HUNTING_COLORS.forestGreen } })}
                      <span style={{ color: HUNTING_COLORS.forestShadow }}>
                        <strong>Queue:</strong>{' '}
                        {camera.latest_report.image_queue > 5 ? (
                          <span className="font-bold" style={{ color: HUNTING_COLORS.clayEarth }}>
                            {camera.latest_report.image_queue}
                          </span>
                        ) : (
                          <span>{camera.latest_report.image_queue}</span>
                        )}
                      </span>
                    </div>
                  )}
              </div>

              {/* Report Timestamp (Last Hunted style - text with border-top) */}
              <div className="text-xs text-weathered-wood mt-2 pt-2 border-t border-weathered-wood/20 text-center">
                <strong className="text-forest-shadow">Report Data From:</strong>{' '}
                <span style={{ color: reportFreshnessColor, fontWeight: '600' }}>
                  {formatReportAge()}
                </span>
              </div>

              {/* Alert Reason */}
              {camera.latest_report.alert_reason && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    {React.createElement(getIcon('alert'), { size: 12, style: { color: alertStatus.color } })}
                    <span style={{ color: alertStatus.color }}>
                      <strong>Alert:</strong> {camera.latest_report.alert_reason}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500 italic text-center">
              <strong>No report data available - camera may not be transmitting</strong>
            </div>
          )}
        </div>

      </BaseCard>
    )
  }

  // ==================== COMPACT MODE ====================
  if (mode === 'compact') {
    // Get battery status color
    const getBatteryColor = () => {
      if (!camera.latest_report?.battery_status) return HUNTING_COLORS.forestShadow
      const status = camera.latest_report.battery_status.toLowerCase()
      if (status === 'critical') return HUNTING_COLORS.clayEarth
      if (status === 'low') return HUNTING_COLORS.mutedGold
      return HUNTING_COLORS.forestShadow
    }

    // Format battery status text (shorten "EXTERNAL OK" to "Ext OK")
    const formatBatteryStatus = (status: string) => {
      if (status.toUpperCase() === 'EXTERNAL OK') return 'Ext OK'
      return status
    }

    // Only bold text if there's an issue
    const getBatteryFontWeight = () => {
      if (!camera.latest_report?.battery_status) return 'normal'
      const status = camera.latest_report.battery_status.toLowerCase()
      if (status === 'critical' || status === 'low') return '600'
      return 'normal'
    }

    return (
      <BaseCard mode={mode} onClick={onClick ? () => onClick(camera) : undefined} clickable={!!onClick}>
        <div className="flex items-start gap-2.5">
          <DeviceIcon deviceId={camera.hardware.device_id} mode={mode} />
          <div className="flex-1 min-w-0">
            {/* Title row with location (no status badge) */}
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-base truncate" style={{ color: HUNTING_COLORS.forestGreen }}>
                {camera.deployment?.location_name || 'Unknown Location'}
              </h3>
            </div>

            {/* Key info row */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs text-forest-shadow">
              {/* Hardware */}
              {camera.hardware.brand && camera.hardware.model && (
                <span className="truncate">
                  {camera.hardware.brand} {camera.hardware.model}
                </span>
              )}

              {/* Battery Status with appropriate icon (replaces standalone solar icon) */}
              {camera.latest_report?.battery_status && (
                <div className="flex items-center gap-1" title="Battery status">
                  {React.createElement(getIcon(powerSourceIcon), { size: 12, style: { color: getBatteryColor() } })}
                  <span style={{ color: getBatteryColor(), fontWeight: getBatteryFontWeight() }}>
                    {formatBatteryStatus(camera.latest_report.battery_status)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseCard>
    )
  }

  // ==================== LIST MODE (Table Row) ====================
  if (mode === 'list') {
    // Get battery status color
    const getBatteryColor = () => {
      if (!camera.latest_report?.battery_status) return HUNTING_COLORS.forestShadow
      const status = camera.latest_report.battery_status.toLowerCase()
      if (status === 'critical') return HUNTING_COLORS.clayEarth
      if (status === 'low') return HUNTING_COLORS.mutedGold
      return HUNTING_COLORS.forestShadow
    }

    // Format battery status text (shorten "EXTERNAL OK" to "Ext OK")
    const formatBatteryStatus = (status: string) => {
      if (status.toUpperCase() === 'EXTERNAL OK') return 'Ext OK'
      return status
    }

    // Only bold text if there's an issue
    const getBatteryFontWeight = () => {
      if (!camera.latest_report?.battery_status) return 'normal'
      const status = camera.latest_report.battery_status.toLowerCase()
      if (status === 'critical' || status === 'low') return '600'
      return 'normal'
    }

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
        {/* Device Column - Icon only, no text */}
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center">
            <DeviceIcon deviceId={camera.hardware.device_id} mode={mode} />
          </div>
        </td>

        {/* Location Column */}
        <td className="px-4 py-3 text-sm">
          <span className="text-forest-shadow font-medium">{camera.deployment?.location_name || 'Unknown'}</span>
        </td>

        {/* Hardware Column - Model + Battery Status */}
        <td className="px-4 py-3 text-sm text-gray-700">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Brand/Model */}
            {camera.hardware.brand && camera.hardware.model ? (
              <span>
                {camera.hardware.brand} {camera.hardware.model}
              </span>
            ) : (
              <span className="text-gray-400 italic">Not specified</span>
            )}

            {/* Battery Status with icon */}
            {camera.latest_report?.battery_status && (
              <div className="flex items-center gap-1" title="Battery status">
                {React.createElement(getIcon(powerSourceIcon), { size: 12, style: { color: getBatteryColor() } })}
                <span style={{ color: getBatteryColor(), fontWeight: getBatteryFontWeight(), fontSize: '0.75rem' }}>
                  {formatBatteryStatus(camera.latest_report.battery_status)}
                </span>
              </div>
            )}
          </div>
        </td>

        {/* Actions Column */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end space-x-1">
            {/* View Button */}
            {onClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick(camera)
                }}
                className="p-1.5 rounded-md text-dark-teal hover:text-dark-teal/80 hover:bg-dark-teal/10 transition-colors"
                title="View camera details"
              >
                {React.createElement(getIcon('eye'), { size: 16 })}
              </button>
            )}

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(camera)
                }}
                className="p-1.5 rounded-md text-olive-green hover:text-pine-needle hover:bg-olive-green/10 transition-colors"
                title="Edit camera"
              >
                {React.createElement(getIcon('edit'), { size: 16 })}
              </button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(camera)
                }}
                className="p-1.5 rounded-md text-clay-earth hover:text-clay-earth/80 hover:bg-clay-earth/10 transition-colors"
                title="Delete camera"
              >
                {React.createElement(getIcon('delete'), { size: 16 })}
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  return null
}
