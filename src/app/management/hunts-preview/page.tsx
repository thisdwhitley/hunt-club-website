'use client'

// src/app/management/hunts-preview/page.tsx
// Preview page to compare old HuntCard vs new HuntCardV2

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import HuntCard from '@/components/hunt-logging/HuntCard'
import HuntCardV2 from '@/components/hunt-logging/HuntCardV2'
import { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'

export default function HuntsPreviewPage() {
  const [hunts, setHunts] = useState<HuntWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'full' | 'compact'>('full')

  const supabase = createClient()

  // Load recent hunts
  useEffect(() => {
    const loadHunts = async () => {
      try {
        setLoading(true)

        // Query recent hunts with related data
        const { data, error: huntsError } = await supabase
          .from('hunt_logs')
          .select(`
            *,
            member:members!hunt_logs_member_id_fkey (
              id,
              email,
              full_name,
              display_name
            ),
            stand:stands!hunt_logs_stand_id_fkey (
              id,
              name,
              type,
              latitude,
              longitude
            ),
            sightings:sightings (
              id,
              animal_type,
              count,
              notes
            )
          `)
          .order('hunt_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5)

        if (huntsError) throw huntsError

        setHunts((data as HuntWithDetails[]) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hunts')
      } finally {
        setLoading(false)
      }
    }

    loadHunts()
  }, [supabase])

  // Get first few hunts for preview
  const previewHunts = hunts.slice(0, 3)

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
          </div>
          <p className="text-xs text-weathered-wood mt-2">
            Note: List/table mode is not included in this preview as it requires full page context.
          </p>
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
                    onView={(h) => alert(`View: ${h.id}`)}
                    onDelete={(id) => alert(`Delete: ${id}`)}
                    showActions={true}
                  />
                ))}
              </div>
            </div>

            {/* New Version */}
            <div>
              <h2 className="text-lg font-bold text-forest-shadow mb-3">
                ✨ NEW - HuntCardV2.tsx (Using Universal Card System)
              </h2>
              <div className="space-y-4">
                {previewHunts.map((hunt) => (
                  <HuntCardV2
                    key={hunt.id}
                    hunt={hunt}
                    mode={selectedMode}
                    onClick={(h) => alert(`View: ${h.id}`)}
                    onEdit={(h) => alert(`Edit: ${h.id}`)}
                    onDelete={(id) => alert(`Delete: ${id}`)}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          </div>
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
              <li>✅ <strong>New V2 cards use universal base components</strong> (BaseCard, CardHeader)</li>
              <li>✅ <strong>Badges are integrated into header</strong> with consistent styling</li>
              <li>✅ <strong>Action buttons match the same color scheme</strong> as Stand cards</li>
              <li>✅ <strong>Weather and time sections use consistent box styling</strong></li>
              <li>✅ <strong>Your existing Hunt data</strong> is displayed correctly</li>
              <li>⚠️ <strong>No existing code modified</strong> - this is a safe preview</li>
              <li>🎯 <strong>This demonstrates:</strong> How the universal card system can standardize Hunt, Stand, and Camera cards</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
