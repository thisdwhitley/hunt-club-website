// src/components/EnvChecker.tsx - Temporary debugging component
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function EnvChecker() {
  const [showDetails, setShowDetails] = useState(false)
  const [connectionTest, setConnectionTest] = useState<string>('')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const testConnection = async () => {
    setConnectionTest('Testing...')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setConnectionTest(`❌ Connection failed: ${error.message}`)
      } else {
        setConnectionTest('✅ Connection successful!')
      }
    } catch (err) {
      setConnectionTest(`❌ Client creation failed: ${err}`)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-amber-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-gray-900">🔧 Debug Panel</h3>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs bg-gray-100 px-2 py-1 rounded"
        >
          {showDetails ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showDetails && (
        <div className="space-y-2 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Supabase URL:</span>
              <span className={url ? 'text-green-600' : 'text-red-600'}>
                {url ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Anon Key:</span>
              <span className={key ? 'text-green-600' : 'text-red-600'}>
                {key ? '✅' : '❌'}
              </span>
            </div>
            
            {url && (
              <div className="text-gray-600 break-all">
                URL: {url.substring(0, 30)}...
              </div>
            )}
          </div>
          
          <button 
            onClick={testConnection}
            className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            Test Connection
          </button>
          
          {connectionTest && (
            <div className="text-xs bg-gray-50 p-2 rounded">
              {connectionTest}
            </div>
          )}
          
          <div className="text-gray-500 text-xs border-t pt-2">
            Remove this component in production
          </div>
        </div>
      )}
    </div>
  )
}

// To use: Add <EnvChecker /> to your main page temporarily