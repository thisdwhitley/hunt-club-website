-- =============================================================================
-- HUNT TEMPERATURE VIEW MIGRATION
-- =============================================================================
-- Date: 2025-08-01
-- Purpose: Create smart temperature display for hunt logs based on hunt timing
-- Tables: hunt_logs, daily_weather_snapshots
-- Breaking Changes: No - creates new view only
-- =============================================================================

-- Create the hunt temperature view
CREATE OR REPLACE VIEW hunt_logs_with_temperature AS
SELECT 
  -- All original hunt_logs columns
  hl.id,
  hl.member_id,
  hl.stand_id,
  hl.hunt_date,
  hl.start_time,
  hl.end_time,
  hl.weather_conditions,
  hl.temperature_high,
  hl.temperature_low,
  hl.wind_speed,
  hl.wind_direction,
  hl.precipitation,
  hl.moon_phase,
  hl.harvest_count,
  hl.game_type,
  hl.notes,
  hl.photos,
  hl.hunt_type,
  hl.moon_illumination,
  hl.sunrise_time,
  hl.sunset_time,
  hl.hunting_season,
  hl.property_sector,
  hl.hunt_duration_minutes,
  hl.had_harvest,
  hl.weather_fetched_at,
  hl.stand_coordinates,
  hl.created_at,
  hl.updated_at,
  
  -- Smart hunt temperature based on timing
  CASE 
    -- AM hunts use dawn temperature
    WHEN hl.hunt_type = 'AM' AND dws.temp_dawn IS NOT NULL 
      THEN ROUND(dws.temp_dawn)::integer
    -- PM hunts use dusk temperature  
    WHEN hl.hunt_type = 'PM' AND dws.temp_dusk IS NOT NULL 
      THEN ROUND(dws.temp_dusk)::integer
    -- All Day hunts use daily average
    WHEN hl.hunt_type = 'All Day' AND dws.tempmax IS NOT NULL AND dws.tempmin IS NOT NULL 
      THEN ROUND((dws.tempmax + dws.tempmin) / 2)::integer
    -- Fallback to daily average if specific temps unavailable
    WHEN dws.tempmax IS NOT NULL AND dws.tempmin IS NOT NULL 
      THEN ROUND((dws.tempmax + dws.tempmin) / 2)::integer
    -- Final fallback to stored temperature_high
    ELSE hl.temperature_high
  END AS hunt_temperature,
  
  -- Additional weather context for display/debugging
  dws.temp_dawn,
  dws.temp_dusk,
  dws.tempmax AS daily_high,
  dws.tempmin AS daily_low,
  dws.temp AS daily_average,
  dws.legal_hunting_start,
  dws.legal_hunting_end,

  -- All weather fields from daily_weather_snapshots
  dws.windspeed,
  dws.winddir,
  dws.moonphase,
  dws.humidity,
  dws.precip,
  dws.precipprob,
  dws.cloudcover,
  dws.uvindex,
  dws.sunrise,
  dws.sunset,
  dws.data_quality_score,
  
  -- Weather data availability flags
  (dws.id IS NOT NULL) AS has_weather_data,
  (dws.temp_dawn IS NOT NULL AND dws.temp_dusk IS NOT NULL) AS has_dawn_dusk_temps

FROM hunt_logs hl
LEFT JOIN daily_weather_snapshots dws ON hl.hunt_date = dws.date;

-- Add helpful comment
COMMENT ON VIEW hunt_logs_with_temperature IS 
'Hunt logs enhanced with smart temperature display: AM=dawn, PM=dusk, All Day=average. Includes weather context and availability flags.';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Test the view with recent data
-- SELECT hunt_date, hunt_type, hunt_temperature, temp_dawn, temp_dusk, daily_high, daily_low
-- FROM hunt_logs_with_temperature 
-- ORDER BY hunt_date DESC LIMIT 10;

-- Check temperature logic for each hunt type
-- SELECT 
--   hunt_type,
--   COUNT(*) as hunt_count,
--   AVG(hunt_temperature) as avg_hunt_temp,
--   AVG(daily_high) as avg_daily_high,
--   AVG(daily_low) as avg_daily_low
-- FROM hunt_logs_with_temperature 
-- WHERE hunt_temperature IS NOT NULL
-- GROUP BY hunt_type;

-- Verify weather data availability
-- SELECT 
--   has_weather_data,
--   has_dawn_dusk_temps,
--   COUNT(*) as hunt_count
-- FROM hunt_logs_with_temperature
-- GROUP BY has_weather_data, has_dawn_dusk_temps;

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================

-- Example 1: Recent hunts with smart temperatures
-- SELECT hunt_date, hunt_type, hunt_temperature, notes
-- FROM hunt_logs_with_temperature 
-- WHERE hunt_date >= CURRENT_DATE - INTERVAL '30 days'
-- ORDER BY hunt_date DESC;

-- Example 2: Temperature-based hunt analysis  
-- SELECT 
--   CASE 
--     WHEN hunt_temperature < 40 THEN 'Cold (<40°F)'
--     WHEN hunt_temperature < 60 THEN 'Cool (40-60°F)'
--     WHEN hunt_temperature < 80 THEN 'Moderate (60-80°F)'
--     ELSE 'Hot (80°F+)'
--   END as temp_range,
--   COUNT(*) as hunts,
--   AVG(harvest_count) as avg_harvest,
--   ROUND(AVG(CASE WHEN had_harvest THEN 1 ELSE 0 END) * 100, 1) as success_rate_pct
-- FROM hunt_logs_with_temperature 
-- WHERE hunt_temperature IS NOT NULL
-- GROUP BY temp_range
-- ORDER BY MIN(hunt_temperature);

-- =============================================================================
-- NOTES
-- =============================================================================

/*
Performance Considerations:
- View includes LEFT JOIN, adds minimal overhead for small datasets
- Consider adding index on hunt_logs.hunt_date if not already present
- PostgreSQL will optimize the join automatically

Data Integrity:
- View always reflects current data (no stale computed values)
- Handles missing weather data gracefully with fallbacks  
- Maintains all original hunt_logs functionality

Usage:
- Use hunt_logs_with_temperature exactly like hunt_logs table
- Additional columns: hunt_temperature, temp_dawn, temp_dusk, daily_high, daily_low
- Backward compatible: existing hunt_logs queries unchanged
*/