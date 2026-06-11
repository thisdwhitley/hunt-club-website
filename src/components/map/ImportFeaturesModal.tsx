'use client'

import React, { useState, useEffect } from 'react'
import type { Feature, Geometry, FeatureCollection } from 'geojson'
import { createClient } from '@/lib/supabase/client'

type FeatureType = 'boundary' | 'trail' | 'road' | 'field' | 'food_plot' | 'water'

interface ParsedFeature {
  id: string
  name: string
  featureType: FeatureType
  geometry: Geometry
  include: boolean
}

interface ImportFeaturesModalProps {
  onClose: () => void
  onSaved: () => void
  onPreviewUpdate: (features: Feature[] | null) => void
}

const FEATURE_TYPE_OPTIONS: { value: FeatureType; label: string }[] = [
  { value: 'boundary', label: 'Property Boundary' },
  { value: 'trail', label: 'Trail' },
  { value: 'road', label: 'Road' },
  { value: 'field', label: 'Field' },
  { value: 'food_plot', label: 'Food Plot' },
  { value: 'water', label: 'Water' },
]

function guessFeatureType(name: string, geometry: Geometry): FeatureType {
  const n = name.toLowerCase()
  if (n.includes('road') || n.includes('drive') || n.includes('lane')) return 'road'
  if (n.includes('trail') || n.includes('path') || n.includes('walk')) return 'trail'
  if (n.includes('field') || n.includes('open')) return 'field'
  if (n.includes('food') || n.includes('plot') || n.includes('clover')) return 'food_plot'
  if (n.includes('water') || n.includes('pond') || n.includes('creek') || n.includes('stream')) return 'water'
  if (n.includes('boundary') || n.includes('property') || n.includes('fence')) return 'boundary'
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') return 'field'
  return 'trail'
}

function parseGeoJSON(text: string): ParsedFeature[] {
  const parsed = JSON.parse(text) as FeatureCollection | Feature
  const features: Feature[] =
    parsed.type === 'FeatureCollection' ? parsed.features : [parsed as Feature]
  return features
    .filter(f => f.geometry)
    .map((f, i) => {
      const name = (f.properties?.name as string | undefined) ?? `Feature ${i + 1}`
      return {
        id: String(i),
        name,
        featureType: guessFeatureType(name, f.geometry),
        geometry: f.geometry,
        include: true,
      }
    })
}

function parseGPX(text: string): ParsedFeature[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const results: ParsedFeature[] = []

  // Tracks → LineString features
  const tracks = doc.querySelectorAll('trk')
  tracks.forEach((trk, i) => {
    const nameEl = trk.querySelector('name')
    const name = nameEl?.textContent?.trim() ?? `Track ${i + 1}`
    const coords: [number, number][] = []
    trk.querySelectorAll('trkpt').forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat') ?? '')
      const lon = parseFloat(pt.getAttribute('lon') ?? '')
      if (!isNaN(lat) && !isNaN(lon)) coords.push([lon, lat])
    })
    if (coords.length >= 2) {
      results.push({
        id: `trk-${i}`,
        name,
        featureType: guessFeatureType(name, { type: 'LineString', coordinates: coords }),
        geometry: { type: 'LineString', coordinates: coords },
        include: true,
      })
    }
  })

  // Routes → LineString features
  const routes = doc.querySelectorAll('rte')
  routes.forEach((rte, i) => {
    const nameEl = rte.querySelector('name')
    const name = nameEl?.textContent?.trim() ?? `Route ${i + 1}`
    const coords: [number, number][] = []
    rte.querySelectorAll('rtept').forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat') ?? '')
      const lon = parseFloat(pt.getAttribute('lon') ?? '')
      if (!isNaN(lat) && !isNaN(lon)) coords.push([lon, lat])
    })
    if (coords.length >= 2) {
      results.push({
        id: `rte-${i}`,
        name,
        featureType: guessFeatureType(name, { type: 'LineString', coordinates: coords }),
        geometry: { type: 'LineString', coordinates: coords },
        include: true,
      })
    }
  })

  return results
}

