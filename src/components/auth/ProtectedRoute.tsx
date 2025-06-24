// src/components/auth/ProtectedRoute.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginForm from './LoginForm'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'member'
}

export default function ProtectedRoute({ children, requiredRole = 'member' }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-green-800 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />
  }

  // Check role permissions
  if (!hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this area. Contact your club administrator for access.
            </p>
            <p className="text-sm text-gray-500">
              Current role: {user.profile?.role || 'member'}
              <br />
              Required role: {requiredRole}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}