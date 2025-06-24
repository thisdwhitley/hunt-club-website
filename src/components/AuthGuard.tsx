// src/components/AuthGuard.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { Loader2, Target } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-white" />
          </div>
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-green-800" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will redirect to login
  }

  return <>{children}</>
}
