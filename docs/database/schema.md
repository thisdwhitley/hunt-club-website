# Database Schema Documentation

## Daily Snapshot System (Latest Addition - July 2025)

### daily_weather_snapshots (22+ fields)
Automated daily weather data collection from Visual Crossing API
- id (uuid, PK)
- date (date, unique) - Date for weather data
- property_center_lat/lng (numeric) - Property coordinates (36.42723577, -79.51088069)
- collection_timestamp (timestamptz) - When data was collected
- api_source (text) - Data source identifier ('visual_crossing')
- raw_weather_data (jsonb) - Complete API response for debugging
- tempmax/tempmin/temp (numeric) - Temperature readings (°F)
- temp_dawn/temp_dusk (numeric) - Interpolated hunting time temperatures
- humidity (numeric) - Relative humidity percentage
- precip/precipprob (numeric) - Precipitation amount and probability
- windspeed/winddir (numeric) - Wind conditions
- cloudcover/uvindex (numeric) - Sky conditions
- moonphase (numeric) - Moon phase (0.0-1.0)
- sunrise/sunset (time) - Daily sun times
- data_quality_score (integer) - Automated quality assessment (0-100)
- missing_fields (text[]) - Array of missing data fields
- quality_notes (text) - Additional quality information
- legal_hunting_start (time) - NC legal hunting start (sunrise - 30 min)
- legal_hunting_end (time) - NC legal hunting end (sunset + 30 min)  
- created_at/updated_at (timestamptz)

### daily_camera_snapshots (25 fields)  
Daily camera activity trends with advanced analytics
- id (uuid, PK)
- date (date) + camera_device_id (text) - Composite unique constraint
- collection_timestamp (timestamptz) - When snapshot was created
- battery_status (text) - Battery level from camera reports
- signal_level (integer) - Cellular signal strength
- temperature (integer) - Camera internal temperature
- sd_images_count (integer) - Total images on SD card
- last_image_timestamp (timestamptz) - Most recent image capture
- current_coordinates (text) - Current GPS coordinates "lat,lng"
- previous_coordinates (text) - Previous GPS coordinates for movement detection
- location_changed (boolean) - Whether camera moved significantly
- distance_moved_meters (numeric) - Distance moved if location changed
- activity_score (integer) - Daily activity rating (0-100)
- activity_trend (text) - Trend analysis (increasing/decreasing/stable/insufficient_data)
- images_added_today (integer) - New images since yesterday
- peak_activity_hour (integer) - Hour with most activity (0-23)
- data_source_quality (integer) - Processing quality score
- processing_notes (text) - Additional processing information
- created_at/updated_at (timestamptz)
- seven_day_average (numeric) - 7-day moving average of daily image additions
- weekly_image_change (integer) - Total image change vs 1 week ago
- days_since_last_activity (integer) - Days since last significant activity (>5 images)
- anomaly_detected (boolean) - Statistical anomaly detected
- anomaly_type (text) - 'spike' or 'drop' if anomaly
- anomaly_severity (text) - 'moderate' or 'high' if anomaly

### daily_collection_log (12 fields)
System monitoring and error tracking for automated processes
- id (uuid, PK)
- collection_date (date) - Date of collection attempt
- collection_type (text) - Type: 'weather', 'camera', 'analysis'
- status (text) - Status: 'success', 'partial_success', 'failed', 'retrying'
- started_at (timestamptz) - When collection process started
- completed_at (timestamptz) - When collection process finished
- processing_duration_ms (integer) - How long processing took
- records_processed (integer) - Number of records successfully processed
- errors_encountered (integer) - Number of errors during processing
- data_completeness_score (integer) - Overall data quality (0-100)
- alerts_generated (integer) - Number of alerts created
- error_details (jsonb) - Detailed error information for debugging
- processing_summary (text) - Human-readable status summary
- created_at (timestamptz)

### Database Functions Added
- `calculate_weather_quality_score(jsonb)` - Automated weather data validation
- `detect_camera_location_change(text, text, numeric)` - GPS-based movement detection  
- `calculate_activity_trend(integer, integer, integer)` - Camera activity analysis
- `calculate_activity_score(integer, numeric)` - Activity scoring (0-100)
- `interpolate_dawn_dusk_temps(time, time, numeric, numeric, numeric)` - Hunting time temperatures
- `validate_coordinates(text)` - GPS coordinate format validation
- `update_updated_at_column()` - Automated timestamp updates

### Indexes Added
- Performance indexes on date, device_id, quality scores, and activity metrics
- Composite indexes for common query patterns
- Conditional indexes for error monitoring

### Integration Points
- **Visual Crossing API**: Historical weather data collection
- **Existing Camera System**: Enhanced with snapshot creation
- **Alert System**: Automated quality and anomaly detection
- **Dashboard Widgets**: Real-time data quality monitoring

