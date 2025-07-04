// src/app/stands-import/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, MapPin, CheckCircle, AlertCircle, Eye, Download, Plus } from 'lucide-react'

interface GPXWaypoint {
  name: string
  description?: string
  latitude: number
  longitude: number
  elevation?: number
  time?: string
  extensions?: Record<string, any>
}

interface StandMapping {
  name: string
  description: string
  latitude: number
  longitude: number
  type: string
  active: boolean
}

interface ImportPreview {
  waypoint: GPXWaypoint
  mapping: StandMapping
  action: 'insert' | 'update' | 'skip'
  existingStand?: any
}

const STAND_TYPES = [
  { value: 'tree_stand', label: 'Tree Stand' },
  { value: 'ground_blind', label: 'Ground Blind' },
  { value: 'ladder_stand', label: 'Ladder Stand' },
  { value: 'tower_stand', label: 'Tower Stand' },
  { value: 'box_blind', label: 'Box Blind' },
  { value: 'shooting_house', label: 'Shooting House' },
  { value: 'other', label: 'Other' }
]

export default function StandsImport() {
  const [gpxWaypoints, setGpxWaypoints] = useState<GPXWaypoint[]>([])
  const [existingStands, setExistingStands] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<ImportPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing stands on component mount
  useEffect(() => {
    loadExistingStands()
  }, [])

  const loadExistingStands = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('stands')
        .select('*')
        .order('name')

      if (error) throw error
      setExistingStands(data || [])
    } catch (err) {
      console.error('Error loading existing stands:', err)
    }
  }

  const parseGPXWaypoints = (gpxContent: string): GPXWaypoint[] => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(gpxContent, 'text/xml')
    const waypoints: GPXWaypoint[] = []

    // Parse waypoints from GPX
    const wpElements = xmlDoc.getElementsByTagName('wpt')
    
    for (let i = 0; i < wpElements.length; i++) {
      const wpt = wpElements[i]
      const lat = parseFloat(wpt.getAttribute('lat') || '0')
      const lon = parseFloat(wpt.getAttribute('lon') || '0')
      
      if (lat === 0 || lon === 0) continue // Skip invalid coordinates

      const nameElement = wpt.getElementsByTagName('name')[0]
      const descElement = wpt.getElementsByTagName('desc')[0]
      const eleElement = wpt.getElementsByTagName('ele')[0]
      const timeElement = wpt.getElementsByTagName('time')[0]

      const waypoint: GPXWaypoint = {
        name: nameElement?.textContent || `Waypoint ${i + 1}`,
        description: descElement?.textContent || '',
        latitude: lat,
        longitude: lon
      }

      if (eleElement?.textContent) {
        waypoint.elevation = parseFloat(eleElement.textContent)
      }

      if (timeElement?.textContent) {
        waypoint.time = timeElement.textContent
      }

      // Parse extensions for custom OnX data
      const extensions = wpt.getElementsByTagName('extensions')[0]
      if (extensions) {
        waypoint.extensions = {}
        Array.from(extensions.children).forEach(child => {
          waypoint.extensions![child.tagName] = child.textContent || ''
        })
      }

      waypoints.push(waypoint)
    }

    return waypoints
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)
    setFileName(file.name)

    try {
      const content = await file.text()
      const waypoints = parseGPXWaypoints(content)
      
      if (waypoints.length === 0) {
        throw new Error('No waypoints found in GPX file. Make sure you exported stands (not tracks) from OnX.')
      }

      setGpxWaypoints(waypoints)
      generateImportPreview(waypoints)
      setSuccess(`Found ${waypoints.length} waypoints in GPX file`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse GPX file')
    } finally {
      setLoading(false)
    }
  }

  const generateImportPreview = (waypoints: GPXWaypoint[]) => {
    const preview: ImportPreview[] = waypoints.map(waypoint => {
      // Check if stand already exists by name
      const existingStand = existingStands.find(stand => 
        stand.name.toLowerCase() === waypoint.name.toLowerCase()
      )

      // Auto-detect stand type from name/description
      const autoDetectType = (): string => {
        const text = `${waypoint.name} ${waypoint.description || ''}`.toLowerCase()
        
        if (text.includes('tree') || text.includes('climber')) return 'tree_stand'
        if (text.includes('ground') || text.includes('blind')) return 'ground_blind'
        if (text.includes('ladder')) return 'ladder_stand'
        if (text.includes('tower')) return 'tower_stand'
        if (text.includes('box')) return 'box_blind'
        if (text.includes('shooting') || text.includes('house')) return 'shooting_house'
        
        return 'tree_stand' // Default
      }

      const mapping: StandMapping = {
        name: waypoint.name,
        description: waypoint.description || '',
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        type: autoDetectType(),
        active: true
      }

      return {
        waypoint,
        mapping,
        action: existingStand ? 'update' : 'insert',
        existingStand
      }
    })

    setImportPreview(preview)
    setShowPreview(true)
  }

  const updatePreviewItem = (index: number, updates: Partial<ImportPreview>) => {
    setImportPreview(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ))
  }

  const updateMapping = (index: number, mappingUpdates: Partial<StandMapping>) => {
    setImportPreview(prev => prev.map((item, i) => 
      i === index ? { ...item, mapping: { ...item.mapping, ...mappingUpdates } } : item
    ))
  }

  const executeImport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      let insertCount = 0
      let updateCount = 0
      let skipCount = 0

      for (const item of importPreview) {
        if (item.action === 'skip') {
          skipCount++
          continue
        }

        if (item.action === 'insert') {
          const { error } = await supabase
            .from('stands')
            .insert(item.mapping)

          if (error) throw error
          insertCount++
        } else if (item.action === 'update' && item.existingStand) {
          const { error } = await supabase
            .from('stands')
            .update(item.mapping)
            .eq('id', item.existingStand.id)

          if (error) throw error
          updateCount++
        }
      }

      setSuccess(`Import complete! Inserted: ${insertCount}, Updated: ${updateCount}, Skipped: ${skipCount}`)
      
      // Refresh existing stands
      await loadExistingStands()
      
      // Reset form
      setGpxWaypoints([])
      setImportPreview([])
      setShowPreview(false)
      setFileName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="text-orange-400" />
            Import Hunting Stands
          </h1>
          <p className="text-stone-200 mt-2">
            Import stand locations from OnX Maps GPX export
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Current Stands Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Current Database</h2>
          <div className="text-stone-600">
            <p><strong>{existingStands.length}</strong> stands currently in database</p>
            {existingStands.length > 0 && (
              <p className="text-sm mt-1">
                Types: {Array.from(new Set(existingStands.map(s => s.type))).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Upload OnX Stands GPX
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
              <div className="text-4xl">🎯</div>
              <div>
                <p className="text-stone-600 mb-2">
                  Export your hunting stands from OnX as GPX waypoints
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Choose GPX File'}
                </button>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {fileName && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700"><strong>File:</strong> {fileName}</p>
              <p className="text-blue-600 text-sm">Found {gpxWaypoints.length} waypoints</p>
            </div>
          )}
        </div>

        {/* Import Preview */}
        {showPreview && importPreview.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                <Eye size={20} />
                Import Preview ({importPreview.length} stands)
              </h2>
              <button
                onClick={executeImport}
                disabled={loading || importPreview.every(item => item.action === 'skip')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Execute Import'}
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {importPreview.map((item, index) => (
                <div key={index} className="border border-stone-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* GPX Data */}
                    <div>
                      <h4 className="font-semibold text-stone-700 mb-2">From GPX:</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {item.waypoint.name}</p>
                        <p><strong>Description:</strong> {item.waypoint.description || 'None'}</p>
                        <p><strong>Coordinates:</strong> {item.waypoint.latitude.toFixed(6)}, {item.waypoint.longitude.toFixed(6)}</p>
                        {item.waypoint.elevation && (
                          <p><strong>Elevation:</strong> {item.waypoint.elevation}m</p>
                        )}
                      </div>
                    </div>

                    {/* Mapping */}
                    <div>
                      <h4 className="font-semibold text-stone-700 mb-2">Database Mapping:</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-stone-600">Name:</label>
                          <input
                            type="text"
                            value={item.mapping.name}
                            onChange={(e) => updateMapping(index, { name: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-stone-600">Type:</label>
                          <select
                            value={item.mapping.type}
                            onChange={(e) => updateMapping(index, { type: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                          >
                            {STAND_TYPES.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-600">Action:</label>
                          <select
                            value={item.action}
                            onChange={(e) => updatePreviewItem(index, { action: e.target.value as any })}
                            className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                          >
                            <option value="insert">Insert New</option>
                            {item.existingStand && <option value="update">Update Existing</option>}
                            <option value="skip">Skip</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    {item.action === 'insert' && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        <Plus size={12} className="inline mr-1" />
                        Will Insert
                      </span>
                    )}
                    {item.action === 'update' && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        ↻ Will Update
                      </span>
                    )}
                    {item.action === 'skip' && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        ⊘ Will Skip
                      </span>
                    )}
                    {item.existingStand && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                        Exists: {item.existingStand.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
