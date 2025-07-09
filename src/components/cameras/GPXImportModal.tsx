// src/components/cameras/GPXImportModal.tsx
// GPX Import functionality for camera management

'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, FileText, MapPin, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import type { CameraHardwareFormData, CameraDeploymentFormData } from '@/lib/cameras/types'

// Interface for parsed GPX waypoint data
interface GPXWaypoint {
  id: string
  name: string
  latitude: number
  longitude: number
  description?: string
  symbol?: string
  elevation?: number
}

// Interface for camera import data (combines hardware + deployment)
interface CameraImportData {
  // Hardware data
  device_id: string
  brand: string
  model: string
  condition: 'good' | 'questionable' | 'poor' | 'retired'
  active: boolean
  
  // Deployment data
  location_name: string
  latitude: number
  longitude: number
  season_year: number
  has_solar_panel: boolean
  notes: string
  
  // Import metadata
  source_name: string // Original waypoint name
  import_notes: string
}

interface GPXImportModalProps {
  onClose: () => void
  onImport: (cameras: CameraImportData[]) => Promise<void>
  isImporting?: boolean
}

export function GPXImportModal({ onClose, onImport, isImporting = false }: GPXImportModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [waypoints, setWaypoints] = useState<GPXWaypoint[]>([])
  const [cameraData, setCameraData] = useState<CameraImportData[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'configure'>('upload')
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse GPX file and extract waypoints
  const parseGPXFile = async (file: File): Promise<GPXWaypoint[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const gpxContent = e.target?.result as string
          const parser = new DOMParser()
          const gpxDoc = parser.parseFromString(gpxContent, 'application/xml')
          
          // Check for parsing errors
          const parseError = gpxDoc.querySelector('parsererror')
          if (parseError) {
            throw new Error('Invalid GPX file format')
          }
          
          // Extract waypoints
          const waypointElements = gpxDoc.querySelectorAll('wpt')
          const waypoints: GPXWaypoint[] = []
          
          waypointElements.forEach((wpt, index) => {
            const lat = parseFloat(wpt.getAttribute('lat') || '0')
            const lon = parseFloat(wpt.getAttribute('lon') || '0')
            
            if (!lat || !lon) return // Skip waypoints without coordinates
            
            const nameElement = wpt.querySelector('name')
            const descElement = wpt.querySelector('desc')
            const symElement = wpt.querySelector('sym')
            const eleElement = wpt.querySelector('ele')
            
            const waypoint: GPXWaypoint = {
              id: `waypoint-${index}`,
              name: nameElement?.textContent?.trim() || `Waypoint ${index + 1}`,
              latitude: lat,
              longitude: lon,
              description: descElement?.textContent?.trim() || undefined,
              symbol: symElement?.textContent?.trim() || undefined,
              elevation: eleElement ? parseFloat(eleElement.textContent || '0') : undefined
            }
            
            waypoints.push(waypoint)
          })
          
          resolve(waypoints)
        } catch (error) {
          reject(new Error(`Failed to parse GPX file: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Generate device IDs based on waypoint names or indices
  const generateDeviceId = (waypoint: GPXWaypoint, index: number): string => {
    // Try to extract numbers from the waypoint name
    const nameNumbers = waypoint.name.match(/\d+/g)
    if (nameNumbers && nameNumbers.length > 0) {
      return nameNumbers[0].padStart(3, '0') // Pad to 3 digits like "002", "013"
    }
    
    // Fall back to sequential numbering
    return (index + 1).toString().padStart(3, '0')
  }

  // Convert waypoints to camera import data
  const convertWaypointsToCameras = (waypoints: GPXWaypoint[]): CameraImportData[] => {
    const currentYear = new Date().getFullYear()
    
    return waypoints.map((waypoint, index) => ({
      // Hardware data
      device_id: generateDeviceId(waypoint, index),
      brand: '', // Will be filled in by user
      model: '', // Will be filled in by user
      condition: 'good' as const,
      active: true,
      
      // Deployment data
      location_name: waypoint.name,
      latitude: waypoint.latitude,
      longitude: waypoint.longitude,
      season_year: currentYear,
      has_solar_panel: false,
      notes: waypoint.description || '',
      
      // Import metadata
      source_name: waypoint.name,
      import_notes: `Imported from GPX file${waypoint.symbol ? ` (${waypoint.symbol})` : ''}`
    }))
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('Please select a valid GPX file')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const parsedWaypoints = await parseGPXFile(file)
      
      if (parsedWaypoints.length === 0) {
        throw new Error('No waypoints found in GPX file')
      }

      setWaypoints(parsedWaypoints)
      const cameras = convertWaypointsToCameras(parsedWaypoints)
      setCameraData(cameras)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process GPX file')
    } finally {
      setProcessing(false)
    }
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  // Update camera data
  const updateCameraData = (index: number, updates: Partial<CameraImportData>) => {
    setCameraData(prev => prev.map((camera, i) => 
      i === index ? { ...camera, ...updates } : camera
    ))
  }

  // Handle import
  const handleImportCameras = async () => {
    // Validate required fields
    const missingFields = cameraData.some(camera => 
      !camera.device_id.trim() || !camera.location_name.trim()
    )
    
    if (missingFields) {
      setError('All cameras must have a Device ID and Location Name')
      return
    }

    // Check for duplicate device IDs
    const deviceIds = cameraData.map(c => c.device_id.trim().toLowerCase())
    const duplicates = deviceIds.filter((id, index) => deviceIds.indexOf(id) !== index)
    
    if (duplicates.length > 0) {
      setError(`Duplicate Device IDs found: ${duplicates.join(', ')}`)
      return
    }

    try {
      await onImport(cameraData)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import cameras')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-olive-green text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload size={20} />
            Import Cameras from GPX
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-pine-needle rounded transition-colors"
            disabled={isImporting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Upload GPX File</h3>
                <p className="text-gray-600">
                  Select a GPX file exported from onX maps containing waypoints for your trail cameras.
                </p>
              </div>

              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-olive-green bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop your GPX file here or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-olive-green hover:text-pine-needle underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-gray-500">GPX files only</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={processing}
                />
              </div>

              {/* Processing indicator */}
              {processing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-olive-green">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Processing GPX file...</span>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview and Configure */}
          {step === 'preview' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Review Import Data</h3>
                <p className="text-gray-600">
                  Found {cameraData.length} waypoints. Review and configure camera details before importing.
                </p>
              </div>

              {/* Camera List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cameraData.map((camera, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Device ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Device ID *
                        </label>
                        <input
                          type="text"
                          value={camera.device_id}
                          onChange={(e) => updateCameraData(index, { device_id: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                          placeholder="e.g., 002, 013"
                        />
                      </div>

                      {/* Location Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location Name *
                        </label>
                        <input
                          type="text"
                          value={camera.location_name}
                          onChange={(e) => updateCameraData(index, { location_name: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                        />
                      </div>

                      {/* Brand */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand
                        </label>
                        <select
                          value={camera.brand}
                          onChange={(e) => updateCameraData(index, { brand: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                        >
                          <option value="">Select Brand</option>
                          <option value="Reconyx">Reconyx</option>
                          <option value="Stealth Cam">Stealth Cam</option>
                          <option value="Moultrie">Moultrie</option>
                          <option value="Bushnell">Bushnell</option>
                          <option value="Spypoint">Spypoint</option>
                          <option value="Cuddeback">Cuddeback</option>
                          <option value="Primos">Primos</option>
                        </select>
                      </div>

                      {/* Coordinates (read-only) */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Coordinates
                        </label>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={16} />
                          <span>{camera.latitude.toFixed(6)}, {camera.longitude.toFixed(6)}</span>
                        </div>
                      </div>

                      {/* Solar Panel */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`solar-${index}`}
                          checked={camera.has_solar_panel}
                          onChange={(e) => updateCameraData(index, { has_solar_panel: e.target.checked })}
                          className="h-4 w-4 text-olive-green focus:ring-olive-green border-gray-300 rounded"
                        />
                        <label htmlFor={`solar-${index}`} className="ml-2 text-sm text-gray-700">
                          Has solar panel
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isImporting}
                >
                  Back
                </button>
                <button
                  onClick={handleImportCameras}
                  disabled={isImporting}
                  className="bg-olive-green text-white px-6 py-2 rounded-md hover:bg-pine-needle transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Import {cameraData.length} Cameras
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
