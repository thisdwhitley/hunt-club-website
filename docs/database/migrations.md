# Database Migrations Log

## Migration Format Template
```
### [Date]: [Feature Name]
**Type**: Schema Addition | Schema Modification | Data Migration | Performance
**Affected Tables**: table1, table2, table3
**Breaking Changes**: Yes/No
**Rollback Available**: Yes/No

**Purpose**: Brief description of why this change was needed

**Changes Made**:
- Added table `new_table` with fields: field1, field2, field3
- Modified table `existing_table`: added field4, removed field5
- Added indexes: idx_name1, idx_name2
- Added triggers: trigger_name

**Migration SQL**: 
```sql
-- SQL commands used
```

**Verification Steps**:
- [ ] Verification step 1
- [ ] Verification step 2

**Files Modified**:
- supabase/schema.sql (exported)
- docs/database/SCHEMA.md (if structure changed)
- src/types/database.ts (if types changed)

**Claude Context**: Include this migration when asking Claude about [specific feature]
```

---

### 2025-07-11 (cont.): Enhanced Camera Activity Trends

**Type**: Schema Modification  
**Affected Tables**: daily_camera_snapshots  
**Breaking Changes**: No  
**Rollback Available**: Yes

**Purpose**: Add enhanced trend analysis fields for 7-day averages, anomaly detection, and activity tracking

**Changes Made**:
- Added columns: seven_day_average, weekly_image_change, days_since_last_activity
- Added columns: anomaly_detected, anomaly_type, anomaly_severity  
- Enhanced activity trend calculations
- Improved logging and analysis capabilities

**Migration SQL**: 

```
-- Add enhanced trend analysis columns to daily_camera_snapshots
ALTER TABLE daily_camera_snapshots 
  ADD COLUMN seven_day_average numeric(5,1),
  ADD COLUMN weekly_image_change integer,
  ADD COLUMN days_since_last_activity integer,
  ADD COLUMN anomaly_detected boolean DEFAULT false,
  ADD COLUMN anomaly_type text CHECK (anomaly_type IN ('spike', 'drop')),
  ADD COLUMN anomaly_severity text CHECK (anomaly_severity IN ('moderate', 'high'));

-- Add indexes for performance on new analytics fields
CREATE INDEX idx_daily_camera_snapshots_anomaly 
ON daily_camera_snapshots(anomaly_detected, date DESC) 
WHERE anomaly_detected = true;

CREATE INDEX idx_daily_camera_snapshots_activity 
ON daily_camera_snapshots(days_since_last_activity DESC) 
WHERE days_since_last_activity > 3;

-- Update table comment
COMMENT ON TABLE daily_camera_snapshots 
IS 'Daily camera activity snapshots with enhanced trend analysis (25 fields)';
```

**Files Modified**:
- supabase/schema.sql (exported)
- docs/database/SCHEMA.md (updated with new fields)
- scripts/sync-cuddeback-cameras.js (enhanced calculations)

**Claude Context**: Include this migration when asking Claude about camera activity trends, anomaly detection, or enhanced analytics

### 2025-07-11: Daily Snapshot System

**Type**: Schema Addition  
**Affected Tables**: daily_weather_snapshots, daily_camera_snapshots, daily_collection_log  
**Breaking Changes**: No  
**Rollback Available**: Yes

**Purpose**: Implement automated daily data collection system for weather and camera activity tracking, enabling trend analysis and smart alerting for the 100-acre hunting property.

**Changes Made**:
- **Added**: daily_weather_snapshots table (20+ fields) - Visual Crossing API data storage
- **Added**: daily_camera_snapshots table (19 fields) - Camera activity trends and location tracking  
- **Added**: daily_collection_log table (12 fields) - System monitoring and error tracking
- **Added**: Database functions for quality scoring, location change detection, activity trends
- **Added**: Automated timestamp update triggers  
- **Added**: Performance indexes for date, device, and quality queries
- **Added**: Row Level Security policies

**Migration SQL**: [Full SQL in daily-snapshot-system-implementation.md Phase 1]

