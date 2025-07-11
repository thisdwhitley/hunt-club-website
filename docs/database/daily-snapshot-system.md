# Daily Snapshot System Documentation

## Overview
Automated daily data collection system for weather and camera activity monitoring, enabling trend analysis and hunting pattern identification for the 100-acre Caswell County Yacht Club property.

## System Architecture

### Data Collection Schedule
- **7:30 AM EST**: Camera data snapshot creation
- **8:00 AM EST**: Weather data collection from Visual Crossing API  
- **8:30 AM EST**: Analysis and alerting workflow

### Database Tables

#### daily_weather_snapshots
Complete weather data for property center coordinates with quality scoring.

**Primary Fields:**
- `date` (unique) - Date for weather data
- `property_center_lat/lng` - Property coordinates (36.42723577, -79.51088069)
- `raw_weather_data` (jsonb) - Complete API response
- `tempmax/tempmin/temp` - Temperature readings (°F)
- `temp_dawn/temp_dusk` - Interpolated hunting time temperatures
- `humidity` - Relative humidity percentage
- `precip/precipprob` - Precipitation data
- `windspeed/winddir` - Wind conditions
- `cloudcover/uvindex` - Sky conditions
- `moonphase` - Moon phase (0.0-1.0)
- `sunrise/sunset` - Daily sun times
- `data_quality_score` - Automated quality assessment (0-100)
- `missing_fields` - Array of missing data fields

**Business Logic:**
- Quality scoring deducts 10 points per missing required field
- Logic validation (tempmax > tempmin, humidity 0-100%)
- Dawn/dusk temperatures interpolated for hunting time analysis
- All data preserved indefinitely for multi-season trends

#### daily_camera_snapshots  
Camera activity trends and location tracking for all deployed devices.

**Primary Fields:**
- `date` + `camera_device_id` (composite unique)
- `battery_status/signal_level/temperature` - Device health
- `sd_images_count` - Total images on SD card
- `last_image_timestamp` - Most recent image capture
- `current_coordinates/previous_coordinates` - GPS tracking
- `location_changed/distance_moved_meters` - Movement detection
- `activity_score` - Daily activity rating (0-100)
- `activity_trend` - Trend analysis (increasing/decreasing/stable/insufficient_data)
- `images_added_today` - New images since yesterday
- `peak_activity_hour` - Hour with most activity
- `data_source_quality` - Processing quality score

**Business Logic:**
- Activity scores calculated relative to historical averages
- Location changes detected using Haversine formula (50m threshold)
- Trend analysis compares to 7-day rolling averages
- Missing cameras tracked for alert generation

#### daily_collection_log
System monitoring and error tracking for all automated processes.

**Primary Fields:**
- `collection_date` + `collection_type` - What was collected when
- `status` - success/partial_success/failed/retrying
- `started_at/completed_at` - Processing timestamps
- `processing_duration_ms` - Performance monitoring
- `records_processed/errors_encountered` - Success metrics
- `data_completeness_score` - Overall data quality
- `alerts_generated` - Count of alerts created
- `error_details` (jsonb) - Detailed error information
- `processing_summary` - Human-readable status

**Business Logic:**
- Tracks performance of all daily collection processes
- Enables monitoring of system health and reliability
- Provides debugging information for failures
- Historical performance trend analysis

## Database Functions

### Weather Data Processing

#### calculate_weather_quality_score(weather_data jsonb)
**Purpose**: Automated quality assessment of weather API responses
**Returns**: (quality_score integer, missing_fields text[])
**Logic**:
- Starts at 100 points
- Deducts 10 points per missing required field
- Deducts 15 points for logic errors (tempmax < tempmin)
- Deducts 10 points for range errors (humidity > 100%)
- Returns score (0-100) and array of missing/invalid fields

#### interpolate_dawn_dusk_temps(sunrise_time, sunset_time, tempmin, tempmax, current_temp)
**Purpose**: Estimate temperatures during prime hunting hours
**Returns**: (temp_dawn numeric, temp_dusk numeric)
**Logic**:
- Dawn temp = tempmin + 10% of daily range
- Dusk temp = tempmax - 20% of daily range
- Provides hunting-relevant temperature estimates

### Camera Data Processing

#### detect_camera_location_change(current_coordinates, previous_coordinates, threshold_meters)
**Purpose**: Detect if camera has been moved or stolen
**Returns**: (changed boolean, distance_meters numeric)
**Logic**:
- Parses "lat,lng" coordinate strings
- Uses Haversine formula for distance calculation
- Default threshold: 50 meters
- Returns true if distance exceeds threshold

#### calculate_activity_trend(current_images, previous_images, days_back)
**Purpose**: Analyze camera activity patterns over time
**Returns**: text (increasing/decreasing/stable/insufficient_data)
**Logic**:
- Compares current to previous image counts
- 10+ image change considered significant
- Basis for activity alerts and hunting recommendations

