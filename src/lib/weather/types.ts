/**
 * FILE: src/lib/weather/types.ts
 * 
 * TypeScript type definitions for Weather Collection Service
 * 
 * Defines interfaces for:
 * - Visual Crossing API responses
 * - Database schema types
 * - Service result types
 * - Configuration interfaces
 */

// Visual Crossing API Response Types
export interface VisualCrossingHour {
  datetime: string;
  temp: number;
  humidity?: number;
  pressure?: number;
  windspeed?: number;
  winddir?: number;
  cloudcover?: number;
  visibility?: number;
  conditions?: string;
  precip?: number;
  precipprob?: number;
  preciptype?: string[];
  uvindex?: number;
  solarradiation?: number;
  dew?: number;
}

export interface VisualCrossingDay {
  datetime: string;
  
  // Temperature fields
  tempmax: number;
  tempmin: number;
  temp: number;
  
  // Atmospheric conditions
  humidity: number;
  dew: number;
  pressure: number;
  
  // Wind conditions
  windspeed: number;
  windgust?: number;
  winddir: number;
  
  // Precipitation
  precip: number;
  precipprob: number;
  precipcover?: number;
  preciptype?: string[];
  
  // Sky conditions
  cloudcover: number;
  visibility: number;
  conditions: string;
  description: string;
  icon: string;
  
  // Astronomical data
  sunrise: string;
  sunset: string;
  moonphase: number;
  
  // Additional metrics
  uvindex: number;
  solarradiation: number;
  
  // Hourly data for dawn/dusk interpolation
  hours: VisualCrossingHour[];
}

export interface VisualCrossingResponse {
  queryCost: number;
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  description?: string;
  days: VisualCrossingDay[];
}

// Database Schema Types
export interface WeatherSnapshotRow {
  id: string;
  date: string;
  property_center_lat: number;
  property_center_lng: number;
  collection_timestamp: string;
  api_source: string;
  raw_weather_data: any;
  
  // Temperature data
  tempmax: number;
  tempmin: number;
  temp: number;
  temp_dawn?: number;
  temp_dusk?: number;
  
  // Atmospheric conditions
  humidity: number;
  pressure: number;
  dew: number;
  
  // Precipitation
  precip: number;
  precipprob: number;
  precipcover?: number;
  preciptype?: string[];
  
  // Wind
  windspeed: number;
  windgust?: number;
  winddir: number;
  
  // Sky conditions
  cloudcover: number;
  visibility: number;
  conditions: string;
  description: string;
  icon: string;
  uvindex: number;
  solarradiation: number;
  
  // Astronomical
  sunrise: string;
  sunset: string;
  moonphase: number;
  
