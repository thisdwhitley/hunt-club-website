# Daily Snapshot System Implementation Roadmap

**Status**: 🚧 IN PROGRESS - Phase 1 Complete, Ready for Phase 2
**Started**: July 11, 2025  
**Current Phase**: ✅ Phase 1 Complete | 🔄 Phase 2 Starting | Phase 3 | Phase 4 | Phase 5 | Phase 6  
**Next Action**: Phase 2, Step 2.1 - Create Weather Collection Service

## Overview

This document provides a step-by-step implementation plan for the automated daily snapshot system for Caswell County Yacht Club. Follow these steps in order to avoid getting lost in complexity.

**Goal**: Implement an automated system that collects daily weather and camera activity data, enabling trend analysis, hunting pattern identification, and smart alerting for the 100-acre hunting property.

## System Architecture Summary

```
Daily Collection Schedule (EST):
├── 7:30 AM: Camera Data Collection
│   ├── Scrape Cuddeback report (existing process)
│   ├── Create daily_camera_snapshots record
│   ├── Detect camera location changes
│   └── Calculate activity trends
│
├── 8:00 AM: Weather Data Collection  
│   ├── Fetch previous day from Visual Crossing API
│   ├── Interpolate dawn/dusk temperatures
│   ├── Create daily_weather_snapshots record
│   ├── Store full JSON + extracted metrics
│   └── Validate data quality
│
└── 8:30 AM: Analysis & Alerting
    ├── Run anomaly detection
    ├── Generate missing data alerts
    ├── Update dashboard metrics
    └── Send email notifications if needed
```

## Progress Tracking

**Current Phase**: ✅ Phase 1 Complete | 🔄 Phase 2 Starting | Phase 3 | Phase 4 | Phase 5 | Phase 6

### Phase 1: Database Foundation ✅ COMPLETED (July 11, 2025)
- [x] Step 1.1: Create three new snapshot tables
- [x] Step 1.2: Add database functions and triggers
- [x] Step 1.3: Create sample data and testing
- [x] Step 1.4: Update documentation
- [x] Step 1.5: Commit and merge to main

### Phase 2: Weather Data Collection ⬜ (2-3 days)
- [ ] Step 2.1: Create weather collection service
- [ ] Step 2.2: Implement Visual Crossing API integration
- [ ] Step 2.3: Add data processing and quality scoring
- [ ] Step 2.4: Create GitHub Actions workflow
- [ ] Step 2.5: Test historical data collection

### Phase 3: Camera Data Integration ⬜ (2-3 days)
- [ ] Step 3.1: Enhance existing camera scraping
- [ ] Step 3.2: Implement activity trend calculations
- [ ] Step 3.3: Add location change detection
- [ ] Step 3.4: Create camera snapshot workflow
- [ ] Step 3.5: Test integration with existing system

### Phase 4: Background Processing ⬜ (1-2 days)
- [ ] Step 4.1: Create analysis and alerting workflow
- [ ] Step 4.2: Implement collection monitoring
- [ ] Step 4.3: Add retry and error handling
- [ ] Step 4.4: Test complete daily workflow

### Phase 5: UI Integration ⬜ (3-4 days)
- [ ] Step 5.1: Create daily highlights widget
- [ ] Step 5.2: Enhance camera cards with trends
- [ ] Step 5.3: Build activity trend charts
- [ ] Step 5.4: Add alert notifications display
- [ ] Step 5.5: Test UI components

### Phase 6: Analytics & Alerting ⬜ (2-3 days)
- [ ] Step 6.1: Implement email notification system
- [ ] Step 6.2: Create advanced anomaly detection
- [ ] Step 6.3: Add performance optimization
- [ ] Step 6.4: Build admin monitoring tools
- [ ] Step 6.5: Conduct user acceptance testing

**Total Estimated Time**: 12-18 days

---

## Git Workflow Setup

### Initial Feature Branch Creation
```bash
git checkout main
git pull origin main
git checkout -b feature/daily-snapshot-system
git push -u origin feature/daily-snapshot-system
```

### Daily Work Session Commands
```bash
# Start work session
git checkout feature/daily-snapshot-system
git pull origin feature/daily-snapshot-system
git status  # Check where you left off

# Regular commits during work
git add .
git commit -m "step-X.Y: [description of what completed]"
git push origin feature/daily-snapshot-system

# Major phase completion
git checkout main
git pull origin main
git merge feature/daily-snapshot-system
git push origin main
git checkout feature/daily-snapshot-system
```

---

## Phase 1: Database Foundation (2-3 days)

**Objective**: Create database tables, functions, and triggers for daily snapshot storage

### Step 1.1: Create Snapshot Tables

**Files to create**: Supabase migration SQL

**Action**: Execute SQL migration to create three new tables

