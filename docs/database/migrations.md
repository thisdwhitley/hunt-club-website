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

