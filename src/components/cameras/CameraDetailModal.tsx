// src/components/cameras/CameraDetailModal.tsx
// Read-only detailed view of camera information

'use client'

import React from 'react'
import { X, Camera, MapPin, Calendar, Settings, Battery, Signal, HardDrive, Zap, Images, AlertTriangle, Navigation, Edit3 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import type { CameraWithStatus } from '@/lib/cameras/types'

// Hunting club color constants
const HUNTING_COLORS = {
  forestGreen: '#566E3D',
  forestShadow: '#2D3E1F', 
  burntOrange: '#FA7921',
  darkTeal: '#0C4767',
  morningMist: '#E8E6E0'
}

interface CameraDetailModalProps {
  camera: CameraWithStatus
  onClose: () => void
  onEdit?: (camera: CameraWithStatus) => void
  onNavigate?: (camera: CameraWithStatus) => void
}

export function CameraDetailModal({ camera, onClose, onEdit, onNavigate }: CameraDetailModalProps) {
  // Helper functions
  // const formatDate = (dateString: string | null): string => {
  //   if (!dateString) return 'Not set'
  //   return new Date(dateString).toLocaleDateString('en-US', { 
  //     year: 'numeric', 
  //     month: 'long', 
  //     day: 'numeric' 
  //   })
  // }

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getAlertStatus = () => {
    if (camera.deployment?.is_missing) {
      return { status: 'missing', color: '#DC2626', label: 'MISSING' }
    }
    if (camera.latest_report?.needs_attention) {
      return { status: 'critical', color: '#DC2626', label: 'CRITICAL' }
    }
    if (camera.latest_report?.battery_status === 'Low' || (camera.days_since_last_report && camera.days_since_last_report > 3)) {
      return { status: 'warning', color: '#D97706', label: 'WARNING' }
    }
    return { status: 'good', color: '#059669', label: 'GOOD' }
  }

  const alertStatus = getAlertStatus()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-olive-green text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera size={24} />
            <div>
              <h2 className="text-xl font-semibold">
                {camera.deployment?.location_name || 'Unknown Location'}
              </h2>
              <p className="text-green-100 opacity-90">
                Device {camera.hardware.device_id} • {camera.hardware.brand || 'Unknown'} {camera.hardware.model || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => onEdit(camera)}
                className="p-2 hover:bg-pine-needle rounded-lg transition-colors flex items-center gap-2"
                title="Edit Camera"
              >
                <Edit3 size={18} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            
            {/* Navigate Button */}
            {onNavigate && camera.deployment?.latitude && camera.deployment?.longitude && (
              <button
                onClick={() => onNavigate(camera)}
                className="p-2 hover:bg-pine-needle rounded-lg transition-colors flex items-center gap-2"
                title="Navigate to Camera"
              >
                <Navigation size={18} />
                <span className="hidden sm:inline">Navigate</span>
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-pine-needle rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status Alert */}
            {alertStatus.status !== 'good' && (
              <div 
                className="p-4 rounded-lg border-l-4 flex items-center gap-3"
                style={{ 
                  backgroundColor: `${alertStatus.color}10`,
                  borderLeftColor: alertStatus.color 
                }}
              >
                <AlertTriangle size={20} style={{ color: alertStatus.color }} />
                <div>
                  <h3 className="font-medium" style={{ color: alertStatus.color }}>
                    {alertStatus.label}
                  </h3>
                  {camera.latest_report?.alert_reason && (
                    <p className="text-sm mt-1" style={{ color: alertStatus.color }}>
                      {camera.latest_report.alert_reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Hardware Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: HUNTING_COLORS.forestGreen }}>
                <Settings size={20} />
                Hardware Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Device ID</label>
                  <p className="text-gray-900 font-medium">{camera.hardware.device_id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Brand & Model</label>
                  <p className="text-gray-900">
                    {[camera.hardware.brand, camera.hardware.model].filter(Boolean).join(' ') || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Serial Number</label>
                  <p className="text-gray-900">{camera.hardware.serial_number || 'Not recorded'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                  <p className="text-gray-900">{formatDate(camera.hardware.purchase_date)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Firmware Version</label>
                  <p className="text-gray-900">{camera.hardware.fw_version || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Command Language Version</label>
                  <p className="text-gray-900">{camera.hardware.cl_version || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Condition</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    camera.hardware.condition === 'good' ? 'bg-green-100 text-green-800' :
                    camera.hardware.condition === 'questionable' ? 'bg-yellow-100 text-yellow-800' :
                    camera.hardware.condition === 'poor' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {camera.hardware.condition}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    camera.hardware.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {camera.hardware.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Deployment Information */}
            {camera.deployment && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: HUNTING_COLORS.forestGreen }}>
                  <MapPin size={20} />
                  Deployment Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location Name</label>
                    <p className="text-gray-900 font-medium">{camera.deployment.location_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Season Year</label>
                    <p className="text-gray-900">{camera.deployment.season_year || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Coordinates</label>
                    <p className="text-gray-900 font-mono text-sm">
                      {camera.deployment.latitude.toFixed(6)}, {camera.deployment.longitude.toFixed(6)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Facing Direction</label>
                    <p className="text-gray-900">{camera.deployment.facing_direction || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Solar Panel</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      camera.deployment.has_solar_panel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {camera.deployment.has_solar_panel ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Deployment Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      camera.deployment.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {camera.deployment.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Deployed On</label>
                    <p className="text-gray-900">{formatDate(camera.deployment.created_at)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-gray-900">{formatDateTime(camera.deployment.updated_at)}</p>
                  </div>
                </div>
                
                {camera.deployment.notes && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-900 mt-1 bg-white p-3 rounded border">
                      {camera.deployment.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Latest Report Information */}
            {camera.latest_report ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: HUNTING_COLORS.forestGreen }}>
                  <Camera size={20} />
                  Latest Status Report
                  <span className="text-sm font-normal text-gray-600">
                    ({camera.days_since_last_report === 0 ? 'Today' : 
                      camera.days_since_last_report === 1 ? '1 day ago' : 
                      `${camera.days_since_last_report} days ago`})
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Battery size={16} style={{ color: HUNTING_COLORS.darkTeal }} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Battery Status</label>
                      <p className="text-gray-900">{camera.latest_report.battery_status || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Signal size={16} style={{ color: HUNTING_COLORS.darkTeal }} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Signal Level</label>
                      <p className="text-gray-900">
                        {camera.latest_report.signal_level !== null ? `${camera.latest_report.signal_level}%` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Images size={16} style={{ color: HUNTING_COLORS.darkTeal }} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Photos on SD</label>
                      <p className="text-gray-900">
                        {camera.latest_report.sd_images_count !== null ? 
                          camera.latest_report.sd_images_count.toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} style={{ color: HUNTING_COLORS.darkTeal }} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Free Storage</label>
                      <p className="text-gray-900">
                        {camera.latest_report.sd_free_space_mb !== null ? 
                          `${(camera.latest_report.sd_free_space_mb / 1024).toFixed(1)} GB` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Upload Queue</label>
                      <p className="text-gray-900">
                        {camera.latest_report.image_queue !== null ? 
                          camera.latest_report.image_queue.toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Network Links</label>
                      <p className="text-gray-900">
                        {camera.latest_report.network_links !== null ? 
                          camera.latest_report.network_links : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Report Date: {formatDate(camera.latest_report.report_date)}</span>
                    <span>Processed: {formatDateTime(camera.latest_report.report_processing_date)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-yellow-800">No Status Reports</h3>
                <p className="text-yellow-700">
                  This camera has not transmitted any status reports yet. Check that the camera is powered on 
                  and has cellular connectivity.
                </p>
              </div>
            )}

            {/* Missing Camera Information */}
            {camera.deployment?.is_missing && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Missing Camera Alert
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-red-600">Last Seen</label>
                    <p className="text-red-800">{formatDate(camera.deployment.last_seen_date)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-red-600">Missing Since</label>
                    <p className="text-red-800">{formatDate(camera.deployment.missing_since_date)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-red-600">Days Missing</label>
                    <p className="text-red-800 font-semibold">
                      {camera.deployment.consecutive_missing_days} days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
