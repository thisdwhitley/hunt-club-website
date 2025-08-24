// src/components/members/MemberDeleteModal.tsx
// Confirmation modal for deleting members

'use client'

import React from 'react'
import { ICONS } from '@/lib/shared/icons'
import { Member } from '@/lib/database/members'

interface MemberDeleteModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (member: Member) => Promise<void>
  isLoading?: boolean
}

export default function MemberDeleteModal({
  member,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: MemberDeleteModalProps) {
  const { close: CloseIcon, delete: DeleteIcon, alert: AlertIcon } = ICONS

  const handleConfirm = async () => {
    if (!member) return
    
    try {
      await onConfirm(member)
      onClose()
    } catch (error) {
      console.error('Delete confirmation error:', error)
    }
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg club-shadow max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-weathered-wood/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-clay-earth/10 rounded-lg">
                <AlertIcon className="w-6 h-6 text-clay-earth" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-forest-shadow">
                  Delete Member
                </h2>
                <p className="text-sm text-weathered-wood">
                  This action cannot be undone
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

          {/* Content */}
          <div className="p-6">
            <div className="mb-4 p-4 bg-clay-earth/5 border border-clay-earth/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-olive-green/10 rounded-full flex items-center justify-center">
                  <ICONS.user className="w-5 h-5 text-olive-green" />
                </div>
                <div>
                  <h3 className="font-medium text-forest-shadow">
                    {member.display_name || member.full_name}
                  </h3>
                  <p className="text-sm text-weathered-wood">{member.email}</p>
                  <p className="text-xs text-weathered-wood">Role: {member.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-weathered-wood">
              <p>
                <strong className="text-forest-shadow">Are you sure you want to delete this member?</strong>
              </p>
              
              <div className="space-y-2">
                <p className="flex items-start space-x-2">
                  <span className="text-clay-earth">•</span>
                  <span>The member will immediately lose access to the system</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-clay-earth">•</span>
                  <span>Their hunt logs will remain but show as "Unknown Member"</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-clay-earth">•</span>
                  <span>This action cannot be undone</span>
                </p>
              </div>

              <div className="mt-4 p-3 bg-bright-orange/10 border border-bright-orange/30 rounded-lg">
                <p className="text-bright-orange text-xs">
                  <strong>Note:</strong> Due to security restrictions, deletion requires manual action 
                  in the Supabase Dashboard. Instructions will be provided after confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-weathered-wood/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-weathered-wood hover:text-forest-shadow hover:bg-morning-mist rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-clay-earth text-white rounded-lg hover:bg-clay-earth/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DeleteIcon className="w-4 h-4" />
              <span>
                {isLoading ? 'Getting Instructions...' : 'Delete Member'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}