export default function ImportFeaturesModal({ onClose, onSaved, onPreviewUpdate }: ImportFeaturesModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [features, setFeatures] = useState<ParsedFeature[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const included = features.filter(f => f.include)
    onPreviewUpdate(
      included.length
        ? included.map(f => ({ type: 'Feature' as const, geometry: f.geometry, properties: { name: f.name } }))
        : null
    )
  }, [features, onPreviewUpdate])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        const parsed = file.name.toLowerCase().endsWith('.gpx')
          ? parseGPX(text)
          : parseGeoJSON(text)
        if (!parsed.length) {
          setParseError('No features found in file.')
          return
        }
        setFeatures(parsed)
        setStep('review')
      } catch {
        setParseError('Could not parse file. Make sure it is valid GeoJSON or GPX.')
      }
    }
    reader.readAsText(file)
  }

  const updateFeature = (id: string, changes: Partial<ParsedFeature>) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, ...changes } : f))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const toInsert = features
      .filter(f => f.include && f.name.trim())
      .map(f => ({
        name: f.name.trim(),
        feature_type: f.featureType,
        geometry: f.geometry as unknown as Record<string, unknown>,
        active: true,
      }))

    if (!toInsert.length) {
      setSaveError('No features selected to save.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('property_features')
      .insert(toInsert)

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    onSaved()
  }

  const includedCount = features.filter(f => f.include).length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 580,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#566E3D', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Import Map Features</h2>
            <p style={{ fontSize: 12, color: '#C6D6B8', margin: '2px 0 0 0' }}>GeoJSON or GPX → property_features</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {step === 'upload' && (
            <div>
              <p style={{ fontSize: 13, color: '#2D3E1F', marginBottom: 16 }}>
                Upload a <strong>.geojson</strong>, <strong>.json</strong>, or <strong>.gpx</strong> file exported from onX or another mapping tool.
                Features will be previewed on the map before saving.
              </p>
              <label style={{
                display: 'block', border: '2px dashed #566E3D', borderRadius: 8,
                padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                background: '#F5F4F0', color: '#566E3D', fontWeight: 600, fontSize: 14,
              }}>
                <div style={{ marginBottom: 8, fontSize: 28 }}>📂</div>
                Click to choose a file
                <input type="file" accept=".geojson,.json,.gpx" onChange={handleFile} style={{ display: 'none' }} />
              </label>
              {parseError && (
                <p style={{ color: '#A0653A', fontSize: 13, marginTop: 10 }}>⚠️ {parseError}</p>
              )}
            </div>
          )}

          {step === 'review' && (
            <div>
              <p style={{ fontSize: 13, color: '#2D3E1F', marginBottom: 12 }}>
                {features.length} feature{features.length !== 1 ? 's' : ''} found. Set the type and name for each, then save.
                Features are previewed on the map in gray.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F5F4F0', borderBottom: '1px solid #E8E6E0' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 32, color: '#566E3D', fontWeight: 700 }}>✓</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#566E3D', fontWeight: 700 }}>Name</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#566E3D', fontWeight: 700 }}>Type</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#566E3D', fontWeight: 700 }}>Geometry</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #E8E6E0', opacity: f.include ? 1 : 0.45 }}>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={f.include}
                          onChange={e => updateFeature(f.id, { include: e.target.checked })}
                        />
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <input
                          value={f.name}
                          onChange={e => updateFeature(f.id, { name: e.target.value })}
                          style={{
                            border: '1px solid #E8E6E0', borderRadius: 4, padding: '3px 6px',
                            fontSize: 12, width: '100%', background: '#fff',
                          }}
                        />
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <select
                          value={f.featureType}
                          onChange={e => updateFeature(f.id, { featureType: e.target.value as FeatureType })}
                          style={{
                            border: '1px solid #E8E6E0', borderRadius: 4, padding: '3px 6px',
                            fontSize: 12, background: '#fff',
                          }}
                        >
                          {FEATURE_TYPE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '5px 8px', color: '#8B7355', fontSize: 11 }}>
                        {f.geometry.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {saveError && (
                <p style={{ color: '#A0653A', fontSize: 13, marginTop: 10 }}>⚠️ {saveError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #E8E6E0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#F5F4F0',
          }}>
            <button
              onClick={() => { setStep('upload'); setFeatures([]); onPreviewUpdate(null) }}
              style={{ background: 'none', border: 'none', color: '#8B7355', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              ← Back
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#566E3D', fontWeight: 600 }}>
                {includedCount} of {features.length} selected
              </span>
              <button
                onClick={handleSave}
                disabled={saving || includedCount === 0}
                style={{
                  background: saving || includedCount === 0 ? '#C4C4C4' : '#FA7921',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving || includedCount === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : `Save ${includedCount} Feature${includedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
