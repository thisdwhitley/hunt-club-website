# Daily Snapshot System Implementation Roadmap

**Status**: 🚧 IN PROGRESS - Phase 3 Complete, Ready for Phase 5 (UI Integration)
**Started**: July 11, 2025  
**Current Phase**: ✅ Phase 1 Complete | ✅ Phase 2 Complete | ✅ Phase 3 Complete | **🔄 Phase 5 Starting** | Phase 4 | Phase 6  
**Next Action**: Phase 5, Step 5.1 - Create daily highlights widget

## ⚠️ **Implementation Order Change**
**Phase 5 (UI Integration) will be completed before Phase 4 (Background Processing)**  
This allows for better testing of UI components before building the automation layer.

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

**Current Phase**: ✅ Phase 1 Complete | ✅ Phase 2 Complete | ✅ Phase 3 Complete | **🔄 Phase 5 Starting** | Phase 4 | Phase 6  

### Phase 1: Database Foundation ✅ COMPLETED (July 11, 2025)
- [x] Step 1.1: Create three new snapshot tables
- [x] Step 1.2: Add database functions and triggers
- [x] Step 1.3: Create sample data and testing
- [x] Step 1.4: Update documentation
- [x] Step 1.5: Commit and merge to main

### ✅ **Phase 2: Weather Data Collection** - COMPLETE  
- [x] **Step 2.1**: Create weather collection service 
- [x] **Step 2.2**: Implement Visual Crossing API integration 
- [x] **Step 2.3**: Add data processing and quality scoring 
- [x] **Step 2.4**: Create GitHub Actions workflow 
- [x] **Step 2.5**: Test historical data collection 

### ✅ **Phase 3: Camera Data Integration** - COMPLETE (July 14, 2025)
- [x] **Step 3.1**: Enhance existing camera scraping
- [x] **Step 3.2**: Implement activity trend calculations
- [x] **Step 3.3**: ~~Add location change detection~~ (SKIPPED - limited value with daily camera reports)
- [x] **Step 3.4**: Create camera snapshot workflow
- [x] **Step 3.5**: Test integration with existing system

**Note**: Step 3.3 (location change detection) was skipped because the daily camera reports from Cuddeback provide limited location precision and the GPS coordinates in the reports are not reliable enough for meaningful location change detection.

### 🔄 **Phase 5: UI Integration** - IN PROGRESS (3-4 days)
**Objective**: Add daily snapshot data to user interface

- [ ] **Step 5.1**: Create daily highlights widget
- [ ] **Step 5.2**: Enhance camera cards with trends
- [ ] **Step 5.3**: Build activity trend charts
- [ ] **Step 5.4**: Add alert notifications display
- [ ] **Step 5.5**: Test UI components

### Phase 4: Background Processing ⬜ (1-2 days) - **WILL BE DONE AFTER PHASE 5**
**Objective**: Coordinate daily jobs and implement monitoring

- [ ] Step 4.1: Create analysis and alerting workflow
- [ ] Step 4.2: Implement collection monitoring
- [ ] Step 4.3: Add retry and error handling
- [ ] Step 4.4: Test complete daily workflow

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
  processing_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- daily_camera_snapshots table
CREATE TABLE daily_camera_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  camera_deployment_id uuid REFERENCES camera_deployments(id) ON DELETE CASCADE,
  
  -- Date and Metadata
  date date NOT NULL,
  device_id text NOT NULL,
  device_name text,
  deployment_name text,
  
  -- Complete Status Fields (preserving all data)
  battery_level integer,
  sd_images_count integer,
  sd_videos_count integer,
  sd_available_gb numeric(6,2),
  signal_strength_bars integer,
  temperature_f integer,
  last_communication_at timestamptz,
  firmware_version text,
  cellular_carrier text,
  image_queue integer,
  last_image_at timestamptz,
  gps_latitude numeric(10,8),
  gps_longitude numeric(11,8),
  status_notes text,
  cuddeback_report_timestamp timestamptz,
  
  -- Activity Analysis (calculated fields)
  images_added_today integer DEFAULT 0,
  activity_score integer DEFAULT 0,
  days_since_last_activity integer DEFAULT 0,
  seven_day_average_images numeric(5,1) DEFAULT 0,
  activity_trend text DEFAULT 'stable',
  activity_anomaly boolean DEFAULT false,
  
  -- Data Quality
  data_quality_score integer DEFAULT 100,
  missing_fields text[],
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Composite unique constraint
  UNIQUE(date, device_id)
);

