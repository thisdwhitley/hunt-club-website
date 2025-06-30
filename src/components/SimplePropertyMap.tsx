'use client'

// src/components/SimplePropertyMap.tsx - No external dependencies, works with any React version
import React, { useState } from 'react'
import { 
  MapPin, 
  Camera, 
  Wheat, 
  Route, 
  Map,
  Target,
  Settings,
  X,
  Plus,
  Edit3,
  Save,
  Zap
} from 'lucide-react'

interface PropertyMapProps {
  className?: string
  height?: string
}

interface MapItem {
  id: string
  name: string
  type: 'stand' | 'camera' | 'plot' | 'trail' | 'boundary'
  x: number // Percentage position on map (0-100)
  y: number // Percentage position on map (0-100)
  description?: string
  details?: Record<string, any>
}

export default function SimplePropertyMap({ className = '', height = '500px' }: PropertyMapProps) {
  const [showLayerControls, setShowLayerControls] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null)
  const [layerVisibility, setLayerVisibility] = useState({
    stands: true,
    cameras: true,
    plots: true,
    trails: true,
    boundaries: true
  })

  // Sample property data positioned on a 100x100 grid
  const mapItems: MapItem[] = [
    // Hunting Stands
    { 
      id: 'stand-1', 
      name: 'North Stand', 
      type: 'stand', 
      x: 25, 
      y: 20,
      description: 'Elevated tree stand overlooking north food plot',
      details: { type: 'tree', height: '15ft', capacity: '2 hunters' }
    },
    { 
      id: 'stand-2', 
      name: 'Creek Stand', 
      type: 'stand', 
      x: 60, 
      y: 70,
      description: 'Ground blind near creek crossing',
      details: { type: 'ground', camo: 'natural', capacity: '1 hunter' }
    },
    { 
      id: 'stand-3', 
      name: 'South Ridge', 
      type: 'stand', 
      x: 80, 
      y: 85,
      description: 'Ladder stand on southern ridge',
      details: { type: 'ladder', height: '12ft', capacity: '1 hunter' }
    },
    
    // Trail Cameras
    { 
      id: 'camera-1', 
      name: 'North Ridge Cam', 
      type: 'camera', 
      x: 30, 
      y: 15,
      description: 'Cellular camera monitoring north food plot',
      details: { brand: 'Reconyx', type: 'cellular', battery: '85%' }
    },
    { 
      id: 'camera-2', 
      name: 'Creek Crossing', 
      type: 'camera', 
      x: 55, 
      y: 65,
      description: 'Standard camera at main creek crossing',
      details: { brand: 'Stealth Cam', type: 'standard', battery: '60%' }
    },
    { 
      id: 'camera-3', 
      name: 'Oak Grove Cam', 
      type: 'camera', 
      x: 40, 
      y: 45,
      description: 'Camera in large oak grove',
      details: { brand: 'Bushnell', type: 'standard', battery: '90%' }
    },
    
    // Food Plots
    { 
      id: 'plot-1', 
      name: 'North Clover Plot', 
      type: 'plot', 
      x: 20, 
      y: 25,
      description: 'Large clover plot - primary deer food source',
      details: { crop: 'White Clover', size: '2.5 acres', planted: 'Spring 2024' }
    },
    { 
      id: 'plot-2', 
      name: 'Creek Bottom Plot', 
      type: 'plot', 
      x: 65, 
      y: 75,
      description: 'Corn plot in fertile creek bottom',
      details: { crop: 'Field Corn', size: '1.8 acres', planted: 'May 2024' }
    },
    { 
      id: 'plot-3', 
      name: 'South Brassica Plot', 
      type: 'plot', 
      x: 75, 
      y: 80,
      description: 'Late season brassica plot',
      details: { crop: 'Turnips & Radishes', size: '1.2 acres', planted: 'August 2024' }
    }
  ]

  const getItemColor = (type: string) => {
    switch (type) {
      case 'stand': return '#059669' // green
      case 'camera': return '#dc2626' // red  
      case 'plot': return '#d97706' // amber
      case 'trail': return '#2563eb' // blue
      case 'boundary': return '#7c2d12' // brown
      default: return '#6b7280' // gray
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'stand': return '🎯'
      case 'camera': return '📷'
      case 'plot': return '🌾'
      case 'trail': return '🥾'
      case 'boundary': return '🗺️'
      default: return '📍'
    }
  }

  const getItemComponent = (type: string) => {
    switch (type) {
      case 'stand': return Target
      case 'camera': return Camera
      case 'plot': return Wheat
      case 'trail': return Route
      case 'boundary': return Map
      default: return MapPin
    }
  }

  const filteredItems = mapItems.filter(item => {
    switch (item.type) {
      case 'stand': return layerVisibility.stands
      case 'camera': return layerVisibility.cameras
      case 'plot': return layerVisibility.plots
      case 'trail': return layerVisibility.trails
      case 'boundary': return layerVisibility.boundaries
      default: return true
    }
  })

  const toggleLayerVisibility = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }))
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    console.log(`Add new item at: ${x.toFixed(1)}%, ${y.toFixed(1)}%`)
    // TODO: Add new item functionality
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Layer Controls */}
      {showLayerControls && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
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
              <span className="text-sm">Hunting Stands (3)</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={layerVisibility.cameras}
                onChange={() => toggleLayerVisibility('cameras')}
                className="rounded border-gray-300"
              />
              <Camera size={16} className="text-red-600" />
              <span className="text-sm">Trail Cameras (3)</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={layerVisibility.plots}
                onChange={() => toggleLayerVisibility('plots')}
                className="rounded border-gray-300"
              />
              <Wheat size={16} className="text-amber-600" />
              <span className="text-sm">Food Plots (3)</span>
            </label>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="absolute top-4 left-4 flex space-x-2 z-40">
        <button
          onClick={() => setShowLayerControls(!showLayerControls)}
          className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Layer Controls"
        >
          <Settings size={20} className="text-gray-600" />
        </button>
        
        <button
          onClick={() => setEditMode(!editMode)}
          className={`p-2 rounded-lg shadow-lg transition-colors ${
            editMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          title="Edit Mode"
        >
          {editMode ? <Save size={20} /> : <Edit3 size={20} />}
        </button>
      </div>

      {/* Property Outline */}
      <div 
        className="relative bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-dashed border-green-300 overflow-hidden cursor-crosshair"
        style={{ height: '100%', width: '100%' }}
        onClick={handleMapClick}
      >
        {/* Property Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-px h-full bg-green-600"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-green-600"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-green-600"></div>
          <div className="absolute top-1/4 left-0 w-full h-px bg-green-600"></div>
          <div className="absolute top-2/4 left-0 w-full h-px bg-green-600"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-green-600"></div>
        </div>

        {/* Terrain Features */}
        <div className="absolute top-[60%] left-[20%] w-[60%] h-[3px] bg-blue-400 rounded opacity-60" title="Creek"></div>
        <div className="absolute top-[10%] left-[70%] w-[25%] h-[30%] bg-green-200 rounded-lg opacity-40" title="Dense Woods"></div>
        <div className="absolute top-[40%] left-[30%] w-[20%] h-[15%] bg-yellow-100 rounded-lg opacity-60" title="Open Field"></div>

        {/* Property Items */}
        {filteredItems.map((item) => {
          const IconComponent = getItemComponent(item.type)
          return (
            <div
              key={item.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ 
                left: `${item.x}%`, 
                top: `${item.y}%`,
                zIndex: selectedItem?.id === item.id ? 30 : 20
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedItem(item)
              }}
            >
              {/* Item Marker */}
              <div 
                className="w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: getItemColor(item.type) }}
                title={item.name}
              >
                <IconComponent size={16} />
              </div>
              
              {/* Item Label */}
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.name}
              </div>
            </div>
          )
        })}

        {/* Property Info */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow text-sm">
          <h4 className="font-semibold text-gray-900 mb-1">Caswell County Yacht Club</h4>
          <p className="text-gray-600 text-xs">3843 Quick Rd, Ruffin, NC 27326</p>
          <p className="text-gray-600 text-xs">100 acres • 36.425°N, 79.515°W</p>
        </div>

        {/* Compass */}
        <div className="absolute top-4 right-20 bg-white bg-opacity-90 p-2 rounded-full shadow text-xs font-bold text-gray-600">
          N ↑
        </div>

        {/* Edit Mode Instructions */}
        {editMode && (
          <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow text-sm">
            Click anywhere to add new items
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2" style={{ color: getItemColor(selectedItem.type) }}>
                  {getItemIcon(selectedItem.type)}
                </span>
                {selectedItem.name}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedItem.description && (
              <p className="text-gray-600 mb-4">{selectedItem.description}</p>
            )}
            
            {selectedItem.details && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Details:</h4>
                {Object.entries(selectedItem.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Position: {selectedItem.x.toFixed(1)}%, {selectedItem.y.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
