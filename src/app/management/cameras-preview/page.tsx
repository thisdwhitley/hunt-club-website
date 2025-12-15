'use client'

// src/app/management/cameras-preview/page.tsx
// Preview page to compare old CameraCard vs new CameraCardV2

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import CameraCard from '@/components/cameras/CameraCard'
import CameraCardV2 from '@/components/cameras/CameraCardV2'
import { CameraDetailModal } from '@/components/cameras/CameraDetailModal'
import { createClient } from '@/lib/supabase/client'
import type { CameraWithStatus } from '@/lib/cameras/types'

export default function CamerasPreviewPage() {
  const [cameras, setCameras] = useState<CameraWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'full' | 'compact' | 'list'>('full')
  const [viewingCamera, setViewingCamera] = useState<CameraWithStatus | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function fetchCameras() {
      try {
        setLoading(true)

        const supabase = createClient()

        // Fetch cameras with deployment and latest report data
        const { data: camerasData, error } = await supabase
          .from('camera_hardware')
          .select(`
            *,
            deployments:camera_deployments!camera_deployments_hardware_id_fkey(
              id,
              hardware_id,
              location_name,
              latitude,
              longitude,
              season_year,
              stand_id,
              facing_direction,
              has_solar_panel,
              active,
              notes,
              last_seen_date,
              missing_since_date,
              is_missing,
              consecutive_missing_days,
              created_at,
              updated_at
            ),
            reports:camera_status_reports!camera_status_reports_hardware_id_fkey(
              id,
              deployment_id,
              hardware_id,
              report_date,
              battery_status,
              signal_level,
              network_links,
              sd_images_count,
              sd_free_space_mb,
              image_queue,
              needs_attention,
              alert_reason,
              report_processing_date,
              cuddeback_report_timestamp,
              created_at
            )
          `)
          .eq('active', true)
          .order('device_id', { ascending: true })

        if (error) throw error

        // Transform data to CameraWithStatus format
        const transformedCameras: CameraWithStatus[] = (camerasData || []).map((hw) => {
          // Get active deployment
          const deployment = hw.deployments?.find((d) => d.active) || null

          // Get latest report for active deployment
          const latestReport = deployment
            ? hw.reports
                ?.filter((r) => r.deployment_id === deployment.id)
                .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())[0] || null
            : null

          // Calculate days since last report
          // TODO: Data source is unreliable (webpage scraping always shows current dates)
          //       See docs/KNOWN_ISSUES.md - "Camera Report Data From Timestamp Accuracy"
          //       Need to investigate email parsing or API alternatives
          let daysSince = null

          // Try last_seen_date first (most accurate - based on email)
          if (deployment?.last_seen_date) {
            const lastSeenDate = new Date(deployment.last_seen_date)
            const today = new Date()
            daysSince = Math.floor((today.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24))
          }
          // Fall back to report timestamp if last_seen_date not available
          else if (latestReport) {
            const timestampToUse = latestReport.cuddeback_report_timestamp || latestReport.report_date
            if (timestampToUse) {
              const reportDate = new Date(timestampToUse)
              const today = new Date()
              daysSince = Math.floor((today.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
            }
          }

          return {
            hardware: {
              id: hw.id,
              device_id: hw.device_id,
              brand: hw.brand,
              model: hw.model,
              serial_number: hw.serial_number,
              purchase_date: hw.purchase_date,
              fw_version: hw.fw_version,
              cl_version: hw.cl_version,
              condition: hw.condition,
              active: hw.active,
              notes: hw.notes,
              created_at: hw.created_at,
              updated_at: hw.updated_at,
            },
            deployment,
            latest_report: latestReport,
            days_since_last_report: daysSince,
          }
        })

        setCameras(transformedCameras)
      } catch (err) {
        console.error('Error fetching cameras:', err)
        setError(err instanceof Error ? err.message : 'Failed to load cameras')
      } finally {
        setLoading(false)
      }
    }

    fetchCameras()
  }, [])

  // Try to get specific cameras, but be flexible with ID format
  // Looking for: Camera 2 (could be "2", "02", "002"), Camera 12 (could be "12", "012"), Camera 13
  const wantedIds = ['2', '02', '002', '12', '012', '13', '013']
  const specificCameras = cameras.filter(cam =>
    wantedIds.includes(cam.hardware.device_id)
  )

  // If we found some specific ones, use those (up to 5), otherwise show first 5
  const displayCameras = specificCameras.length > 0 ? specificCameras.slice(0, 5) : cameras.slice(0, 5)

  // Debug: Log what we're showing (remove this later)
  console.log('Available cameras:', cameras.map(c => ({
    id: c.hardware.device_id,
    name: c.deployment?.location_name,
    last_seen_date: c.deployment?.last_seen_date,           // Email-based (accurate)
    report_date: c.latest_report?.report_date,              // Sync date (always today)
    cuddeback_timestamp: c.latest_report?.cuddeback_report_timestamp,  // Currently wrong
    days_since: c.days_since_last_report,
    is_missing: c.deployment?.is_missing
  })))
  console.log('Displaying cameras:', displayCameras.map(c => ({ id: c.hardware.device_id, name: c.deployment?.location_name })))

  // Handle view camera
  const handleViewCamera = (camera: CameraWithStatus) => {
    setViewingCamera(camera)
    setShowModal(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setViewingCamera(null)
  }

  // Handle edit camera
  const handleEditCamera = (camera: CameraWithStatus) => {
    alert(`Edit camera: ${camera.hardware.device_id}\n\nNote: Full edit functionality will be implemented when this card system is integrated into the main camera management page.`)
  }

  // Handle delete camera
  const handleDeleteCamera = (camera: CameraWithStatus) => {
    alert(`Delete: ${camera.hardware.device_id}`)
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/management/cameras"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Camera Management
          </Link>

          <div className="flex items-center gap-3">
            <Eye size={28} />
            <div>
              <h1 className="text-2xl font-bold">Camera Card Preview</h1>
              <p className="text-green-100 opacity-90">
                Compare old vs new card designs with your actual camera data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-blue-900 font-medium mb-2">🎨 Preview Mode</h3>
          <p className="text-blue-800 text-sm mb-2">
            This page shows side-by-side comparison of the <strong>existing CameraCard</strong> (left)
            and the <strong>new CameraCardV2</strong> (right) using your actual Camera data.
          </p>
          <p className="text-blue-800 text-sm">
            No existing code has been modified. This is a safe preview environment.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-forest-shadow mb-3">Card Mode:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMode('full')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMode === 'full'
                  ? 'bg-olive-green text-white'
                  : 'bg-morning-mist text-forest-shadow hover:bg-weathered-wood/20'
              }`}
            >
              Full Mode
            </button>
            <button
              onClick={() => setSelectedMode('compact')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMode === 'compact'
                  ? 'bg-olive-green text-white'
                  : 'bg-morning-mist text-forest-shadow hover:bg-weathered-wood/20'
              }`}
            >
              Compact Mode
            </button>
            <button
              onClick={() => setSelectedMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMode === 'list'
                  ? 'bg-olive-green text-white'
                  : 'bg-morning-mist text-forest-shadow hover:bg-weathered-wood/20'
              }`}
            >
              List Mode (Table)
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error Loading Cameras</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* List Mode (Table View) */}
        {!loading && !error && selectedMode === 'list' && (
          <div className="space-y-8">
            {/* Old Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ❌ OLD - CameraCard.tsx (List Mode Not Supported)
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">
                  The original CameraCard does not support list/table mode.
                </p>
              </div>
            </div>

            {/* New Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ✨ NEW - CameraCardV2.tsx (List Mode - Table View)
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-morning-mist">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Hardware
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayCameras.map((camera) => (
                      <CameraCardV2
                        key={camera.hardware.id}
                        camera={camera}
                        mode="list"
                        onClick={handleViewCamera}
                        onEdit={handleEditCamera}
                        onDelete={handleDeleteCamera}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Card Mode (Full/Compact) */}
        {!loading && !error && selectedMode !== 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Old Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ❌ OLD - CameraCard.tsx
              </h2>
              <div className="space-y-4">
                {displayCameras.map((camera) => (
                  <CameraCard
                    key={camera.hardware.id}
                    camera={camera}
                    mode={selectedMode}
                    onClick={(cam) => alert(`View: ${cam.hardware.device_id}`)}
                    onEdit={handleEditCamera}
                    onDelete={handleDeleteCamera}
                    showLocation={true}
                    showStats={true}
                    showActions={true}
                  />
                ))}
              </div>
            </div>

            {/* New Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ✨ NEW - CameraCardV2.tsx (Using Base Components)
              </h2>
              <div className="space-y-4">
                {displayCameras.map((camera) => (
                  <CameraCardV2
                    key={camera.hardware.id}
                    camera={camera}
                    mode={selectedMode}
                    onClick={handleViewCamera}
                    onEdit={handleEditCamera}
                    onDelete={handleDeleteCamera}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && cameras.length === 0 && (
          <div className="text-center py-12">
            <p className="text-weathered-wood">No cameras found. Add some cameras to see the preview.</p>
            <Link
              href="/management/cameras"
              className="text-olive-green hover:text-pine-needle font-medium underline mt-2 inline-block"
            >
              Go to Camera Management
            </Link>
          </div>
        )}

        {/* Notes Section */}
        {!loading && !error && cameras.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-forest-shadow mb-3">📝 Notes</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>New V2 cards use composable base components</strong> for consistency</li>
              <li>✅ <strong>List mode (table view) is now supported</strong> in V2</li>
              <li>✅ <strong>Custom DeviceIcon component</strong> with dark teal theme</li>
              <li>✅ <strong>Report freshness color coding</strong> - green (0-3 days), yellow (4-7), orange (7+)</li>
              <li>✅ <strong>All icons use centralized registry</strong> - no direct lucide-react imports</li>
              <li>✅ <strong>Clicking a card opens detail modal</strong> with all camera information</li>
              <li>✅ <strong>Modal has Edit and Navigate buttons</strong> matching Stand/Hunt card pattern</li>
              <li>✅ <strong>Your existing Camera data</strong> is displayed correctly</li>
              <li>⚠️ <strong>No existing code modified</strong> - this is a safe preview</li>
              <li>🎯 <strong>Next step:</strong> Review and approve before switching routes</li>
            </ul>
          </div>
        )}
      </div>

      {/* Camera Detail Modal */}
      {showModal && viewingCamera && (
        <CameraDetailModal
          camera={viewingCamera}
          onClose={handleCloseModal}
          onEdit={handleEditCamera}
        />
      )}
    </div>
  )
}