-- daily_collection_log table
CREATE TABLE daily_collection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Collection Metadata
  collection_date date NOT NULL,
  collection_type text NOT NULL, -- 'weather', 'cameras', 'analysis'
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed', 'partial'
  
  -- Processing Details
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  
  -- Error Handling
  error_message text,
  error_details jsonb,
  retry_count integer DEFAULT 0,
  
  -- Quality Metrics
  data_quality_issues text[],
  performance_metrics jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Git commands** (after running migration):
```bash
git add supabase/
git commit -m "step-1.1: create daily snapshot database tables

- Add daily_weather_snapshots table (20 fields + quality scoring)
- Add daily_camera_snapshots table (30 fields including activity analysis)
- Add daily_collection_log table for monitoring and debugging
- Include comprehensive indexes for performance
- Database foundation ready for daily snapshot system"
git push origin feature/daily-snapshot-system
```

**How to prompt Claude**:
> "Starting Phase 1. Database migration complete. Three snapshot tables created in Supabase. Ready for Step 1.2."

### Step 1.2: Add Database Functions and Triggers

**Files to create**: Additional Supabase SQL for functions

**Action**: Create helper functions for data quality and activity calculations

**How to prompt Claude**:
> "Step 1.1 complete. Need database functions and triggers. Requirements:
> - Data quality scoring function for weather snapshots
> - Activity trend calculation functions for camera snapshots
> - Location change detection using GPS coordinates  
> - Anomaly detection triggers
> - Updated_at triggers for all snapshot tables"

**Expected deliverables**:
- Quality scoring algorithms
- Activity calculation functions
- GPS distance calculations
- Automated triggers
- Database performance indexes

### Step 1.3: Create Sample Data and Testing

**File**: `scripts/create-sample-snapshot-data.js`

**Action**: Generate realistic test data for development

**How to prompt Claude**:
> "Database functions ready. Need sample data generation script. Requirements:
> - Create 30 days of sample weather snapshots
> - Generate daily camera snapshots for all 6 cameras
> - Include realistic activity trends and anomalies
> - Add collection log entries for testing
> - Verify all database functions work correctly"

**Expected deliverables**:
- Sample data generation script
- Realistic test scenarios
- Function verification
- Data quality validation
- Performance testing

### Step 1.4: Update Documentation

**Files to update**:
- `docs/database/SCHEMA.md`
- `docs/database/daily-snapshot-system.md`

**Action**: Document new database structure comprehensively

**How to prompt Claude**:
> "Sample data created successfully. Need documentation updates. Please update database schema documentation to include the three new snapshot tables, their relationships, and the new functions."

**Expected deliverables**:
- Updated schema documentation
- Table relationship diagrams
- Function documentation
- Usage examples
- Migration procedures

### Step 1.5: Commit and Merge to Main

