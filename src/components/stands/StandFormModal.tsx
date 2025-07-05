'use client'

// src/components/stands/StandFormModal.tsx
// Comprehensive form for creating and editing hunting stands

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, MapPin, Info, Calendar, BarChart3 } from 'lucide-react'
import { StandService } from '@/lib/database/stands'

// Stand type from your database schema
export interface Stand {
  id: string
  name: string
  description: string | null
  type: 'ladder_stand' | 'bale_blind' | 'box_stand' | 'tripod'
  active: boolean
  latitude: number | null
  longitude: number | null
  trail_name: string | null
  walking_time_minutes: number | null
  access_notes: string | null
  height_feet: number | null
  capacity: number | null
  time_of_day: 'AM' | 'PM' | 'ALL' | null
  view_distance_yards: number | null
  nearby_water_source: boolean | null
  total_hunts: number | null
  total_harvests: number | null
  last_used_date: string | null
  season_hunts: number | null
  food_source: 'field' | 'feeder' | null
  archery_season: boolean | null
  trail_camera_name: string | null
  created_at: string
  updated_at: string
}

// Form validation schema
const StandFormSchema = z.object({
  name: z.string().min(1, 'Stand name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['ladder_stand', 'bale_blind', 'box_stand', 'tripod']),
  active: z.boolean(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  trail_name: z.string().max(100, 'Trail name too long').optional(),
  walking_time_minutes: z.number().min(0).max(120).nullable(),
  access_notes: z.string().max(500, 'Access notes too long').optional(),
  height_feet: z.number().min(0).max(50).nullable(),
  capacity: z.number().min(1).max(10).nullable(),
  time_of_day: z.enum(['AM', 'PM', 'ALL']).nullable(),
  view_distance_yards: z.number().min(0).max(1000).nullable(),
  nearby_water_source: z.boolean().nullable(),
  food_source: z.enum(['field', 'feeder']).nullable(),
  archery_season: z.boolean().nullable(),
  trail_camera_name: z.string().max(100, 'Camera name too long').optional(),
  // Stats fields - these will be read-only in edit mode
  total_hunts: z.number().min(0).nullable(),
  total_harvests: z.number().min(0).nullable(),
  season_hunts: z.number().min(0).nullable(),
  last_used_date: z.string().nullable()
}).refine((data) => {
  // Custom validation: if latitude is provided, longitude must also be provided
  if ((data.latitude !== null && data.latitude !== undefined) && 
      (data.longitude === null || data.longitude === undefined)) {
    return false
  }
  if ((data.longitude !== null && data.longitude !== undefined) && 
      (data.latitude === null || data.latitude === undefined)) {
    return false
  }
  return true
}, {
  message: "Both latitude and longitude must be provided together",
  path: ["latitude"]
})

type StandFormData = z.infer<typeof StandFormSchema>

interface StandFormModalProps {
  stand?: Stand | null
  onClose: () => void
  onSubmit: () => void
}

export default function StandFormModal({ stand, onClose, onSubmit }: StandFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'features' | 'stats'>('basic')
  const standService = new StandService()
  
  const isEditing = !!stand

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<StandFormData>({
    resolver: zodResolver(StandFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'ladder_stand',
      active: true,
      latitude: null,
      longitude: null,
      trail_name: '',
      walking_time_minutes: null,
      access_notes: '',
      height_feet: null,
      capacity: null,
      time_of_day: null,
      view_distance_yards: null,
      nearby_water_source: null,
      food_source: null,
      archery_season: null,
      trail_camera_name: '',
      total_hunts: null,
      total_harvests: null,
      season_hunts: null,
      last_used_date: null
    }
  })

  // Populate form when editing
  useEffect(() => {
    if (stand) {
      reset({
        name: stand.name,
        description: stand.description || '',
        type: stand.type,
        active: stand.active,
        latitude: stand.latitude,
        longitude: stand.longitude,
        trail_name: stand.trail_name || '',
        walking_time_minutes: stand.walking_time_minutes,
        access_notes: stand.access_notes || '',
        height_feet: stand.height_feet,
        capacity: stand.capacity,
        time_of_day: stand.time_of_day,
        view_distance_yards: stand.view_distance_yards,
        nearby_water_source: stand.nearby_water_source,
        food_source: stand.food_source,
        archery_season: stand.archery_season,
        trail_camera_name: stand.trail_camera_name || '',
        total_hunts: stand.total_hunts,
        total_harvests: stand.total_harvests,
        season_hunts: stand.season_hunts,
        last_used_date: stand.last_used_date
      })
    }
  }, [stand, reset])

  const onFormSubmit = async (data: StandFormData) => {
    try {
      setIsSubmitting(true)

      // Prepare data for database (convert empty strings to null and only include valid fields)
      const dbData = {
        name: data.name,
        description: data.description || null,
        type: data.type,
        active: data.active,
        latitude: data.latitude,
        longitude: data.longitude,
        trail_name: data.trail_name || null,
        walking_time_minutes: data.walking_time_minutes,
        access_notes: data.access_notes || null,
        height_feet: data.height_feet,
        capacity: data.capacity,
        time_of_day: data.time_of_day,
        view_distance_yards: data.view_distance_yards,
        nearby_water_source: data.nearby_water_source,
        food_source: data.food_source,
        archery_season: data.archery_season,
        trail_camera_name: data.trail_camera_name || null,
        total_hunts: data.total_hunts,
        total_harvests: data.total_harvests,
        season_hunts: data.season_hunts,
        last_used_date: data.last_used_date
      }

      console.log('🔍 Form submitting data:', dbData)

      if (isEditing && stand) {
        await standService.updateStand(stand.id, dbData)
      } else {
        await standService.createStand(dbData)
      }

      onSubmit()
    } catch (error) {
      console.error('Error saving stand:', error)
      alert(`Failed to ${isEditing ? 'update' : 'create'} stand: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get current location for coordinates
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', Number(position.coords.latitude.toFixed(6)))
          setValue('longitude', Number(position.coords.longitude.toFixed(6)))
        },
        (error) => {
          alert('Unable to get location: ' + error.message)
        }
      )
    } else {
      alert('Geolocation is not supported by this browser')
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'features', label: 'Features', icon: Calendar },
    { id: 'stats', label: 'Statistics', icon: BarChart3 }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-olive-green text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? `Edit ${stand?.name}` : 'Add New Stand'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-pine-needle rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-olive-green text-olive-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    {tab.label}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="overflow-y-auto max-h-[60vh]">
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Stand Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Stand Name *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="e.g., North Ridge Stand"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Stand Type */}
                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Stand Type *
                    </label>
                    <select
                      {...register('type')}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                    >
                      <option value="ladder_stand">Ladder Stand</option>
                      <option value="bale_blind">Bale Blind</option>
                      <option value="box_stand">Box Stand</option>
                      <option value="tripod">Tripod</option>
                    </select>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <label className="flex items-center gap-3">
                      <input
                        {...register('active')}
                        type="checkbox"
                        className="w-5 h-5 text-olive-green bg-morning-mist border-gray-300 rounded focus:ring-olive-green focus:ring-2"
                      />
                      <span className="text-sm font-medium text-forest-shadow">
                        Stand is Active
                      </span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-forest-shadow mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                    placeholder="Describe the stand location, nearby features, etc."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Coordinates */}
                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Latitude
                    </label>
                    <input
                      {...register('latitude', { valueAsNumber: true })}
                      type="number"
                      step="0.000001"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="36.427236"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Longitude
                    </label>
                    <input
                      {...register('longitude', { valueAsNumber: true })}
                      type="number"
                      step="0.000001"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="-79.510881"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="bg-muted-gold hover:bg-sunset-amber text-forest-shadow px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Get Current Location
                    </button>
                    {errors.latitude && (
                      <p className="text-red-600 text-sm mt-1">{errors.latitude.message}</p>
                    )}
                  </div>

                  {/* Trail Info */}
                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Trail Name
                    </label>
                    <input
                      {...register('trail_name')}
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="Main Trail"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Walking Time (minutes)
                    </label>
                    <input
                      {...register('walking_time_minutes', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max="120"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="15"
                    />
                  </div>
                </div>

                {/* Access Notes */}
                <div>
                  <label className="block text-sm font-medium text-forest-shadow mb-2">
                    Access Notes
                  </label>
                  <textarea
                    {...register('access_notes')}
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                    placeholder="Directions to reach the stand, safety notes, etc."
                  />
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Physical Properties */}
                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Height (feet)
                    </label>
                    <input
                      {...register('height_feet', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max="50"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Capacity (hunters)
                    </label>
                    <input
                      {...register('capacity', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="10"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      View Distance (yards)
                    </label>
                    <input
                      {...register('view_distance_yards', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max="1000"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Best Time of Day
                    </label>
                    <select
                      {...register('time_of_day')}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                    >
                      <option value="">Not specified</option>
                      <option value="AM">Morning (AM)</option>
                      <option value="PM">Evening (PM)</option>
                      <option value="ALL">All Day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Food Source
                    </label>
                    <select
                      {...register('food_source')}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                    >
                      <option value="">None</option>
                      <option value="field">Field</option>
                      <option value="feeder">Feeder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Trail Camera Name
                    </label>
                    <input
                      {...register('trail_camera_name')}
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="North Ridge Cam"
                    />
                  </div>
                </div>

                {/* Boolean Features */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      {...register('nearby_water_source')}
                      type="checkbox"
                      className="w-5 h-5 text-olive-green bg-morning-mist border-gray-300 rounded focus:ring-olive-green focus:ring-2"
                    />
                    <span className="text-sm font-medium text-forest-shadow">
                      Nearby Water Source
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      {...register('archery_season')}
                      type="checkbox"
                      className="w-5 h-5 text-olive-green bg-morning-mist border-gray-300 rounded focus:ring-olive-green focus:ring-2"
                    />
                    <span className="text-sm font-medium text-forest-shadow">
                      Archery Season Suitable
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Statistics are typically updated automatically when hunt logs are created. 
                    You can manually adjust these values if needed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Total Hunts
                    </label>
                    <input
                      {...register('total_hunts', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Total Harvests
                    </label>
                    <input
                      {...register('total_harvests', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Season Hunts
                    </label>
                    <input
                      {...register('season_hunts', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      Last Used Date
                    </label>
                    <input
                      {...register('last_used_date')}
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-morning-mist focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-weathered-wood hover:text-forest-shadow font-medium transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="bg-burnt-orange hover:bg-clay-earth text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? 'Update Stand' : 'Create Stand'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
