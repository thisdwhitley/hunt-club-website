/**
 * FILE: src/lib/weather/weather-service.js
 * 
 * Weather Collection Service (JavaScript version for Node.js scripts)
 * 
 * Handles daily weather data collection from Visual Crossing API
 * for the Caswell County Yacht Club hunting property.
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables - ensure these are set
const VISUAL_CROSSING_API_KEY = process.env.WEATHER_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Property coordinates
const PROPERTY_CENTER = {
  lat: 36.42723577,
  lng: -79.51088069
};

// Visual Crossing API configuration
const VISUAL_CROSSING_CONFIG = {
  baseUrl: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline',
  unitGroup: 'us', // Fahrenheit, inches, mph
  elements: [
    'datetime', 'tempmax', 'tempmin', 'temp', 'humidity', 'dew',
    'pressure', 'windspeed', 'windgust', 'winddir',
    'precip', 'precipprob', 'precipcover', 'preciptype',
    'cloudcover', 'visibility', 'conditions', 'description', 'icon',
    'sunrise', 'sunset', 'moonphase',
    'uvindex', 'solarradiation'
  ].join(','),
  include: 'days,hours' // Get both daily summary and hourly data
};

/**
 * Main Weather Collection Service
 */
class WeatherCollectionService {
  constructor() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Collect weather data for a specific date (usually previous day)
   */
  async collectDailyWeather(targetDate) {
    const startTime = new Date().toISOString();
    const logEntry = {
      collection_date: targetDate,
      collection_type: 'weather',
      started_at: startTime,  // Fixed: use started_at instead of start_time
      status: 'pending'       // Set initial status
    };

    try {
      console.log(`🌤️ Starting weather collection for ${targetDate}`);
      
      // 1. Check if data already exists
      const existingData = await this.checkExistingData(targetDate);
      if (existingData) {
        console.log(`⚠️ Weather data for ${targetDate} already exists, skipping collection`);
        return {
          success: true,
          date: targetDate,
          errors: ['Data already exists for this date']
        };
      }

      // 2. Fetch from Visual Crossing API with retry logic
      const apiStartTime = Date.now();
      const rawData = await this.fetchWithRetry(targetDate);
      const apiResponseTime = Date.now() - apiStartTime;

      // 3. Process the raw data
      const processedData = await this.processWeatherData(rawData, targetDate);

      // 4. Store in database
      await this.storeWeatherSnapshot(processedData);

      // 5. Calculate quality score using database function
      const qualityScore = await this.calculateQualityScore(processedData);

      // Ensure qualityScore is actually a number before using it
      const validQualityScore = (typeof qualityScore === 'number' && !isNaN(qualityScore)) ? qualityScore : 85;

      // 6. Log successful collection
      await this.logCollection({
        ...logEntry,
        status: 'success',
        completed_at: new Date().toISOString(),
        processing_duration_ms: apiResponseTime,
        data_completeness_score: validQualityScore,  // Ensure this is an integer
        processing_summary: `Successfully collected weather data with quality score: ${validQualityScore}`
      });

      console.log(`✅ Weather collection completed for ${targetDate} (Quality: ${validQualityScore})`);

      return {
        success: true,
        date: targetDate,
        weatherData: processedData,
        rawResponse: rawData,
        apiResponseTime,
        dataQualityScore: validQualityScore
      };

    } catch (error) {
      console.error(`❌ Weather collection failed for ${targetDate}:`, error);
      
      // Log failure
      await this.logCollection({
        ...logEntry,
        status: 'failed',
        completed_at: new Date().toISOString(),  // Fixed: use completed_at instead of end_time
        error_details: {
          message: error.message,
          stack: error.stack
        },
        processing_summary: `Collection failed: ${error.message}`
      });

      return {
        success: false,
        date: targetDate,
        errors: [error.message]
      };
    }
  }