**Git commands**:
```bash
git add docs/
git commit -m "step-1.4: complete database foundation documentation

- Update SCHEMA.md with daily snapshot tables
- Add daily-snapshot-system.md database guide  
- Document functions, triggers, and relationships
- Include usage examples and migration procedures
- Database foundation complete and documented"

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

**File**: `src/lib/weather/snapshot-service.ts`

**Action**: Build core weather data collection service

**How to prompt Claude**:
> "Starting Phase 2. Need weather collection service. Requirements:
> - Visual Crossing API integration for historical weather data
> - Fetch data for property center coordinates (36.42723577, -79.51088069)
> - Parse and extract all weather metrics for daily_weather_snapshots
> - Calculate dawn/dusk temperatures using sunrise/sunset interpolation
> - Implement data quality scoring based on field completeness
> - Full error handling and logging"

**Expected deliverables**:
- Weather API service
- Data parsing and transformation
- Quality scoring implementation
- Error handling system
- TypeScript type definitions

### Step 2.2: Implement Visual Crossing API Integration

**File**: `src/lib/weather/visual-crossing-client.ts`

**Action**: Create robust API client with error handling

**How to prompt Claude**:
> "Weather service created. Need Visual Crossing API client. Requirements:
> - Authentication with API key from environment variables
> - Proper request rate limiting and retry logic
> - Response validation and error handling
> - Support for historical weather queries by date
> - Parse all fields needed for daily_weather_snapshots table
> - Comprehensive logging for debugging"

**Expected deliverables**:
- API client implementation
- Authentication handling
- Rate limiting system
- Response validation
- Retry logic implementation

### Step 2.3: Add Data Processing and Quality Scoring

**File**: `src/lib/weather/data-processor.ts`

**Action**: Implement sophisticated data processing pipeline

**How to prompt Claude**:
> "API client ready. Need data processing and quality scoring. Requirements:
> - Process Visual Crossing response into daily_weather_snapshots format
> - Calculate dawn/dusk temperatures from hourly data + sunrise/sunset times
> - Implement quality scoring (0-100) based on missing fields and data validity
> - Handle missing or invalid data gracefully
> - Store both raw JSON and processed fields
> - Add processing metadata and timestamps"

**Expected deliverables**:
- Data transformation pipeline
- Quality scoring algorithms
- Dawn/dusk temperature calculation
- Missing data handling
- Metadata generation

### Step 2.4: Create GitHub Actions Workflow

**File**: `.github/workflows/daily-weather-snapshots.yml`

**Action**: Set up automated daily weather collection

**How to prompt Claude**:
> "Data processing complete. Need GitHub Actions automation. Requirements:
> - Schedule daily at 8:00 AM EST (after Visual Crossing data is available)
> - Use existing Supabase and Visual Crossing environment secrets
> - Run weather collection for previous day
> - Include error handling and notification on failure
> - Log detailed execution information
> - Support manual triggering for testing"

**Expected deliverables**:
- GitHub Actions workflow
- Environment configuration
- Error notification system
- Manual trigger support
- Execution logging

### Step 2.5: Test Historical Data Collection

**File**: `scripts/test-weather-collection.js`

**Action**: Validate weather collection with historical dates

**How to prompt Claude**:
> "Automation workflow created. Need historical testing script. Requirements:
> - Test weather collection for past 7 days
> - Validate all data fields are populated correctly
> - Verify quality scoring is working
> - Test error handling with invalid dates
> - Confirm database inserts are successful
> - Generate performance metrics"

**Expected deliverables**:
- Historical testing script
- Data validation tests
- Error scenario testing
- Performance metrics
- Success verification

**Git commands** (after all steps):
```bash
git add src/lib/weather/ .github/workflows/ scripts/
git commit -m "phase-2: complete weather data collection system

- Add Visual Crossing API integration with comprehensive error handling
- Implement data processing with dawn/dusk temperature calculation
- Create quality scoring system for data validation
- Add GitHub Actions workflow for daily automation
- Historical testing confirms system reliability"
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

### Step 3.3: Add Location Change Detection ~~(SKIPPED)~~

**Reasoning**: This step was skipped because the daily camera reports from Cuddeback provide limited GPS precision and the location data is not reliable enough for meaningful change detection. The daily reports are primarily status updates rather than precise location tracking.

### Step 3.4: Create Camera Snapshot Workflow

**File**: `.github/workflows/daily-camera-snapshots.yml`

**Action**: Set up automated camera snapshot creation

**How to prompt Claude**:
> "Activity analysis complete. Need camera snapshot automation. Requirements:
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
> "Phase 3 complete. Camera data integration merged to main. Ready for Phase 5, Step 5.1."

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
> - Add activity trend indicators to existing camera cards
> - Show 7-day activity scores and trends
> - Display activity anomaly alerts when detected
> - Add mini trend charts showing recent activity
> - Maintain existing card design and functionality
> - Responsive design for mobile and desktop"

**Expected deliverables**:
- Enhanced CameraCard component
- Activity trend indicators
- Mini trend charts
- Anomaly alert display
- Responsive design updates

### Step 5.3: Build Activity Trend Charts

**File**: `src/components/cameras/ActivityTrendChart.tsx`

**Action**: Create comprehensive activity visualization

**How to prompt Claude**:
> "Camera cards enhanced. Need activity trend charts. Requirements:
> - Build detailed activity trend chart component
> - Show daily activity scores over time (30+ days)
> - Include weather overlay for correlation analysis
> - Interactive tooltips with detailed information
> - Support for different time ranges (7, 14, 30, 90 days)
> - Export functionality for sharing/printing"

