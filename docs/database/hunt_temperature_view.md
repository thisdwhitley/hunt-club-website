# Hunt Temperature View Documentation

## Overview

The `hunt_logs_with_temperature` view provides smart temperature display for hunt logs by mapping hunt timing to appropriate weather conditions:

- **AM hunts** → Dawn temperature (`temp_dawn`)
- **PM hunts** → Dusk temperature (`temp_dusk`)  
- **All Day hunts** → Daily average (`(tempmax + tempmin) / 2`)

## Benefits

### **More Accurate Data**
Instead of showing "45°-75° that day", displays "52°F at dawn" for actual hunting conditions.

### **Zero Storage Overhead** 
Computed on-demand from existing `hunt_logs` and `daily_weather_snapshots` data.

### **Always Current**
Reflects latest weather data automatically - no stale computed values.

### **Backward Compatible**
Existing `hunt_logs` queries continue to work unchanged.

## Usage

### **Basic Query**
```sql
SELECT hunt_date, hunt_type, hunt_temperature, notes
FROM hunt_logs_with_temperature 
ORDER BY hunt_date DESC;
```

### **Supabase Client**
```typescript
const { data: hunts } = await supabase
  .from('hunt_logs_with_temperature')
  .select('hunt_date, hunt_type, hunt_temperature, daily_high, daily_low')
  .order('hunt_date', { ascending: false })
```

### **With Weather Context**
```sql
SELECT 
  hunt_date,
  hunt_type,
  hunt_temperature,
  temp_dawn,
  temp_dusk,
  daily_high,
  daily_low,
  has_weather_data
FROM hunt_logs_with_temperature 
WHERE hunt_date >= CURRENT_DATE - INTERVAL '30 days';
```

## Temperature Logic

### **AM Hunts**
```sql
WHEN hunt_type = 'AM' AND temp_dawn IS NOT NULL 
  THEN ROUND(temp_dawn)::integer
```
Uses interpolated dawn temperature from weather data.

### **PM Hunts**  
```sql
WHEN hunt_type = 'PM' AND temp_dusk IS NOT NULL 
  THEN ROUND(temp_dusk)::integer
```
Uses interpolated dusk temperature from weather data.

### **All Day Hunts**
```sql
WHEN hunt_type = 'All Day' AND tempmax IS NOT NULL AND tempmin IS NOT NULL 
  THEN ROUND((tempmax + tempmin) / 2)::integer
```
Uses average of daily high and low temperatures.

### **Fallback Logic**
1. If specific dawn/dusk temps unavailable → daily average
2. If no weather data → existing `temperature_high` value
3. Final fallback → `NULL`

## Available Columns

### **Original Hunt Data**
All columns from `hunt_logs` table remain available and unchanged.

### **Enhanced Temperature**
- `hunt_temperature` - Smart temperature based on hunt timing
- `temp_dawn` - Dawn temperature from weather data
- `temp_dusk` - Dusk temperature from weather data
- `daily_high` - Daily maximum temperature (`tempmax`)
- `daily_low` - Daily minimum temperature (`tempmin`)
- `daily_average` - Daily average temperature (`temp`)

### **Legal Hunting Times**
- `legal_hunting_start` - Legal hunting start time (sunrise - 30 min)
- `legal_hunting_end` - Legal hunting end time (sunset + 30 min)

### **Data Quality Flags**
- `has_weather_data` - Boolean: weather snapshot exists for hunt date
- `has_dawn_dusk_temps` - Boolean: dawn/dusk temperatures available

## Analytics Examples

### **Temperature-Based Success Analysis**
```sql
SELECT 
  CASE 
    WHEN hunt_temperature < 40 THEN 'Cold (<40°F)'
    WHEN hunt_temperature < 60 THEN 'Cool (40-60°F)'
    WHEN hunt_temperature < 80 THEN 'Moderate (60-80°F)'
    ELSE 'Hot (80°F+)'
  END as temp_range,
  COUNT(*) as hunts,
  AVG(harvest_count) as avg_harvest,
  ROUND(AVG(CASE WHEN had_harvest THEN 1 ELSE 0 END) * 100, 1) as success_rate_pct
FROM hunt_logs_with_temperature 
WHERE hunt_temperature IS NOT NULL
GROUP BY temp_range
ORDER BY MIN(hunt_temperature);
```

