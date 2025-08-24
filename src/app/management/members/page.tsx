'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ICONS } from '@/lib/shared/icons'
import { MemberService, Member, MemberFormData } from '@/lib/database/members'
import MemberFormModal from '@/components/members/MemberFormModal'
import MemberDeleteModal from '@/components/members/MemberDeleteModal'

interface MemberStats {
  total: number
  by_role: Record<string, number>
  newest_member: Member | null
}

export default function MemberManagementPage() {
  const { user } = useAuth()
  const memberService = new MemberService()
  
  // Core state
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stats, setStats] = useState<MemberStats>({ total: 0, by_role: {}, newest_member: null })

  // Modal state - completely separate from member data
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Icons from registry
  const { user: UserIcon, plus: PlusIcon, edit: EditIcon, 
          delete: DeleteIcon, settings: SettingsIcon, alert: AlertIcon, 
          check: CheckIcon, refresh: RefreshIcon } = ICONS

  // Load members and stats
  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const [membersData, statsData] = await Promise.all([
        memberService.getMembers(),
        memberService.getMemberStats()
      ])

      setMembers(membersData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading members:', err)
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  // Load members on component mount
  useEffect(() => {
    loadMembers()
  }, [])

  // Clear messages after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 10000) // Longer timeout for manual instructions
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Handle add member
  const handleAddMember = async (formData: MemberFormData) => {
    setModalLoading(true)
    try {
      const result = await memberService.createMemberInstructions(formData)
      setSuccess(result.instructions)
      setShowAddModal(false)
    } catch (err) {
      console.error('Error creating member:', err)
      throw err // Let modal handle the error display
    } finally {
      setModalLoading(false)
    }
  }

  // Handle edit member
  const handleEditMember = async (formData: MemberFormData) => {
    if (!editingMember) return

    setModalLoading(true)
    try {
      await memberService.updateMember(editingMember.id, formData)
      setSuccess(`Member ${formData.display_name} updated successfully!`)
      setShowEditModal(false)
      setEditingMember(null)
      await loadMembers() // Refresh the list
    } catch (err) {
      console.error('Error updating member:', err)
      throw err // Let modal handle the error display
    } finally {
      setModalLoading(false)
    }
  }

  // Handle delete member
  const handleDeleteMember = async (member: Member) => {
    setModalLoading(true)
    try {
      const result = await memberService.deleteMemberInstructions(member)
      setSuccess(result.instructions)
      setShowDeleteModal(false)
      setDeletingMember(null)
    } catch (err) {
      console.error('Error deleting member:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete member')
    } finally {
      setModalLoading(false)
    }
  }

  // Handle password reset
  const handleResetPassword = async (member: Member) => {
    try {
      const instructions = await memberService.getPasswordResetInstructions(member)
      setSuccess(instructions)
    } catch (err) {
      console.error('Error getting reset instructions:', err)
      setError(err instanceof Error ? err.message : 'Failed to get reset instructions')
    }
  }

  // Modal handlers
  const openAddModal = () => {
    setEditingMember(null)
    setShowAddModal(true)
  }

  const openEditModal = (member: Member) => {
    setEditingMember(member)
    setShowEditModal(true)
  }

  const openDeleteModal = (member: Member) => {
    setDeletingMember(member)
    setShowDeleteModal(true)
  }

  const closeAllModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowDeleteModal(false)
    setEditingMember(null)
    setDeletingMember(null)
  }

  // Check if user is admin
  const isAdmin = user?.email // You might want to check specific admin role here

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-morning-mist p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg club-shadow p-6 text-center max-w-md w-full">
          <AlertIcon className="w-12 h-12 text-clay-earth mx-auto mb-4" />
          <h2 className="text-xl font-bold text-forest-shadow mb-2">Access Denied</h2>
          <p className="text-weathered-wood">You don't have permission to manage members.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-morning-mist p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg club-shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8 text-olive-green" />
              <div>
                <h1 className="text-2xl font-bold text-forest-shadow">Member Management</h1>
                <p className="text-weathered-wood">Manage club members and access</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadMembers}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-olive-green hover:bg-olive-green/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshIcon className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center space-x-2 px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg club-shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-weathered-wood">Total Members</p>
                  <p className="text-2xl font-bold text-forest-shadow">{stats.total}</p>
                </div>
                <UserIcon className="w-8 h-8 text-olive-green" />
              </div>
            </div>
            {Object.entries(stats.by_role).map(([role, count]) => (
              <div key={role} className="bg-white rounded-lg club-shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-weathered-wood capitalize">{role}s</p>
                    <p className="text-2xl font-bold text-forest-shadow">{count}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    role === 'admin' ? 'bg-clay-earth' :
                    role === 'commodore' ? 'bg-bright-orange' :
                    role === 'guest' ? 'bg-weathered-wood' : 'bg-olive-green'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="bg-clay-earth/10 border border-clay-earth/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertIcon className="w-5 h-5 text-clay-earth flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-clay-earth whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-bright-orange/10 border border-bright-orange/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckIcon className="w-5 h-5 text-bright-orange flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-bright-orange whitespace-pre-line">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-lg club-shadow">
          <div className="p-6 border-b border-weathered-wood/20">
            <h2 className="text-xl font-bold text-forest-shadow">Club Members</h2>
            <p className="text-weathered-wood">
              {members.length} member{members.length !== 1 ? 's' : ''} total
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center space-x-2 text-weathered-wood">
                <div className="w-4 h-4 border-2 border-weathered-wood/30 border-t-weathered-wood rounded-full animate-spin"></div>
                <span>Loading members...</span>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-weathered-wood">
              <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No members found</p>
              <button
                onClick={openAddModal}
                className="mt-3 text-olive-green hover:text-pine-needle font-medium underline"
              >
                Add the first member
              </button>
            </div>
          ) : (
            <div className="divide-y divide-weathered-wood/20">
              {members.map((member) => (
                <div key={member.id} className="p-6 hover:bg-morning-mist/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-olive-green/10 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-olive-green" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-forest-shadow">
                            {member.display_name || member.full_name || 'Unnamed'}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'admin' ? 'bg-clay-earth/10 text-clay-earth' :
                            member.role === 'commodore' ? 'bg-bright-orange/10 text-bright-orange' :
                            member.role === 'guest' ? 'bg-weathered-wood/10 text-weathered-wood' :
                            'bg-olive-green/10 text-olive-green'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                        <p className="text-sm text-weathered-wood">{member.email}</p>
                        <div className="flex items-center space-x-4 text-xs text-weathered-wood mt-1">
                          {member.phone && <span>Phone: {member.phone}</span>}
                          <span>Member since: {new Date(member.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 text-olive-green hover:bg-olive-green/10 rounded-lg transition-colors"
                        title="Edit member"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleResetPassword(member)}
                        className="p-2 text-burnt-orange hover:bg-burnt-orange/10 rounded-lg transition-colors"
                        title="Get password reset instructions"
                      >
                        <RefreshIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openDeleteModal(member)}
                        className="p-2 text-clay-earth hover:bg-clay-earth/10 rounded-lg transition-colors"
                        title="Delete member"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <MemberFormModal
        member={null}
        isOpen={showAddModal}
        onClose={closeAllModals}
        onSubmit={handleAddMember}
        isLoading={modalLoading}
      />

      <MemberFormModal
        member={editingMember}
        isOpen={showEditModal}
        onClose={closeAllModals}
        onSubmit={handleEditMember}
        isLoading={modalLoading}
      />

      <MemberDeleteModal
        member={deletingMember}
        isOpen={showDeleteModal}
        onClose={closeAllModals}
        onConfirm={handleDeleteMember}
        isLoading={modalLoading}
      />
    </div>
  )
}