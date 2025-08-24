// src/lib/database/members.ts
// Member service class following the StandService pattern

import { createClient } from '@/lib/supabase/client'

export interface Member {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  phone: string | null
  role: 'admin' | 'member' | 'guest' | 'commodore'
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_sign_in_at?: string | null
}

export interface MemberFormData {
  email: string
  full_name: string
  display_name: string
  phone: string
  role: 'admin' | 'member' | 'guest' | 'commodore'
  temporary_password?: string
}

export interface MemberWithAuth extends Member {
  auth_user?: {
    email_confirmed_at: string | null
    last_sign_in_at: string | null
    created_at: string
  }
}

// Helper function to generate temporary password
export const generateTempPassword = (): string => {
  const adjectives = ['Swift', 'Bold', 'Keen', 'Wild', 'Sharp', 'Strong']
  const animals = ['Buck', 'Fox', 'Wolf', 'Bear', 'Eagle', 'Hawk']
  const numbers = Math.floor(Math.random() * 99) + 10
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  
  return `${adjective}${animal}${numbers}`
}

export class MemberService {
  private supabase = createClient()

  // Get all members
  async getMembers(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      throw new Error(`Failed to fetch members: ${error.message}`)
    }

    return data || []
  }

  // Get single member
  async getMember(id: string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching member:', error)
      throw new Error(`Failed to fetch member: ${error.message}`)
    }

    return data
  }

  // Update member (only profile data - not auth)
  async updateMember(id: string, formData: Partial<MemberFormData>): Promise<Member> {
    const updateData = {
      full_name: formData.full_name,
      display_name: formData.display_name,
      phone: formData.phone || null,
      role: formData.role,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member:', error)
      throw new Error(`Failed to update member: ${error.message}`)
    }

    return data
  }

  // Create new member (returns instructions for manual creation)
  async createMemberInstructions(formData: MemberFormData): Promise<{
    success: true
    instructions: string
    credentials: {
      email: string
      password: string
      memberData: MemberFormData
    }
  }> {
    // For now, return instructions for manual creation in Supabase Dashboard
    // In the future, this could be replaced with an API route that has admin privileges
    
    const tempPassword = formData.temporary_password || generateTempPassword()
    
    const instructions = `Ready to create member:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" 
3. Enter email: ${formData.email}
4. Enter password: ${tempPassword}
5. Set email_confirm: true
6. Click "Add User"
7. The member record will be created automatically via trigger

Member Details:
- Name: ${formData.full_name}
- Display Name: ${formData.display_name}
- Role: ${formData.role}
- Phone: ${formData.phone || 'None'}

After creating the user, refresh this page to see the new member.`

    return {
      success: true,
      instructions,
      credentials: {
        email: formData.email,
        password: tempPassword,
        memberData: formData
      }
    }
  }

  // Delete member (returns instructions for manual deletion)
  async deleteMemberInstructions(member: Member): Promise<{
    success: true
    instructions: string
    memberInfo: Member
  }> {
    // For now, return instructions for manual deletion in Supabase Dashboard
    // The member record will be deleted automatically via CASCADE foreign key
    
    const instructions = `To delete member ${member.display_name || member.email}:

1. Go to Supabase Dashboard → Authentication → Users
2. Find user: ${member.email}
3. Click the three dots menu → "Delete User"
4. Confirm deletion
5. The member record will be deleted automatically via CASCADE

⚠️ WARNING: This action cannot be undone. The member will lose access immediately and all their hunt logs will remain but show as "Unknown Member".

After deletion, refresh this page to update the member list.`

    return {
      success: true,
      instructions,
      memberInfo: member
    }
  }

  // Get member statistics
  async getMemberStats(): Promise<{
    total: number
    by_role: Record<string, number>
    active_this_month: number
    newest_member: Member | null
  }> {
    const members = await this.getMembers()
    
    const stats = {
      total: members.length,
      by_role: {} as Record<string, number>,
      active_this_month: 0, // Could be enhanced with actual activity data
      newest_member: members[0] || null // Already ordered by created_at desc
    }

    // Count by role
    members.forEach(member => {
      stats.by_role[member.role] = (stats.by_role[member.role] || 0) + 1
    })

    return stats
  }

  // Check if current user can manage members (basic check)
  async canManageMembers(): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return false

    // Get current user's member record to check role
    const member = await this.getMember(user.id)
    return member?.role === 'admin'
  }

  // Reset password instructions
  async getPasswordResetInstructions(member: Member): Promise<string> {
    const newTempPassword = generateTempPassword()
    
    return `Password reset instructions for ${member.display_name || member.email}:
    
1. Go to Supabase Dashboard → Authentication → Users
2. Find user: ${member.email}
3. Click the three dots menu → "Send Magic Link" or "Reset Password"
4. Or manually set password to: ${newTempPassword}

This action requires admin access to Supabase Dashboard.`
  }
}