### **Hunt Type Temperature Comparison**
```sql
SELECT 
  hunt_type,
  COUNT(*) as hunt_count,
  AVG(hunt_temperature) as avg_hunt_temp,
  AVG(daily_high) as avg_daily_high,
  AVG(daily_low) as avg_daily_low
FROM hunt_logs_with_temperature 
WHERE hunt_temperature IS NOT NULL
GROUP BY hunt_type;
```

## TypeScript Integration

### **Interface**
```typescript
import { Database } from '@/types/database'

type HuntWithTemperature = Database['public']['Tables']['hunt_logs_with_temperature']['Row']
```

### **Helper Function Example**
```typescript
function getTemperatureContext(hunt: HuntWithTemperature): string {
  if (!hunt.hunt_temperature) return 'Temperature unavailable'
  
  switch (hunt.hunt_type) {
    case 'AM':
      return `${hunt.hunt_temperature}°F at dawn`
    case 'PM':
      return `${hunt.hunt_temperature}°F at dusk`
    case 'All Day':
      return `${hunt.hunt_temperature}°F daily average`
    default:
      return `${hunt.hunt_temperature}°F`
  }
}
```

## Performance Considerations

### **Query Performance**
- Adds LEFT JOIN to every query (minimal impact at small scale)
- PostgreSQL optimizes the join automatically
- Consider index on `hunt_logs.hunt_date` if not present

### **Scaling**
- Suitable for thousands of hunt records
- For larger datasets, consider materialized view
- View definition cached by PostgreSQL query planner

## Maintenance

### **Updating Logic**
```sql
-- Modify temperature calculation
CREATE OR REPLACE VIEW hunt_logs_with_temperature AS
SELECT 
  -- Updated logic here
FROM hunt_logs hl
LEFT JOIN daily_weather_snapshots dws ON hl.hunt_date = dws.date;
```

### **Adding Fields**
Simply update the view definition to include additional computed columns or weather context.

### **Dropping View**
```sql
DROP VIEW IF EXISTS hunt_logs_with_temperature;
```
Safe operation - doesn't affect underlying data.

## Data Dependencies

### **Required Tables**
- `hunt_logs` - Base hunt data
- `daily_weather_snapshots` - Weather data with dawn/dusk temperatures

### **Required Fields**
- `hunt_logs.hunt_date` and `hunt_logs.hunt_type`
- `daily_weather_snapshots.date`, `temp_dawn`, `temp_dusk`, `tempmax`, `tempmin`

### **Data Quality**
View gracefully handles missing weather data through fallback logic. Use `has_weather_data` and `has_dawn_dusk_temps` flags to assess data completeness.

## Troubleshooting

### **Missing Temperature Data**
```sql
-- Check hunts without weather data
SELECT hunt_date, has_weather_data, has_dawn_dusk_temps
FROM hunt_logs_with_temperature 
WHERE hunt_temperature IS NULL;
```

### **Temperature Logic Verification**
```sql
-- Verify temperature calculations
SELECT 
  hunt_date,
  hunt_type,
  hunt_temperature,
  temp_dawn,
  temp_dusk,
  daily_high,
  daily_low,
  CASE hunt_type
    WHEN 'AM' THEN 'Should match temp_dawn'
    WHEN 'PM' THEN 'Should match temp_dusk'
    WHEN 'All Day' THEN 'Should be (daily_high + daily_low) / 2'
  END as expected_logic
FROM hunt_logs_with_temperature
WHERE hunt_date >= CURRENT_DATE - INTERVAL '7 days';
```

This view provides the foundation for enhanced hunt logging analytics while maintaining simplicity and data integrity.