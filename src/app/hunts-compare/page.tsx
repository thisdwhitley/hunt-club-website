// src/app/hunts-compare/page.tsx
// Demo page to compare Recent Hunts layouts: Current vs Compact mode

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { huntService, type HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import HuntCard from '@/components/hunt-logging/HuntCard'
import { formatHuntDate, getHuntTypeBadge } from '@/lib/utils/date'
import { getStandIcon } from '@/lib/utils/standUtils'
import { getIcon } from '@/lib/shared/icons'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils'
import {
  Calendar,
  Clock,
  Trophy,
  Binoculars,
  Thermometer,
  Wind,
  Moon,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function HuntsComparePage() {
  const { user } = useAuth()
  const [hunts, setHunts] = useState<HuntWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadHunts()
    }
  }, [user])

  const loadHunts = async () => {
    try {
      setLoading(true)
      const huntsData = await huntService.getHunts({})
      setHunts(huntsData.slice(0, 10)) // Take first 10 for demo
    } catch (err) {
      console.error('Error loading hunts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-weathered-wood">Please log in to view this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-weathered-wood">Loading hunts...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/hunts"
            className="inline-flex items-center text-olive-green hover:text-pine-needle mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hunts
          </Link>
          <h1 className="text-3xl font-bold text-forest-shadow mb-2">
            Layout Comparison: Recent Hunts
          </h1>
          <p className="text-weathered-wood">
            Side-by-side comparison of current layout vs compact mode
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Current Layout */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10 bg-olive-green/5">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Current Layout (Custom)
              </h2>
              <p className="text-sm text-weathered-wood mt-1">
                More visual hierarchy, detailed grid view
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hunts.map((hunt) => {
                const tempContext = getTemperatureContext(hunt)
                const StandIcon = getIcon(getStandIcon(hunt.stand?.type) as any)
                const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)

                return (
                  <div key={hunt.id} className="bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${huntTypeBadge.className}`}>
                                {huntTypeBadge.label}
                              </span>
                              <span className="font-medium text-forest-shadow">
                                {formatHuntDate(hunt.hunt_date)}
                              </span>
                            </div>
                            {(hunt.had_harvest || hunt.harvest_count > 0) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bright-orange/10 text-bright-orange">
                                <Trophy className="w-3 h-3 mr-1" />
                                Harvest
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm text-weathered-wood mb-3">
                            <div className="flex items-center">
                              <span className="font-medium mr-1">Member:</span>
                              {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'}
                            </div>
                            <div className="flex items-center">
                              <StandIcon className="w-3 h-3 mr-1" />
                              {hunt.stand?.name || 'Unknown Stand'}
                            </div>
                            {(hunt.start_time || hunt.end_time) && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {hunt.start_time || 'N/A'} - {hunt.end_time || 'N/A'}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Binoculars className="w-3 h-3 mr-1" />
                              {hunt.sightings?.length || 0} sightings
                            </div>
                          </div>

                          {tempContext.temperature !== null && (
                            <div className="flex items-center space-x-4 text-xs text-weathered-wood">
                              <div className="flex items-center">
                                <Thermometer className="w-3 h-3 mr-1 text-burnt-orange" />
                                <span className="font-medium">{tempContext.fullDisplay}</span>
                              </div>
                              {hunt.windspeed !== null && (
                                <div className="flex items-center">
                                  <Wind className="w-3 h-3 mr-1 text-dark-teal" />
                                  {hunt.windspeed} mph
                                </div>
                              )}
                              {hunt.moonphase !== null && (
                                <div className="flex items-center">
                                  <Moon className="w-3 h-3 mr-1 text-muted-gold" />
                                  {Math.round((hunt.moonphase || 0) * 100)}%
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Compact Mode */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10 bg-bright-orange/5">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Compact Mode
              </h2>
              <p className="text-sm text-weathered-wood mt-1">
                Single-line view, more hunts visible at once
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hunts.map((hunt) => (
                <HuntCard
                  key={hunt.id}
                  hunt={hunt}
                  mode="compact"
                  showActions={false}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Notes */}
        <div className="mt-6 bg-white rounded-lg club-shadow p-6">
          <h3 className="text-lg font-semibold text-forest-shadow mb-4">
            Comparison Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-forest-shadow mb-2">Current Layout</h4>
              <ul className="space-y-2 text-sm text-weathered-wood">
                <li>✅ More visual hierarchy and spacing</li>
                <li>✅ Easier to scan for specific details</li>
                <li>✅ Weather info prominently displayed</li>
                <li>✅ Grid format for member/stand/time/sightings</li>
                <li>⚠️ Takes more vertical space (~10 hunts)</li>
                <li>⚠️ Custom rendering (not using HuntCard)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-forest-shadow mb-2">Compact Mode</h4>
              <ul className="space-y-2 text-sm text-weathered-wood">
                <li>✅ Very space-efficient (15-20 hunts visible)</li>
                <li>✅ Quick scanning of key info</li>
                <li>✅ Consistent with Data Management styles</li>
                <li>✅ Uses HuntCard component (better consistency)</li>
                <li>✅ All recent improvements (badges, icons)</li>
                <li>⚠️ Less detailed weather info</li>
                <li>⚠️ Might feel cramped for dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