**Verification Steps**:
- [x] All three snapshot tables created successfully
- [x] Database functions operational (quality scoring, location detection, activity trends)
- [x] Indexes created for optimal query performance  
- [x] RLS policies active for security
- [x] Sample data inserted and tested
- [x] All automated triggers working

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

---

### 2025-07-10: Hunt Logging System Foundation

**Type**: Schema Addition | Schema Modification  
**Affected Tables**: hunt_logs, hunt_harvests, hunt_sightings, stands  
**Breaking Changes**: No  
**Rollback Available**: Yes (column drops, trigger removal)

**Purpose**: Implement comprehensive hunt logging system with auto-populated weather/astronomical data and enhanced stand activity tracking with member identification.

**Changes Made**:
- **Enhanced**: hunt_logs table - Added 10 auto-population fields (hunt_type, moon_illumination, sunrise_time, sunset_time, hunting_season, property_sector, hunt_duration_minutes, had_harvest, weather_fetched_at, stand_coordinates)
- **Added**: hunt_harvests table (22 fields) - Detailed harvest tracking when had_harvest = true
- **Added**: hunt_sightings table (14 fields) - Animal observation logging during hunts  
- **Enhanced**: stands table - Added 7 activity tracking fields (last_hunted, total_hunts, total_harvests, last_harvest, success_rate, last_hunted_by, last_harvest_by)
- **Added**: Automatic stand activity triggers - Updates stand stats when hunts are logged
- **Added**: Performance indexes for hunt queries and stand analytics
- **Added**: Row Level Security (RLS) policies for all hunt tables
- **Added**: Auto-update triggers for timestamp fields

**Migration SQL**: 
[Reference hunt_logging_migration and enhanced_stand_tracking artifacts]

**Verification Steps**:
- [x] hunt_logs enhanced with 10 auto-population fields  
- [x] hunt_harvests and hunt_sightings tables created
- [x] stands table enhanced with activity tracking
- [x] Triggers update stand stats automatically
- [x] Foreign key relationships working
- [x] RLS policies active on all hunt tables
- [x] Performance indexes created

**Files Modified**:
- supabase/schema.sql (exported after migration)
- docs/database/SCHEMA.md (updated with hunt logging tables)
- src/types/database.ts (hunt logging types to be added)

**Claude Context**: Include this migration when asking Claude about hunt logging, weather auto-population, stand analytics, or harvest tracking. Essential for understanding the three-table hunt logging relationship and automatic stand activity updates.

**Key Business Logic**:
- Weather data auto-populated from stand coordinates using Visual Crossing API
- Moon phase calculated using SunCalc library  
- Stand activity updated automatically when hunts logged (Option 1: any hunt)
- Success rate calculated as (total_harvests / total_hunts) * 100
- RLS ensures users only see their own hunt data
- Stand tracking includes member identification for last hunter/harvest
- Harvest and sightings are optional extensions of basic hunt log

---

### 2025-07-09: Web Scraping Automation - Cuddeback Report Timestamp

**Type**: Schema Modification  
**Affected Tables**: camera_status_reports  
**Breaking Changes**: No  
**Rollback Available**: Yes (simple column drop)

**Purpose**: Add field to store Cuddeback's "Last Updated" timestamp for web scraping automation. This replaces Phase 5 email parsing with direct web scraping from Cuddeback device reports.

**Changes Made**:
- **Added**: `cuddeback_report_timestamp` field to camera_status_reports (now 15 fields)
- **Added**: Performance index for cuddeback timestamp queries
- **Updated**: Documentation to reflect web scraping approach
- **Replaced**: Phase 5 email parsing with GitHub Actions web scraping

**Migration SQL**: 
```sql
-- Add field to store when Cuddeback generated the report
ALTER TABLE camera_status_reports 
ADD COLUMN cuddeback_report_timestamp timestamptz;

-- Add index for performance
CREATE INDEX idx_camera_status_reports_cuddeback_timestamp 
ON camera_status_reports(cuddeback_report_timestamp DESC);

-- Update table comment
COMMENT ON TABLE camera_status_reports 
IS 'Daily camera status reports (15 fields) - web scraped from Cuddeback';
```

