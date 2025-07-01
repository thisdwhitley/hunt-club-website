// src/lib/database/setup.ts
import { createClient } from '@/lib/supabase/client'

export interface DatabaseSetupResult {
  success: boolean
  message: string
  details?: any
}

// Check if the stands table exists and has the required columns
export async function checkStandsTable(): Promise<DatabaseSetupResult> {
  try {
    const supabase = createClient()
    
    // Try to query the stands table to see if it exists
    const { data, error } = await supabase
      .from('stands')
      .select('id, name, latitude, longitude')
      .limit(1)

    if (error) {
      // Table might not exist or missing columns
      return {
        success: false,
        message: 'Stands table needs to be created or updated',
        details: error
      }
    }

    return {
      success: true,
      message: 'Stands table exists and is properly configured',
      details: { recordCount: data?.length || 0 }
    }
  } catch (err) {
    return {
      success: false,
      message: 'Database connection error',
      details: err
    }
  }
}

// Create the stands table with proper structure
export async function createStandsTable(): Promise<DatabaseSetupResult> {
  try {
    const supabase = createClient()
    
    // Note: In a real app, this would be done via Supabase migrations
    // This is just for development testing
    console.log('Creating stands table...')
    
    const { error } = await supabase.rpc('create_stands_table_if_not_exists')

    if (error) {
      return {
        success: false,
        message: 'Failed to create stands table',
        details: error
      }
    }

    return {
      success: true,
      message: 'Stands table created successfully'
    }
  } catch (err) {
    return {
      success: false,
      message: 'Error creating stands table',
      details: err
    }
  }
}

// Add sample data for testing
export async function addSampleStands(): Promise<DatabaseSetupResult> {
  try {
    const supabase = createClient()
    
    // Property center coordinates: 3843 Quick Rd, Ruffin, NC 27326 (from Google Maps)
    const propertyCenter = { lat: 36.427270297571546, lng: -79.51088069325365 }
    
    const sampleStands = [
      {
        name: 'North Ridge Stand',
        description: 'Elevated tree stand overlooking northern property boundary',
        latitude: propertyCenter.lat + 0.002,
        longitude: propertyCenter.lng + 0.001,
        type: 'tree_stand',
        active: true
      },
      {
        name: 'Creek Bottom Stand',
        description: 'Ground blind near the creek crossing',
        latitude: propertyCenter.lat - 0.001,
        longitude: propertyCenter.lng - 0.002,
        type: 'ground_blind',
        active: true
      },
      {
        name: 'Oak Grove Ladder',
        description: 'Ladder stand in the oak grove',
        latitude: propertyCenter.lat + 0.001,
        longitude: propertyCenter.lng - 0.001,
        type: 'ladder_stand',
        active: true
      },
      {
        name: 'Field Edge Stand',
        description: 'Tower stand on the edge of the food plot',
        latitude: propertyCenter.lat - 0.002,
        longitude: propertyCenter.lng + 0.001,
        type: 'tower_stand',
        active: true
      }
    ]

    // Check if sample stands already exist
    const { data: existingStands } = await supabase
      .from('stands')
      .select('name')
      .in('name', sampleStands.map(s => s.name))

    if (existingStands && existingStands.length > 0) {
      return {
        success: true,
        message: 'Sample stands already exist',
        details: { existing: existingStands.length, total: sampleStands.length }
      }
    }

    // Insert sample stands
    const { data, error } = await supabase
      .from('stands')
      .insert(sampleStands)
      .select()

    if (error) {
      return {
        success: false,
        message: 'Failed to add sample stands',
        details: error
      }
    }

    return {
      success: true,
      message: `Added ${data?.length || 0} sample stands`,
      details: data
    }
  } catch (err) {
    return {
      success: false,
      message: 'Error adding sample stands',
      details: err
    }
  }
}

// Complete database setup process
export async function setupDatabase(): Promise<DatabaseSetupResult[]> {
  const results: DatabaseSetupResult[] = []
  
  // 1. Check if stands table exists
  const tableCheck = await checkStandsTable()
  results.push(tableCheck)
  
  // 2. If table doesn't exist, try to create it (requires admin privileges)
  if (!tableCheck.success) {
    const createResult = await createStandsTable()
    results.push(createResult)
  }
  
  // 3. Add sample data if table is ready
  if (tableCheck.success || results[results.length - 1]?.success) {
    const sampleData = await addSampleStands()
    results.push(sampleData)
  }
  
  return results
}

// Get current database status
export async function getDatabaseStatus() {
  try {
    const supabase = createClient()
    
    const status = {
      connection: false,
      standsTable: false,
      standsCount: 0,
      sampleDataExists: false
    }

    // Test connection
    const { data: connectionTest } = await supabase.auth.getSession()
    status.connection = true

    // Check stands table
    const { data: stands, error: standsError } = await supabase
      .from('stands')
      .select('id, name')

    if (!standsError && stands) {
      status.standsTable = true
      status.standsCount = stands.length
      
      // Check if sample data exists
      const sampleStandNames = ['North Ridge Stand', 'Creek Bottom Stand', 'Oak Grove Ladder', 'Field Edge Stand']
      const sampleExists = stands.some(stand => sampleStandNames.includes(stand.name))
      status.sampleDataExists = sampleExists
    }

    return status
  } catch (err) {
    console.error('Error getting database status:', err)
    return {
      connection: false,
      standsTable: false,
      standsCount: 0,
      sampleDataExists: false
    }
  }
}
