// src/app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Target, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectTo = searchParams.get('redirectTo') || '/'

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Use email username as default name
            },
          },
        })
        
        if (error) throw error
        
        // After successful signup, sign them in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) throw signInError
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
      }
      
      // Redirect to the intended page or home
      router.push(redirectTo)
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-morning-mist flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home Link */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-weathered-wood hover:text-forest-shadow mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to site
          </Link>
        </div>

        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-olive-green rounded-lg flex items-center justify-center">
              <Target size={24} className="text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-forest-shadow">
            {isSignUp ? 'Join the Club' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-center text-sm text-weathered-wood">
            {isSignUp 
              ? 'Create your account to access club features'
              : 'Sign in to your Caswell County Yacht Club account'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className="bg-clay-earth/10 border border-clay-earth/20 rounded-md p-4">
              <div className="text-sm text-clay-earth">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest-shadow">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-transparent"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest-shadow">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-transparent pr-10"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-weathered-wood hover:text-forest-shadow"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-olive-green text-white py-2 px-4 rounded-lg hover:bg-pine-needle focus:outline-none focus:ring-2 focus:ring-olive-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-burnt-orange hover:text-clay-earth"
              disabled={loading}
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'
              }
            </button>
          </div>
        </form>

        {/* Development Note */}
        <div className="mt-6 p-4 bg-sunset-amber/10 border border-sunset-amber/20 rounded-lg">
          <p className="text-sm text-clay-earth font-medium mb-2">🚧 Development Mode</p>
          <p className="text-xs text-weathered-wood">
            Use the test credentials provided by your admin to access the system.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-weathered-wood">
            Hunting Club Management System v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
