// src/hooks/useHuntModals.tsx
// Custom hooks for managing hunt modal states

'use client'

import { useState } from 'react'
import { HuntDetailsModal } from '@/components/hunt-logging/HuntDetailsModal'
import { HuntListModal } from '@/components/hunt-logging/HuntListModal'
import type { HuntFilters } from '@/lib/hunt-logging/hunt-service'

interface HuntModalState {
  showList: boolean
  showDetails: boolean
  selectedHuntId: string | null
  listTitle: string
  listFilters: HuntFilters
}

export function useHuntModals() {
  const [modalState, setModalState] = useState<HuntModalState>({
    showList: false,
    showDetails: false,
    selectedHuntId: null,
    listTitle: '',
    listFilters: {}
  })

  const showHuntList = (title: string, filters: HuntFilters = {}) => {
    setModalState({
      showList: true,
      showDetails: false,
      selectedHuntId: null,
      listTitle: title,
      listFilters: filters
    })
  }

  const showHuntDetails = (huntId: string) => {
    setModalState(prev => ({
      ...prev,
      showDetails: true,
      selectedHuntId: huntId,
      showList: false
    }))
  }

  const closeModals = () => {
    setModalState({
      showList: false,
      showDetails: false,
      selectedHuntId: null,
      listTitle: '',
      listFilters: {}
    })
  }

  const handleHuntSelect = (huntId: string) => {
    showHuntDetails(huntId)
  }

  // Pre-configured modal openers for common use cases
  const showAllHunts = () => {
    showHuntList('All Hunts', {})
  }

  const showSuccessfulHunts = () => {
    showHuntList('Successful Hunts', { had_harvest: true })
  }

  const showUnsuccessfulHunts = () => {
    showHuntList('Hunts Without Harvest', { had_harvest: false })
  }

  const showRecentHunts = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    showHuntList('Recent Hunts (Last 30 Days)', {
      date_from: thirtyDaysAgo.toISOString().split('T')[0]
    })
  }

  const showThisSeasonHunts = () => {
    const currentYear = new Date().getFullYear()
    const seasonStart = `${currentYear}-08-01` // Adjust based on your season
    showHuntList('This Season\'s Hunts', {
      date_from: seasonStart
    })
  }

  const showHuntsWithSightings = () => {
    // Note: This would require a custom filter in the hunt service
    // For now, we'll show all hunts and let the user filter
    showHuntList('Hunts with Sightings', {})
  }

  // Modal components to render
  const HuntModals = () => (
    <>
      <HuntListModal
        isOpen={modalState.showList}
        onClose={closeModals}
        title={modalState.listTitle}
        initialFilters={modalState.listFilters}
        onHuntSelect={handleHuntSelect}
      />
      
      <HuntDetailsModal
        huntId={modalState.selectedHuntId}
        isOpen={modalState.showDetails}
        onClose={closeModals}
      />
    </>
  )

  return {
    // State
    modalState,
    
    // Generic functions
    showHuntList,
    showHuntDetails,
    closeModals,
    handleHuntSelect,
    
    // Pre-configured functions
    showAllHunts,
    showSuccessfulHunts,
    showUnsuccessfulHunts,
    showRecentHunts,
    showThisSeasonHunts,
    showHuntsWithSightings,
    
    // Component to render
    HuntModals
  }
}

// Custom hook for hunt statistics with modal integration
export function useHuntStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Import the service dynamically to avoid SSR issues
      const { huntService } = await import('@/lib/hunt-logging/hunt-service')
      const statsData = await huntService.getHuntStats()
      setStats(statsData)
    } catch (err) {
      console.error('Error loading hunt stats:', err)
      setError('Failed to load hunt statistics')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    loadStats
  }
}
