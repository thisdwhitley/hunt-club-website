// src/app/hunts-badge-demo/page.tsx
// Demo page to compare different compact hunt card badge layouts

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { huntService, type HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import { formatHuntDate, getHuntTypeBadge, formatTime } from '@/lib/utils/date'
import { getStandIcon } from '@/lib/utils/standUtils'
import { getIcon } from '@/lib/shared/icons'
import { getTemperatureContext } from '@/lib/hunt-logging/temperature-utils'
import {
  Trophy,
  Binoculars,
  Thermometer,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function HuntsBadgeDemoPage() {
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
      setHunts(huntsData.slice(0, 5)) // Take first 5 for demo
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

  // Helper function to extract date parts
  const getDateParts = (dateString: string) => {
    const date = new Date(dateString)
    return {
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      monthNumber: String(date.getMonth() + 1).padStart(2, '0'),
      dayNumberPadded: String(date.getDate()).padStart(2, '0'),
      fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  // Badge size matching CameraCard (32px x 32px)
  const standardBadgeStyle = {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    backgroundColor: 'rgba(12, 71, 103, 0.15)',
    color: '#0C4767',
    flexShrink: 0
  }

  const largeBadgeStyle = {
    ...standardBadgeStyle,
    width: '56px',
    height: '56px',
    flexDirection: 'column' as const,
    gap: '2px',
    padding: '4px'
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      <div className="max-w-[1600px] mx-auto p-6">
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
            Compact Hunt Card Badge Options
          </h1>
          <p className="text-weathered-wood">
            Comparing different badge layouts for compact hunt cards (inspired by CameraCard)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option A: Larger Badge with Stacked Info */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10 bg-bright-orange/5">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Option A: Larger Badge (56px)
              </h2>
              <p className="text-sm text-weathered-wood mt-1">
                Day/Date/Type stacked in larger badge
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hunts.map((hunt) => {
                const tempContext = getTemperatureContext(hunt)
                const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)
                const dateParts = getDateParts(hunt.hunt_date)

                return (
                  <div key={hunt.id} className="bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow p-3">
                    <div className="flex items-center gap-3">
                      {/* Large badge with stacked info */}
                      <div
                        style={{
                          ...largeBadgeStyle,
                          backgroundColor: `${huntTypeBadge.className.includes('bright-orange') ? '#FA7921' : huntTypeBadge.className.includes('clay-earth') ? '#8B7355' : '#566E3D'}20`
                        }}
                      >
                        <span className="text-[9px] font-semibold" style={{ color: '#2D3E1F' }}>
                          {dateParts.dayOfWeek}
                        </span>
                        <span className="text-[20px] font-bold" style={{ color: '#2D3E1F' }}>
                          {dateParts.dayNumber}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${huntTypeBadge.className}`}>
                          {huntTypeBadge.label}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-olive-green truncate">
                          {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'} - {hunt.stand?.name || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-weathered-wood mt-1">
                          {tempContext.temperature !== null && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-burnt-orange" />
                              <span>{tempContext.temperature}°</span>
                            </div>
                          )}
                          {(hunt.sightings?.length || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Binoculars className="w-3 h-3 text-dark-teal" />
                              <span>{hunt.sightings?.length}</span>
                            </div>
                          )}
                          {(hunt.had_harvest || hunt.harvest_count > 0) && (
                            <Trophy className="w-3 h-3 text-bright-orange" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Option B: Colored Background Badge */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10 bg-clay-earth/5">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Option B: Colored Badge (48px)
              </h2>
              <p className="text-sm text-weathered-wood mt-1">
                Hunt type color as background, white text with month
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hunts.map((hunt) => {
                const tempContext = getTemperatureContext(hunt)
                const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)
                const dateParts = getDateParts(hunt.hunt_date)

                const getBadgeColor = () => {
                  if (huntTypeBadge.className.includes('bright-orange')) return '#FA7921'
                  if (huntTypeBadge.className.includes('clay-earth')) return '#8B7355'
                  return '#566E3D'
                }

                return (
                  <div key={hunt.id} className="bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow p-3">
                    <div className="flex items-center gap-3">
                      {/* Colored badge */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          width: '48px',
                          height: '48px',
                          borderRadius: '6px',
                          backgroundColor: getBadgeColor(),
                          color: 'white',
                          flexShrink: 0,
                          gap: '0px',
                          padding: '4px'
                        }}
                      >
                        <span className="text-[8px] font-semibold opacity-90">
                          {dateParts.dayOfWeek}
                        </span>
                        <span className="text-[9px] font-semibold opacity-90 leading-none">
                          {dateParts.month}
                        </span>
                        <span className="text-[16px] font-bold leading-none">
                          {dateParts.dayNumber}
                        </span>
                        <span className="text-[8px] font-bold opacity-90">
                          {huntTypeBadge.label}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-olive-green truncate">
                          {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'} - {hunt.stand?.name || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-weathered-wood mt-1">
                          {tempContext.temperature !== null && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-burnt-orange" />
                              <span>{tempContext.temperature}°</span>
                            </div>
                          )}
                          {(hunt.sightings?.length || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Binoculars className="w-3 h-3 text-dark-teal" />
                              <span>{hunt.sightings?.length}</span>
                            </div>
                          )}
                          {(hunt.had_harvest || hunt.harvest_count > 0) && (
                            <Trophy className="w-3 h-3 text-bright-orange" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Option C: Standard Badge (32px) - Date Number Only */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10 bg-olive-green/5">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Option C: Standard Badge + Text (32px)
              </h2>
              <p className="text-sm text-weathered-wood mt-1">
                Date number in badge, day + hunt type next to name
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hunts.map((hunt) => {
                const tempContext = getTemperatureContext(hunt)
                const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)
                const dateParts = getDateParts(hunt.hunt_date)

                return (
                  <div key={hunt.id} className="bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow p-3">
                    <div className="flex items-center gap-3">
                      {/* Standard badge with just date number */}
                      <div style={standardBadgeStyle}>
                        <span>{dateParts.dayNumber}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-olive-green truncate">
                            {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'} - {hunt.stand?.name || 'Unknown'}
                          </h3>
                          <span className="text-xs text-weathered-wood">
                            {dateParts.dayOfWeek}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${huntTypeBadge.className}`}>
                            {huntTypeBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-weathered-wood">
                          {tempContext.temperature !== null && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-burnt-orange" />
                              <span>{tempContext.temperature}°</span>
                            </div>
                          )}
                          {(hunt.sightings?.length || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Binoculars className="w-3 h-3 text-dark-teal" />
                              <span>{hunt.sightings?.length}</span>
                            </div>
                          )}
                          {(hunt.had_harvest || hunt.harvest_count > 0) && (
                            <Trophy className="w-3 h-3 text-bright-orange" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Option D: User's Request - MM/DD format in badge */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-4 border-b border-weathered-wood/10 bg-dark-teal/5">
              <h2 className="text-lg font-semibold text-forest-shadow">
                Option D: Colored MM/DD Badge (32px)
              </h2>
              <p className="text-sm text-weathered-wood mt-1">
                Colored badge with date, 2-line layout with all info on second line
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hunts.map((hunt) => {
                const tempContext = getTemperatureContext(hunt)
                const huntTypeBadge = getHuntTypeBadge(hunt.hunt_type)
                const dateParts = getDateParts(hunt.hunt_date)

                const getBadgeColor = () => {
                  if (huntTypeBadge.className.includes('bright-orange')) return '#FA7921'
                  if (huntTypeBadge.className.includes('clay-earth')) return '#8B7355'
                  return '#566E3D'
                }

                // Abbreviate stand name if needed
                const abbreviateStand = (standName: string) => {
                  if (standName.length <= 12) return standName
                  return standName.substring(0, 10) + '...'
                }

                return (
                  <div key={hunt.id} className="bg-white rounded-lg club-shadow hover:shadow-lg transition-shadow p-3">
                    <div className="flex items-center gap-3">
                      {/* Badge with MM/DD and hunt type color */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: getBadgeColor(),
                          color: 'white',
                          flexShrink: 0,
                          fontSize: '11px',
                          fontWeight: 'bold',
                          letterSpacing: '-0.5px'
                        }}
                      >
                        <span>{dateParts.monthNumber}/{dateParts.dayNumberPadded}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Line 1: Hunter - Stand */}
                        <h3 className="text-base font-bold text-olive-green truncate">
                          {hunt.member?.display_name || hunt.member?.full_name || 'Unknown'} - {abbreviateStand(hunt.stand?.name || 'Unknown')}
                        </h3>
                        {/* Line 2: AM/PM badge, Day, Month Date, Temp, Sightings, Harvest */}
                        <div className="flex items-center gap-2 text-xs text-weathered-wood">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${huntTypeBadge.className}`}>
                            {huntTypeBadge.label}
                          </span>
                          <span className="text-[11px]">{dateParts.fullDate}</span>
                          {tempContext.temperature !== null && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-burnt-orange" />
                              <span>{tempContext.temperature}°</span>
                            </div>
                          )}
                          {(hunt.sightings?.length || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Binoculars className="w-3 h-3 text-dark-teal" />
                              <span>{hunt.sightings?.length}</span>
                            </div>
                          )}
                          {(hunt.had_harvest || hunt.harvest_count > 0) && (
                            <Trophy className="w-3 h-3 text-bright-orange" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Comparison Notes */}
        <div className="mt-6 bg-white rounded-lg club-shadow p-6">
          <h3 className="text-lg font-semibold text-forest-shadow mb-4">
            Comparison Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium text-forest-shadow mb-2">Option A: Larger Badge</h4>
              <ul className="space-y-2 text-sm text-weathered-wood">
                <li>✅ All info visible in badge</li>
                <li>✅ Quick visual scanning</li>
                <li>✅ Stand name on same line as hunter</li>
                <li>⚠️ Larger than camera cards (56px vs 32px)</li>
                <li>⚠️ Takes more horizontal space</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-forest-shadow mb-2">Option B: Colored Badge</h4>
              <ul className="space-y-2 text-sm text-weathered-wood">
                <li>✅ Instant AM/PM/ALL recognition by color</li>
                <li>✅ All info in badge (now with month!)</li>
                <li>✅ Visually striking</li>
                <li>✅ Stand name on same line as hunter</li>
                <li>⚠️ Slightly larger (48px)</li>
                <li>⚠️ Lots of text in small space</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-forest-shadow mb-2">Option C: Standard + Text</h4>
              <ul className="space-y-2 text-sm text-weathered-wood">
                <li>✅ Matches camera card size (32px)</li>
                <li>✅ Clean, minimal badge</li>
                <li>✅ Info integrated with name</li>
                <li>✅ Stand name on same line as hunter</li>
                <li>⚠️ More reading required</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-forest-shadow mb-2">Option D: Colored MM/DD Badge</h4>
              <ul className="space-y-2 text-sm text-weathered-wood">
                <li>✅ Matches camera card size (32px)</li>
                <li>✅ Date format familiar (10/25)</li>
                <li>✅ Colored badge shows AM/PM at a glance</li>
                <li>✅ All info on 2 compact lines</li>
                <li>✅ Stand name abbreviated if needed</li>
                <li>✅ Cleanest, most compact layout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
