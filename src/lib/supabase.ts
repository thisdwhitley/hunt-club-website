// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// REMOVED: Profile interface (no longer needed)

// Member interface (updated with display_name)
export interface Member {
  id: string
  email: string
  full_name: string | null
  display_name: string | null  // ADDED: display_name field
  phone: string | null
  role: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Updated AuthUser interface
export interface AuthUser {
  id: string
  email: string
  member: Member | null  // CHANGED: from 'profile' to 'member'
}