**Migration SQL**:
```sql
-- daily_weather_snapshots table
CREATE TABLE daily_weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata
  date date NOT NULL UNIQUE,
  property_center_lat numeric(10,8) NOT NULL DEFAULT 36.42723577,
  property_center_lng numeric(11,8) NOT NULL DEFAULT -79.51088069,
  collection_timestamp timestamptz DEFAULT now(),
  api_source text DEFAULT 'visual_crossing',
  
  -- Raw API Response
  raw_weather_data jsonb NOT NULL,
  
  -- Extracted Key Metrics
  tempmax numeric(4,1),
  tempmin numeric(4,1),
  temp numeric(4,1),
  temp_dawn numeric(4,1),
  temp_dusk numeric(4,1),
  humidity numeric(5,2),
  precip numeric(5,2),
  precipprob numeric(3,0),
  windspeed numeric(4,1),
  winddir numeric(3,0),
  cloudcover numeric(3,0),
  uvindex numeric(3,1),
  moonphase numeric(3,2),
  sunrise time,
  sunset time,
  
  -- Data Quality Scoring
  data_quality_score integer DEFAULT 100,
  missing_fields text[],
  data_source_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- daily_camera_snapshots table
CREATE TABLE daily_camera_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference Data
  date date NOT NULL,
  camera_device_id text NOT NULL,
  
  -- Snapshot of camera_status_reports fields
  deployment_id uuid,
  hardware_id uuid,
  battery_status text,
  signal_level integer,
  network_links integer,
  sd_images_count integer,
  sd_free_space_mb integer,
  image_queue integer,
  last_photo_timestamp timestamptz,
  temp_f integer,
  cellular_status text,
  gps_coordinates text,
  device_time timestamptz,
  
  -- Trend Analysis Fields
  activity_score integer DEFAULT 0,
  activity_trend text, -- 'increasing', 'decreasing', 'stable', 'new'
  images_added_today integer DEFAULT 0,
  days_since_last_activity integer DEFAULT 0,
  
  -- Location Change Detection
  location_changed boolean DEFAULT false,
  previous_coordinates text,
  location_change_distance_meters numeric(10,2),
  
  -- Alert Flags
  needs_attention boolean DEFAULT false,
  alert_reasons text[],
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(date, camera_device_id)
);

-- daily_collection_log table
CREATE TABLE daily_collection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Collection Metadata
  collection_date date NOT NULL,
  collection_type text NOT NULL, -- 'weather', 'cameras', 'analysis'
  collection_timestamp timestamptz DEFAULT now(),
  
  -- Status Tracking
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'partial', 'failed'
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  processing_duration_ms integer,
  
  -- Error Tracking
  error_message text,
  error_details jsonb,
  retry_count integer DEFAULT 0,
  
  -- Data Quality
  data_quality_issues text[],
  data_completeness_score integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_weather_snapshots_date ON daily_weather_snapshots(date);
CREATE INDEX idx_weather_snapshots_quality ON daily_weather_snapshots(data_quality_score);
CREATE INDEX idx_camera_snapshots_date ON daily_camera_snapshots(date);
CREATE INDEX idx_camera_snapshots_device ON daily_camera_snapshots(camera_device_id);
CREATE INDEX idx_camera_snapshots_activity ON daily_camera_snapshots(activity_score);
CREATE INDEX idx_collection_log_date_type ON daily_collection_log(collection_date, collection_type);
CREATE INDEX idx_collection_log_status ON daily_collection_log(status);

-- Enable Row Level Security
ALTER TABLE daily_weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_camera_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_collection_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users can read/write)
CREATE POLICY "Users can view weather snapshots" ON daily_weather_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert weather snapshots" ON daily_weather_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update weather snapshots" ON daily_weather_snapshots FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view camera snapshots" ON daily_camera_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert camera snapshots" ON daily_camera_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update camera snapshots" ON daily_camera_snapshots FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view collection log" ON daily_collection_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert collection log" ON daily_collection_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update collection log" ON daily_collection_log FOR UPDATE USING (auth.role() = 'authenticated');
```

**Git commands**:
```bash
git add supabase/
git commit -m "step-1.1: create daily snapshot database tables

- Add daily_weather_snapshots table with Visual Crossing API fields
- Add daily_camera_snapshots table with trend analysis
- Add daily_collection_log table for monitoring
- Include indexes for performance
- Add RLS policies for security"
git push origin feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Created snapshot database tables. Migration executed successfully in Supabase. All three tables exist with proper indexes and RLS policies. Ready for Step 1.2."

### Step 1.2: Add Database Functions and Triggers

**Action**: Create database functions for automated data processing

**Additional SQL to execute**:
```sql
-- Function to calculate weather data quality score
CREATE OR REPLACE FUNCTION calculate_weather_quality_score(weather_data jsonb)
RETURNS TABLE(quality_score integer, missing_fields text[]) 
LANGUAGE plpgsql AS $$
DECLARE
  score integer := 100;
  missing text[] := '{}';
  required_fields text[] := ARRAY['tempmax', 'tempmin', 'temp', 'humidity', 'precip', 'windspeed', 'sunrise', 'sunset'];
  field text;
BEGIN
  -- Check each required field
  FOREACH field IN ARRAY required_fields LOOP
    IF weather_data->field IS NULL OR weather_data->>field = '' THEN
      score := score - 10;
      missing := array_append(missing, field);
    END IF;
  END LOOP;
  
  -- Additional quality checks
  IF (weather_data->>'tempmax')::numeric < (weather_data->>'tempmin')::numeric THEN
    score := score - 15;
    missing := array_append(missing, 'temp_logic_error');
  END IF;
  
  IF (weather_data->>'humidity')::numeric > 100 OR (weather_data->>'humidity')::numeric < 0 THEN
    score := score - 10;
    missing := array_append(missing, 'humidity_range_error');
  END IF;
  
  RETURN QUERY SELECT GREATEST(score, 0), missing;
END;
$$;

-- Function to detect camera location changes
CREATE OR REPLACE FUNCTION detect_camera_location_change(
  current_coordinates text,
  previous_coordinates text,
  threshold_meters numeric DEFAULT 50.0
)
RETURNS TABLE(changed boolean, distance_meters numeric)
LANGUAGE plpgsql AS $$
DECLARE
  distance numeric;
  current_lat numeric;
  current_lng numeric;
  prev_lat numeric;
  prev_lng numeric;
BEGIN
  -- Parse coordinates (format: "lat,lng")
  IF current_coordinates IS NULL OR previous_coordinates IS NULL THEN
    RETURN QUERY SELECT false, 0.0;
    RETURN;
  END IF;
  
  -- Extract lat/lng from coordinate strings
  current_lat := split_part(current_coordinates, ',', 1)::numeric;
  current_lng := split_part(current_coordinates, ',', 2)::numeric;
  prev_lat := split_part(previous_coordinates, ',', 1)::numeric;
  prev_lng := split_part(previous_coordinates, ',', 2)::numeric;
  
  -- Calculate distance using Haversine formula (simplified for small distances)
  distance := 111320 * sqrt(
    power(current_lat - prev_lat, 2) + 
    power((current_lng - prev_lng) * cos(radians(current_lat)), 2)
  );
  
  RETURN QUERY SELECT distance > threshold_meters, distance;
