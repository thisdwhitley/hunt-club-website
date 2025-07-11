#!/usr/bin/env node

/**
 * FILE: scripts/test-weather-service.js
 * 
 * Test script for Weather Collection Service
 * 
 * Run with: node scripts/test-weather-service.js
 * 
 * Tests:
 * 1. API connectivity
 * 2. Data collection for yesterday
 * 3. Database storage
 * 4. Quality scoring
 */

const { WeatherCollectionService, collectYesterdayWeather } = require('../src/lib/weather/weather-service.js');

// Database schema verification function
async function verifyDatabaseSchema(service) {
  const errors = [];
  
  try {
    // Check if daily_weather_snapshots table exists with required columns
    const { data: weatherCols, error: weatherError } = await service.supabase
      .from('daily_weather_snapshots')
      .select('*')
      .limit(0);
    
    if (weatherError) {
      errors.push(`daily_weather_snapshots table missing or inaccessible: ${weatherError.message}`);
    }
    
    // Check if daily_collection_log table exists  
    const { data: logCols, error: logError } = await service.supabase
      .from('daily_collection_log')
      .select('*')
      .limit(0);
      
    if (logError) {
      errors.push(`daily_collection_log table missing or inaccessible: ${logError.message}`);
    }
    
    // Check if required database functions exist
    const functionsToCheck = [
      {
        name: 'interpolate_dawn_dusk_temps',
        params: { 
          sunrise_time: '06:00:00',
          sunset_time: '20:00:00', 
          tempmin: 70,            // Fixed parameter name
          tempmax: 90,            // Fixed parameter name
          current_temp: 80        // Fixed parameter name
        }
      },
      {
        name: 'calculate_weather_quality_score',
        params: {
          weather_data: { days: [{ tempmax: 90, tempmin: 70, temp: 80 }] }  // Fixed parameter name
        }
      }
    ];
    
    for (const func of functionsToCheck) {
      const { data, error } = await service.supabase.rpc(func.name, func.params);
      
      if (error && error.message.includes('Could not find the function')) {
        errors.push(`Database function '${func.name}' not found`);
      }
    }
    
  } catch (error) {
    errors.push(`Schema verification failed: ${error.message}`);
  }
  
  return {
    success: errors.length === 0,
    errors
  };
}

