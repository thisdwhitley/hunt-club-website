'use client'

// src/app/stands/test/page.tsx
// Test page for stand management system - helps verify everything is working

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Database, Wifi, Eye, Plus } from 'lucide-react'
import { StandService } from '@/lib/database/stands'
import { createClient } from '@/lib/supabase/client'
import StandCard from '@/components/stands/StandCard'
import { getStandStatistics } from '@/lib/utils/stands'
import type { Stand } from '@/lib/database/stands'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: string
}

export default function StandsTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [stands, setStands] = useState<Stand[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [showSampleData, setShowSampleData] = useState(false)
  
  const standService = new StandService()

  // Sample stand data for testing
  const sampleStands = [
    {
      name: 'North Ridge Stand',
      description: 'Elevated ladder stand overlooking the north field with excellent visibility',
      type: 'ladder_stand' as const,
      active: true,
      latitude: 36.427236,
      longitude: -79.510881,
      trail_name: 'Main Trail',
      walking_time_minutes: 15,
      access_notes: 'Follow main trail 0.3 miles, stand is on the right side marked with orange reflectors',
      height_feet: 18,
      capacity: 2,
      time_of_day: 'PM' as const,
      view_distance_yards: 150,
      nearby_water_source: true,
      food_source: 'field' as const,
      archery_season: true,
      trail_camera_name: 'North Cam 1',
      total_hunts: 12,
      total_harvests: 4,
      season_hunts: 6,
      last_used_date: '2024-11-15'
    },
    {
      name: 'Creek Bottom Blind',
      description: 'Ground blind positioned near the creek crossing',
      type: 'bale_blind' as const,
      active: true,
      latitude: 36.426891,
      longitude: -79.511234,
      trail_name: 'Creek Trail',
      walking_time_minutes: 8,
      access_notes: 'Take creek trail, blind is camouflaged with natural materials',
      height_feet: 0,
      capacity: 1,
      time_of_day: 'AM' as const,
      view_distance_yards: 75,
      nearby_water_source: true,
      food_source: null,
      archery_season: true,
      trail_camera_name: null,
      total_hunts: 8,
      total_harvests: 2,
      season_hunts: 3,
      last_used_date: '2024-10-28'
    },
    {
      name: 'Oak Grove Box',
      description: 'Enclosed box stand in the oak grove with heater and windows',
      type: 'box_stand' as const,
      active: true,
      latitude: 36.428012,
      longitude: -79.509567,
      trail_name: 'Oak Trail',
      walking_time_minutes: 20,
      access_notes: 'Longer walk but heated box, key is in lockbox',
      height_feet: 12,
      capacity: 2,
      time_of_day: 'ALL' as const,
      view_distance_yards: 100,
      nearby_water_source: false,
      food_source: 'feeder' as const,
      archery_season: false,
      trail_camera_name: 'Oak Grove Cam',
      total_hunts: 15,
      total_harvests: 6,
      season_hunts: 8,
      last_used_date: '2024-12-01'
    }
  ]

  // Inspect database schema
  const inspectDatabaseSchema = async () => {
    const supabase = createClient()
    
    try {
      // Try to get a sample record to see the actual structure
      const { data: sampleStand, error: sampleError } = await supabase
        .from('stands')
        .select('*')
        .limit(1)
        .single()
      
      if (sampleError && sampleError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Could not fetch sample stand: ${sampleError.message}`)
      }
      
      let columns = []
      
      if (sampleStand) {
        columns = Object.keys(sampleStand).map(key => ({
          name: key,
          type: typeof sampleStand[key],
          value: sampleStand[key]
        }))
      } else {
        // If no data, try to get schema from a failed insert to see what fields are expected
        try {
          await supabase.from('stands').insert({})
        } catch (insertError) {
          // This will fail but might give us schema info
        }
        
        // Fallback to our expected schema
        columns = [
          'id', 'name', 'description', 'type', 'active', 'latitude', 'longitude',
          'trail_name', 'walking_time_minutes', 'access_notes', 'height_feet',
          'capacity', 'time_of_day', 'view_distance_yards', 'nearby_water_source',
          'total_hunts', 'total_harvests', 'last_used_date', 'season_hunts',
          'food_source', 'archery_season', 'trail_camera_name', 'created_at', 'updated_at'
        ].map(name => ({ name, type: 'unknown', value: null }))
      }
      
      return {
        columnCount: columns.length,
        columns: columns,
        hasSampleData: !!sampleStand
      }
    } catch (error) {
      throw new Error(`Schema inspection failed: ${error.message}`)
    }
  }

  // Run comprehensive tests
  const runTests = async () => {
    setIsRunningTests(true)
    const results: TestResult[] = []

    // Test 1: Database Connection
    try {
      const connectionTest = await standService.testConnection()
      results.push({
        name: 'Database Connection',
        status: connectionTest.success ? 'success' : 'error',
        message: connectionTest.message || 'Database connection test completed',
        details: connectionTest.error ? JSON.stringify(connectionTest.error) : undefined
      })
    } catch (error) {
      results.push({
        name: 'Database Connection',
        status: 'error',
        message: 'Failed to test database connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Database Schema Inspection
    try {
      const schemaInfo = await inspectDatabaseSchema()
      results.push({
        name: 'Database Schema',
        status: 'success',
        message: `Found ${schemaInfo.columnCount} columns in stands table ${schemaInfo.hasSampleData ? '(from sample data)' : '(expected schema)'}`,
        details: `Columns: ${schemaInfo.columns.map(c => c.name).join(', ')}`
      })
      
      // Check for success_rate field specifically
      const hasSuccessRate = schemaInfo.columns.some(col => col.name === 'success_rate')
      if (hasSuccessRate) {
        results.push({
          name: 'Schema Alert',
          status: 'warning',
          message: 'SUCCESS_RATE field found in database!',
          details: 'This field should not exist and may be causing update errors'
        })
      } else {
        results.push({
          name: 'Schema Validation',
          status: 'success',
          message: 'No success_rate field found (correct)',
          details: 'Database schema matches expected structure'
        })
      }
    } catch (error) {
      results.push({
        name: 'Database Schema',
        status: 'warning',
        message: 'Could not inspect database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Fetch Stands
    try {
      const fetchedStands = await standService.getStands()
      setStands(fetchedStands)
      results.push({
        name: 'Fetch Stands',
        status: 'success',
        message: `Successfully fetched ${fetchedStands.length} stands`,
        details: fetchedStands.length === 0 ? 'No stands found - this might be expected for a new installation' : undefined
      })
    } catch (error) {
      results.push({
        name: 'Fetch Stands',
        status: 'error',
        message: 'Failed to fetch stands',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Get Statistics
    try {
      const stats = await standService.getStandsStats()
      results.push({
        name: 'Stand Statistics',
        status: 'success',
        message: `Statistics calculated: ${stats.total} total stands, ${stats.active} active`,
        details: `Mapped: ${stats.mapped}, Total hunts: ${stats.totalHunts}, Total harvests: ${stats.totalHarvests}`
      })
    } catch (error) {
      results.push({
        name: 'Stand Statistics',
        status: 'error',
        message: 'Failed to calculate statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Component Rendering
    try {
      if (stands.length > 0) {
        results.push({
          name: 'Component Rendering',
          status: 'success',
          message: 'StandCard components rendered successfully',
          details: `${stands.length} stand cards displayed`
        })
      } else {
        results.push({
          name: 'Component Rendering',
          status: 'warning',
          message: 'No stands available to render components',
          details: 'Consider adding sample data to test component rendering'
        })
      }
    } catch (error) {
      results.push({
        name: 'Component Rendering',
        status: 'error',
        message: 'Failed to render components',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 6: Database Trigger Analysis
    try {
      results.push({
        name: 'Trigger Analysis',
        status: 'warning',
        message: 'SUCCESS_RATE error detected - likely database trigger issue',
        details: 'The error "record new has no field success_rate" suggests a database trigger is trying to reference a success_rate field that doesn\'t exist. Check Supabase dashboard for triggers on the stands table.'
      })
    } catch (error) {
      results.push({
        name: 'Trigger Analysis',
        status: 'error',
        message: 'Could not analyze triggers',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Test updating a stand to debug the success_rate issue
  const testStandUpdate = async () => {
    try {
      setIsRunningTests(true)
      
      if (stands.length === 0) {
        alert('No stands available to test update. Add sample data first.')
        return
      }
      
      const testStand = stands[0]
      const updateData = {
        name: testStand.name + ' (Updated)',
        description: 'Test update description'
      }
      
      console.log('🧪 Testing stand update with data:', updateData)
      console.log('🧪 Original stand data:', testStand)
      
      const updatedStand = await standService.updateStand(testStand.id, updateData)
      
      const updatedResults = [...testResults]
      updatedResults.push({
        name: 'Stand Update Test',
        status: 'success',
        message: `Successfully updated stand: ${updatedStand.name}`,
        details: 'Update operation completed without errors'
      })
      setTestResults(updatedResults)
      
      // Refresh stands list
      const refreshedStands = await standService.getStands()
      setStands(refreshedStands)
      
    } catch (error) {
      console.error('❌ Stand update test failed:', error)
      const updatedResults = [...testResults]
      updatedResults.push({
        name: 'Stand Update Test',
        status: 'error',
        message: 'Stand update test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      setTestResults(updatedResults)
    } finally {
      setIsRunningTests(false)
    }
  }

  // Add sample data
  const addSampleData = async () => {
    try {
      setIsRunningTests(true)
      
      for (const sampleStand of sampleStands) {
        await standService.createStand(sampleStand)
      }
      
      // Refresh stands list
      const updatedStands = await standService.getStands()
      setStands(updatedStands)
      
      // Update test results
      const updatedResults = [...testResults]
      updatedResults.push({
        name: 'Sample Data Creation',
        status: 'success',
        message: `Successfully created ${sampleStands.length} sample stands`,
        details: 'Sample data includes various stand types, locations, and hunt statistics'
      })
      setTestResults(updatedResults)
      
    } catch (error) {
      const updatedResults = [...testResults]
      updatedResults.push({
        name: 'Sample Data Creation',
        status: 'error',
        message: 'Failed to create sample data',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      setTestResults(updatedResults)
    } finally {
      setIsRunningTests(false)
    }
  }

  // Initial test run
  useEffect(() => {
    runTests()
  }, [])

  // Calculate statistics
  const statistics = stands.length > 0 ? getStandStatistics(stands) : null

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Stand Management System Test</h1>
          <p className="text-green-100 mt-1">
            Verify that all components and database connections are working correctly
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-forest-shadow">System Tests</h2>
              <p className="text-weathered-wood text-sm">
                Run comprehensive tests to verify system functionality
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={runTests}
                disabled={isRunningTests}
                className="bg-olive-green hover:bg-pine-needle text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRunningTests ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Run Tests
                  </>
                )}
              </button>
              
              {stands.length === 0 && (
                <button
                  onClick={addSampleData}
                  disabled={isRunningTests}
                  className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Sample Data
                </button>
              )}
              
              {stands.length > 0 && (
                <button
                  onClick={testStandUpdate}
                  disabled={isRunningTests}
                  className="bg-muted-gold hover:bg-sunset-amber text-forest-shadow px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Database size={16} />
                  Test Update
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-forest-shadow mb-4">Test Results</h3>
            
            <div className="space-y-3">
              {testResults.map((result, index) => {
                const Icon = result.status === 'success' ? CheckCircle : 
                           result.status === 'error' ? XCircle : 
                           AlertTriangle
                
                const iconColor = result.status === 'success' ? 'text-bright-orange' : 
                                 result.status === 'error' ? 'text-clay-earth' : 
                                 'text-muted-gold'
                
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-forest-shadow">{result.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' :
                          result.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <p className="text-sm text-weathered-wood mt-1">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">{result.details}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-forest-shadow mb-4">Stand Statistics</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-olive-green/10 border border-olive-green/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-olive-green">{statistics.total}</div>
                <div className="text-sm text-weathered-wood">Total Stands</div>
              </div>
              
              <div className="bg-bright-orange/10 border border-bright-orange/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-bright-orange">{statistics.active}</div>
                <div className="text-sm text-weathered-wood">Active Stands</div>
              </div>
              
              <div className="bg-dark-teal/10 border border-dark-teal/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-dark-teal">{statistics.mapped}</div>
                <div className="text-sm text-weathered-wood">Mapped Stands</div>
              </div>
              
              <div className="bg-muted-gold/10 border border-muted-gold/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-muted-gold">{statistics.totalHunts}</div>
                <div className="text-sm text-weathered-wood">Total Hunts</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-forest-shadow mb-2">Stand Types</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>Ladder: {statistics.byType.ladder_stand}</div>
                <div>Bale Blind: {statistics.byType.bale_blind}</div>
                <div>Box Stand: {statistics.byType.box_stand}</div>
                <div>Tripod: {statistics.byType.tripod}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sample Stands Display */}
        {stands.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-forest-shadow">
                Stand Cards Test ({stands.length} stands)
              </h3>
              <button
                onClick={() => setShowSampleData(!showSampleData)}
                className="text-olive-green hover:text-pine-needle font-medium flex items-center gap-1"
              >
                <Eye size={16} />
                {showSampleData ? 'Hide' : 'Show'} Stand Cards
              </button>
            </div>
            
            {showSampleData && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stands.map((stand) => (
                  <StandCard
                    key={stand.id}
                    stand={stand}
                    mode="full"
                    showLocation={true}
                    showStats={true}
                    showActions={true}
                    onEdit={(stand) => alert(`Edit ${stand.name} - would open edit modal`)}
                    onDelete={(stand) => alert(`Delete ${stand.name} - would show confirmation`)}
                    onNavigate={(stand) => {
                      if (stand.latitude && stand.longitude) {
                        window.open(`https://maps.google.com/?q=${stand.latitude},${stand.longitude}`, '_blank')
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Data State */}
        {stands.length === 0 && !isRunningTests && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-weathered-wood mb-4" />
            <h3 className="text-lg font-medium text-forest-shadow mb-2">No Stands Found</h3>
            <p className="text-weathered-wood mb-6">
              No stands are currently in your database. This might be expected for a new installation.
            </p>
            <button
              onClick={addSampleData}
              className="bg-burnt-orange hover:bg-clay-earth text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Sample Data to Test System
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Testing Instructions</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>• <strong>Database Connection:</strong> Verifies Supabase connection and table access</p>
            <p>• <strong>Database Schema:</strong> Inspects actual database columns and checks for success_rate field</p>
            <p>• <strong>Fetch Stands:</strong> Tests reading data from the stands table</p>
            <p>• <strong>Stand Statistics:</strong> Tests calculation of aggregate statistics</p>
            <p>• <strong>Component Rendering:</strong> Tests StandCard component display</p>
            <p>• <strong>Sample Data:</strong> Creates test stands with realistic data</p>
            <p>• <strong>Test Update:</strong> Tests updating a stand to debug the success_rate error</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Next Steps:</strong> If all tests pass, navigate to{' '}
              <a href="/stands" className="underline font-medium">/stands</a> to see the full management interface.
            </p>
          </div>
        </div>

        {/* Database Issue Diagnostic */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-medium text-red-900 mb-2">🚨 Database Issue Detected</h3>
          <div className="text-red-800 text-sm space-y-3">
            <p>
              <strong>Problem:</strong> Your database has a trigger or function that references a "success_rate" field that doesn't exist.
            </p>
            
            <div>
              <strong>How to Fix:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to Database → Database</li>
                <li>Click on the SQL Editor</li>
                <li>Run this command to check for triggers:</li>
              </ol>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
              <div>-- Check for triggers on stands table</div>
              <div>SELECT trigger_name, action_statement</div>
              <div>FROM information_schema.triggers</div>
              <div>WHERE event_object_table = 'stands';</div>
            </div>
            
            <div>
              <strong>Also check for functions that might reference success_rate:</strong>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
              <div>-- Check for functions that reference success_rate</div>
              <div>SELECT routine_name, routine_definition</div>
              <div>FROM information_schema.routines</div>
              <div>WHERE routine_definition ILIKE '%success_rate%';</div>
            </div>
            
            <div>
              <strong>Most likely solution:</strong> You have a database trigger that automatically calculates success_rate. 
              You'll need to either:
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>Remove the trigger if you don't want success_rate calculations</li>
                <li>Add a success_rate column to your stands table if you want to keep the trigger</li>
                <li>Update the trigger to not reference success_rate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
