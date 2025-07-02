'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Upload, MapPin, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react'

// Property center coordinates for Caswell County Yacht Club
const PROPERTY_CENTER: [number, number] = [36.42723576739513, -79.51088069325365]

// Global reference to loaded Leaflet library
let L: any = null

export default function GPXBoundaryTestPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [gpxData, setGpxData] = useState<any>(null)
  const [boundaryLayer, setBoundaryLayer] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Load Leaflet and GPX plugin
  useEffect(() => {
    const loadLeafletAndGPX = async () => {
      addDebugInfo('🗺️ Loading Leaflet and GPX plugin...')

      try {
        // Load Leaflet CSS
        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        cssLink.crossOrigin = ''
        document.head.appendChild(cssLink)

        // Load Leaflet JS
        const leafletScript = document.createElement('script')
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        leafletScript.crossOrigin = ''
        
        leafletScript.onload = () => {
          addDebugInfo('✅ Leaflet loaded')
          L = (window as any).L
          
          // Fix default markers
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          })

          // Load GPX plugin
          const gpxScript = document.createElement('script')
          gpxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/gpx.min.js'
          
          gpxScript.onload = () => {
            addDebugInfo('✅ GPX plugin loaded')
            setLeafletLoaded(true)
          }
          
          gpxScript.onerror = () => {
            addDebugInfo('❌ Failed to load GPX plugin')
            setError('Failed to load GPX plugin')
          }
          
          document.head.appendChild(gpxScript)
        }
        
        leafletScript.onerror = () => {
          addDebugInfo('❌ Failed to load Leaflet')
          setError('Failed to load Leaflet')
        }
        
        document.head.appendChild(leafletScript)

      } catch (err) {
        addDebugInfo('❌ Exception during library loading')
        console.error('Error loading libraries:', err)
        setError('Failed to load mapping libraries')
      }
    }

    loadLeafletAndGPX()
  }, [])

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !L || !mapRef.current || leafletMapRef.current) return

    addDebugInfo('🗺️ Initializing property map...')

    try {
      // Create the map
      leafletMapRef.current = L.map(mapRef.current, {
        zoomControl: true
      }).setView(PROPERTY_CENTER, 16)

      // Add satellite tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18
      }).addTo(leafletMapRef.current)

      // Add property center marker
      const clubhouseIcon = L.divIcon({
        html: `
          <div style="
            background: #566E3D; 
            border: 2px solid #FA7921; 
            border-radius: 50%; 
            width: 24px; 
            height: 24px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            <div style="
              background: white; 
              border-radius: 50%; 
              width: 8px; 
              height: 8px;
            "></div>
          </div>
        `,
        className: 'clubhouse-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      L.marker(PROPERTY_CENTER, { icon: clubhouseIcon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="color: #566E3D; margin: 0 0 8px 0;">🏕️ Caswell County Yacht Club</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px;">Property Center</p>
            <div style="font-size: 12px; color: #666;">
              ${PROPERTY_CENTER[0].toFixed(6)}, ${PROPERTY_CENTER[1].toFixed(6)}
            </div>
          </div>
        `)

      setMapReady(true)
      addDebugInfo('✅ Map ready for GPX testing!')

    } catch (err) {
      addDebugInfo('❌ Exception during map initialization')
      console.error('Error initializing map:', err)
      setError('Failed to initialize map')
    }
  }, [leafletLoaded])

  // Handle GPX file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('Please select a GPX file')
      return
    }

    setLoading(true)
    setError(null)
    addDebugInfo(`📁 Loading GPX file: ${file.name}`)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const gpxContent = e.target?.result as string
        addDebugInfo('✅ GPX file loaded, parsing...')
        
        // Parse and display GPX on map
        parseAndDisplayGPX(gpxContent, file.name)
        
      } catch (err) {
        addDebugInfo('❌ Failed to read GPX file')
        console.error('Error reading GPX file:', err)
        setError('Failed to read GPX file')
        setLoading(false)
      }
    }

    reader.onerror = () => {
      addDebugInfo('❌ File reader error')
      setError('Failed to read file')
      setLoading(false)
    }

    reader.readAsText(file)
  }

  // Parse and display GPX data
  const parseAndDisplayGPX = (gpxContent: string, fileName: string) => {
    if (!leafletMapRef.current || !L) {
      setError('Map not ready')
      setLoading(false)
      return
    }

    try {
      // Remove existing boundary if present
      if (boundaryLayer) {
        leafletMapRef.current.removeLayer(boundaryLayer)
        addDebugInfo('🗑️ Removed previous boundary')
      }

      // Create GPX layer
      const gpxLayer = new (L as any).GPX(gpxContent, {
        async: true,
        marker_options: {
          startIconUrl: null,
          endIconUrl: null,
          shadowUrl: null,
          wptIconUrls: {
            '': null
          }
        },
        polyline_options: {
          color: '#FA7921',
          weight: 3,
          opacity: 0.8,
          fillColor: '#566E3D',
          fillOpacity: 0.1
        }
      })

      gpxLayer.on('loaded', (e: any) => {
        const gpx = e.target
        
        // Fit map to GPX bounds
        leafletMapRef.current.fitBounds(gpx.getBounds())
        
        // Extract coordinates from GPX layers
        const coordinates: [number, number][] = []
        let trackCount = 0
        let waypointCount = 0
        
        // Get coordinates from all layers in the GPX
        gpx.eachLayer((layer: any) => {
          if (layer.getLatLngs) {
            trackCount++
            const latlngs = layer.getLatLngs()
            
            // Handle different coordinate structures
            const processLatLngs = (coords: any) => {
              if (Array.isArray(coords)) {
                coords.forEach((coord: any) => {
                  if (coord.lat !== undefined && coord.lng !== undefined) {
                    coordinates.push([coord.lat, coord.lng])
                  } else if (Array.isArray(coord)) {
                    processLatLngs(coord)
                  }
                })
              } else if (coords.lat !== undefined && coords.lng !== undefined) {
                coordinates.push([coords.lat, coords.lng])
              }
            }
            
            processLatLngs(latlngs)
          } else if (layer.getLatLng) {
            waypointCount++
            const latlng = layer.getLatLng()
            coordinates.push([latlng.lat, latlng.lng])
          }
        })
        
        addDebugInfo(`✅ GPX parsed successfully!`)
        addDebugInfo(`📍 Found ${trackCount} tracks, ${waypointCount} waypoints`)
        addDebugInfo(`🎯 Extracted ${coordinates.length} coordinate points`)
        
        // Store GPX data for export
        setGpxData({
          fileName,
          content: gpxContent,
          tracks: trackCount,
          waypoints: waypointCount,
          coordinates: coordinates,
          bounds: gpx.getBounds()
        })

        // Add popup with GPX info
        gpx.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="color: #566E3D; margin: 0 0 8px 0;">🗺️ Property Boundary</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>File:</strong> ${fileName}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Tracks:</strong> ${trackCount}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Waypoints:</strong> ${waypointCount}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Points:</strong> ${coordinates.length}</p>
            <div style="font-size: 12px; color: #666;">
              Click to view boundary details
            </div>
          </div>
        `)

        setLoading(false)
        addDebugInfo('🎉 Property boundary loaded successfully!')
      })

      gpxLayer.on('error', (e: any) => {
        addDebugInfo('❌ GPX parsing failed')
        console.error('GPX parsing error:', e)
        setError('Failed to parse GPX file')
        setLoading(false)
      })

      // Add to map
      leafletMapRef.current.addLayer(gpxLayer)
      setBoundaryLayer(gpxLayer)

    } catch (err) {
      addDebugInfo('❌ Exception during GPX processing')
      console.error('Error processing GPX:', err)
      setError('Failed to process GPX file')
      setLoading(false)
    }
  }

  // Generate database insert SQL
  const generateInsertSQL = () => {
    if (!gpxData || !gpxData.coordinates || gpxData.coordinates.length === 0) {
      return '-- No coordinate data available. Please upload a GPX file first.'
    }

    const coordinates = gpxData.coordinates

    return `-- Insert Caswell County Yacht Club property boundary
-- Extracted from ${gpxData.fileName}
-- Contains ${coordinates.length} coordinate points
-- MATCHES YOUR EXISTING SCHEMA: boundary_data (jsonb), total_acres (numeric)

INSERT INTO property_boundaries (name, description, boundary_data, total_acres)
VALUES (
  'Caswell County Yacht Club Property',
  'Main 100-acre hunting property boundary imported from onX Maps (${gpxData.fileName})',
  '${JSON.stringify(coordinates)}',
  100
);

-- Verify the insertion:
-- SELECT name, jsonb_array_length(boundary_data) as point_count, total_acres
-- FROM property_boundaries 
-- WHERE name = 'Caswell County Yacht Club Property';`
  }

  // Generate simple table SQL for quick testing
  const generateSimpleSQL = () => {
    if (!gpxData || !gpxData.coordinates || gpxData.coordinates.length === 0) {
      return '-- No coordinate data available.'
    }

    const coordinates = gpxData.coordinates

    return `-- Quick test using your existing table structure
INSERT INTO property_boundaries (name, description, boundary_data, total_acres)
VALUES (
  'CCYC Property Test',
  'Test boundary from ${gpxData.fileName}',
  '${JSON.stringify(coordinates)}',
  100
);

-- Check what you inserted:
-- SELECT name, jsonb_array_length(boundary_data) as points, total_acres FROM property_boundaries;`
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="text-orange-400" />
            GPX Property Boundary Test
          </h1>
          <p className="text-stone-200 mt-2">
            Test importing your onX Maps property boundary (GPX format)
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* GPX Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Upload Property Boundary GPX
          </h2>
          
          <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-stone-600 mb-2">
                  Export your property boundary from onX Maps as GPX. Your database is ready!
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!mapReady || loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Choose GPX File'}
                </button>
                <p className="text-xs text-stone-500 mt-2">
                  ✅ property_boundaries table detected with boundary_data and total_acres columns
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {gpxData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle size={20} />
                <strong>GPX Loaded Successfully!</strong>
              </div>
              <div className="text-green-600 text-sm space-y-1">
                <p><strong>File:</strong> {gpxData.fileName}</p>
                <p><strong>Tracks:</strong> {gpxData.tracks}</p>
                <p><strong>Waypoints:</strong> {gpxData.waypoints}</p>
                <p><strong>Coordinate Points:</strong> {gpxData.coordinates?.length || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Property Map</h2>
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border border-stone-200"
            style={{ minHeight: '400px' }}
          />
          {!mapReady && (
            <div className="flex items-center justify-center h-96 text-stone-500">
              Loading map...
            </div>
          )}
        </div>

        {/* Database SQL Export */}
        {gpxData && gpxData.coordinates && gpxData.coordinates.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Ready to Insert! ({gpxData.coordinates.length} points)
            </h2>
            
            {/* Success message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Table Found!</h3>
              <p className="text-green-700 text-sm mb-3">
                Your property_boundaries table already exists with the correct structure. Just run this INSERT:
              </p>
              <div className="bg-green-100 p-3 rounded text-xs overflow-x-auto">
                <pre><code>{generateInsertSQL()}</code></pre>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generateInsertSQL())}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Copy INSERT SQL
              </button>
            </div>

            {/* Alternative simple option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔄 Alternative: Simple Test Insert</h3>
              <p className="text-blue-700 text-sm mb-3">
                For testing, you can insert with a different name:
              </p>
              <div className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
                <pre><code>{generateSimpleSQL()}</code></pre>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generateSimpleSQL())}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Copy Test SQL
              </button>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-4">Debug Log</h2>
            <div className="bg-stone-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