END;
$$;

-- Function to calculate activity trends
CREATE OR REPLACE FUNCTION calculate_activity_trend(
  current_images integer,
  previous_images integer,
  days_back integer DEFAULT 7
)
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  trend text := 'stable';
  image_diff integer;
  change_threshold integer := 10; -- Minimum change to consider significant
BEGIN
  IF previous_images IS NULL OR current_images IS NULL THEN
    RETURN 'new';
  END IF;
  
  image_diff := current_images - previous_images;
  
  IF image_diff > change_threshold THEN
    trend := 'increasing';
  ELSIF image_diff < -change_threshold THEN
    trend := 'decreasing';
  ELSE
    trend := 'stable';
  END IF;
  
  RETURN trend;
END;
$$;

-- Trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all snapshot tables
CREATE TRIGGER update_weather_snapshots_updated_at BEFORE UPDATE ON daily_weather_snapshots 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_camera_snapshots_updated_at BEFORE UPDATE ON daily_camera_snapshots 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_log_updated_at BEFORE UPDATE ON daily_collection_log 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Git commands**:
```bash
git add supabase/
git commit -m "step-1.2: add database functions and triggers

- Add calculate_weather_quality_score function
- Add detect_camera_location_change function  
- Add calculate_activity_trend function
- Add auto-update timestamp triggers
- Functions enable automated data processing"
git push origin feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Database functions and triggers created successfully. All automated processing functions are working. Ready for Step 1.3."

### Step 1.3: Create Sample Data and Testing

**Action**: Insert test data and verify database functionality

**Test data SQL**:
```sql
-- Insert sample weather data
INSERT INTO daily_weather_snapshots (
  date, 
  raw_weather_data,
  tempmax, tempmin, temp, temp_dawn, temp_dusk,
  humidity, precip, precipprob, windspeed, winddir,
  cloudcover, uvindex, moonphase, sunrise, sunset,
  data_quality_score
) VALUES (
  '2025-07-10',
  '{"tempmax":85.2,"tempmin":62.1,"temp":73.5,"humidity":68.4,"precip":0.0,"windspeed":8.2,"sunrise":"06:15:00","sunset":"20:10:00"}',
  85.2, 62.1, 73.5, 64.8, 78.2,
  68.4, 0.0, 15, 8.2, 225,
  25, 7.2, 0.25, '06:15:00', '20:10:00',
  100
);

-- Insert sample camera data
INSERT INTO daily_camera_snapshots (
  date,
  camera_device_id,
  battery_status,
  signal_level,
  sd_images_count,
  activity_score,
  activity_trend,
  images_added_today
) VALUES (
  '2025-07-10',
  '002',
  'OK',
  85,
  1247,
  75,
  'increasing',
  23
);

-- Insert sample collection log
INSERT INTO daily_collection_log (
  collection_date,
  collection_type,
  status,
  records_processed,
  processing_duration_ms,
  data_completeness_score
) VALUES (
  '2025-07-10',
  'weather',
  'success',
  1,
  1250,
  100
);

-- Test database functions
SELECT * FROM calculate_weather_quality_score(
  '{"tempmax":85.2,"tempmin":62.1,"temp":73.5,"humidity":68.4,"precip":0.0,"windspeed":8.2,"sunrise":"06:15:00","sunset":"20:10:00"}'::jsonb
);

SELECT * FROM detect_camera_location_change(
  '36.4272,-79.5109',
  '36.4275,-79.5112',
  50.0
);

SELECT calculate_activity_trend(1247, 1224, 7);
```

**Verification queries**:
```sql
-- Verify table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('daily_weather_snapshots', 'daily_camera_snapshots', 'daily_collection_log')
ORDER BY table_name, ordinal_position;

-- Test data retrieval
SELECT count(*) as weather_records FROM daily_weather_snapshots;
SELECT count(*) as camera_records FROM daily_camera_snapshots;  
SELECT count(*) as log_records FROM daily_collection_log;

-- Test indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename LIKE 'daily_%'
ORDER BY tablename, indexname;
```

**Git commands**:
```bash
git add docs/database/
git commit -m "step-1.3: add sample data and testing

- Insert sample weather, camera, and log data
- Test all database functions work correctly
- Verify table structures and indexes
- Database foundation fully functional"
git push origin feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Sample data inserted and tested successfully. All database functions working. Indexes verified. Database foundation is complete. Ready for Step 1.4."

### Step 1.4: Update Documentation

**Files to create/update**:
- `docs/database/migrations.md`
- `docs/database/SCHEMA.md`
- `docs/database/daily-snapshot-system.md`

**Update migrations.md**:
```markdown
### Daily Snapshot System - July 2025

**Type**: Schema Addition  
**Affected Tables**: daily_weather_snapshots, daily_camera_snapshots, daily_collection_log  
**Breaking Changes**: No  
**Rollback Available**: Yes

**Purpose**: Implement automated daily data collection system for weather and camera activity tracking, enabling trend analysis and smart alerting.

**Changes Made**:
- **Added**: daily_weather_snapshots table (20 fields) - Visual Crossing API data storage
- **Added**: daily_camera_snapshots table (19 fields) - Camera activity trends and location tracking
- **Added**: daily_collection_log table (12 fields) - System monitoring and error tracking
- **Added**: Database functions for quality scoring, location change detection, activity trends
- **Added**: Automated timestamp update triggers
- **Added**: Performance indexes for date, device, and quality queries
- **Added**: Row Level Security policies

**Migration SQL**: [Full SQL in daily-snapshot-system-implementation.md Phase 1]

**Verification Steps**:
- [X] All three snapshot tables created successfully
- [X] Database functions operational (quality scoring, location detection, activity trends)
- [X] Indexes created for optimal query performance
- [X] RLS policies active for security
- [X] Sample data inserted and tested
- [X] All automated triggers working

**Files Modified**:
- supabase/schema.sql (exported after migration)
- docs/database/SCHEMA.md (updated with snapshot system)
- docs/database/daily-snapshot-system.md (created)

**Claude Context**: Include this migration when asking Claude about daily snapshots, weather data collection, camera trend analysis, or automated data processing workflows.

**Key Business Logic**:
- Weather data collected daily at 8 AM EST from Visual Crossing API
- Camera snapshots track activity trends and location changes
- Quality scoring enables monitoring of data reliability
- Collection log provides system health monitoring
- All data preserved indefinitely for multi-season analysis
```

