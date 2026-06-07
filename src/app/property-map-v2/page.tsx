'use client'

import React from 'react'
import { Crosshair } from 'lucide-react'
import Navigation from '@/components/Navigation'
import PropertyMapV2 from '@/components/map/PropertyMapV2'

export default function PropertyMapV2Page() {
  return (
    <div className="min-h-screen bg-morning-mist">
      <Navigation />

      <div style={{ background: '#566E3D', borderBottom: '4px solid #FA7921', padding: '12px 16px' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-orange-400" />
              Property Map
            </h1>
            <p className="text-gray-200 text-sm mt-0.5">
              Boundary, stands, and cameras — 100 acres, Caswell County NC
            </p>
          </div>
          <a
            href="/property-map"
            style={{ color: '#B9A44C', fontSize: 12, fontWeight: 600 }}
          >
            View old map →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <PropertyMapV2 height="h-[70vh]" />
      </div>
    </div>
  )
}