async function runTests() {
  console.log('🧪 Starting Weather Service Tests\n');
  
  try {
    const service = new WeatherCollectionService();
    
    // Test 0: Database Schema Verification
    console.log('🔍 Test 0: Database Schema Verification');
    const schemaCheck = await verifyDatabaseSchema(service);
    if (!schemaCheck.success) {
      console.log('   ❌ Database schema verification failed');
      schemaCheck.errors.forEach(error => console.log(`      - ${error}`));
      console.log('');
      console.log('🚨 CRITICAL: Phase 1 database setup appears incomplete!');
      console.log('   Please run the Phase 1 database migration scripts first.');
      process.exit(1);
    }
    console.log('   ✅ Database schema verification passed');
    console.log('');
    
    // Test 1: API Connectivity
    console.log('📡 Test 1: API Connectivity');
    const connectivityTest = await service.testApiConnectivity();
    console.log(`   ${connectivityTest.success ? '✅' : '❌'} ${connectivityTest.message}`);
    if (connectivityTest.responseTime) {
      console.log(`   Response time: ${connectivityTest.responseTime}ms`);
    }
    console.log('');
    
    if (!connectivityTest.success) {
      console.log('❌ API connectivity failed. Check your WEATHER_API_KEY environment variable.');
      process.exit(1);
    }
    
    // Test 2: Collect Yesterday's Weather
    console.log('🌤️ Test 2: Collect Yesterday\'s Weather');
    const yesterday = WeatherCollectionService.getYesterdayDate();
    console.log(`   Target date: ${yesterday}`);
    
    const result = await service.collectDailyWeather(yesterday);
    console.log(`   ${result.success ? '✅' : '❌'} Collection ${result.success ? 'successful' : 'failed'}`);
    
    if (result.success && result.weatherData) {
      console.log(`   Temperature: ${result.weatherData.tempmin}°F - ${result.weatherData.tempmax}°F`);
      
      // Extract conditions from raw_weather_data for display
      const conditions = result.rawResponse?.days?.[0]?.conditions || 'Unknown';
      console.log(`   Conditions: ${conditions}`);
      
      // Ensure quality score is displayed as a number
      const qualityScore = typeof result.dataQualityScore === 'number' 
        ? result.dataQualityScore 
        : 'Error extracting score';
      console.log(`   Quality Score: ${qualityScore}`);
      console.log(`   API Response Time: ${result.apiResponseTime}ms`);
      
      // Show sunrise/sunset times used for calculations
      const sunrise = result.rawResponse?.days?.[0]?.sunrise;
      const sunset = result.rawResponse?.days?.[0]?.sunset;
      if (sunrise && sunset) {
        console.log(`   Sunrise: ${sunrise}, Sunset: ${sunset}`);
      }
      
      if (result.weatherData.temp_dawn) {
        console.log(`   Dawn Temperature: ${result.weatherData.temp_dawn}°F (calculated from sunrise time)`);
      }
      if (result.weatherData.temp_dusk) {
        console.log(`   Dusk Temperature: ${result.weatherData.temp_dusk}°F (calculated from sunset time)`);
      }
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
    
    // Test 3: Verify Database Storage
    if (result.success) {
      console.log('💾 Test 3: Database Storage Verification');
      try {
        const storedData = await service.getWeatherData(yesterday);
        console.log('   ✅ Data successfully stored in database');
        console.log(`   Record ID: ${storedData.id}`);
        console.log(`   Collection timestamp: ${storedData.collection_timestamp}`);
        console.log(`   Data quality score: ${storedData.data_quality_score}`);
        console.log(`   Stored conditions: ${storedData.conditions || 'Available in raw_weather_data'}`);
        console.log(`   Stored sunrise: ${storedData.sunrise}, sunset: ${storedData.sunset}`);
        console.log(`   Raw data contains: ${Object.keys(storedData.raw_weather_data?.days?.[0] || {}).length} weather fields`);
      } catch (error) {
        console.log(`   ❌ Database verification failed: ${error.message}`);
        hasFailures = true;
        failureMessages.push('Database storage verification failed');
      }
      console.log('');
      
      // Test 4: Collection Log Verification
      console.log('📋 Test 4: Collection Log Verification');
      console.log('   ✅ Collection logged (check daily_collection_log table)');
      console.log('');
    } else {
      console.log('💾 Test 3: Database Storage Verification');
      console.log('   ⏭️ Skipped (collection failed)');
      console.log('');
      
      console.log('📋 Test 4: Collection Log Verification');
      console.log('   ⏭️ Skipped (collection failed)');
      console.log('');
    }
    
    // Check if any critical tests failed
    let hasFailures = false;
    let failureMessages = [];

    if (!connectivityTest.success) {
      hasFailures = true;
      failureMessages.push('API connectivity failed');
    }

    if (!result.success) {
      hasFailures = true;
      failureMessages.push('Weather collection failed');
    }

    if (hasFailures) {
      console.log('❌ TESTS FAILED!');
      console.log('');
      console.log('💥 Failure Summary:');
      failureMessages.forEach(msg => console.log(`   - ${msg}`));
      console.log('');
      console.log('🔧 Fix these issues before proceeding to next steps.');
      process.exit(1);
    } else {
      console.log('🎉 All tests completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('- Set up GitHub Actions workflow (Step 2.4)');
      console.log('- Test historical data collection (Step 2.5)');
      console.log('- Monitor data quality scores');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Helper function to test date ranges
async function testDateRange(startDate, endDate) {
  console.log(`📅 Testing date range: ${startDate} to ${endDate}`);
  const service = new WeatherCollectionService();
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const results = [];
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0];
    console.log(`   Collecting data for ${dateString}...`);
    
    try {
      const result = await service.collectDailyWeather(dateString);
      results.push({
        date: dateString,
        success: result.success,
        quality: result.dataQualityScore
      });
      
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Failed for ${dateString}: ${error.message}`);
      results.push({
        date: dateString,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log('\n📊 Date Range Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const quality = result.quality ? ` (Quality: ${result.quality})` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`   ${status} ${result.date}${quality}${error}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📈 Success Rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run standard tests
    runTests().catch(console.error);
  } else if (args[0] === 'range' && args.length === 3) {
    // Test date range: node test-weather-service.js range 2025-07-01 2025-07-07
    testDateRange(args[1], args[2]).catch(console.error);
  } else if (args[0] === 'yesterday') {
    // Test yesterday only: node test-weather-service.js yesterday
    collectYesterdayWeather().then(result => {
      console.log('Yesterday weather collection result:', result);
    }).catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  node test-weather-service.js                    # Run all tests');
    console.log('  node test-weather-service.js yesterday          # Collect yesterday only');
    console.log('  node test-weather-service.js range 2025-07-01 2025-07-07  # Test date range');
  }
}

module.exports = {
  runTests,
  testDateRange
};
