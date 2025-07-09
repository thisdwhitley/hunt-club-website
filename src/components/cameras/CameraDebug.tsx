// Optional: Add this debug component temporarily to src/components/cameras/FilterDebug.tsx
// This will help you verify that filtering is working correctly

'use client'

import React from 'react'
import { Info } from 'lucide-react'
import type { CameraWithStatus, CameraFilters } from '@/lib/cameras/types'

interface FilterDebugProps {
  cameras: CameraWithStatus[]
  filters: any // Your management filters
  cameraFilters: Partial<CameraFilters>
  stats: any
}

export function FilterDebug({ cameras, filters, cameraFilters, stats }: FilterDebugProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">Filter Debug Info</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <strong className="text-blue-700">UI Filters:</strong>
          <pre className="mt-1 text-blue-600 whitespace-pre-wrap">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong className="text-blue-700">Database Filters:</strong>
          <pre className="mt-1 text-blue-600 whitespace-pre-wrap">
            {JSON.stringify(cameraFilters, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong className="text-blue-700">Results:</strong>
          <div className="mt-1 text-blue-600">
            <div>Cameras loaded: {cameras.length}</div>
            <div>With alerts: {cameras.filter(c => c.latest_report?.needs_attention || c.days_since_last_report! > 1).length}</div>
            <div>Active: {cameras.filter(c => c.deployment?.active).length}</div>
            <div>Brands: {Array.from(new Set(cameras.map(c => c.hardware?.brand).filter(Boolean))).join(', ')}</div>
            {stats && (
              <div>Stats loaded: ✓ ({stats.total_hardware} total)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
