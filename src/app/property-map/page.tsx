'use client'

import React, { useState } from 'react'
import Navigation from '@/components/Navigation'
import PropertyMapV2 from '@/components/map/PropertyMapV2'
import ImportFeaturesModal from '@/components/map/ImportFeaturesModal'
import type { Feature } from 'geojson'

export default function PropertyMapPage() {
  const [importOpen, setImportOpen] = useState(false)
  const [previewFeatures, setPreviewFeatures] = useState<Feature[] | null>(null)
  const [mapKey, setMapKey] = useState(0)

  const handleImportClose = () => {
    setImportOpen(false)
    setPreviewFeatures(null)
  }

  const handleImportSaved = () => {
    setImportOpen(false)
    setPreviewFeatures(null)
    setMapKey(k => k + 1)
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <PropertyMapV2
          key={mapKey}
          height="h-[600px] md:h-[700px]"
          previewFeatures={previewFeatures ?? undefined}
          onImportClick={() => setImportOpen(true)}
        />
      </div>

      {importOpen && (
        <ImportFeaturesModal
          onClose={handleImportClose}
          onSaved={handleImportSaved}
          onPreviewUpdate={setPreviewFeatures}
        />
      )}
    </div>
  )
}