**Create daily-snapshot-system.md**:
```markdown
# Daily Snapshot System Documentation

## Overview
Automated daily data collection system for weather and camera activity monitoring, enabling trend analysis and hunting pattern identification.

## System Architecture

### Data Collection Schedule
- **7:30 AM EST**: Camera data snapshot creation
- **8:00 AM EST**: Weather data collection from Visual Crossing API
- **8:30 AM EST**: Analysis and alerting workflow

### Database Tables

#### daily_weather_snapshots
Complete weather data for property center coordinates with quality scoring.

**Key Fields**:
- Date, coordinates, API source metadata
- Raw JSON response for future flexibility
- Extracted metrics: temperatures, humidity, precipitation, wind, etc.
- Dawn/dusk temperatures interpolated from hourly data
- Data quality score (0-100) with missing field tracking

#### daily_camera_snapshots  
Daily snapshot of camera status with trend analysis.

**Key Fields**:
- Camera device ID and snapshot date
- All camera status report fields preserved
- Activity scoring and trend calculation
- Location change detection with distance measurement
- Alert flags for attention-needed cameras

#### daily_collection_log
System monitoring and error tracking for data collection workflows.

**Key Fields**:
- Collection type (weather/cameras/analysis) and timestamps
- Success/failure status with error details
- Processing metrics and data quality scores
- Retry tracking and troubleshooting information

## Data Processing Logic

### Weather Quality Scoring
- **100 points**: Perfect data with all required fields
- **-10 points**: Each missing required field
- **-15 points**: Temperature logic errors (max < min)
- **-10 points**: Humidity out of range (0-100%)

### Camera Activity Trends
- **"increasing"**: >10 more images than previous period
- **"decreasing"**: >10 fewer images than previous period  
- **"stable"**: Within 10 image threshold
- **"new"**: No previous data available

### Location Change Detection
- Uses Haversine formula for GPS coordinate comparison
- **50-meter threshold**: Default for significant location changes
- Tracks distance moved and flags for investigation

## Automation Workflows

### GitHub Actions Integration
- **Weather Collection**: Runs at 8:00 AM EST daily
- **Camera Processing**: Runs at 7:30 AM EST daily
- **Analysis & Alerts**: Runs at 8:30 AM EST daily
- **Error Handling**: Retry logic with exponential backoff

### Alert Generation
1. **Missing Data**: Weather/camera data not collected by expected time
2. **Quality Issues**: Data quality score below 80%
3. **Location Changes**: Camera moved >50 meters
4. **Activity Anomalies**: Significant activity pattern changes

## API Integration

### Visual Crossing Weather API
- **Endpoint**: Historical weather data for previous day
- **Cost**: $0.0001 per record (~$0.04/year)
- **Data Availability**: Complete by 6-8 AM following day
- **Coordinates**: Property center (36.42723577, -79.51088069)

### Error Handling
- **Retry Logic**: 3 attempts with exponential backoff
- **Fallback**: Preserve data gaps rather than interpolate
- **Monitoring**: Collection success tracked in daily_collection_log
- **Alerting**: Email notifications for collection failures

## Performance Considerations

### Database Optimization
- **Indexes**: Date, device ID, activity score, quality score
- **Query Patterns**: Dashboard widgets <500ms target
- **Data Growth**: ~2MB/year total storage
- **Retention**: Indefinite (data becomes more valuable over time)

### Monitoring & Maintenance
- **Success Rate Target**: 99%+ daily collection
- **Quality Score Target**: 95%+ average
- **Alert Response**: <2 hours for critical issues
- **Performance**: Dashboard queries <500ms
```

**Git commands**:
```bash
git add docs/
git commit -m "step-1.4: update documentation for daily snapshot system

- Add migration entry to migrations.md
- Update SCHEMA.md with new tables
- Create daily-snapshot-system.md with detailed docs
- Document all business logic and automation workflows"
git push origin feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Documentation updated for daily snapshot system. All database changes documented. Ready for Step 1.5."

### Step 1.5: Commit and Merge to Main

**Action**: Merge Phase 1 to main so Claude can see database foundation

**Commands**:
```bash
# Merge to main so Claude can see progress
git checkout main
git pull origin main
git merge feature/daily-snapshot-system
git push origin main
git checkout feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Phase 1 complete. Database foundation merged to main. Ready for Phase 2, Step 2.1."

---

## Phase 2: Weather Data Collection (2-3 days)

**Objective**: Implement Visual Crossing API integration and automation

### Step 2.1: Create Weather Collection Service

**File**: `src/lib/weather/weather-service.ts`

**Action**: Create comprehensive weather data collection service

**How to prompt Claude**:
> "Starting Phase 2. Need to create weather collection service. Attach files:
> - docs/implementation/daily-snapshot-system-design.md  
> - docs/database/daily-snapshot-system.md
> 
> Please create src/lib/weather/weather-service.ts with:
> - Visual Crossing API integration
> - Error handling and retries
> - Data quality scoring using database function
> - Dawn/dusk temperature interpolation from hourly data
> - Complete TypeScript types for all responses"