**Expected deliverables**:
- Activity trend chart component
- Weather correlation overlay
- Interactive features
- Time range selection
- Export functionality

### Step 5.4: Add Alert Notifications Display

**File**: `src/components/dashboard/AlertNotifications.tsx`

**Action**: Create centralized alert display system

**How to prompt Claude**:
> "Trend charts complete. Need alert notification system. Requirements:
> - Display alerts from daily snapshot data collection
> - Show camera activity anomalies and issues
> - Weather data quality alerts
> - Collection system health notifications
> - Dismissible alert management
> - Mobile-friendly notification display"

**Expected deliverables**:
- Alert notification component
- Alert categorization and prioritization
- Dismissal management
- Mobile-optimized display
- Real-time alert updates

### Step 5.5: Test UI Components

**File**: `src/__tests__/daily-snapshots.test.tsx`

**Action**: Comprehensive testing of all UI components

**How to prompt Claude**:
> "Alert system complete. Need comprehensive UI testing. Requirements:
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
> "Phase 5 complete. UI integration merged to main. Ready for Phase 4, Step 4.1."

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
> "Phase 4 complete. Background processing system merged to main. Ready for Phase 6, Step 6.1."

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
> - Statistical anomaly detection for camera activity patterns
> - Weather-based hunting condition analysis
> - Seasonal trend analysis and predictions
> - Multi-variable correlation detection
> - Machine learning-inspired pattern recognition
> - Configurable sensitivity thresholds"

**Expected deliverables**:
- Advanced anomaly detection algorithms
- Pattern recognition systems
- Correlation analysis tools
- Seasonal trend analysis
- Configurable detection thresholds

### Step 6.3: Add Performance Optimization

**Files**:
- `src/lib/database/query-optimizer.ts`
- `src/lib/cache/snapshot-cache.ts`

**Action**: Optimize system performance for production use

**How to prompt Claude**:
> "Anomaly detection ready. Need performance optimization. Requirements:
> - Database query optimization for large datasets
> - Caching layer for frequently accessed snapshot data
> - Pagination for UI components with large datasets
> - Background job optimization and resource management
> - Memory usage optimization for long-running processes
> - Database connection pooling and optimization"

**Expected deliverables**:
- Query optimization strategies
- Caching implementation
- Pagination systems
- Resource management
- Memory optimization

### Step 6.4: Build Admin Monitoring Tools

**File**: `src/components/admin/SnapshotSystemMonitor.tsx`

**Action**: Create administrative monitoring interface

**How to prompt Claude**:
> "Performance optimization complete. Need admin monitoring tools. Requirements:
> - System health dashboard for administrators
> - Collection status monitoring and manual triggers
> - Data quality metrics and trend analysis
> - Error log viewer and troubleshooting tools
> - Performance metrics and resource usage display
> - Administrative controls for system management"

**Expected deliverables**:
- Administrative monitoring dashboard
- System health indicators
- Manual control interfaces
- Error troubleshooting tools
- Performance monitoring

### Step 6.5: Conduct User Acceptance Testing

**File**: `docs/testing/user-acceptance-test-plan.md`

**Action**: Comprehensive system testing with end users

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

### Phase 2 Complete: ✅ ACHIEVED
- [x] Visual Crossing API integration working with error handling
- [x] Weather data collection automated via GitHub Actions
- [x] Data quality scoring functional and reliable (80+ scores)
- [x] Historical data testing completed successfully (July 2025 data)

### Phase 3 Complete When: ✅ ACHIEVED
- [x] Camera scraping enhanced without breaking existing functionality
- [x] Activity trend calculations working accurately
- [x] ~~Location change detection operational~~ (SKIPPED)
- [x] Camera snapshot automation integrated with existing system

### Phase 5 Complete When:
- [ ] Daily highlights widget integrated into dashboard
- [ ] Camera cards enhanced with trend indicators
- [ ] Activity trend charts functional and responsive
- [ ] Alert notification system operational

### Phase 4 Complete When:
- [ ] Complete daily workflow automation functional
- [ ] Robust error handling and retry logic operational
- [ ] System monitoring and health checks working
- [ ] End-to-end testing completed successfully

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