## Camera Management System (Latest)

### camera_hardware (13 fields)
Physical camera devices and specifications
- id (uuid, PK)
- device_id (varchar(10), unique) - From daily reports ("002", "013")
- brand, model, serial_number
- purchase_date, fw_version, cl_version
- condition (good|questionable|poor|retired)
- active (boolean)
- notes, created_at, updated_at

### camera_deployments (17 fields)  
Where cameras are currently placed with missing detection
- id (uuid, PK)
- hardware_id (FK to camera_hardware)
- location_name (varchar(100)) - Human readable location
- latitude, longitude (numeric)
- season_year (integer) - 2024, 2025, etc.
- stand_id (FK to stands, optional)
- facing_direction (N|NE|E|SE|S|SW|W|NW)
- has_solar_panel (boolean) - Critical for battery alerts
- active (boolean)
- notes
- **Missing Detection Fields**:
  - last_seen_date - Last appearance in report
  - missing_since_date - First noticed missing
  - is_missing (boolean) - Currently missing
  - consecutive_missing_days (integer)
- created_at, updated_at

### camera_status_reports (15 fields) ⭐ UPDATED
Daily camera status data from Cuddeback web scraping automation
- id (uuid, PK)  
- deployment_id (FK to camera_deployments)
- hardware_id (FK to camera_hardware)
- report_date (date)
- battery_status (varchar) - Original Cuddeback values (e.g., "Ext OK", "Low")
- signal_level (integer) - Parsed from Cuddeback "Level" column  
- network_links (integer) - CuddeLink network connections
- sd_images_count (integer) - Images stored on SD card
- sd_free_space_mb (integer) - Available SD card space
- image_queue (integer) - Images waiting to upload
- needs_attention (boolean) - Auto-generated alerts
- alert_reason (text) - Detailed alert description
- report_processing_date (timestamptz) - When we processed the report
- cuddeback_report_timestamp (timestamptz) ⭐ NEW - When Cuddeback generated the report
- created_at (timestamptz)

**Data Source**: Automated web scraping from Cuddeback device report page
**Update Frequency**: Daily at 6 AM EST via GitHub Actions
**Field Mapping**: 13 columns from Cuddeback table → database fields
**Key Features**: 
- Original Cuddeback values preserved (no normalization)
- Automatic alert generation via triggers
- Missing camera detection integration
- Complete historical tracking


### Key Relationships
- camera_hardware → camera_deployments (one-to-many)
- camera_deployments → camera_status_reports (one-to-many)  
- stands → camera_deployments (one-to-many, optional)

### Alert Logic
- Automatic via trigger on status report insert/update
- Missing camera detection via daily function call
- Solar panel issue detection (should show "Ext OK" not "OK")
- Storage and connectivity alerts

### Functions
- `update_camera_alert_status()` - Trigger function for automatic alerts
- `detect_missing_cameras(date)` - Daily missing camera detection

### Indexes
- Performance indexes on commonly queried fields
- Special indexes for missing camera detection
- Alert-specific indexes for dashboard queries

## Other Application Tables

### members
User management and authentication
- id, email, role, active, created_at, updated_at

### profiles  
Extended user profile information
- id (FK to auth.users), member_id (FK to members)
- first_name, last_name, phone, avatar_url
- created_at, updated_at

### hunt_logs
Individual hunting session records
- id, member_id (FK), date, stand_id (FK)
- start_time, end_time, weather_conditions
- animals_seen, shots_taken, harvest_details
- notes, created_at, updated_at

### stands
Hunting stand locations
- id, name, latitude, longitude
- type, capacity, condition
- last_maintenance, notes
- active, created_at, updated_at

### trails
Trail system mapping
- id, name, description, difficulty
- start_lat, start_lng, end_lat, end_lng
- length_meters, active
- created_at, updated_at

### maintenance_tasks
Property maintenance tracking
- id, title, description, priority
- assigned_to (FK to members), status
- due_date, completed_date
- location, estimated_hours
- created_at, updated_at

### camp_todos
Shared todo lists for camp activities
- id, task, description, priority
- assigned_to (FK to members), status
- due_date, completed_date
- created_by (FK to members)
- created_at, updated_at

### club_events
Club meetings and events
- id, title, description, event_type
- start_date, end_date, location
- max_attendees, rsvp_required
- created_by (FK to members)
- created_at, updated_at

### food_plots
Food plot management
- id, name, location_description
- latitude, longitude, size_acres
- crop_type, planting_date, notes
- active, created_at, updated_at

### property_boundaries
Legal property boundaries
- id, boundary_name, coordinates (JSON)
- area_acres, description
- created_at, updated_at

### trail_cameras_backup
Backup of original trail_cameras table
- Preserved during camera system migration
- Available for data recovery if needed