**Expected deliverables**:
- Weather service with API integration
- TypeScript interfaces for Visual Crossing API
- Error handling with exponential backoff
- Data quality validation
- Test functions for API connectivity

### Step 2.2: Implement Visual Crossing API Integration

**Files**: 
- `src/lib/weather/visual-crossing-client.ts`
- `src/lib/weather/types.ts`

**Action**: Create dedicated API client with comprehensive error handling

**How to prompt Claude**:
> "Weather service created. Now need Visual Crossing API client. Requirements:
> - Dedicated client class for Visual Crossing Historical API
> - Handle rate limiting and HTTP errors
> - Parse response and extract all required fields
> - Support for date range queries (for backfilling historical data)
> - Environment variable configuration for API key
> - TypeScript types matching Visual Crossing response format"

**Expected deliverables**:
- Visual Crossing API client
- Complete TypeScript interfaces
- Configuration management
- Rate limiting handling
- Response validation

### Step 2.3: Add Data Processing and Quality Scoring

**Files**:
- `src/lib/weather/data-processor.ts`
- `src/lib/weather/quality-validator.ts`

**Action**: Implement data processing pipeline with quality validation

**How to prompt Claude**:
> "API client ready. Need data processing pipeline. Requirements:
> - Process Visual Crossing response into database format
> - Calculate dawn/dusk temperatures using sunrise/sunset times
> - Call database quality scoring function
> - Handle missing or invalid data gracefully
> - Extract all 15 weather fields from raw JSON
> - Validate coordinate accuracy and API source tracking"

**Expected deliverables**:
- Data processing pipeline
- Quality validation logic
- Temperature interpolation functions
- Database integration helpers
- Error handling for malformed data

### Step 2.4: Create GitHub Actions Workflow

**File**: `.github/workflows/daily-weather-collection.yml`

**Action**: Set up automated daily weather collection

**How to prompt Claude**:
> "Data processing complete. Need GitHub Actions automation. Requirements:
> - Daily schedule at 8:00 AM EST
> - Run weather collection for previous day
> - Handle timezone conversions properly
> - Store logs in daily_collection_log table  
> - Email notifications on failures
> - Support manual triggering for testing
> - Environment variables for API keys and database credentials"

**Expected deliverables**:
- GitHub Actions workflow
- Environment variable configuration
- Error notification setup
- Manual trigger support
- Logging integration

### Step 2.5: Test Historical Data Collection

**File**: `scripts/test-weather-collection.js`

**Action**: Create testing script and validate with historical data

**How to prompt Claude**:
> "Automation workflow created. Need testing script. Requirements:
> - Test script to collect historical weather data for validation
> - Support date range collection for backfilling
> - Verify API response format matches expectations
> - Test quality scoring with various data scenarios
> - Validate database insertions work correctly
> - Generate report of data quality over test period"

**Expected deliverables**:
- Testing script for manual execution
- Historical data validation
- Quality scoring verification
- Database integration testing
- Documentation for testing procedures

**Git commands** (after all steps):
```bash
git add src/lib/weather/ .github/workflows/ scripts/
git commit -m "phase-2: complete weather data collection system

- Add Visual Crossing API integration with error handling
- Implement data processing and quality scoring  
- Create GitHub Actions workflow for daily automation
- Add testing scripts for historical data validation
- Weather collection system fully operational"
git push origin feature/daily-snapshot-system

# Merge to main
git checkout main
git pull origin main  
git merge feature/daily-snapshot-system
git push origin main
git checkout feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Phase 2 complete. Weather data collection system merged to main. Ready for Phase 3, Step 3.1."

---

## Phase 3: Camera Data Integration (2-3 days)

**Objective**: Enhance existing camera scraping to create daily snapshots

### Step 3.1: Enhance Existing Camera Scraping

**Files to modify**:
- `scripts/sync-cuddeback-data.js` (existing)
- Create: `src/lib/cameras/snapshot-service.ts`

**Action**: Modify existing scraping to dual-write snapshot data

**How to prompt Claude**:
> "Starting Phase 3. Need to enhance existing camera scraping. Attach files:
> - scripts/sync-cuddeback-data.js (current implementation)
> - docs/database/daily-snapshot-system.md
> 
> Requirements:
> - Enhance existing scraper to create daily_camera_snapshots records
> - Preserve existing camera_status_reports functionality
> - Add activity trend calculations
> - Implement location change detection using GPS coordinates
> - Calculate activity scores based on image count changes
> - Maintain backward compatibility with current system"

**Expected deliverables**:
- Enhanced scraping script
- Camera snapshot service
- Activity calculation logic
- Location change detection
- Integration with existing workflows

### Step 3.2: Implement Activity Trend Calculations

**File**: `src/lib/cameras/activity-analyzer.ts`

**Action**: Create sophisticated activity analysis system

**How to prompt Claude**:
> "Camera scraping enhanced. Need activity analysis system. Requirements:
> - Calculate activity scores (0-100) based on image count trends
> - Implement 7-day moving averages for trend detection
> - Detect activity anomalies (sudden spikes or drops)
> - Calculate images_added_today from count differences
> - Implement days_since_last_activity tracking
> - Support different activity patterns (day/night cameras, seasonal variations)"

**Expected deliverables**:
- Activity analysis algorithms
- Trend calculation functions
- Anomaly detection logic
- Scoring system implementation
- Historical comparison tools

### Step 3.3: Add Location Change Detection

**File**: `src/lib/cameras/location-detector.ts`

**Action**: Implement GPS-based location change detection

**How to prompt Claude**:
> "Activity analysis complete. Need location change detection. Requirements:
> - Parse GPS coordinates from camera status reports  
> - Use Haversine formula for distance calculations
> - 50-meter threshold for significant location changes
> - Track distance moved and direction
> - Generate alerts for location changes
> - Handle missing or invalid GPS data gracefully"

**Expected deliverables**:
- GPS coordinate parsing
- Distance calculation functions  
- Location change detection
- Alert generation for moves
- Error handling for invalid coordinates

### Step 3.4: Create Camera Snapshot Workflow

**File**: `.github/workflows/daily-camera-snapshots.yml`

**Action**: Set up automated camera snapshot creation

**How to prompt Claude**:
> "Location detection ready. Need camera snapshot automation. Requirements:
> - Daily schedule at 7:30 AM EST (before weather collection)
> - Integrate with existing Cuddeback scraping
> - Create camera snapshots for all active devices
> - Handle missing cameras and offline devices
> - Log all processing in daily_collection_log
> - Generate alerts for cameras needing attention"

**Expected deliverables**:
- GitHub Actions workflow
- Integration with existing scraping
- Error handling and logging
- Alert generation system
- Manual trigger support

### Step 3.5: Test Integration with Existing System

**File**: `scripts/test-camera-integration.js`

**Action**: Comprehensive testing of camera snapshot system

**How to prompt Claude**:
> "Camera automation created. Need integration testing. Requirements:
> - Test compatibility with existing camera_status_reports system
> - Verify snapshot creation doesn't break current functionality
> - Test activity calculations with historical data
> - Validate location change detection accuracy
> - Test alert generation for various scenarios
> - Performance testing with all 6 cameras"

**Expected deliverables**:
- Integration testing script
- Compatibility verification
- Performance testing
- Alert system validation
- Documentation of test results

**Git commands** (after all steps):
```bash
git add src/lib/cameras/ .github/workflows/ scripts/
git commit -m "phase-3: complete camera data integration

