'use client'

// src/app/management/hunts/page.tsx
// Hunt Data Management page - consistent with /management/stands and /management/cameras pattern

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { huntService, type HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import HuntDataManagement from '@/components/hunt-logging/HuntDataManagement'
import { ArrowLeft, RefreshCw, Download } from 'lucide-react'
import Link from 'next/link'

export default function HuntManagementPage() {
  const { user } = useAuth()
  const [hunts, setHunts] = useState<HuntWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load hunts data
  const loadHunts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await huntService.getHunts({})
      setHunts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hunts')
      console.error('Error loading hunts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load on mount
  useEffect(() => {
    if (user) {
      loadHunts()
    }
  }, [user])

  // Handlers for hunt operations
  const handleHuntUpdate = () => {
    loadHunts() // Reload data after update
  }

  const handleHuntDelete = () => {
    loadHunts() // Reload data after delete
  }

  // Export hunt data to CSV
  const exportHuntData = () => {
    if (hunts.length === 0) return

    // CSV headers
    const headers = ['Date', 'Member', 'Stand', 'Hunt Type', 'Start Time', 'End Time', 'Duration (min)', 'Temperature', 'Wind Speed', 'Moon Phase', 'Sightings', 'Harvest', 'Game Type', 'Notes']

    // CSV rows
    const rows = hunts.map(hunt => [
      hunt.hunt_date,
      hunt.member?.display_name || hunt.member?.full_name || '',
      hunt.stand?.name || '',
      hunt.hunt_type || '',
      hunt.start_time || '',
      hunt.end_time || '',
      hunt.hunt_duration_minutes || '',
      hunt.temperature || '',
      hunt.windspeed || '',
      hunt.moonphase || '',
      hunt.sightings?.length || 0,
      hunt.had_harvest || hunt.harvest_count > 0 ? 'Yes' : 'No',
      hunt.game_type || '',
      hunt.notes || ''
    ])

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `hunt-data-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-morning-mist">
        <div className="bg-white rounded-lg club-shadow p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-forest-shadow mb-4">
            Authentication Required
          </h2>
          <p className="text-weathered-wood mb-6">
            Please log in to access hunt data management.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-olive-green hover:text-pine-needle"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-morning-mist">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-olive-green animate-spin mx-auto mb-4" />
          <p className="text-weathered-wood">Loading hunt data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-morning-mist">
        <div className="bg-white rounded-lg club-shadow p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-clay-earth mb-4">
            Error Loading Data
          </h2>
          <p className="text-weathered-wood mb-6">{error}</p>
          <button
            onClick={loadHunts}
            className="inline-flex items-center px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Hunt Data Management</h1>
              <p className="text-green-100 mt-1">
                Manage all hunt logs, filter by member, stand, or date range
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportHuntData}
                disabled={loading || hunts.length === 0}
                className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium disabled:opacity-50"
                title="Export hunt data to CSV"
              >
                <Download size={20} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={loadHunts}
                className="p-2 rounded-lg border-2 border-white/30 hover:bg-pine-needle hover:border-white transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HuntDataManagement
          hunts={hunts}
          onHuntUpdate={handleHuntUpdate}
          onHuntDelete={handleHuntDelete}
        />
      </div>
    </div>
  )
}
