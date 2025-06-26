// src/components/ApiKeyTest.tsx (Direct API key test)
'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle, XCircle, Key, Globe } from 'lucide-react'

export function ApiKeyTest() {
  const [apiKey, setApiKey] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testApiKeyDirect = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your API key')
      return
    }

    setLoading(true)
    setTestResult(null)

    try {
      // Test with US Holidays calendar (known to be public)
      const testCalendarId = 'en.usa%23holiday%40group.v.calendar.google.com'
      const testUrl = `https://www.googleapis.com/calendar/v3/calendars/${testCalendarId}/events?key=${apiKey}&maxResults=5&timeMin=2025-01-01T00:00:00Z&timeMax=2025-12-31T23:59:59Z`
      
      console.log('Testing URL:', testUrl)
      
      const response = await fetch(testUrl)
      const data = await response.json()
      
      setTestResult({
        status: response.status,
        success: response.ok,
        data: data,
        url: testUrl
      })
      
    } catch (error: any) {
      setTestResult({
        status: 0,
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const testCurrentEnvKey = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      // Test the server's environment API key
      const response = await fetch('/api/calendar/google?debug=true')
      const debugData = await response.json()
      
      setTestResult({
        status: response.status,
        success: response.ok,
        data: debugData,
        isEnvTest: true
      })
      
    } catch (error: any) {
      setTestResult({
        status: 0,
        success: false,
        error: error.message,
        isEnvTest: true
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Key className="w-6 h-6 mr-2" />
          Google Calendar API Key Test
        </h2>
        <p className="text-gray-600">
          Test your Google Calendar API key directly against Google's servers.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Environment Test */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-gray-900 mb-3">Test Current Environment</h3>
          <p className="text-sm text-gray-600 mb-3">
            Test the API key currently configured in your environment variables.
          </p>
          <button
            onClick={testCurrentEnvKey}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Environment API Key'}
          </button>
        </div>

        {/* Manual API Key Test */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="font-semibold text-gray-900 mb-3">Manual API Key Test</h3>
          <p className="text-sm text-gray-600 mb-3">
            Enter your API key to test it directly against Google's public API.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Calendar API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={testApiKeyDirect}
              disabled={loading || !apiKey.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Key'}
            </button>
          </div>
        </div>

        {/* Results */}
        {testResult && (
          <div className="p-4 border rounded-md">
            <div className="flex items-center mb-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <h3 className="font-semibold">
                {testResult.isEnvTest ? 'Environment Test' : 'Direct API Test'} - 
                Status: {testResult.status}
              </h3>
            </div>

            {testResult.success ? (
              <div className="text-green-700">
                <p className="font-medium mb-2">✅ API Key is working!</p>
                {testResult.isEnvTest ? (
                  <div className="text-sm">
                    <p>Environment Details:</p>
                    <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p>Found {testResult.data.items?.length || 0} events in US Holidays calendar</p>
                    {testResult.data.items?.[0] && (
                      <p>Sample event: {testResult.data.items[0].summary}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p className="font-medium mb-2">❌ API Key failed</p>
                <div className="text-sm space-y-1">
                  {testResult.error && <p>Error: {testResult.error}</p>}
                  {testResult.data?.error && (
                    <div>
                      <p>Google Error: {testResult.data.error.message}</p>
                      <p>Code: {testResult.data.error.code}</p>
                      {testResult.data.error.errors && (
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
                          {JSON.stringify(testResult.data.error.errors, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw Response for Debugging */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600">
                Show Raw Response
              </summary>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-64">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-gray-900 mb-3">API Key Setup Instructions</h3>
          <div className="text-sm space-y-2">
            <p><strong>1. Go to Google Cloud Console:</strong></p>
            <p className="ml-4 text-blue-600">
              <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">
                https://console.cloud.google.com/
              </a>
            </p>
            
            <p><strong>2. Enable Calendar API:</strong></p>
            <p className="ml-4">APIs & Services → Library → Search "Calendar" → Enable</p>
            
            <p><strong>3. Create API Key:</strong></p>
            <p className="ml-4">APIs & Services → Credentials → Create Credentials → API Key</p>
            
            <p><strong>4. Restrict API Key (Optional but Recommended):</strong></p>
            <p className="ml-4">Edit API Key → API Restrictions → Select "Google Calendar API"</p>
            
            <p><strong>5. Common Error Codes:</strong></p>
            <div className="ml-4 space-y-1">
              <p>• <strong>401 Unauthorized:</strong> Invalid API key or API not enabled</p>
              <p>• <strong>403 Forbidden:</strong> API key restrictions or quota exceeded</p>
              <p>• <strong>404 Not Found:</strong> Calendar doesn't exist or isn't public</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
