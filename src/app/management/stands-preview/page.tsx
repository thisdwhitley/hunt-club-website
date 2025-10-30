'use client'

// src/app/management/stands-preview/page.tsx
// Preview page to compare old StandCard vs new StandCardV2

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import { StandService } from '@/lib/database/stands'
import { createClient } from '@/lib/supabase/client'
import StandCard from '@/components/stands/StandCard'
import StandCardV2 from '@/components/stands/StandCardV2'
import { StandDetailModal } from '@/components/stands/StandDetailModal'
import type { Stand } from '@/lib/database/stands'

// Store last hunt info for each stand
interface StandLastHunt {
  hunt_date: string
  hunt_type: 'AM' | 'PM' | 'All Day'
}

// Store history stats calculated from hunt_logs
interface StandHistoryStats {
  totalHarvests: number
  seasonHunts: number
  allTimeHunts: number
}

export default function StandsPreviewPage() {
  const [stands, setStands] = useState<Stand[]>([])
  const [lastHunts, setLastHunts] = useState<Record<string, StandLastHunt>>({})
  const [historyStats, setHistoryStats] = useState<Record<string, StandHistoryStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'full' | 'compact' | 'list'>('full')
  const [viewingStand, setViewingStand] = useState<Stand | null>(null)
  const [showModal, setShowModal] = useState(false)

  const standService = new StandService()
  const supabase = createClient()

  // Load stands and their most recent hunts
  useEffect(() => {
    const loadStandsAndHunts = async () => {
      try {
        setLoading(true)
        const data = await standService.getStands()
        setStands(data || [])

        // Query for most recent hunt per stand and calculate history stats
        if (data && data.length > 0) {
          const standIds = data.map(s => s.id)
          const currentYear = new Date().getFullYear()

          // Get all hunts for these stands
          const { data: hunts, error: huntsError } = await supabase
            .from('hunt_logs')
            .select(`
              id,
              stand_id,
              hunt_date,
              hunt_type,
              harvest_count,
              created_at
            `)
            .in('stand_id', standIds)
            .order('hunt_date', { ascending: false })
            .order('created_at', { ascending: false })

          if (huntsError) throw huntsError

          // Create map of stand_id -> most recent hunt
          const huntMap: Record<string, StandLastHunt> = {}
          // Calculate history stats per stand
          const statsMap: Record<string, StandHistoryStats> = {}

          // Initialize stats for each stand
          standIds.forEach(id => {
            statsMap[id] = {
              totalHarvests: 0,
              seasonHunts: 0,
              allTimeHunts: 0
            }
          })

          if (hunts) {
            for (const hunt of hunts) {
              // Track most recent hunt (first one due to ordering)
              if (!huntMap[hunt.stand_id]) {
                huntMap[hunt.stand_id] = {
                  hunt_date: hunt.hunt_date,
                  hunt_type: hunt.hunt_type as 'AM' | 'PM' | 'All Day'
                }
              }

              // Calculate stats
              const stats = statsMap[hunt.stand_id]

              // Count all-time hunts
              stats.allTimeHunts++

              // Count harvests
              if (hunt.harvest_count && hunt.harvest_count > 0) {
                stats.totalHarvests += hunt.harvest_count
              }

              // Count current season hunts
              const huntYear = new Date(hunt.hunt_date).getFullYear()
              if (huntYear === currentYear) {
                stats.seasonHunts++
              }
            }
          }

          setLastHunts(huntMap)
          setHistoryStats(statsMap)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stands')
      } finally {
        setLoading(false)
      }
    }

    loadStandsAndHunts()
  }, [])

  // Get first few stands for preview
  const previewStands = stands.slice(0, 3)

  // Handle viewing stand details
  const handleViewStand = (stand: Stand) => {
    setViewingStand(stand)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setViewingStand(null)
  }

  const handleEditStand = (stand: Stand) => {
    alert(`Edit: ${stand.name}`)
    // In production, this would open the edit form
  }

  const handleNavigateToStand = (stand: Stand) => {
    if (stand.latitude && stand.longitude) {
      alert(`Navigate to: ${stand.name}\nCoordinates: ${stand.latitude}, ${stand.longitude}`)
      // In production, this would open maps or navigate
    }
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/management/stands"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Stand Management
          </Link>

          <div className="flex items-center gap-3">
            <Eye size={28} />
            <div>
              <h1 className="text-2xl font-bold">Stand Card Preview</h1>
              <p className="text-green-100 opacity-90">
                Compare old vs new card designs with your actual data
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
            This page shows side-by-side comparison of the <strong>existing StandCard</strong> (left)
            and the <strong>new StandCardV2</strong> (right) using your actual Stand data.
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
            <h3 className="text-red-800 font-medium">Error Loading Stands</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* List Mode (Table View) */}
        {!loading && !error && selectedMode === 'list' && (
          <div className="space-y-8">
            {/* Old Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ❌ OLD - StandCard.tsx (List Mode Not Supported)
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">
                  The original StandCard does not support list/table mode.
                </p>
              </div>
            </div>

            {/* New Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ✨ NEW - StandCardV2.tsx (List Mode - Table View)
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-morning-mist">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Stand
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-forest-shadow uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewStands.map((stand) => (
                      <StandCardV2
                        key={stand.id}
                        stand={stand}
                        mode="list"
                        onEdit={(s) => alert(`Edit: ${s.name}`)}
                        onDelete={(s) => alert(`Delete: ${s.name}`)}
                        showLocation={true}
                        showStats={true}
                        showActions={true}
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
                ❌ OLD - StandCard.tsx
              </h2>
              <div className="space-y-4">
                {previewStands.map((stand) => (
                  <StandCard
                    key={stand.id}
                    stand={stand}
                    mode={selectedMode}
                    onEdit={(s) => alert(`Edit: ${s.name}`)}
                    onDelete={(s) => alert(`Delete: ${s.name}`)}
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
                ✨ NEW - StandCardV2.tsx (Using Base Components)
              </h2>
              <div className="space-y-4">
                {previewStands.map((stand) => {
                  // Get last hunt data for this stand
                  const lastHunt = lastHunts[stand.id]
                  // Get calculated history stats for this stand
                  const stats = historyStats[stand.id]

                  return (
                    <StandCardV2
                      key={stand.id}
                      stand={stand}
                      mode={selectedMode}
                      onClick={handleViewStand}
                      onEdit={handleEditStand}
                      onDelete={(s) => alert(`Delete: ${s.name}`)}
                      showLocation={true}
                      showStats={true}
                      showActions={true}
                      // Pass dynamic history stats calculated from hunt_logs
                      historyStats={stats ? [
                        {
                          label: 'Total Harvests',
                          value: stats.totalHarvests,
                          color: 'text-burnt-orange'
                        },
                        {
                          label: `${new Date().getFullYear()} Hunts`,
                          value: stats.seasonHunts,
                          color: 'text-muted-gold'
                        },
                        {
                          label: 'All-Time Hunts',
                          value: stats.allTimeHunts,
                          color: 'text-olive-green'
                        }
                      ] : undefined}
                      // Pass last hunt data for dynamic "Last Hunted" display
                      lastActivity={lastHunt ? {
                        date: lastHunt.hunt_date,
                        timeOfDay: lastHunt.hunt_type,
                        label: 'Last Hunted'
                      } : undefined}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && stands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-weathered-wood">No stands found. Add some stands to see the preview.</p>
            <Link
              href="/management/stands"
              className="text-olive-green hover:text-pine-needle font-medium underline mt-2 inline-block"
            >
              Go to Stand Management
            </Link>
          </div>
        )}

        {/* Notes Section */}
        {!loading && !error && stands.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-forest-shadow mb-3">📝 Notes</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>New V2 cards use composable base components</strong> for consistency</li>
              <li>✅ <strong>List mode (table view) is now supported</strong> in V2</li>
              <li>✅ <strong>Clicking a card opens detail modal</strong> with all information</li>
              <li>✅ <strong>Modal has Edit and Navigate buttons</strong> matching Camera card pattern</li>
              <li>✅ <strong>Your existing Stand data</strong> is displayed correctly</li>
              <li>⚠️ <strong>No existing code modified</strong> - this is a safe preview</li>
              <li>🎯 <strong>Next step:</strong> Review and approve before switching routes</li>
            </ul>
          </div>
        )}
      </div>

      {/* Stand Detail Modal */}
      {showModal && viewingStand && (
        <StandDetailModal
          stand={viewingStand}
          onClose={handleCloseModal}
          onEdit={handleEditStand}
          onNavigate={handleNavigateToStand}
          historyStats={historyStats[viewingStand.id] ? [
            {
              label: 'Total Harvests',
              value: historyStats[viewingStand.id].totalHarvests,
              color: 'text-burnt-orange'
            },
            {
              label: `${new Date().getFullYear()} Hunts`,
              value: historyStats[viewingStand.id].seasonHunts,
              color: 'text-muted-gold'
            },
            {
              label: 'All-Time Hunts',
              value: historyStats[viewingStand.id].allTimeHunts,
              color: 'text-olive-green'
            }
          ] : undefined}
          lastActivity={lastHunts[viewingStand.id] ? {
            date: lastHunts[viewingStand.id].hunt_date,
            timeOfDay: lastHunts[viewingStand.id].hunt_type,
            label: 'Last Hunted'
          } : undefined}
        />
      )}
    </div>
  )
}