  /**
   * Check if weather data already exists for the target date
   */
  async checkExistingData(targetDate) {
    const { data, error } = await this.supabase
      .from('daily_weather_snapshots')
      .select('id')
      .eq('date', targetDate)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Error checking existing data: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Fetch weather data from Visual Crossing API with retry logic
   */
  async fetchWithRetry(targetDate, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 API attempt ${attempt}/${maxRetries} for ${targetDate}`);
        return await this.fetchFromVisualCrossing(targetDate);
      } catch (error) {
        lastError = error;
        console.log(`⚠️ API attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 2^attempt seconds
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to fetch weather data after ${maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Make actual API call to Visual Crossing
   */
  async fetchFromVisualCrossing(targetDate) {
    if (!VISUAL_CROSSING_API_KEY) {
      throw new Error('WEATHER_API_KEY environment variable is not set');
    }

    const url = new URL(`${VISUAL_CROSSING_CONFIG.baseUrl}/${PROPERTY_CENTER.lat},${PROPERTY_CENTER.lng}/${targetDate}/${targetDate}`);
    url.searchParams.set('unitGroup', VISUAL_CROSSING_CONFIG.unitGroup);
    url.searchParams.set('elements', VISUAL_CROSSING_CONFIG.elements);
    url.searchParams.set('include', VISUAL_CROSSING_CONFIG.include);
    url.searchParams.set('key', VISUAL_CROSSING_API_KEY);
    url.searchParams.set('contentType', 'json');

    console.log(`🌐 Fetching from Visual Crossing: ${url.toString().replace(VISUAL_CROSSING_API_KEY, 'REDACTED')}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Visual Crossing API rate limit exceeded');
      } else if (response.status === 401) {
        throw new Error('Visual Crossing API authentication failed - check API key');
      } else if (response.status >= 500) {
        throw new Error(`Visual Crossing API server error: ${response.status} ${response.statusText}`);
      } else {
        const errorText = await response.text();
        throw new Error(`Visual Crossing API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (!data.days || data.days.length === 0) {
      throw new Error('No weather data returned from Visual Crossing API');
    }

    return data;
  }

  /**
   * Process raw Visual Crossing data into database format
   * Only includes columns that exist in the actual database schema
   */
  async processWeatherData(rawData, targetDate) {
    const dayData = rawData.days[0];
    
    if (!dayData) {
      throw new Error('No day data found in Visual Crossing response');
    }

    // Calculate dawn/dusk temperatures using database function
    const dawnDuskResult = await this.calculateDawnDuskTemps(dayData);

    // Only include columns that actually exist in your database
    const processedData = {
      date: targetDate,
      property_center_lat: PROPERTY_CENTER.lat,
      property_center_lng: PROPERTY_CENTER.lng,
      collection_timestamp: new Date().toISOString(),
      api_source: 'visual_crossing',
      raw_weather_data: rawData, // Store complete API response here
      
      // Temperature data (these columns exist)
      tempmax: dayData.tempmax,
      tempmin: dayData.tempmin,
      temp: dayData.temp,
      temp_dawn: dawnDuskResult.temp_dawn,
      temp_dusk: dawnDuskResult.temp_dusk,
      
      // Atmospheric conditions (only humidity exists in your schema)
      humidity: dayData.humidity,
      
      // Precipitation (only precip and precipprob exist)
      precip: dayData.precip,
      precipprob: dayData.precipprob,
      
      // Wind (only windspeed and winddir exist, no windgust)
      windspeed: dayData.windspeed,
      winddir: dayData.winddir,
      
      // Sky conditions (only cloudcover and uvindex exist)
      cloudcover: dayData.cloudcover,
      uvindex: dayData.uvindex,
      
      // Astronomical (only sunrise, sunset, moonphase exist)
      sunrise: dayData.sunrise,
      sunset: dayData.sunset,
      moonphase: dayData.moonphase
      
      // Note: conditions, description, icon, visibility, pressure, dew, 
      // precipcover, preciptype, windgust, solarradiation are stored 
      // in raw_weather_data for future use if needed
      
      // Debug info with sunrise/sunset times used for calculation is available
      // in the dawnDuskResult but not stored in database
    };

    return processedData;
  }

  /**
   * Calculate dawn and dusk temperatures using database function
   */
  async calculateDawnDuskTemps(dayData) {
    try {
      // Extract hourly temperatures around sunrise/sunset
      const sunrise = dayData.sunrise;
      const sunset = dayData.sunset;
      const tempMax = dayData.tempmax;
      const tempMin = dayData.tempmin;
      const tempAvg = dayData.temp;

      if (!sunrise || !sunset || !dayData.hours || dayData.hours.length === 0) {
        console.log('⚠️ Missing sunrise/sunset or hourly data, skipping dawn/dusk temperature calculation');
        return {};
      }

      console.log(`🌅 Using sunrise: ${sunrise}, sunset: ${sunset} for dawn/dusk temperature calculation`);

      // Call database function for temperature interpolation
      const { data, error } = await this.supabase
        .rpc('interpolate_dawn_dusk_temps', {
          sunrise_time: sunrise,
          sunset_time: sunset,
          tempmin: tempMin,        // Fixed parameter name
          tempmax: tempMax,        // Fixed parameter name
          current_temp: tempAvg    // Fixed parameter name
        });

      if (error) {
        console.log('⚠️ Database function failed for dawn/dusk temps:', error.message);
        return {};
      }

      // The function returns a table, so we need to get the first row
      const result = Array.isArray(data) ? data[0] : data;

      const dawnDuskData = {
        temp_dawn: result?.temp_dawn,
        temp_dusk: result?.temp_dusk,
        sunrise_used: sunrise,    // Include the times used
        sunset_used: sunset       // Include the times used
      };

      console.log(`🌡️ Calculated dawn temp: ${dawnDuskData.temp_dawn}°F (near ${sunrise}), dusk temp: ${dawnDuskData.temp_dusk}°F (near ${sunset})`);

      return dawnDuskData;
    } catch (error) {
      console.log('⚠️ Error calculating dawn/dusk temperatures:', error);
      return {};
    }
  }

  /**
   * Store processed weather data in database
   */
  async storeWeatherSnapshot(weatherData) {
    const { error } = await this.supabase
      .from('daily_weather_snapshots')
      .insert(weatherData);

    if (error) {
      throw new Error(`Failed to store weather snapshot: ${error.message}`);
    }

    console.log(`💾 Weather data stored successfully for ${weatherData.date}`);
  }

  /**
   * Calculate data quality score using database function
   */
  async calculateQualityScore(weatherData) {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_weather_quality_score', {
          weather_data: weatherData.raw_weather_data  // Fixed parameter name
        });

      if (error) {
        console.log('⚠️ Database quality score calculation failed:', error.message);
        return 85; // Default score if calculation fails
      }

      return data || 85;
    } catch (error) {
      console.log('⚠️ Error calculating quality score:', error);
      return 85; // Default score if calculation fails
    }
  }

  /**
   * Log collection attempt to database using correct column names
   */
  async logCollection(logEntry) {
    try {
      // Map to actual database columns for daily_collection_log
      const dbLogEntry = {
        collection_date: logEntry.collection_date,
        collection_type: logEntry.collection_type,
        status: logEntry.status,
        started_at: logEntry.started_at,
        completed_at: logEntry.completed_at,
        processing_duration_ms: logEntry.processing_duration_ms,
        records_processed: logEntry.status === 'success' ? 1 : 0,
        errors_encountered: logEntry.status === 'failed' ? 1 : 0,
        data_completeness_score: logEntry.data_completeness_score,
        alerts_generated: 0, // No alerts for now
        error_details: logEntry.error_details,
        processing_summary: logEntry.processing_summary
      };

      const { error } = await this.supabase
        .from('daily_collection_log')
        .insert(dbLogEntry);

      if (error) {
        console.error('Failed to log collection attempt:', error.message);
      }
    } catch (error) {
      console.error('Error logging collection attempt:', error);
    }
  }

  /**
   * Test API connectivity
   */
  async testApiConnectivity() {
    try {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 1); // Yesterday
      const dateString = testDate.toISOString().split('T')[0];
      
      console.log(`🧪 Testing Visual Crossing API connectivity for ${dateString}`);
      
      const startTime = Date.now();
      await this.fetchFromVisualCrossing(dateString);
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Visual Crossing API is accessible and responding normally',
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format
   */
  static getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Get weather data for a specific date (for testing)
   * Includes mapping of useful fields from raw_weather_data
   */
  async getWeatherData(date) {
    const { data, error } = await this.supabase
      .from('daily_weather_snapshots')
      .select('*')
      .eq('date', date)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve weather data: ${error.message}`);
    }

    // Map additional useful fields from raw_weather_data for display
    if (data && data.raw_weather_data) {
      const rawDay = data.raw_weather_data.days?.[0];
      if (rawDay) {
        data.conditions = rawDay.conditions;
        data.description = rawDay.description;
        data.icon = rawDay.icon;
        data.pressure = rawDay.pressure;
        data.visibility = rawDay.visibility;
        data.windgust = rawDay.windgust;
        data.dew = rawDay.dew;
        data.preciptype = rawDay.preciptype;
        data.solarradiation = rawDay.solarradiation;
      }
    }

    return data;
  }

  /**
   * Helper function to extract display-friendly data from stored weather record
   */
  static extractDisplayData(weatherRecord) {
    const displayData = { ...weatherRecord };
    
    // Extract useful fields from raw_weather_data for display
    if (weatherRecord.raw_weather_data) {
      const rawDay = weatherRecord.raw_weather_data.days?.[0];
      if (rawDay) {
        displayData.conditions = rawDay.conditions || 'Unknown';
        displayData.description = rawDay.description || '';
        displayData.icon = rawDay.icon || '';
        displayData.pressure = rawDay.pressure;
        displayData.visibility = rawDay.visibility;
        displayData.windgust = rawDay.windgust;
        displayData.dew = rawDay.dew;
        displayData.preciptype = rawDay.preciptype;
        displayData.solarradiation = rawDay.solarradiation;
      }
    }
    
    return displayData;
  }
}

/**
 * Standalone function for easy usage in scripts
 */
async function collectYesterdayWeather() {
  const service = new WeatherCollectionService();
  const yesterday = WeatherCollectionService.getYesterdayDate();
  return await service.collectDailyWeather(yesterday);
}

module.exports = {
  WeatherCollectionService,
  collectYesterdayWeather
};
