// src/lib/hunt-logging/temperature-utils.ts
// NEW FILE - Temperature display utilities for hunt logging

import type { HuntWithTemperature } from '@/types/database'

export interface TemperatureContext {
  temperature: number | null
  context: 'dawn' | 'dusk' | 'average' | 'fallback' | 'unavailable'
  displayText: string
  shortDisplay: string
  fullDisplay: string
}

/**
 * Get contextual temperature display for a hunt
 * Uses the smart temperature from hunt_logs_with_temperature view
 */
export function getTemperatureContext(hunt: any): TemperatureContext {
  // If we have the smart hunt_temperature from the view, use it
  if (hunt.hunt_temperature !== null && hunt.hunt_temperature !== undefined) {
    let context: TemperatureContext['context'] = 'fallback'
    let displayText = ''
    
    // Determine context based on hunt type and available data
    if (hunt.hunt_type === 'AM' && hunt.temp_dawn !== null) {
      context = 'dawn'
      displayText = 'at dawn'
    } else if (hunt.hunt_type === 'PM' && hunt.temp_dusk !== null) {
      context = 'dusk'  
      displayText = 'at dusk'
    } else if (hunt.hunt_type === 'All Day' && hunt.daily_high !== null && hunt.daily_low !== null) {
      context = 'average'
      displayText = 'daily average'
    } else {
      context = 'fallback'
      displayText = 'estimated'
    }
    
    return {
      temperature: hunt.hunt_temperature,
      context,
      displayText,
      shortDisplay: `${hunt.hunt_temperature}°F`,
      fullDisplay: `${hunt.hunt_temperature}°F ${displayText}`
    }
  }
  
  // Fallback for old data or missing weather
  if (hunt.temperature_high !== null) {
    return {
      temperature: hunt.temperature_high,
      context: 'fallback',
      displayText: 'recorded',
      shortDisplay: `${hunt.temperature_high}°F`,
      fullDisplay: `${hunt.temperature_high}°F recorded`
    }
  }
  
  return {
    temperature: null,
    context: 'unavailable',
    displayText: 'unavailable',
    shortDisplay: 'N/A',
    fullDisplay: 'Temperature unavailable'
  }
}

/**
 * Get the primary temperature for this hunt with explanation
 * Used in details view to highlight the most relevant temperature
 */
export function getPrimaryTemperatureExplanation(hunt: any): {
  temperature: number | null
  source: string
  explanation: string
  isOptimal: boolean
} {
  if (!hunt.hunt_type) {
    return {
      temperature: hunt.temperature_high || null,
      source: 'Daily High',
      explanation: 'Hunt type not specified, showing daily high temperature',
      isOptimal: false
    }
  }

  switch (hunt.hunt_type) {
    case 'AM':
      if (hunt.temp_dawn !== null) {
        return {
          temperature: hunt.temp_dawn,
          source: 'Dawn Temperature',
          explanation: 'Temperature at dawn - optimal for morning hunts',
          isOptimal: true
        }
      } else if (hunt.daily_low !== null) {
        return {
          temperature: hunt.daily_low,
          source: 'Daily Low',
          explanation: 'Dawn temperature unavailable, using daily low as approximation',
          isOptimal: false
        }
      }
      break
      
    case 'PM':
      if (hunt.temp_dusk !== null) {
        return {
          temperature: hunt.temp_dusk,
          source: 'Dusk Temperature',
          explanation: 'Temperature at dusk - optimal for evening hunts',
          isOptimal: true
        }
      } else if (hunt.daily_high !== null) {
        return {
          temperature: hunt.daily_high,
          source: 'Daily High',
          explanation: 'Dusk temperature unavailable, using daily high as approximation',
          isOptimal: false
        }
      }
      break
      
    case 'All Day':
      if (hunt.daily_high !== null && hunt.daily_low !== null) {
        return {
          temperature: Math.round((hunt.daily_high + hunt.daily_low) / 2),
          source: 'Daily Average',
          explanation: 'Average of daily high and low - optimal for all-day hunts',
          isOptimal: true
        }
      }
      break
  }
  
  // Final fallback
  return {
    temperature: hunt.temperature_high || null,
    source: 'Recorded Temperature',
    explanation: 'Using available temperature data',
    isOptimal: false
  }
}

/**
 * Get temperature range display for context
 */
export function getTemperatureRange(hunt: any): string {
  if (hunt.daily_low !== null && hunt.daily_high !== null) {
    return `${hunt.daily_low}°F - ${hunt.daily_high}°F daily range`
  }
  
  if (hunt.temperature_low !== null && hunt.temperature_high !== null) {
    return `${hunt.temperature_low}°F - ${hunt.temperature_high}°F recorded range`
  }
  
  return ''
}

/**
 * Get weather quality assessment
 */
export function getWeatherQuality(hunt: any): {
  score: 'excellent' | 'good' | 'fair' | 'poor' | null
  explanation: string
} {
  if (!hunt.temp_dawn && !hunt.temp_dusk && !hunt.temperature_high) {
    return { score: null, explanation: 'No temperature data available' }
  }
  
  // Use hunt-specific temperature for assessment
  const tempContext = getTemperatureContext(hunt)
  const temp = tempContext.temperature
  
  if (temp === null) {
    return { score: null, explanation: 'Temperature data unavailable' }
  }
  
  // Basic temperature comfort assessment for hunting
  if (temp >= 45 && temp <= 65) {
    return { score: 'excellent', explanation: 'Ideal hunting temperature range' }
  } else if (temp >= 35 && temp <= 75) {
    return { score: 'good', explanation: 'Good hunting temperature' }
  } else if (temp >= 25 && temp <= 85) {
    return { score: 'fair', explanation: 'Acceptable hunting temperature' }
  } else {
    return { score: 'poor', explanation: 'Challenging hunting temperature' }
  }
}