#### calculate_activity_score(images_added_today, avg_images_per_day)
**Purpose**: Score daily camera activity relative to averages
**Returns**: integer (0-100)
**Logic**:
- Percentage of average daily activity, capped at 100
- Enables quick identification of high/low activity days
- Used for dashboard indicators and trend analysis

### Utility Functions

#### validate_coordinates(coordinates text)
**Purpose**: Ensure GPS coordinate format is valid
**Returns**: boolean
**Logic**:
- Validates "lat,lng" format
- Ensures both components are numeric
- Prevents processing errors from malformed data

## Performance Optimization

### Indexes
```sql
-- Weather snapshots
idx_weather_snapshots_date (date DESC)
idx_weather_snapshots_quality (data_quality_score)
idx_weather_snapshots_collection_time (collection_timestamp DESC)

-- Camera snapshots  
idx_camera_snapshots_date_device (date DESC, camera_device_id)
idx_camera_snapshots_activity (activity_score DESC)
idx_camera_snapshots_location_changes (location_changed, distance_moved_meters)
idx_camera_snapshots_device (camera_device_id)

-- Collection log
idx_collection_log_date_type (collection_date DESC, collection_type)
idx_collection_log_status (status, started_at DESC)
idx_collection_log_errors (errors_encountered) WHERE errors_encountered > 0
```

### Query Patterns
- **Dashboard widgets**: <500ms target response time
- **Trend analysis**: Date range queries optimized with date indexes
- **Device filtering**: Device-specific indexes for camera queries
- **Error monitoring**: Conditional indexes for failed operations only

## Integration Points

### Visual Crossing Weather API
- **Endpoint**: Historical weather data for previous day
- **Cost**: $0.0001 per record (~$0.04/year for daily collection)
- **Data Availability**: Complete by 6-8 AM following day
- **Coordinates**: Property center (36.42723577, -79.51088069)
- **Rate Limits**: 1,000 calls/day (sufficient for daily collection)

### Existing Camera System
- **Data Source**: Enhanced Cuddeback email report parsing
- **Integration**: Dual-write to camera_status_reports + daily_camera_snapshots
- **Compatibility**: No changes to existing camera management workflows
- **Location Data**: GPS coordinates from existing camera deployments

## Alert Generation

### Trigger Conditions
1. **Missing Data**: Weather/camera data not collected by expected time
2. **Quality Issues**: Data quality score below 80%
3. **Location Changes**: Camera moved >50 meters  
4. **Activity Anomalies**: Significant activity pattern changes

### Alert Processing
- **Email Notifications**: Critical issues sent to hunting club members
- **Dashboard Alerts**: Visual indicators for missing/problematic data
- **Retry Logic**: 3 attempts with exponential backoff before alerting
- **Alert Throttling**: Prevent spam for ongoing issues

## Error Handling

### Data Collection Failures
- **Retry Logic**: 3 attempts with exponential backoff
- **Fallback**: Preserve data gaps rather than interpolate
- **Monitoring**: All failures logged in daily_collection_log
- **Manual Recovery**: Scripts available for historical data backfill

### Data Quality Issues
- **Validation**: All incoming data validated before storage
- **Quality Scoring**: Automated assessment of data completeness
- **Alert Generation**: Low-quality data triggers investigation alerts
- **Degraded Mode**: System continues operation with partial data

## Monitoring & Maintenance

### Success Metrics
- **Collection Success Rate**: Target 99%+ daily collection
- **Data Quality**: Target 95%+ average quality score  
- **Alert Response**: <2 hours for critical issues
- **Dashboard Performance**: <500ms for all widget queries

### Maintenance Tasks
- **Weekly**: Review collection logs for patterns
- **Monthly**: Analyze data quality trends  
- **Seasonal**: Archive old data, update weather baselines
- **Annual**: Review API costs and performance optimization

## Data Retention

### Storage Growth
- **Weather Data**: ~365 records/year × 2KB = ~730KB/year
- **Camera Data**: ~6 cameras × 365 days × 1KB = ~2.2MB/year
- **Collection Logs**: ~1,095 records/year × 500B = ~550KB/year
- **Total**: ~3.5MB/year total storage growth

### Retention Policy
- **Weather Data**: Indefinite (becomes more valuable over time)
- **Camera Data**: Indefinite (hunting pattern analysis)
- **Collection Logs**: 3 years (operational monitoring)
- **Error Details**: 1 year (debugging and pattern analysis)

## Future Enhancements

### Phase 2 Additions
- **Automated Collection**: GitHub Actions workflows
- **API Optimization**: Caching and rate limit management
- **Enhanced Alerts**: SMS notifications for critical issues

### Phase 3 Additions  
- **Advanced Analytics**: Multi-season trend analysis
- **Machine Learning**: Predictive activity scoring
- **External APIs**: Additional weather data sources

### Phase 4 Additions
- **Real-time Processing**: Live camera data integration  
- **Mobile Apps**: Field data collection capabilities
- **Advanced Reporting**: PDF/Excel export functionality