**Verification Steps**:
- [x] New field exists in camera_status_reports table
- [x] Index created successfully
- [x] Field count updated to 15 in documentation
- [x] Local test script can populate the field
- [x] GitHub Actions workflow can access the field

**Files Modified**:
- supabase/schema.sql (export after migration)
- docs/database/SCHEMA.md (field count and description updates)
- docs/database/camera-system.md (Phase 5 replacement documentation)
- docs/implementation/camera-system-implementation.md (updated roadmap)
- src/lib/cameras/types.ts (TypeScript interface update)

**Claude Context**: This migration enables web scraping automation to replace email parsing. Include when asking Claude about automated camera data sync, Cuddeback integration, or Phase 5 implementation.

**Web Scraping Details**:
- **Data Source**: Cuddeback device report page (13 columns)
- **Automation**: GitHub Actions daily at 6 AM EST
- **Mapping**: Location ID → camera_hardware.device_id
- **Timestamp**: Captures Cuddeback's "Last Updated" time
- **Benefits**: Real-time access, all fields, reliable automation

---

### 2025-07-07: Camera Management System

**Type**: Schema Addition  
**Affected Tables**: camera_hardware, camera_deployments, camera_status_reports  
**Breaking Changes**: Yes (removed trail_cameras table)  
**Rollback Available**: Yes (via trail_cameras_backup table for 7 days)

**Purpose**: Replace basic trail_cameras table with sophisticated three-table system supporting seasonal moves, smart alerts, missing camera detection, and email report parsing.

**Changes Made**:
- **Removed**: trail_cameras table (backed up as trail_cameras_backup)
- **Added**: camera_hardware table (13 fields) - Physical device inventory
- **Added**: camera_deployments table (17 fields) - Location and seasonal tracking  
- **Added**: camera_status_reports table (14 fields) - Daily report data with alerts
- **Added**: Missing detection fields: last_seen_date, missing_since_date, is_missing, consecutive_missing_days
- **Added**: Automatic alert triggers for battery, storage, connectivity issues
- **Added**: Missing camera detection function detect_missing_cameras()
- **Added**: Solar panel monitoring and issue detection
- **Added**: Performance indexes for queries and missing detection
- **Added**: Row Level Security (RLS) policies

**Migration SQL**: 
Enhanced Camera Management System Migration (see camera-system-implementation.md step 1.1)

**Verification Steps**:
- [x] All three camera tables created successfully
- [x] Missing detection indexes functional  
- [x] Alert trigger works for battery/storage/connectivity
- [x] Missing camera detection function operational
- [x] Old trail_cameras table removed, backup retained
- [x] RLS policies active

**Files Modified**:
- supabase/schema.sql (exported after migration)
- docs/database/SCHEMA.md (updated with camera system)
- docs/database/camera-system.md (created)
- docs/implementation/camera-system-implementation.md (field count corrections)
- WORKFLOW.md (enhanced database procedures)

**Claude Context**: Include this migration when asking Claude about camera system, missing detection, or alert logic. Essential for understanding the three-table relationship and missing camera workflows.

**Key Business Logic**:
- Cameras can move between seasons (same location, different hardware)
- Missing detection runs daily after report processing
- Solar panels should show "Ext OK" not "OK" for battery status
- Alert priorities: Missing > Battery Low > Storage Low > Connectivity Issues
- Deployment deactivation preserves historical data

---

### 2025-07-02: Secure database workflow setup  
- ✅ Schema export via PostgreSQL container
- 🔒 Credentials secured in .env.local
- ⚠️ TypeScript generation requires Docker (skipped for now)
- 📦 Container-based approach working reliably



### 2025-07-03: Major stands schema cleanup
- Removed 11 unnecessary fields
- Simplified stand types to 4 actual types: ladder_stand, bale_blind, box_stand, tripod
- Added new fields: season_hunts, food_source, archery_season, trail_camera_name
- Updated enums: time_of_day (AM/PM/ALL), stand_type, food_source_type
- Renamed columns: stand_style → type, best_time_of_day → time_of_day
- Ready for new component architecture

