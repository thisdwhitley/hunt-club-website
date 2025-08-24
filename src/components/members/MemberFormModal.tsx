// src/components/members/MemberFormModal.tsx
// Modal component for adding/editing members

'use client'

import React, { useState, useEffect } from 'react'
import { ICONS } from '@/lib/shared/icons'
import { Member, MemberFormData, generateTempPassword } from '@/lib/database/members'

interface MemberFormModalProps {
  member?: Member | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: MemberFormData) => Promise<void>
  isLoading?: boolean
}

export default function MemberFormModal({
  member,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: MemberFormModalProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    email: '',
    full_name: '',
    display_name: '',
    phone: '',
    role: 'member',
    temporary_password: generateTempPassword()
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Icons from registry
  const { close: CloseIcon, save: SaveIcon, user: UserIcon, 
          edit: EditIcon, plus: PlusIcon, alert: AlertIcon } = ICONS

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        email: member.email,
        full_name: member.full_name || '',
        display_name: member.display_name || '',
        phone: member.phone || '',
        role: member.role,
        temporary_password: '' // Don't show password for existing members
      })
    } else {
      setFormData({
        email: '',
        full_name: '',
        display_name: '',
        phone: '',
        role: 'member',
        temporary_password: generateTempPassword()
      })
    }
    setErrors({})
  }, [member, isOpen])

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.display_name) {
      newErrors.display_name = 'Display name is required'
    }

    if (!member && !formData.temporary_password) {
      newErrors.temporary_password = 'Temporary password is required for new members'
    }

    if (formData.phone && !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'An error occurred' })
    }
  }

  // Handle input changes
  const handleChange = (field: keyof MemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Generate new password
  const handleGeneratePassword = () => {
    setFormData(prev => ({ ...prev, temporary_password: generateTempPassword() }))
  }

  if (!isOpen) return null

  const isEditing = !!member

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg club-shadow max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-weathered-wood/20">
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <EditIcon className="w-6 h-6 text-olive-green" />
              ) : (
                <PlusIcon className="w-6 h-6 text-olive-green" />
              )}
              <div>
                <h2 className="text-xl font-bold text-forest-shadow">
                  {isEditing ? 'Edit Member' : 'Add New Member'}
                </h2>
                <p className="text-sm text-weathered-wood">
                  {isEditing ? 'Update member information' : 'Create a new club member account'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-weathered-wood hover:text-forest-shadow hover:bg-morning-mist rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-clay-earth/10 border border-clay-earth/30 rounded-lg flex items-center space-x-2">
                <AlertIcon className="w-4 h-4 text-clay-earth flex-shrink-0" />
                <p className="text-sm text-clay-earth">{errors.submit}</p>
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-forest-shadow mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isEditing || isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green transition-colors ${
                  errors.email 
                    ? 'border-clay-earth bg-clay-earth/5' 
                    : 'border-weathered-wood/30'
                } ${isEditing ? 'bg-morning-mist/50 cursor-not-allowed' : ''}`}
                placeholder="member@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-clay-earth">{errors.email}</p>
              )}
              {isEditing && (
                <p className="mt-1 text-xs text-weathered-wood">
                  Email cannot be changed after account creation
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-forest-shadow mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green transition-colors ${
                  errors.full_name 
                    ? 'border-clay-earth bg-clay-earth/5' 
                    : 'border-weathered-wood/30'
                }`}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-clay-earth">{errors.full_name}</p>
              )}
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-forest-shadow mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green transition-colors ${
                  errors.display_name 
                    ? 'border-clay-earth bg-clay-earth/5' 
                    : 'border-weathered-wood/30'
                }`}
                placeholder="John"
              />
              {errors.display_name && (
                <p className="mt-1 text-sm text-clay-earth">{errors.display_name}</p>
              )}
              <p className="mt-1 text-xs text-weathered-wood">
                Name shown in hunt logs and throughout the app
              </p>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-forest-shadow mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green transition-colors ${
                  errors.phone 
                    ? 'border-clay-earth bg-clay-earth/5' 
                    : 'border-weathered-wood/30'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-clay-earth">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-forest-shadow mb-1">
                Member Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-weathered-wood/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
                <option value="commodore">Commodore</option>
              </select>
              <p className="mt-1 text-xs text-weathered-wood">
                Admins can manage members and settings. Members can log hunts and view data.
              </p>
            </div>

            {/* Temporary Password (new members only) */}
            {!isEditing && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-forest-shadow mb-1">
                  Temporary Password *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.temporary_password}
                    onChange={(e) => handleChange('temporary_password', e.target.value)}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green/50 focus:border-olive-green font-mono text-sm transition-colors ${
                      errors.temporary_password 
                        ? 'border-clay-earth bg-clay-earth/5' 
                        : 'border-weathered-wood/30'
                    }`}
                    placeholder="TempPassword123"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={isLoading}
                    className="px-3 py-2 text-olive-green hover:bg-olive-green/10 rounded-lg transition-colors text-sm font-medium"
                  >
                    Generate
                  </button>
                </div>
                {errors.temporary_password && (
                  <p className="mt-1 text-sm text-clay-earth">{errors.temporary_password}</p>
                )}
                <p className="mt-1 text-xs text-weathered-wood">
                  The member will need to change this password on first login
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-weathered-wood/20">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-weathered-wood hover:text-forest-shadow hover:bg-morning-mist rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SaveIcon className="w-4 h-4" />
                <span>
                  {isLoading 
                    ? (isEditing ? 'Updating...' : 'Creating...') 
                    : (isEditing ? 'Update Member' : 'Create Member')
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}