  // Quality tracking
  data_quality_score?: number;
  missing_fields?: string[];
  quality_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CollectionLogRow {
  id: string;
  collection_date: string;
  collection_type: 'weather' | 'cameras' | 'analysis';
  status: 'success' | 'failed' | 'partial';
  start_time: string;
  end_time?: string;
  api_response_time?: number;
  data_quality_score?: number;
  error_details?: any;
  retry_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Service Input/Output Types (Updated to match actual database schema)
export interface ProcessedWeatherData {
  date: string;
  property_center_lat: number;
  property_center_lng: number;
  collection_timestamp: string;
  api_source: string;
  raw_weather_data: any;
  
  // Weather fields that actually exist in database
  tempmax: number;
  tempmin: number;
  temp: number;
  temp_dawn?: number;
  temp_dusk?: number;
  humidity: number;
  precip: number;
  precipprob: number;
  windspeed: number;
  winddir: number;
  cloudcover: number;
  uvindex: number;
  sunrise: string;
  sunset: string;
  moonphase: number;
  
  // Note: The following fields from Visual Crossing API are stored in raw_weather_data:
  // pressure, dew, precipcover, preciptype, windgust, visibility, 
  // conditions, description, icon, solarradiation
  // 
  // Sunrise/sunset times used for dawn/dusk calculations are shown in logs
  // but not stored separately (they're the same as the sunrise/sunset fields above)
}

export interface WeatherCollectionResult {
  success: boolean;
  date: string;
  weatherData?: ProcessedWeatherData;
  rawResponse?: VisualCrossingResponse;
  errors?: string[];
  apiResponseTime?: number;
  dataQualityScore?: number;
}

export interface WeatherCollectionError {
  type: 'api_error' | 'network_error' | 'data_processing_error' | 'database_error';
  message: string;
  details?: any;
  retryable: boolean;
}

// Configuration Types
export interface WeatherAPIConfig {
  baseUrl: string;
  apiKey: string;
  location: string;
  unitGroup: 'us' | 'metric';
  elements: string;
  include: string;
}

export interface PropertyCoordinates {
  lat: number;
  lng: number;
}

// Database Function Return Types
export interface QualityScoreResult {
  quality_score: number;
  missing_fields: string[];
}

export interface DawnDuskTempsResult {
  temp_dawn?: number;
  temp_dusk?: number;
}

// API Test Result Types
export interface ApiConnectivityTest {
  success: boolean;
  message: string;
  responseTime?: number;
  apiCost?: number;
  dataFields?: string[];
}

// Weather Analysis Types
export interface WeatherTrends {
  temperature_trend: 'increasing' | 'decreasing' | 'stable';
  pressure_trend: 'rising' | 'falling' | 'steady';
  activity_forecast: 'high' | 'medium' | 'low';
  hunting_conditions: 'excellent' | 'good' | 'fair' | 'poor';
}

// Utility Types
export type WeatherCondition = 
  | 'Clear'
  | 'Partially cloudy'
  | 'Cloudy'
  | 'Overcast'
  | 'Rain'
  | 'Snow'
  | 'Fog';

export type PrecipitationType = 'rain' | 'snow' | 'ice';

export type WindDirection = 
  | 'N' | 'NNE' | 'NE' | 'ENE'
  | 'E' | 'ESE' | 'SE' | 'SSE'
  | 'S' | 'SSW' | 'SW' | 'WSW'
  | 'W' | 'WNW' | 'NW' | 'NNW';

// Error handling types
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface RateLimitInfo {
  requestsPerDay: number;
  requestsPerHour: number;
  costPerRequest: number;
}

// Export all types
export * from './weather-service';

// Type guards
export function isValidWeatherResponse(data: any): data is VisualCrossingResponse {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.days) &&
    data.days.length > 0 &&
    typeof data.days[0].datetime === 'string' &&
    typeof data.days[0].tempmax === 'number' &&
    typeof data.days[0].tempmin === 'number'
  );
}

export function isValidDayData(day: any): day is VisualCrossingDay {
  return (
    day &&
    typeof day === 'object' &&
    typeof day.datetime === 'string' &&
    typeof day.tempmax === 'number' &&
    typeof day.tempmin === 'number' &&
    typeof day.temp === 'number' &&
    typeof day.humidity === 'number' &&
    typeof day.pressure === 'number'
  );
}

// Constants
export const REQUIRED_WEATHER_FIELDS = [
  'datetime', 'tempmax', 'tempmin', 'temp', 'humidity', 'pressure',
  'windspeed', 'winddir', 'precip', 'precipprob', 'cloudcover',
  'conditions', 'sunrise', 'sunset', 'moonphase'
] as const;

export const OPTIONAL_WEATHER_FIELDS = [
  'windgust', 'precipcover', 'preciptype', 'visibility', 'description',
  'icon', 'uvindex', 'solarradiation', 'dew'
] as const;

export const VISUAL_CROSSING_ICONS = [
  'clear-day', 'clear-night', 'cloudy', 'fog', 'hail', 'partly-cloudy-day',
  'partly-cloudy-night', 'rain-snow-showers-day', 'rain-snow-showers-night',
  'rain-snow', 'rain', 'showers-day', 'showers-night', 'sleet', 'snow-showers-day',
  'snow-showers-night', 'snow', 'thunder-rain', 'thunder-showers-day',
  'thunder-showers-night', 'thunder', 'wind'
] as const;

export type VisualCrossingIcon = typeof VISUAL_CROSSING_ICONS[number];