- Enhance existing scraping for snapshot creation
- Add activity trend analysis and scoring
- Implement GPS-based location change detection
- Create automated camera snapshot workflow
- Full integration with existing camera system"
git push origin feature/daily-snapshot-system

# Merge to main
git checkout main
git pull origin main
git merge feature/daily-snapshot-system  
git push origin main
git checkout feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Phase 3 complete. Camera data integration merged to main. Ready for Phase 4, Step 4.1."

---

## Phase 4: Background Processing (1-2 days)

**Objective**: Coordinate daily jobs and implement monitoring

### Step 4.1: Create Analysis and Alerting Workflow

**File**: `.github/workflows/daily-analysis-alerts.yml`

**Action**: Set up coordinated analysis and alert generation

**How to prompt Claude**:
> "Starting Phase 4. Need analysis and alerting workflow. Requirements:
> - Schedule at 8:30 AM EST (after weather and camera collection)
> - Run anomaly detection on both weather and camera data
> - Generate consolidated alerts for missing data, quality issues, activity changes
> - Create daily summary statistics
> - Update dashboard metrics cache
> - Send email notifications for critical alerts"

**Expected deliverables**:
- Analysis workflow automation
- Anomaly detection algorithms
- Alert consolidation logic
- Dashboard metrics updates
- Email notification system

### Step 4.2: Implement Collection Monitoring

**File**: `src/lib/monitoring/collection-monitor.ts`

**Action**: Create comprehensive system health monitoring

**How to prompt Claude**:
> "Analysis workflow created. Need collection monitoring system. Requirements:
> - Monitor success/failure of all daily collection jobs
> - Track data quality trends over time
> - Detect system performance degradation
> - Generate health check reports
> - Monitor API quotas and usage
> - Alert on consecutive collection failures"

**Expected deliverables**:
- Collection monitoring service
- Health check systems
- Performance tracking
- Quota monitoring
- Failure detection and alerting

### Step 4.3: Add Retry and Error Handling

**File**: `src/lib/common/retry-handler.ts`

**Action**: Implement robust retry and error handling system

**How to prompt Claude**:
> "Monitoring system ready. Need retry and error handling. Requirements:
> - Exponential backoff retry strategy
> - Different retry policies for API failures vs database errors
> - Circuit breaker pattern for failing services
> - Comprehensive error logging and categorization
> - Graceful degradation when services are unavailable
> - Recovery procedures for partial failures"

**Expected deliverables**:
- Retry handler service
- Error categorization system
- Circuit breaker implementation
- Recovery procedures
- Comprehensive error logging

### Step 4.4: Test Complete Daily Workflow

**File**: `scripts/test-daily-workflow.js`

**Action**: End-to-end testing of complete daily automation

**How to prompt Claude**:
> "Error handling complete. Need end-to-end workflow testing. Requirements:
> - Test complete daily workflow from start to finish
> - Simulate various failure scenarios (API down, database issues, network problems)
> - Verify proper error handling and recovery
> - Test alert generation and notification delivery
> - Validate data consistency across all systems
> - Performance testing with realistic data loads"

**Expected deliverables**:
- End-to-end testing script
- Failure scenario testing
- Recovery verification
- Performance validation
- Complete workflow documentation

