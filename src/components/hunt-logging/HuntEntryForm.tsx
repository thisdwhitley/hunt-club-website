'use client'

// src/components/hunt-logging/HuntEntryForm.tsx
// Ultra-fast hunt entry form with proper design system alignment

import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Check, Clock, MapPin, Target, Plus, ArrowLeft, ChevronDown, Eye, AlertCircle, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { HuntFormSchema, type HuntFormData, type SightingData } from '@/lib/hunt-logging/hunt-validation'
import { createClient } from '@/lib/supabase/client'

// ===========================================
// TYPES & UTILS
// ===========================================

interface Stand {
  id: string
  name: string
  description?: string | null
  type?: string
  active: boolean
}

// Smart time period detection
function getCurrentTimePeriod(): 'AM' | 'PM' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'AM'   // 5 AM to 12 PM = Morning hunt
  if (hour >= 12 && hour < 20) return 'PM'  // 12 PM to 8 PM = Evening hunt
  return 'AM' // Default for late night/early morning entries
}

// Animal type options - simplified and appropriate
const animalTypes = [
  'Deer', 'Turkey', 'Coyote', 'Raccoon', 'Other'
]

// Context-aware gender options
const getGenderOptions = (animalType: string) => {
  switch (animalType.toLowerCase()) {
    case 'deer':
      return ['Buck', 'Doe', 'Unknown']
    case 'turkey':
      return ['Jake', 'Jennie', 'Tom', 'Hen', 'Unknown']
    default:
      return ['Unknown'] // Other animals - can't tell gender
  }
}

type HuntStep = 'basic' | 'harvest' | 'sightings' | 'success'  // Remove 'review', add 'success'

// ===========================================
// MAIN COMPONENT
// ===========================================

