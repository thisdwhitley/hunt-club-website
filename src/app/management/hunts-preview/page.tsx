'use client'

// src/app/management/hunts-preview/page.tsx
// Preview page to compare old HuntCard vs new HuntCardV2

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, X as XIcon, Calendar, User, Clock, Timer, Target, CloudSun, Thermometer, Wind, Moon, Info, Trophy, Binoculars, AlertCircle, Edit3 } from 'lucide-react'
import Link from 'next/link'
import HuntCard from '@/components/hunt-logging/HuntCard'
import HuntCardV2 from '@/components/hunt-logging/HuntCardV2'
import { HuntService, HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { getIcon } from '@/lib/shared/icons'
import { getStandIcon } from '@/lib/utils/standUtils'
import { getTemperatureContext, getPrimaryTemperatureExplanation } from '@/lib/hunt-logging/temperature-utils'
import { formatHuntDate } from '@/lib/utils/date'

export default function HuntsPreviewPage() {
  const [hunts, setHunts] = useState<HuntWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'full' | 'compact' | 'list'>('full')
  const [viewingHunt, setViewingHunt] = useState<HuntWithDetails | null>(null)
  const [showModal, setShowModal] = useState(false)

  const huntService = new HuntService()

  // Load recent hunts
  useEffect(() => {
    const loadHunts = async () => {
      try {
        setLoading(true)

        // Use HuntService to get recent hunts (no filters = all hunts)
        const data = await huntService.getHunts()

        // Take only the 5 most recent
        setHunts(data.slice(0, 5))
      } catch (err) {
        console.error('Error loading hunts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hunts')
      } finally {
        setLoading(false)
      }
    }

    loadHunts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get first few hunts for preview
  const previewHunts = hunts.slice(0, 3)

  // Handle view hunt
  const handleViewHunt = (hunt: HuntWithDetails) => {
    setViewingHunt(hunt)
    setShowModal(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setViewingHunt(null)
  }

  // Handle edit hunt
  const handleEditHunt = (hunt: HuntWithDetails) => {
    alert(`Edit hunt: ${hunt.id}\n\nNote: Full edit functionality will be implemented when this card system is integrated into the main hunt management page.`)
  }

  // Helper functions for modal
  const formatTime = (time: string | null) => {
    if (!time) return 'N/A'
    return time.slice(0, 5)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getMoonPhaseDisplay = (phase: number | null) => {
    if (phase === null) return 'Unknown'
    const phaseNames = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
    const index = Math.round(phase * 8) % 8
    return phaseNames[index]
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/management/hunts"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Hunt Management
          </Link>

          <div className="flex items-center gap-3">
            <Eye size={28} />
            <div>
              <h1 className="text-2xl font-bold">Hunt Card Preview</h1>
              <p className="text-green-100 opacity-90">
                Compare old vs new card designs with your actual hunt data
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
            This page shows side-by-side comparison of the <strong>existing HuntCard</strong> (left)
            and the <strong>new HuntCardV2</strong> (right) using your actual Hunt data.
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
              List Mode
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
            <h3 className="text-red-800 font-medium">Error Loading Hunts</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Card Comparison */}
        {!loading && !error && previewHunts.length > 0 && (
          <>
            {/* List Mode - Tables */}
            {selectedMode === 'list' ? (
              <div className="space-y-8">
                {/* Old Version Table */}
                <div>
                  <h2 className="text-lg font-bold text-forest-shadow mb-3">
                    ❌ OLD - HuntCard.tsx (List Mode)
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stand</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weather/Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewHunts.map((hunt) => (
                          <HuntCard
                            key={hunt.id}
                            hunt={hunt}
                            mode="list"
                            onEdit={(h) => alert(`Edit: ${h.id}`)}
                            onView={handleViewHunt}
                            onDelete={(id) => alert(`Delete: ${id}`)}
                            showActions={true}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* New Version Table */}
                <div>
                  <h2 className="text-lg font-bold text-forest-shadow mb-3">
                    ✨ NEW - HuntCardV2.tsx (List Mode - Using Composable Card System)
                  </h2>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hunter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stand</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weather</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewHunts.map((hunt) => (
                          <HuntCardV2
                            key={hunt.id}
                            hunt={hunt}
                            mode="list"
                            onClick={handleViewHunt}
                            onEdit={(h) => alert(`Edit: ${h.id}`)}
                            onDelete={(id) => alert(`Delete: ${id}`)}
                            showActions={true}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Full/Compact Mode - Side by Side Cards */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Old Version */}
                <div>
                  <h2 className="text-lg font-bold text-forest-shadow mb-3">
                    ❌ OLD - HuntCard.tsx
                  </h2>
                  <div className="space-y-4">
                    {previewHunts.map((hunt) => (
                      <HuntCard
                        key={hunt.id}
                        hunt={hunt}
                        mode={selectedMode}
                        onEdit={(h) => alert(`Edit: ${h.id}`)}
                        onView={handleViewHunt}
                        onDelete={(id) => alert(`Delete: ${id}`)}
                        showActions={true}
                      />
                    ))}
                  </div>
                </div>

                {/* New Version */}
                <div>
                  <h2 className="text-lg font-bold text-forest-shadow mb-3">
                    ✨ NEW - HuntCardV2.tsx (Using Composable Card System)
                  </h2>
                  <div className="space-y-4">
                    {previewHunts.map((hunt) => (
                      <HuntCardV2
                        key={hunt.id}
                        hunt={hunt}
                        mode={selectedMode}
                        onClick={handleViewHunt}
                        onEdit={(h) => alert(`Edit: ${h.id}`)}
                        onDelete={(id) => alert(`Delete: ${id}`)}
                        showActions={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Data */}
        {!loading && !error && hunts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-weathered-wood">No hunts found. Log some hunts to see the preview.</p>
            <Link
              href="/hunt-logging"
              className="text-olive-green hover:text-pine-needle font-medium underline mt-2 inline-block"
            >
              Go to Hunt Logging
            </Link>
          </div>
        )}

        {/* Notes Section */}
        {!loading && !error && hunts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-forest-shadow mb-3">📝 Notes</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ <strong>New V2 cards use composable base components</strong> (BaseCard, CardHeader)</li>
              <li>✅ <strong>Three modes available:</strong> Full (desktop grid), Compact (mobile), List (table rows)</li>
              <li>✅ <strong>Badges are integrated into header</strong> with consistent styling</li>
              <li>✅ <strong>Action buttons match the same color scheme</strong> as Stand cards</li>
              <li>✅ <strong>Weather and time sections use consistent box styling</strong></li>
              <li>✅ <strong>Your existing Hunt data</strong> is displayed correctly</li>
              <li>⚠️ <strong>No existing code modified</strong> - this is a safe preview</li>
              <li>🎯 <strong>This demonstrates:</strong> How the composable card system can standardize Hunt, Stand, and Camera cards</li>
            </ul>
          </div>
        )}
      </div>

      {/* Hunt Details Modal - Matches StandDetailModal appearance */}
      {showModal && viewingHunt && (() => {
        const tempContext = getTemperatureContext(viewingHunt)
        const primaryTemp = getPrimaryTemperatureExplanation(viewingHunt)
        const StandIcon = getIcon(getStandIcon(viewingHunt.stand?.type) as any)
        const huntTypeBadge = viewingHunt.hunt_type === 'AM' ? 'Morning Hunt' : viewingHunt.hunt_type === 'PM' ? 'Evening Hunt' : 'All Day Hunt'

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header - Matches StandDetailModal */}
              <div className="bg-olive-green text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{formatHuntDate(viewingHunt.hunt_date)}</h2>
                    <p className="text-green-100 opacity-90">{huntTypeBadge}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditHunt(viewingHunt)}
                    className="p-2 hover:bg-pine-needle rounded-lg transition-colors flex items-center gap-2"
                    title="Edit Hunt"
                  >
                    <Edit3 size={18} />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-pine-needle rounded-lg transition-colors"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Hunt Notes at top if exists */}
                  {viewingHunt.notes && (
                    <div className="bg-morning-mist rounded-lg p-4">
                      <p className="text-forest-shadow italic">"{viewingHunt.notes}"</p>
                    </div>
                  )}

                  {/* Hunt Details Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-olive-green">
                      <Target size={20} />
                      Hunt Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Hunter */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hunter</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <User size={16} className="text-olive-green" />
                          {viewingHunt.member?.display_name || viewingHunt.member?.full_name || 'Unknown'}
                        </p>
                      </div>

                      {/* Stand */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">Stand</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <StandIcon size={16} className="text-olive-green" />
                          {viewingHunt.stand?.name || 'Unknown Stand'}
                        </p>
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Time</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <Clock size={16} className="text-olive-green" />
                          {formatTime(viewingHunt.start_time)}
                        </p>
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Time</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <Clock size={16} className="text-olive-green" />
                          {formatTime(viewingHunt.end_time)}
                        </p>
                      </div>

                      {/* Duration */}
                      {viewingHunt.hunt_duration_minutes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Duration</label>
                          <p className="text-gray-900 flex items-center gap-2">
                            <Timer size={16} className="text-olive-green" />
                            {formatDuration(viewingHunt.hunt_duration_minutes)}
                          </p>
                        </div>
                      )}

                      {/* Hunting Season */}
                      {viewingHunt.hunting_season && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Season</label>
                          <p className="text-gray-900">{viewingHunt.hunting_season}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weather Conditions Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-olive-green">
                      <CloudSun size={20} />
                      Weather Conditions
                    </h3>

                    {viewingHunt.has_weather_data ? (
                      <div className="space-y-4">
                        {/* Primary Temperature Highlight */}
                        {tempContext.temperature !== null && (
                          <div className="bg-burnt-orange/10 border border-burnt-orange/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center text-forest-shadow font-medium">
                                <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                                Primary Hunt Temperature:
                              </span>
                              <span className="text-lg font-bold text-burnt-orange">
                                {tempContext.fullDisplay}
                              </span>
                            </div>
                            <div className="flex items-start text-xs text-forest-shadow">
                              <Info className="w-3 h-3 mr-1 mt-0.5 text-burnt-orange flex-shrink-0" />
                              <span>{primaryTemp.explanation}</span>
                            </div>
                          </div>
                        )}

                        {/* Detailed Temperature Data */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-forest-shadow">All Temperature Data</h4>

                          {viewingHunt.temp_dawn !== null && (
                            <div className={`flex items-center justify-between p-2 rounded ${tempContext.context === 'dawn' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'}`}>
                              <span className={`flex items-center text-forest-shadow ${tempContext.context === 'dawn' ? 'font-bold' : ''}`}>
                                <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                                Dawn Temperature:
                                {tempContext.context === 'dawn' && <span className="ml-2 text-xs text-burnt-orange">(Primary)</span>}
                              </span>
                              <span className={`font-medium text-weathered-wood ${tempContext.context === 'dawn' ? 'text-burnt-orange font-bold' : ''}`}>
                                {viewingHunt.temp_dawn}°F
                              </span>
                            </div>
                          )}

                          {viewingHunt.temp_dusk !== null && (
                            <div className={`flex items-center justify-between p-2 rounded ${tempContext.context === 'dusk' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'}`}>
                              <span className={`flex items-center text-forest-shadow ${tempContext.context === 'dusk' ? 'font-bold' : ''}`}>
                                <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                                Dusk Temperature:
                                {tempContext.context === 'dusk' && <span className="ml-2 text-xs text-burnt-orange">(Primary)</span>}
                              </span>
                              <span className={`font-medium text-weathered-wood ${tempContext.context === 'dusk' ? 'text-burnt-orange font-bold' : ''}`}>
                                {viewingHunt.temp_dusk}°F
                              </span>
                            </div>
                          )}

                          {viewingHunt.daily_high !== null && viewingHunt.daily_low !== null && (
                            <div className={`flex items-center justify-between p-2 rounded ${tempContext.context === 'average' ? 'bg-burnt-orange/10 border border-burnt-orange/20' : 'bg-white'}`}>
                              <span className={`flex items-center text-forest-shadow ${tempContext.context === 'average' ? 'font-bold' : ''}`}>
                                <Thermometer className="w-4 h-4 mr-2 text-burnt-orange" />
                                Daily Range:
                                {tempContext.context === 'average' && <span className="ml-2 text-xs text-burnt-orange">(Primary: Avg)</span>}
                              </span>
                              <span className={`font-medium text-weathered-wood ${tempContext.context === 'average' ? 'text-burnt-orange font-bold' : ''}`}>
                                {viewingHunt.daily_low}°F - {viewingHunt.daily_high}°F
                                {tempContext.context === 'average' && (
                                  <span className="ml-2 text-sm">
                                    (Avg: {Math.round((viewingHunt.daily_high + viewingHunt.daily_low) / 2)}°F)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Other Weather Data */}
                        <div className="border-t border-weathered-wood/20 pt-3 space-y-2">
                          {viewingHunt.wind_speed !== null && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center text-forest-shadow">
                                <Wind className="w-4 h-4 mr-2 text-dark-teal" />
                                Wind:
                              </span>
                              <span className="font-medium text-weathered-wood">
                                {viewingHunt.wind_speed} mph {viewingHunt.wind_direction ? `${viewingHunt.wind_direction}°` : ''}
                              </span>
                            </div>
                          )}

                          {viewingHunt.precipitation !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-forest-shadow">Precipitation:</span>
                              <span className="font-medium text-weathered-wood">{viewingHunt.precipitation}"</span>
                            </div>
                          )}

                          {viewingHunt.moon_illumination !== null && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center text-forest-shadow">
                                <Moon className="w-4 h-4 mr-2 text-muted-gold" />
                                Moon Phase:
                              </span>
                              <span className="font-medium text-weathered-wood">
                                {getMoonPhaseDisplay(viewingHunt.moon_illumination)}
                              </span>
                            </div>
                          )}

                          {viewingHunt.sunrise_time && viewingHunt.sunset_time && (
                            <div className="flex items-center justify-between">
                              <span className="text-forest-shadow">Sun Times:</span>
                              <span className="font-medium text-weathered-wood">
                                {formatTime(viewingHunt.sunrise_time)} - {formatTime(viewingHunt.sunset_time)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 bg-morning-mist rounded-lg">
                        <AlertCircle className="w-8 h-8 text-weathered-wood/50 mr-3" />
                        <span className="text-weathered-wood">No weather data available for this date</span>
                      </div>
                    )}
                  </div>

                  {/* Harvest Information */}
                  {(viewingHunt.had_harvest || viewingHunt.harvest_count > 0) && viewingHunt.harvests && viewingHunt.harvests.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-olive-green">
                        <Trophy size={20} />
                        Harvest Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewingHunt.harvests.map((harvest, index) => (
                          <div key={harvest.id} className="bg-bright-orange/5 border border-bright-orange/20 rounded-lg p-4">
                            <h4 className="font-medium text-forest-shadow mb-3">
                              Harvest #{index + 1}: {harvest.animal_type}
                            </h4>
                            <div className="space-y-2 text-sm">
                              {harvest.gender && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Gender:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.gender}</span>
                                </div>
                              )}
                              {harvest.estimated_age && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Estimated Age:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.estimated_age}</span>
                                </div>
                              )}
                              {harvest.estimated_weight && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Weight:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.estimated_weight} lbs</span>
                                </div>
                              )}
                              {harvest.shot_distance_yards && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Shot Distance:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.shot_distance_yards} yards</span>
                                </div>
                              )}
                              {harvest.weapon_used && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Weapon:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.weapon_used}</span>
                                </div>
                              )}
                              {harvest.antler_points && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Antler Points:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.antler_points}</span>
                                </div>
                              )}
                              {harvest.processor_name && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Processor:</span>
                                  <span className="font-medium text-forest-shadow">{harvest.processor_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sightings Information */}
                  {viewingHunt.sightings && viewingHunt.sightings.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-olive-green">
                        <Binoculars size={20} />
                        Sightings ({viewingHunt.sightings.length})
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {viewingHunt.sightings.map((sighting) => (
                          <div key={sighting.id} className="bg-olive-green/5 border border-olive-green/20 rounded-lg p-4">
                            <h4 className="font-medium text-forest-shadow mb-3">
                              {sighting.animal_type} {sighting.count && sighting.count > 1 ? `(${sighting.count})` : ''}
                            </h4>
                            <div className="space-y-2 text-sm">
                              {sighting.gender && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Gender:</span>
                                  <span className="font-medium text-forest-shadow">{sighting.gender}</span>
                                </div>
                              )}
                              {sighting.behavior && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Behavior:</span>
                                  <span className="font-medium text-forest-shadow">{sighting.behavior}</span>
                                </div>
                              )}
                              {sighting.distance_yards && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Distance:</span>
                                  <span className="font-medium text-forest-shadow">{sighting.distance_yards} yards</span>
                                </div>
                              )}
                              {sighting.direction && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Direction:</span>
                                  <span className="font-medium text-forest-shadow">{sighting.direction}</span>
                                </div>
                              )}
                              {sighting.time_observed && (
                                <div className="flex justify-between">
                                  <span className="text-weathered-wood">Time:</span>
                                  <span className="font-medium text-forest-shadow">{sighting.time_observed}</span>
                                </div>
                              )}
                              {sighting.notes && (
                                <div className="mt-2">
                                  <span className="text-weathered-wood">Notes:</span>
                                  <p className="text-forest-shadow italic mt-1">"{sighting.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Record Information */}
                  <div className="border-t border-weathered-wood/20 pt-4">
                    <h3 className="text-lg font-semibold mb-3 text-olive-green">Record Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-weathered-wood">Created:</span>
                        <span className="ml-2 font-medium text-forest-shadow">
                          {formatHuntDate(viewingHunt.created_at, { style: 'full' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-weathered-wood">Last Updated:</span>
                        <span className="ml-2 font-medium text-forest-shadow">
                          {formatHuntDate(viewingHunt.updated_at, { style: 'full' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