**Git commands** (after all steps):
```bash
git add src/lib/monitoring/ src/lib/common/ .github/workflows/ scripts/
git commit -m "phase-4: complete background processing system

- Add analysis and alerting workflow coordination
- Implement comprehensive collection monitoring
- Add robust retry and error handling
- Complete end-to-end workflow testing
- Background processing system operational"
git push origin feature/daily-snapshot-system

# Merge to main
git checkout main
git pull origin main
git merge feature/daily-snapshot-system
git push origin main
git checkout feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Phase 4 complete. Background processing system merged to main. Ready for Phase 5, Step 5.1."

---

## Phase 5: UI Integration (3-4 days)

**Objective**: Add daily snapshot data to user interface

### Step 5.1: Create Daily Highlights Widget

**File**: `src/components/dashboard/DailyHighlights.tsx`

**Action**: Create dashboard widget showing daily snapshot summary

**How to prompt Claude**:
> "Starting Phase 5. Need daily highlights dashboard widget. Requirements:
> - Show today's weather summary with key metrics
> - Display camera activity highlights (most active, alerts)
> - Show data collection status and quality scores
> - Include yesterday's comparison for trends
> - Responsive design for mobile and desktop
> - Real-time updates when new data arrives"

**Expected deliverables**:
- Daily highlights React component
- Weather summary display
- Camera activity highlights
- Collection status indicators
- Responsive design implementation

### Step 5.2: Enhance Camera Cards with Trends

**Files to modify**:
- `src/components/cameras/CameraCard.tsx` (existing)
- Create: `src/components/cameras/ActivityTrendChart.tsx`

**Action**: Add trend indicators and activity charts to camera cards

**How to prompt Claude**:
> "Daily highlights widget created. Need to enhance camera cards. Attach current CameraCard.tsx. Requirements:
> - Add activity trend indicators (up/down/stable arrows)
> - Show 7-day activity sparkline chart
> - Display last activity date and image count changes
> - Add location change alerts when GPS coordinates change
> - Include data quality indicators
> - Maintain existing card functionality and design"

**Expected deliverables**:
- Enhanced camera card component
- Activity trend chart component
- Trend indicators and sparklines
- Location change alerts
- Data quality indicators

### Step 5.3: Build Activity Trend Charts

**File**: `src/components/analytics/ActivityTrendChart.tsx`

**Action**: Create comprehensive activity visualization component

**How to prompt Claude**:
> "Camera cards enhanced. Need detailed activity trend charts. Requirements:
> - Line chart showing camera activity over time (7/30/90 day views)
> - Overlay weather data for correlation analysis
> - Interactive tooltips with detailed information
> - Ability to compare multiple cameras
> - Export functionality for sharing data
> - Mobile-optimized touch interactions"

**Expected deliverables**:
- Activity trend chart component
- Weather correlation overlay
- Interactive chart features
- Multi-camera comparison
- Export functionality

### Step 5.4: Add Alert Notifications Display

**File**: `src/components/alerts/AlertNotifications.tsx`

**Action**: Create alert display and management system

**How to prompt Claude**:
> "Activity charts complete. Need alert notification system. Requirements:
> - Display active alerts from daily snapshot analysis
> - Categorize alerts by priority (critical, high, medium, low)
> - Show alert details and recommended actions
> - Mark alerts as acknowledged or resolved
> - Real-time notifications for new alerts
> - Alert history and trends"

**Expected deliverables**:
- Alert notification component
- Alert categorization system
- Alert management features
- Real-time notifications
- Alert history tracking

### Step 5.5: Test UI Components

**File**: `src/__tests__/components/daily-snapshots.test.tsx`

**Action**: Comprehensive testing of all UI components

**How to prompt Claude**:
> "Alert system ready. Need comprehensive UI testing. Requirements:
> - Unit tests for all daily snapshot components
> - Integration tests with Supabase data
> - Responsive design testing across devices
> - Accessibility testing for screen readers
> - Performance testing with large datasets
> - User interaction testing"

**Expected deliverables**:
- Complete test suite for UI components
- Integration testing
- Accessibility validation
- Performance testing
- User interaction tests

**Git commands** (after all steps):
```bash
git add src/components/ src/__tests__/
git commit -m "phase-5: complete UI integration for daily snapshots

- Add daily highlights dashboard widget
- Enhance camera cards with trend indicators
- Create activity trend visualization charts
- Implement alert notification system
- Comprehensive UI testing and validation"
git push origin feature/daily-snapshot-system

# Merge to main
git checkout main
git pull origin main
git merge feature/daily-snapshot-system
git push origin main
git checkout feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Phase 5 complete. UI integration merged to main. Ready for Phase 6, Step 6.1."

---

## Phase 6: Analytics & Alerting (2-3 days)

**Objective**: Complete alerting system and performance optimization

### Step 6.1: Implement Email Notification System

**Files**:
- `src/lib/notifications/email-service.ts`
- `src/lib/notifications/templates.ts`

**Action**: Create comprehensive email alerting system

**How to prompt Claude**:
> "Starting Phase 6. Need email notification system. Requirements:
> - SMTP integration for sending alerts
> - HTML email templates for different alert types
> - Daily summary emails with highlights and issues
> - Immediate alerts for critical issues (missing cameras, data collection failures)
> - Subscription management for different alert types
> - Email delivery tracking and retry logic"

**Expected deliverables**:
- Email service integration
- HTML email templates
- Alert categorization and delivery
- Subscription management
- Delivery tracking and retries

### Step 6.2: Create Advanced Anomaly Detection

**File**: `src/lib/analytics/anomaly-detector.ts`

**Action**: Implement sophisticated anomaly detection algorithms

**How to prompt Claude**:
> "Email system ready. Need advanced anomaly detection. Requirements:
> - Statistical anomaly detection for weather patterns
> - Machine learning-based camera activity anomalies
> - Seasonal pattern recognition and adjustments
> - Multi-variable correlation analysis (weather + camera activity)
> - Configurable sensitivity thresholds
> - Historical trend analysis for pattern identification"

**Expected deliverables**:
- Anomaly detection algorithms
- Statistical analysis functions
- Pattern recognition system
- Correlation analysis tools
- Configurable thresholds

### Step 6.3: Add Performance Optimization

**Files**:
- `src/lib/database/query-optimizer.ts`
- `src/lib/cache/redis-cache.ts`

**Action**: Optimize system performance for production use

**How to prompt Claude**:
> "Anomaly detection complete. Need performance optimization. Requirements:
> - Database query optimization for large datasets
> - Redis caching for frequently accessed data
> - API response caching with smart invalidation
> - Background job queue for heavy processing
> - Database connection pooling and management
> - Performance monitoring and alerting"

**Expected deliverables**:
- Query optimization system
- Caching implementation
- Background job processing
- Connection pool management
- Performance monitoring

