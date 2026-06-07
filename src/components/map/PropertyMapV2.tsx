'use client'

import React, { useState, useEffect, useRef } from 'react'
import type * as LeafletLib from 'leaflet'
import type { FeatureCollection, Geometry } from 'geojson'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { Stand } from '@/lib/database/stands'
import type { CameraWithStatus } from '@/lib/cameras/types'
import { getCameraDeployments } from '@/lib/cameras/database'
import StandCardV2 from '@/components/stands/StandCardV2'
import CameraCardV2 from '@/components/cameras/CameraCardV2'
import { createRoot } from 'react-dom/client'

type PropertyFeature = Database['public']['Tables']['property_features']['Row']

const PROPERTY_CENTER: [number, number] = [36.42712517693617, -79.51073582842501]

const FEATURE_STYLES: Record<string, LeafletLib.PathOptions> = {
  boundary:  { color: '#FE9920', weight: 3, dashArray: '6,4', fill: false, opacity: 0.9 },
  trail:     { color: '#A0653A', weight: 2, dashArray: '4,4', opacity: 0.8, fill: false },
  road:      { color: '#8B7355', weight: 3, opacity: 0.9, fill: false },
  field:     { color: '#566E3D', weight: 1, fillColor: '#566E3D', fillOpacity: 0.15 },
  food_plot: { color: '#566E3D', weight: 1, fillColor: '#566E3D', fillOpacity: 0.15 },
  water:     { color: '#0C4767', weight: 2, opacity: 0.8, fill: false },
}

type LayerKey = 'boundary' | 'trail' | 'road' | 'field' | 'water' | 'stands' | 'cameras'
type TileKey = 'esri' | 'google' | 'street' | 'terrain'

const LAYER_LABELS: Record<LayerKey, string> = {
  boundary: 'Boundary',
  trail:    'Trails',
  road:     'Roads',
  field:    'Fields',
  water:    'Water',
  stands:   'Stands',
  cameras:  'Cameras',
}

const LAYER_COLORS: Record<LayerKey, string> = {
  boundary: '#FE9920',
  trail:    '#A0653A',
  road:     '#8B7355',
  field:    '#566E3D',
  water:    '#0C4767',
  stands:   '#FA7921',
  cameras:  '#0C4767',
}

const FEATURE_LAYER_KEYS: LayerKey[] = ['boundary', 'trail', 'road', 'field', 'water']
const ALL_LAYER_KEYS: LayerKey[] = [...FEATURE_LAYER_KEYS, 'stands', 'cameras']

const DEFAULT_VISIBILITY: Record<LayerKey, boolean> = {
  boundary: true, trail: true, road: true, field: true,
  water: true, stands: true, cameras: true,
}

const STORAGE_KEY = 'map-v2-layer-visibility'

const TILE_URLS: Record<TileKey, string> = {
  esri:    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  google:  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  street:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
}

let L!: typeof LeafletLib