interface HuntEntryFormProps {
  stands: Stand[]
  onSubmit: (data: HuntFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function HuntEntryForm({ stands, onSubmit, onCancel, isSubmitting = false }: HuntEntryFormProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')
  const [showExactTimes, setShowExactTimes] = useState(false)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedHunter, setSelectedHunter] = useState(user?.id || '')
  const [members, setMembers] = useState<any[]>([])
  const [submittedHuntData, setSubmittedHuntData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    trigger,
    getValues
  } = useForm<HuntFormData>({
    resolver: zodResolver(HuntFormSchema),
    defaultValues: {
      hunt_date: new Date().toISOString().split('T')[0], // Today
      stand_id: '',
      start_time: '',
      end_time: '',
      had_harvest: false,
      notes: '',
      hunt_type: getCurrentTimePeriod(),
      sightings: []
    }
  })

  // useEffect(() => {
  //   const loadMembers = async () => {
  //     try {
  //       const supabase = createClient()
  //       const { data } = await supabase
  //         .from('members')
  //         .select('id, email, full_name, display_name')  // Get both display_name and full_name
  //         .order('display_name')
        
  //       setMembers(data || [])
        
  //       if (!selectedHunter && user?.id) {
  //         setSelectedHunter(user.id)
  //       }
  //     } catch (error) {
  //       console.error('Error loading members:', error)
  //     }
  //   }

  //   loadMembers()
  // }, [user, selectedHunter])

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('members')
          .select('id, email, full_name, display_name')
          .order('display_name')
        
        console.log('🎯 Loaded members from database:', data)
        setMembers(data || [])
        
        if (!selectedHunter && user?.id) {
          console.log('🎯 Setting initial selectedHunter to user.id:', user.id)
          setSelectedHunter(user.id)
        }
      } catch (error) {
        console.error('Error loading members:', error)
      }
    }
    
    loadMembers()
  }, [user, selectedHunter])

  const { fields: sightingFields, append: addSighting, remove: removeSighting } = useFieldArray({
    control,
    name: 'sightings'
  })

  const watchedValues = watch()
  const watchedHadHarvest = watch('had_harvest')

  // Add new sighting with default values
  const handleAddSighting = () => {
    addSighting({
      animal_type: 'Deer',
      count: 1,
      gender: 'Unknown',
      estimated_age: '',
      behavior: '',
      distance_yards: undefined,
      direction: 'Unknown',
      time_observed: '',
      notes: ''
    })
  }

  // Navigation handlers
  const handleBasicNext = () => {
    const isValid = trigger(['hunt_date', 'stand_id'])
    if (isValid) {
      if (watchedHadHarvest) {
        setCurrentStep('harvest')
      } else {
        // No harvest - can submit directly or add sightings
        // Navigation happens via button clicks, not automatic
      }
    }
  }

  const handleHarvestNext = () => {
    // Auto-add a sighting if going to sightings and none exist
    if (sightingFields.length === 0) {
      handleAddSighting()
    }
    setCurrentStep('sightings')
  }

  const handleHarvestSubmit = async () => {
    // Skip sightings and go straight to submit
    const isValid = await trigger(['hunt_date', 'stand_id'])
    if (isValid) {
      const formData = {
        ...getValues(),
        season: String(new Date().getFullYear())
      }
      await onSubmit(formData)
    }
  }

  const handleHarvestComplete = () => {
    // From harvest, user chooses submit or add sightings via buttons
    // Navigation happens via button clicks
  }

  const handleSightingsComplete = () => {
    // From sightings, submit directly (no review step)
    handleSubmitHunt()
  }

  const handleSubmitHunt = async () => {
    console.log('=== handleSubmitHunt called ===')
    console.log('🎯 handleSubmitHunt - selectedHunter:', selectedHunter)
    console.log('🎯 handleSubmitHunt - members list:', members)
    
    const isValid = await trigger(['hunt_date', 'stand_id'])
    if (isValid) {
      console.log('=== Form is valid ===')
      const formData = {
        ...getValues(),
        member_id: selectedHunter,
        season: String(new Date().getFullYear())
      }
      
    console.log('🎯 formData being sent to onSubmit:', formData)
    console.log('🎯 formData.member_id specifically:', formData.member_id)

    // const isValid = await trigger(['hunt_date', 'stand_id'])
    // if (isValid) {
    //   console.log('=== Form is valid ===')
    //   const formData = {
    //     ...getValues(),
    //     member_id: selectedHunter
    //   }
      
      // Store submitted data and show success BEFORE submitting
      setSubmittedHuntData({
        ...formData,
        hunter_name: members.find(m => m.id === selectedHunter)?.display_name || 
                    members.find(m => m.id === selectedHunter)?.full_name || 'Unknown',
        stand_name: stands.find(s => s.id === formData.stand_id)?.name || 'Unknown Stand'
      })
      
      console.log('=== Setting step to success ===')
      // Show success confirmation immediately
      setCurrentStep('success')
      
      console.log('=== Calling onSubmit in background ===')
      // Submit in background (don't await to avoid timing issues)
      onSubmit(formData).catch(error => {
        console.error('Error submitting hunt:', error)
        // If submission fails, go back to basic form
        setCurrentStep('basic')
        setSubmittedHuntData(null)
      })
    } else {
      console.log('=== Form validation failed ===')
    }
  }

  // const handleSightingsBack = () => {
  //   if (watchedHadHarvest) {
  //     setCurrentStep('harvest')
  //   } else {
  //     setCurrentStep('basic')
  //   }
  // }

  // const handleSightingsContinue = async () => {
  //   // Skip validation for now - just go to review
  //   console.log('Going to review with sightings:', getValues('sightings'))
  //   setCurrentStep('review')
  // }

  // const handleDirectSubmit = async () => {
  //   const isValid = await trigger(['hunt_date', 'stand_id'])
  //   if (isValid) {
  //     const formData = getValues()
  //     await onSubmit(formData)
  //   }
  // }

  // ===========================================
  // RENDER METHODS
  // ===========================================

  const renderBasicForm = () => (
    <div className="space-y-4">
      {/* Header - More Compact */}
      {/* <div className="text-center">
        <h2 className="text-lg font-bold text-forest-shadow">Log Hunt</h2>
        <p className="text-xs text-weathered-wood">Quick entry • All fields auto-saved</p>
      </div> */}

      {/* Advanced Options - Hunter Selection */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-bold text-forest-shadow">Log Hunt</h2>
          {members.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-weathered-wood hover:text-forest-shadow flex items-center"
            >
              <Settings className="w-3 h-3 mr-1" />
              {showAdvanced ? 'Less' : 'Options'}
            </button>
          )}
        </div>
      </div>

      {showAdvanced && members.length > 1 && (
        <div className="mb-4 p-3 bg-morning-mist/30 rounded-lg border border-weathered-wood/20">
          <label className="block text-xs text-weathered-wood mb-1">Log hunt for:</label>
          <select
            value={selectedHunter}
            onChange={(e) => {
              console.log('🎯 Dropdown changed to:', e.target.value)
              const selectedMember = members.find(m => m.id === e.target.value)
              console.log('🎯 Selected member:', selectedMember)
              setSelectedHunter(e.target.value)
            }}

            className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow text-sm"
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.display_name || member.full_name || member.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-xs text-weathered-wood mb-4">Quick entry • All fields auto-save</p>

      {/* Hunt Date & Time Period - Same Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-forest-shadow mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Hunt Date
          </label>
          <input
            type="date"
            {...register('hunt_date')}
            className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm h-10"
          />
          {errors.hunt_date && (
            <p className="text-xs text-clay-earth mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.hunt_date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-forest-shadow mb-2">
            <Clock className="inline w-4 h-4 mr-1" />
            Time
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['AM', 'PM', 'All Day'] as const).map((period) => (
              <label key={period} className="relative">
                <input
                  type="radio"
                  value={period}
                  {...register('hunt_type')}
                  className="sr-only"
                />
                <div className={`p-2 text-center border rounded text-sm cursor-pointer transition-all h-10 flex items-center justify-center ${
                  watchedValues.hunt_type === period
                    ? 'bg-olive-green text-white border-olive-green'
                    : 'bg-white border-weathered-wood/30 text-forest-shadow hover:border-olive-green/50'
                }`}>
                  {period === 'All Day' ? 'All' : period}
                </div>
              </label>
            ))}
          </div>
          {errors.hunt_type && (
            <p className="text-xs text-clay-earth mt-1">{errors.hunt_type.message}</p>
          )}
        </div>
      </div>

      {/* Stand Selection - REQUIRED */}
      <div>
        <label className="block text-sm font-medium text-forest-shadow mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Hunting Stand <span className="text-clay-earth">*</span>
        </label>
        <div className="relative">
          <select
            {...register('stand_id')}
            className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green appearance-none text-sm h-10"
          >
            <option value="">Select a stand...</option>
            {stands.filter(stand => stand.active).map((stand) => (
              <option key={stand.id} value={stand.id}>
                {stand.name} {stand.type && `(${stand.type.replace('_', ' ')})`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-weathered-wood pointer-events-none" />
        </div>
        {errors.stand_id && (
          <p className="text-sm text-clay-earth mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.stand_id.message}
          </p>
        )}
      </div>

      {/* Exact Times (Optional Expansion) - Right Below Date/Time Row */}
      <div>
        <button
          type="button"
          onClick={() => setShowExactTimes(!showExactTimes)}
          className="text-xs text-olive-green hover:text-forest-shadow flex items-center"
        >
          <Clock className="w-3 h-3 mr-1" />
          {showExactTimes ? 'Hide' : 'Add'} exact times (optional)
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showExactTimes ? 'rotate-180' : ''}`} />
        </button>
        
        {showExactTimes && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-xs text-weathered-wood mb-1">Start Time</label>
              <input
                type="time"
                {...register('start_time')}
                className="w-full p-2 border border-weathered-wood/30 rounded bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm h-10"
              />
            </div>
            <div>
              <label className="block text-xs text-weathered-wood mb-1">End Time</label>
              <input
                type="time"
                {...register('end_time')}
                className="w-full p-2 border border-weathered-wood/30 rounded bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm h-10"
              />
              {errors.end_time && (
                <p className="text-xs text-clay-earth mt-1">{errors.end_time.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Had Harvest Toggle - More Compact */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('had_harvest')}
            className="w-4 h-4 text-olive-green border-weathered-wood/30 rounded focus:ring-olive-green focus:ring-2"
          />
          <span className="text-sm font-medium text-forest-shadow">
            <Target className="inline w-4 h-4 mr-1" />
            Had harvest this hunt
          </span>
        </label>
      </div>

      {/* Notes (Optional) - More Compact */}
      <div>
        <label className="block text-sm font-medium text-forest-shadow mb-2">
          Hunt Notes (optional)
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Weather conditions, stand setup, observations..."
          className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green resize-none text-sm"
        />
        {errors.notes && (
          <p className="text-sm text-clay-earth mt-1">{errors.notes.message}</p>
        )}
      </div>

      {/* Action Buttons - Always show sightings option */}
      <div className="flex flex-col space-y-3 pt-2">
        {watchedHadHarvest ? (
          /* Has harvest - go to harvest details first */
          <button
            type="button"
            onClick={() => setCurrentStep('harvest')}
            className="w-full bg-burnt-orange text-white py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors"
          >
            Next: Harvest Details
          </button>
        ) : (
          /* No harvest - can submit directly */
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSubmitHunt}
              disabled={isSubmitting}
              className="w-full bg-burnt-orange text-white py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting Hunt Log...' : 'Submit Hunt Log'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (sightingFields.length === 0) {
                  handleAddSighting()
                }
                setCurrentStep('sightings')
              }}
              className="w-full bg-muted-gold text-forest-shadow py-2.5 rounded-lg font-medium hover:bg-sunset-amber transition-colors flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              + Add Sightings
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderHarvestForm = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-forest-shadow">Harvest Details</h2>
        <p className="text-xs text-weathered-wood">Add details about your harvest</p>
      </div>

      {/* Basic Harvest Info */}
      <div className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
        <h3 className="font-medium text-forest-shadow mb-3">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-weathered-wood mb-1">Animal Type</label>
            <select className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm">
              <option value="Deer">Deer</option>
              <option value="Turkey">Turkey</option>
              <option value="Coyote">Coyote</option>
              <option value="Raccoon">Raccoon</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-weathered-wood mb-1">Gender</label>
            <select className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm">
              <option value="Buck">Buck</option>
              <option value="Doe">Doe</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-weathered-wood mb-1">Est. Weight (lbs)</label>
            <input
              type="number"
              min="10"
              max="400"
              placeholder="150"
              className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-weathered-wood mb-1">Shot Distance (yards)</label>
            <input
              type="number"
              min="5"
              max="500"
              placeholder="25"
              className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
            />
          </div>
        </div>
        
        <div className="mt-3">
          <label className="block text-xs text-weathered-wood mb-1">Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Shot placement, tracking notes..."
            className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 pt-2">
        <button
          type="button"
          onClick={handleSubmitHunt}
          disabled={isSubmitting}
          className="w-full bg-burnt-orange text-white py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting Hunt Log...' : 'Submit Hunt Log'}
        </button>
        
        <button
          type="button"
          onClick={() => {
            if (sightingFields.length === 0) {
              handleAddSighting()
            }
            setCurrentStep('sightings')
          }}
          className="w-full bg-muted-gold text-forest-shadow py-2.5 rounded-lg font-medium hover:bg-sunset-amber transition-colors flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          + Add Sightings
        </button>
        
        <button
          type="button"
          onClick={() => setCurrentStep('basic')}
          className="w-full text-weathered-wood py-1.5 text-sm hover:text-forest-shadow transition-colors"
        >
          Back to Hunt Details
        </button>
      </div>
    </div>
  )

  const renderSightingsForm = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-forest-shadow">Animal Sightings</h2>
        <p className="text-xs text-weathered-wood">Add any animals observed during hunt</p>
      </div>

      {/* Sightings List */}
      <div className="space-y-4">
        {sightingFields.map((field, index) => {
          const currentAnimalType = watch(`sightings.${index}.animal_type`) || 'Deer'
          const genderOptions = getGenderOptions(currentAnimalType)
          
          return (
            <div key={field.id} className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-forest-shadow">Sighting {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeSighting(index)}
                  className="text-clay-earth hover:text-forest-shadow text-sm"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-weathered-wood mb-1">Animal Type</label>
                  <select
                    {...register(`sightings.${index}.animal_type`)}
                    className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
                  >
                    {animalTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {currentAnimalType === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify animal..."
                      className="w-full p-1 mt-1 border border-weathered-wood/30 rounded bg-white text-forest-shadow focus:ring-1 focus:ring-olive-green text-xs"
                    />
                  )}
                  {errors.sightings?.[index]?.animal_type && (
                    <p className="text-xs text-clay-earth mt-1">{errors.sightings[index]?.animal_type?.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-weathered-wood mb-1">Count</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    defaultValue={1}
                    {...register(`sightings.${index}.count`, { valueAsNumber: true })}
                    className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
                  />
                  {errors.sightings?.[index]?.count && (
                    <p className="text-xs text-clay-earth mt-1">{errors.sightings[index]?.count?.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-weathered-wood mb-1">
                    {currentAnimalType === 'Turkey' ? 'Type' : currentAnimalType === 'Deer' ? 'Gender' : 'Gender'}
                  </label>
                  <select
                    {...register(`sightings.${index}.gender`)}
                    className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
                    disabled={genderOptions.length === 1 && genderOptions[0] === 'Unknown'}
                  >
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-weathered-wood mb-1">Time (optional)</label>
                  <input
                    type="time"
                    {...register(`sightings.${index}.time_observed`)}
                    className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-xs text-weathered-wood mb-1">Behavior (optional)</label>
                <input
                  type="text"
                  placeholder="Feeding, alert, moving..."
                  {...register(`sightings.${index}.behavior`)}
                  className="w-full p-2 border border-weathered-wood/30 rounded-lg bg-white text-forest-shadow focus:ring-2 focus:ring-olive-green focus:border-olive-green text-sm"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Sighting Button */}
      <button
        type="button"
        onClick={handleAddSighting}
        className="w-full border-2 border-dashed border-olive-green/30 text-olive-green py-4 rounded-lg font-medium hover:border-olive-green/50 hover:bg-olive-green/5 transition-colors flex items-center justify-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Another Sighting
      </button>

      {/* Navigation Buttons */}
      <div className="flex flex-col space-y-3 pt-2">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              if (watchedHadHarvest) {
                setCurrentStep('harvest')
              } else {
                setCurrentStep('basic')
              }
            }}
            className="flex-1 border border-weathered-wood/30 text-forest-shadow py-2.5 rounded-lg font-medium hover:bg-weathered-wood/5 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <button
            type="button"
            onClick={handleSubmitHunt}
            disabled={isSubmitting}
            className="flex-1 bg-burnt-orange text-white py-2.5 rounded-lg font-medium hover:bg-clay-earth transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Hunt Log'}
          </button>
        </div>
      </div>
    </div>
  )

  // const renderReviewForm = () => (
  //   <div className="space-y-4">
  //     {/* Header */}
  //     <div className="text-center">
  //       <h2 className="text-lg font-bold text-forest-shadow">Review Hunt Log</h2>
  //       <p className="text-xs text-weathered-wood">Confirm details before submitting</p>
  //     </div>

  //     {/* Hunt Summary */}
  //     <div className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
  //       <h3 className="font-medium text-forest-shadow mb-3">Hunt Details</h3>
  //       <div className="space-y-2 text-sm">
  //         <div className="flex justify-between">
  //           <span className="text-weathered-wood">Date:</span>
  //           <span className="text-forest-shadow font-medium">{watchedValues.hunt_date}</span>
  //         </div>
  //         <div className="flex justify-between">
  //           <span className="text-weathered-wood">Stand:</span>
  //           <span className="text-forest-shadow font-medium">
  //             {stands.find(s => s.id === watchedValues.stand_id)?.name || 'Unknown'}
  //           </span>
  //         </div>
  //         <div className="flex justify-between">
  //           <span className="text-weathered-wood">Period:</span>
  //           <span className="text-forest-shadow font-medium">{watchedValues.hunt_type}</span>
  //         </div>
  //         {(watchedValues.start_time || watchedValues.end_time) && (
  //           <div className="flex justify-between">
  //             <span className="text-weathered-wood">Times:</span>
  //             <span className="text-forest-shadow font-medium">
  //               {watchedValues.start_time || '--'} to {watchedValues.end_time || '--'}
  //             </span>
  //           </div>
  //         )}
  //         <div className="flex justify-between">
  //           <span className="text-weathered-wood">Harvest:</span>
  //           <span className="text-forest-shadow font-medium">
  //             {watchedValues.had_harvest ? 'Yes' : 'No'}
  //           </span>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Sightings Summary */}
  //     {watchedValues.sightings && watchedValues.sightings.length > 0 && (
  //       <div className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
  //         <h3 className="font-medium text-forest-shadow mb-3">Sightings ({watchedValues.sightings.length})</h3>
  //         <div className="space-y-2">
  //           {watchedValues.sightings.map((sighting, index) => (
  //             <div key={index} className="flex justify-between text-sm">
  //               <span className="text-weathered-wood">{sighting.animal_type}:</span>
  //               <span className="text-forest-shadow font-medium">{sighting.count}</span>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     )}

  //     {/* Notes */}
  //     {watchedValues.notes && (
  //       <div className="bg-morning-mist/50 p-4 rounded-lg border border-weathered-wood/20">
  //         <h3 className="font-medium text-forest-shadow mb-2">Notes</h3>
  //         <p className="text-sm text-forest-shadow">{watchedValues.notes}</p>
  //       </div>
  //     )}

  //     {/* Submit Button */}
  //     <div className="flex flex-col space-y-3 pt-2">
  //       <button
  //         type="submit"
  //         disabled={isSubmitting}
  //         className="w-full bg-burnt-orange text-white py-3 rounded-lg font-medium hover:bg-clay-earth transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //       >
  //         {isSubmitting ? 'Submitting Hunt Log...' : 'Submit Hunt Log'}
  //       </button>
        
  //       <button
  //         type="button"
  //         onClick={() => setCurrentStep('sightings')}
  //         className="w-full text-weathered-wood py-1.5 text-sm hover:text-forest-shadow transition-colors"
  //       >
  //         Back to Edit
  //       </button>
  //     </div>
  //   </div>
  // )

  const renderSuccessForm = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-bright-orange/10 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-bright-orange" />
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-forest-shadow">Hunt Logged Successfully!</h2>
        <p className="text-sm text-weathered-wood mt-1">
          {submittedHuntData?.hunt_date ? new Date(submittedHuntData.hunt_date).toLocaleDateString() : ''} • {submittedHuntData?.stand_name}
        </p>
      </div>

      <div className="bg-morning-mist/50 p-3 rounded-lg text-left">
        <div className="text-xs text-weathered-wood space-y-1">
          <div>Hunter: {submittedHuntData?.hunter_name}</div>
          <div>Harvest: {submittedHuntData?.had_harvest ? 'Yes' : 'No'}</div>
          {submittedHuntData?.sightings?.length > 0 && (
            <div>Sightings: {submittedHuntData.sightings.length}</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            onCancel() // Close modal
          }}
          className="w-full bg-burnt-orange text-white py-3 rounded-lg font-medium"
        >
          Done
        </button>
        
        <button
          type="button"
          onClick={() => {
            // Reset form for another entry
            reset()
            setCurrentStep('basic')
            setSubmittedHuntData(null)
          }}
          className="w-full text-weathered-wood py-2 text-sm hover:text-forest-shadow"
        >
          Log Another Hunt
        </button>
      </div>
    </div>
  )

  // ===========================================
  // MAIN RENDER
  // ===========================================

  console.log('=== Rendering HuntEntryForm ===', { currentStep, submittedHuntData })

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg club-shadow">
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        {currentStep === 'basic' && renderBasicForm()}
        {currentStep === 'harvest' && renderHarvestForm()}
        {currentStep === 'sightings' && renderSightingsForm()}
        {currentStep === 'success' && renderSuccessForm()}
      </form>
    </div>
  )
}
