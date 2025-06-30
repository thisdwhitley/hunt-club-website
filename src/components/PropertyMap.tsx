'use client'

// src/components/PropertyMap.tsx
import React, { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { 
  MapPin, 
  Camera, 
  Wheat, 
  Route, 
  Map,
  Plus,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Settings,
  Navigation,
  Target
} from 'lucide-react'
import { useMapData } from '@/hooks/useMapData'
import { useAuth } from '@/hooks/useAuth'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
)

// Property center coordinates for Ruffin, NC
const PROPERTY_CENTER: [number, number] = [36.425, -79.515]
const DEFAULT_ZOOM = 16

interface PropertyMapProps {
  className?: string
  height?: string
}

export default function PropertyMap({ className = '', height = '500px' }: PropertyMapProps) {
  const { user } = useAuth()
  const { mapData, loading, error, layerVisibility, toggleLayerVisibility, addStand, addTrailCamera, addFoodPlot } = useMapData()
  const mapRef = useRef<any>(null)
  
  const [editMode, setEditMode] = useState(false)
  const [addingType, setAddingType] = useState<'stand' | 'camera' | 'plot' | null>(null)
  const [showLayerControls, setShowLayerControls] = useState(false)
  const [newMarkerPosition, setNewMarkerPosition] = useState<[number, number] | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', type: 'tree' })

  // Create custom icons (for now using CSS classes)
  const createCustomIcon = (type: string, color: string) => {
    if (typeof window === 'undefined') return null
    
    const L = require('leaflet')
    return L.divIcon({
      className: `hunting-marker ${type}-marker`,
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
        ${type === 'stand' ? '🎯' : type === 'camera' ? '📷' : '🌾'}
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    })
  }

  const handleMapClick = (e: any) => {
    if (editMode && addingType && user) {
      const { lat, lng } = e.latlng
      setNewMarkerPosition([lat, lng])
      setShowAddModal(true)
    }
  }

  const handleAddItem = async () => {
    if (!newMarkerPosition || !addingType || !user) return

    const [lat, lng] = newMarkerPosition
    const itemData = {
      name: formData.name,
      description: formData.description,
      latitude: lat,
      longitude: lng,
      type: formData.type,
      active: true
    }

    try {
      let result
      switch (addingType) {
        case 'stand':
          result = await addStand(itemData)
          break
        case 'camera':
          result = await addTrailCamera({
            ...itemData,
            type: formData.type || 'standard'
          })
          break
        case 'plot':
          result = await addFoodPlot({
            ...itemData,
            plot_type: formData.type || 'clover'
          })
          break
      }

      if (result?.success) {
        setShowAddModal(false)
        setNewMarkerPosition(null)
        setFormData({ name: '', description: '', type: 'tree' })
        setAddingType(null)
      }
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const LayerControls = () => (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Map Layers</h3>
        <button
          onClick={() => setShowLayerControls(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="space-y-2 min-w-[200px]">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layerVisibility.stands}
            onChange={() => toggleLayerVisibility('stands')}
            className="rounded border-gray-300"
          />
          <Target size={16} className="text-green-600" />
          <span className="text-sm">Hunting Stands ({mapData.stands.length})</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layerVisibility.trailCameras}
            onChange={() => toggleLayerVisibility('trailCameras')}
            className="rounded border-gray-300"
          />
          <Camera size={16} className="text-red-600" />
          <span className="text-sm">Trail Cameras ({mapData.trailCameras.length})</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layerVisibility.foodPlots}
            onChange={() => toggleLayerVisibility('foodPlots')}
            className="rounded border-gray-300"
          />
          <Wheat size={16} className="text-amber-600" />
          <span className="text-sm">Food Plots ({mapData.foodPlots.length})</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layerVisibility.trails}
            onChange={() => toggleLayerVisibility('trails')}
            className="rounded border-gray-300"
          />
          <Route size={16} className="text-blue-600" />
          <span className="text-sm">Trails ({mapData.trails.length})</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layerVisibility.propertyBoundaries}
            onChange={() => toggleLayerVisibility('propertyBoundaries')}
            className="rounded border-gray-300"
          />
          <Map size={16} className="text-stone-600" />
          <span className="text-sm">Property Bounds ({mapData.propertyBoundaries.length})</span>
        </label>
      </div>
    </div>
  )

  const EditControls = () => (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
      <div className="flex flex-col space-y-2">
        {editMode ? (
          <>
            <div className="text-xs font-medium text-gray-600 mb-2">Add New Item:</div>
            <button
              onClick={() => setAddingType(addingType === 'stand' ? null : 'stand')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
                addingType === 'stand' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Target size={16} />
              <span>Stand</span>
            </button>
            
            <button
              onClick={() => setAddingType(addingType === 'camera' ? null : 'camera')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
                addingType === 'camera' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Camera size={16} />
              <span>Camera</span>
            </button>
            
            <button
              onClick={() => setAddingType(addingType === 'plot' ? null : 'plot')}
              className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
                addingType === 'plot' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Wheat size={16} />
              <span>Food Plot</span>
            </button>
            
            <hr className="my-2" />
            
            <button
              onClick={() => {
                setEditMode(false)
                setAddingType(null)
                setNewMarkerPosition(null)
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              <Save size={16} />
              <span>Done</span>
            </button>
          </>
        ) : (
          user && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit Map</span>
            </button>
          )
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="map-loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="font-medium">Failed to load map</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`relative ${className}`} style={{ height }}>
        {/* Map Controls */}
        <div className="absolute top-4 right-16 z-[1000]">
          <button
            onClick={() => setShowLayerControls(!showLayerControls)}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="Layer Controls"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Layer Controls */}
        {showLayerControls && <LayerControls />}
        
        {/* Edit Controls */}
        <EditControls />

        {/* Instructions for edit mode */}
        {editMode && addingType && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
            <p className="text-sm">Click on the map to add a new {addingType}</p>
          </div>
        )}

        {/* Map */}
        <MapContainer
          center={PROPERTY_CENTER}
          zoom={DEFAULT_ZOOM}
          className={`map-container ${editMode ? 'map-edit-mode' : ''}`}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          onClick={handleMapClick}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Hunting Stands */}
          {layerVisibility.stands && mapData.stands.map((stand) => (
            stand.latitude && stand.longitude && (
              <Marker
                key={`stand-${stand.id}`}
                position={[stand.latitude, stand.longitude]}
                icon={createCustomIcon('stand', '#059669')}
              >
                <Popup>
                  <div className="popup-content">
                    <h4 className="popup-title">🎯 {stand.name}</h4>
                    {stand.description && (
                      <p className="popup-info">{stand.description}</p>
                    )}
                    <p className="popup-info">Type: {stand.type}</p>
                    <p className="popup-coordinates">
                      {stand.latitude.toFixed(6)}, {stand.longitude.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Trail Cameras */}
          {layerVisibility.trailCameras && mapData.trailCameras.map((camera) => (
            <Marker
              key={`camera-${camera.id}`}
              position={[camera.latitude, camera.longitude]}
              icon={createCustomIcon('camera', '#dc2626')}
            >
              <Popup>
                <div className="popup-content">
                  <h4 className="popup-title">📷 {camera.name}</h4>
                  {camera.description && (
                    <p className="popup-info">{camera.description}</p>
                  )}
                  <p className="popup-info">Type: {camera.type}</p>
                  {camera.brand && (
                    <p className="popup-info">Brand: {camera.brand}</p>
                  )}
                  {camera.battery_level && (
                    <p className="popup-info">Battery: {camera.battery_level}%</p>
                  )}
                  <p className="popup-coordinates">
                    {camera.latitude.toFixed(6)}, {camera.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Food Plots */}
          {layerVisibility.foodPlots && mapData.foodPlots.map((plot) => (
            <Marker
              key={`plot-${plot.id}`}
              position={[plot.latitude, plot.longitude]}
              icon={createCustomIcon('plot', '#d97706')}
            >
              <Popup>
                <div className="popup-content">
                  <h4 className="popup-title">🌾 {plot.name}</h4>
                  {plot.description && (
                    <p className="popup-info">{plot.description}</p>
                  )}
                  <p className="popup-info">Type: {plot.plot_type}</p>
                  {plot.crop_type && (
                    <p className="popup-info">Crop: {plot.crop_type}</p>
                  )}
                  {plot.size_acres && (
                    <p className="popup-info">Size: {plot.size_acres} acres</p>
                  )}
                  <p className="popup-coordinates">
                    {plot.latitude.toFixed(6)}, {plot.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Trails */}
          {layerVisibility.trails && mapData.trails.map((trail) => {
            const coordinates = trail.path_coordinates as [number, number][]
            return coordinates && coordinates.length > 1 ? (
              <Polyline
                key={`trail-${trail.id}`}
                positions={coordinates}
                pathOptions={{
                  color: '#2563eb',
                  weight: 3,
                  dashArray: '5,5'
                }}
              >
                <Popup>
                  <div className="popup-content">
                    <h4 className="popup-title">🥾 {trail.name}</h4>
                    {trail.description && (
                      <p className="popup-info">{trail.description}</p>
                    )}
                    <p className="popup-info">Type: {trail.trail_type}</p>
                    {trail.length_miles && (
                      <p className="popup-info">Length: {trail.length_miles} miles</p>
                    )}
                    {trail.difficulty && (
                      <p className="popup-info">Difficulty: {trail.difficulty}</p>
                    )}
                  </div>
                </Popup>
              </Polyline>
            ) : null
          })}

          {/* Property Boundaries */}
          {layerVisibility.propertyBoundaries && mapData.propertyBoundaries.map((boundary) => {
            const coordinates = boundary.boundary_coordinates as [number, number][]
            return coordinates && coordinates.length > 2 ? (
              <Polygon
                key={`boundary-${boundary.id}`}
                positions={coordinates}
                pathOptions={{
                  color: '#7c2d12',
                  weight: 2,
                  fillColor: '#22c55e',
                  fillOpacity: 0.1,
                  dashArray: '10,5'
                }}
              >
                <Popup>
                  <div className="popup-content">
                    <h4 className="popup-title">🗺️ {boundary.name}</h4>
                    {boundary.description && (
                      <p className="popup-info">{boundary.description}</p>
                    )}
                    <p className="popup-info">Type: {boundary.boundary_type}</p>
                    {boundary.area_acres && (
                      <p className="popup-info">Area: {boundary.area_acres} acres</p>
                    )}
                  </div>
                </Popup>
              </Polygon>
            ) : null
          })}

          {/* New marker being placed */}
          {newMarkerPosition && (
            <Marker
              position={newMarkerPosition}
              icon={createCustomIcon(addingType || 'stand', '#6b7280')}
            />
          )}
        </MapContainer>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add New {addingType === 'stand' ? 'Hunting Stand' : addingType === 'camera' ? 'Trail Camera' : 'Food Plot'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewMarkerPosition(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`Enter ${addingType} name`}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {addingType === 'stand' && (
                    <>
                      <option value="tree">Tree Stand</option>
                      <option value="ground">Ground Blind</option>
                      <option value="ladder">Ladder Stand</option>
                      <option value="box">Box Stand</option>
                    </>
                  )}
                  {addingType === 'camera' && (
                    <>
                      <option value="standard">Standard Camera</option>
                      <option value="cellular">Cellular Camera</option>
                      <option value="video">Video Camera</option>
                    </>
                  )}
                  {addingType === 'plot' && (
                    <>
                      <option value="clover">Clover Plot</option>
                      <option value="corn">Corn Plot</option>
                      <option value="beans">Bean Plot</option>
                      <option value="brassica">Brassica Plot</option>
                      <option value="chicory">Chicory Plot</option>
                    </>
                  )}
                </select>
              </div>
              
              {newMarkerPosition && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Coordinates:</strong><br />
                    Lat: {newMarkerPosition[0].toFixed(6)}<br />
                    Lng: {newMarkerPosition[1].toFixed(6)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewMarkerPosition(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add {addingType === 'stand' ? 'Stand' : addingType === 'camera' ? 'Camera' : 'Plot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