export default function PropertyMapV2({ height = 'h-96 md:h-[600px]' }: { height?: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletLib.Map | null>(null)
  const tileLayerRef = useRef<LeafletLib.TileLayer | null>(null)
  const geoLayerRefs = useRef<Partial<Record<LayerKey, LeafletLib.GeoJSON>>>({})
  const standLayerRef = useRef<LeafletLib.LayerGroup | null>(null)
  const cameraLayerRef = useRef<LeafletLib.LayerGroup | null>(null)
  const visibilityRef = useRef<Record<LayerKey, boolean>>(DEFAULT_VISIBILITY)

  const [leafletReady, setLeafletReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [currentTile, setCurrentTile] = useState<TileKey>('esri')
  const [visibility, setVisibility] = useState<Record<LayerKey, boolean>>(DEFAULT_VISIBILITY)

  const [features, setFeatures] = useState<PropertyFeature[]>([])
  const [stands, setStands] = useState<Stand[]>([])
  const [cameras, setCameras] = useState<CameraWithStatus[]>([])

  // Keep ref in sync with state so effects can read current visibility without re-running
  useEffect(() => { visibilityRef.current = visibility }, [visibility])

  // Load persisted layer visibility
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<LayerKey, boolean>
        setVisibility(parsed)
        visibilityRef.current = parsed
      }
    } catch { /* ignore */ }
  }, [])

  // Persist visibility on change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility)) } catch { /* ignore */ }
  }, [visibility])

  // Load Leaflet from CDN
  useEffect(() => {
    if (typeof window === 'undefined' || L) { if (L) setLeafletReady(true); return }
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
    document.head.appendChild(css)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
    script.onload = () => {
      L = (window as Window & { L?: typeof LeafletLib }).L!
      setLeafletReady(true)
    }
    script.onerror = () => setError('Failed to load mapping library')
    document.head.appendChild(script)
  }, [])

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const [featuresRes, standsRes, camerasRes] = await Promise.all([
          supabase.from('property_features').select('*').eq('active', true),
          supabase.from('stands').select('*').eq('active', true).order('name'),
          getCameraDeployments(),
        ])
        if (featuresRes.error) throw featuresRes.error
        if (standsRes.error) throw standsRes.error
        setFeatures(featuresRes.data ?? [])
        setStands((standsRes.data ?? []) as Stand[])
        if (camerasRes.success) setCameras(camerasRes.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return
    mapInstanceRef.current = L.map(mapRef.current, { zoomControl: true }).setView(PROPERTY_CENTER, 16)

    // Popup CSS
    const style = document.createElement('style')
    style.textContent = `
      .leaflet-popup-content-wrapper { padding: 6px !important; border-radius: 10px !important; }
      .leaflet-popup-content { margin: 0 !important; }
    `
    document.head.appendChild(style)

    setMapReady(true)
  }, [leafletReady])

  // Tile layer
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current)
    tileLayerRef.current = L.tileLayer(TILE_URLS[currentTile], { attribution: '© CCYC', maxZoom: 20 })
    tileLayerRef.current.addTo(mapInstanceRef.current)
  }, [mapReady, currentTile])

  // Feature layers (boundary, trails, etc.) — only recreate when feature data changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    // Clear existing feature layers
    for (const key of FEATURE_LAYER_KEYS) {
      const existing = geoLayerRefs.current[key]
      if (existing) { mapInstanceRef.current.removeLayer(existing); delete geoLayerRefs.current[key] }
    }

    if (!features.length) return

    // Group by display key (food_plot → field)
    const grouped: Partial<Record<LayerKey, PropertyFeature[]>> = {}
    for (const f of features) {
      const key = (f.feature_type === 'food_plot' ? 'field' : f.feature_type) as LayerKey
      if (!grouped[key]) grouped[key] = []
      grouped[key]!.push(f)
    }

    for (const [layerKey, layerFeatures] of Object.entries(grouped) as [LayerKey, PropertyFeature[]][]) {
      const baseStyle = FEATURE_STYLES[layerKey] ?? { color: '#666' }

      const fc: FeatureCollection = {
        type: 'FeatureCollection',
        features: layerFeatures.map(f => ({
          type: 'Feature',
          geometry: f.geometry as unknown as Geometry,
          properties: { name: f.name, notes: f.notes, color: f.color },
        })),
      }

      const geoLayer = L.geoJSON(fc, {
        style: (feat) => ({
          ...baseStyle,
          ...(feat?.properties?.color ? { color: feat.properties.color as string } : {}),
        }),
        onEachFeature: (feat, layer) => {
          const name = feat.properties?.name as string | undefined
          const notes = feat.properties?.notes as string | null | undefined
          if (name) {
            layer.bindPopup(
              `<strong style="color:#566E3D;font-size:13px">${name}</strong>` +
              (notes ? `<br><span style="font-size:11px;color:#2D3E1F">${notes}</span>` : '')
            )
          }
        },
      })

      geoLayerRefs.current[layerKey] = geoLayer

      if (visibilityRef.current[layerKey]) {
        geoLayer.addTo(mapInstanceRef.current)
      }

      // Fit map to boundary after first render
      if (layerKey === 'boundary') {
        try {
          const bounds = geoLayer.getBounds()
          if (bounds.isValid()) mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24] })
        } catch { /* ignore */ }
      }
    }
  }, [mapReady, features])

  // Stand markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    if (standLayerRef.current) {
      mapInstanceRef.current.removeLayer(standLayerRef.current)
      standLayerRef.current = null
    }
    if (!visibilityRef.current.stands) return

    const icon = L.divIcon({
      html: `<div style="background:#FA7921;border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 2px 4px rgba(0,0,0,0.35);"></div>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10],
    })

    const group = L.layerGroup()
    for (const stand of stands) {
      if (!stand.latitude || !stand.longitude) continue
      const div = document.createElement('div')
      createRoot(div).render(<StandCardV2 stand={stand} mode="compact" showActions={false} />)
      L.marker([stand.latitude, stand.longitude], { icon })
        .bindPopup(div, { maxWidth: 340, minWidth: 300, className: 'stand-popup' })
        .addTo(group)
    }
    group.addTo(mapInstanceRef.current)
    standLayerRef.current = group
  }, [mapReady, stands])

  // Camera markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    if (cameraLayerRef.current) {
      mapInstanceRef.current.removeLayer(cameraLayerRef.current)
      cameraLayerRef.current = null
    }
    if (!visibilityRef.current.cameras) return

    const icon = L.divIcon({
      html: `<div style="background:#0C4767;border:1px solid #E8E6E0;border-radius:50%;width:12px;height:12px;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -8],
    })

    const group = L.layerGroup()
    for (const camera of cameras) {
      const { deployment } = camera
      if (!deployment?.latitude || !deployment?.longitude || !deployment?.active) continue
      const div = document.createElement('div')
      createRoot(div).render(<CameraCardV2 camera={camera} mode="compact" showActions={false} />)
      L.marker([deployment.latitude, deployment.longitude], { icon })
        .bindPopup(div, { maxWidth: 350, minWidth: 330, className: 'camera-popup' })
        .addTo(group)
    }
    group.addTo(mapInstanceRef.current)
    cameraLayerRef.current = group
  }, [mapReady, cameras])

  const toggleLayer = (key: LayerKey) => {
    setVisibility(prev => {
      const next = { ...prev, [key]: !prev[key] }
      visibilityRef.current = next

      if (!mapInstanceRef.current) return next

      if (key === 'stands') {
        if (standLayerRef.current) {
          if (next.stands) standLayerRef.current.addTo(mapInstanceRef.current)
          else mapInstanceRef.current.removeLayer(standLayerRef.current)
        }
      } else if (key === 'cameras') {
        if (cameraLayerRef.current) {
          if (next.cameras) cameraLayerRef.current.addTo(mapInstanceRef.current)
          else mapInstanceRef.current.removeLayer(cameraLayerRef.current)
        }
      } else {
        const layer = geoLayerRefs.current[key]
        if (layer) {
          if (next[key]) layer.addTo(mapInstanceRef.current)
          else mapInstanceRef.current.removeLayer(layer)
        }
      }

      return next
    })
  }

  const tileLabels: Record<TileKey, string> = { esri: 'Esri', google: 'Google', street: 'Street', terrain: 'Terrain' }

  return (
    <div style={{ background: '#E8E6E0', border: '2px solid #2D3E1F', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#2D3E1F', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Caswell County Yacht Club — Property Map</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0 0' }}>
            {loading ? 'Loading…' : `${stands.length} stands · ${cameras.filter(c => c.deployment?.active).length} cameras · 100 acres`}
          </p>
        </div>
        {/* Tile selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(tileLabels) as TileKey[]).map(t => (
            <button
              key={t}
              onClick={() => setCurrentTile(t)}
              style={{
                background: currentTile === t ? '#FA7921' : 'rgba(255,255,255,0.12)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '3px 9px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tileLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative' }}>
        {/* Layer panel — top-right overlay */}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <button
            onClick={() => setPanelOpen(o => !o)}
            style={{
              background: panelOpen ? '#566E3D' : 'rgba(232,230,224,0.93)',
              color: panelOpen ? 'white' : '#2D3E1F',
              border: `1px solid #566E3D`,
              borderRadius: 6,
              padding: '5px 11px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            {panelOpen ? '✕ Layers' : '☰ Layers'}
          </button>

          {panelOpen && (
            <div style={{
              marginTop: 4,
              background: 'rgba(232,230,224,0.96)',
              border: '1px solid #566E3D',
              borderRadius: 6,
              padding: '8px 10px',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              minWidth: 115,
            }}>
              {ALL_LAYER_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '4px 0',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#2D3E1F',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: visibility[key] ? LAYER_COLORS[key] : '#C4C4C4',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                  }} />
                  {LAYER_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={mapRef} className={`w-full ${height}`} />
      </div>

      {error && (
        <div style={{ background: '#A0653A', color: 'white', padding: '8px 16px', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