### Step 6.4: Build Administrative Monitoring Tools

**File**: `src/components/admin/SystemMonitoring.tsx`

**Action**: Create admin interface for system monitoring

**How to prompt Claude**:
> "Performance optimization ready. Need admin monitoring tools. Requirements:
> - System health dashboard for administrators
> - Data collection status and quality metrics
> - API usage and quota monitoring
> - Error log analysis and trending
> - Performance metrics and optimization suggestions
> - Manual trigger capabilities for emergency situations"

**Expected deliverables**:
- Admin monitoring dashboard
- System health metrics
- Error analysis tools
- Performance monitoring
- Manual override capabilities

### Step 6.5: Conduct User Acceptance Testing

**Files**:
- `docs/testing/user-acceptance-test-plan.md`
- `scripts/user-acceptance-tests.js`

**Action**: Final testing and validation with club members

**How to prompt Claude**:
> "Admin tools complete. Need user acceptance testing. Requirements:
> - Create comprehensive test plan for club members
> - Test all major user workflows and features
> - Validate mobile responsiveness across devices
> - Performance testing with realistic usage patterns
> - Documentation for end users
> - Feedback collection and issue tracking"

**Expected deliverables**:
- User acceptance test plan
- End-user documentation
- Mobile testing validation
- Performance validation
- Feedback collection system

**Git commands** (after all steps):
```bash
git add src/lib/notifications/ src/lib/analytics/ src/lib/database/ src/lib/cache/ src/components/admin/ docs/testing/ scripts/
git commit -m "phase-6: complete analytics and alerting system

- Implement email notification system with templates
- Add advanced anomaly detection algorithms  
- Optimize performance with caching and query optimization
- Create administrative monitoring tools
- Complete user acceptance testing and documentation"
git push origin feature/daily-snapshot-system

# Final merge to main
git checkout main
git pull origin main
git merge feature/daily-snapshot-system
git push origin main

# Clean up feature branch
git branch -d feature/daily-snapshot-system
git push origin --delete feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Phase 6 complete. Daily Snapshot System fully implemented and merged to main. System is production-ready."

---

## Success Criteria

### Phase 1 Complete When: ✅ ACHIEVED
- [x] All three snapshot tables exist in Supabase with proper indexes
- [x] Database functions operational (quality scoring, location detection, trends)
- [x] Sample data inserted and tested successfully
- [x] Complete documentation created

### Phase 2 Complete When:
- [ ] Visual Crossing API integration working with error handling
- [ ] Weather data collection automated via GitHub Actions
- [ ] Data quality scoring functional and reliable
- [ ] Historical data testing completed successfully

### Phase 3 Complete When:
- [ ] Camera scraping enhanced without breaking existing functionality
- [ ] Activity trend calculations working accurately
- [ ] Location change detection operational
- [ ] Camera snapshot automation integrated with existing system

### Phase 4 Complete When:
- [ ] Complete daily workflow automation functional
- [ ] Robust error handling and retry logic operational
- [ ] System monitoring and health checks working
- [ ] End-to-end testing completed successfully

### Phase 5 Complete When:
- [ ] Daily highlights widget integrated into dashboard
- [ ] Camera cards enhanced with trend indicators
- [ ] Activity trend charts functional and responsive
- [ ] Alert notification system operational

### Phase 6 Complete When:
- [ ] Email notification system delivering alerts reliably
- [ ] Advanced anomaly detection identifying patterns
- [ ] System performance optimized for production use
- [ ] User acceptance testing completed with positive feedback

---

## Emergency Procedures

### If You Get Stuck
1. **Check this document** for the exact step you're on in the progress tracking
2. **Use the provided prompts** to ask Claude for help with specific context
3. **Include current files**: Always attach relevant files when asking for help
4. **Never skip ahead**: Each phase builds on previous ones - complete in order

### Database Issues
1. **Backup before changes**: Always export schema before major modifications
2. **Test in staging**: Use Supabase staging environment if available
3. **Rollback procedures**: Use git to revert to last working database schema
4. **Data recovery**: Keep daily_collection_log for troubleshooting

### API Issues
1. **Check API status**: Visual Crossing status page for service issues
2. **Verify credentials**: GitHub Secrets configuration for API keys
3. **Test endpoints**: Use manual scripts to test API connectivity
4. **Rate limiting**: Monitor API usage in collection logs

### Automation Troubleshooting
1. **GitHub Actions logs**: Check workflow execution details
2. **Environment variables**: Verify all secrets are properly configured
3. **Timezone issues**: Ensure EST scheduling works correctly
4. **Manual triggers**: Use workflow dispatch for testing

### Getting Back on Track
If you lose track of where you are:
1. **Check progress tracking** in this document
2. **Review recent git commits** to see what's been completed
3. **Ask Claude**: "I lost track of daily snapshot implementation. Here's what I have: [list completed phases/steps]. Where should I continue?"

### Rollback Procedures
- **Database**: Use Supabase backup/restore from before daily snapshot migration
- **Code**: Use git to revert to last working state before feature branch
- **Automation**: Disable GitHub Actions workflows until issues resolved
- **UI**: Comment out new components until problems fixed

---

## Final Notes

- **Take breaks** between phases to avoid complexity overload
- **Test thoroughly** at each step before moving to next phase
- **Ask questions** using provided prompts - don't guess at implementations
- **Update progress** in this document as you complete each step
- **Commit often** to save your work and track progress

This daily snapshot system will provide powerful insights into hunting patterns and property management. The investment in proper phased implementation will result in a robust, automated system that runs reliably for years.

**Remember**: Follow the phases in order, use the provided prompts, test thoroughly, and you'll have a sophisticated daily snapshot system that transforms how the hunting club analyzes their property data.

**Estimated Total Time**: 12-18 days with proper testing and documentation
**System Value**: Automated daily insights, trend analysis, and smart alerting for optimal hunting property management