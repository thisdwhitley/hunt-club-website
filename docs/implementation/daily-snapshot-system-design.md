# Daily Snapshot System - Design Document

**Project**: Caswell County Yacht Club  
**Feature**: Daily Weather & Camera Activity Snapshots  
**Version**: 1.0  
**Date**: July 2025  
**Purpose**: Comprehensive design for automated daily data collection and trend analysis

---

## 🤔 **Design Decisions & Rationale**

### **Weather Data Collection Strategy**

#### **Single Weather Collection Point**
**Decision**: Use property center coordinates (36.42723577, -79.51088069) for all weather data  
**Reasoning**: 
- **Property size analysis**: 100-acre property measures ~445m x 384m (under 0.5km in any direction)
- **Weather variation**: At this scale, weather differences across the property are negligible
- **Cost efficiency**: Single API call vs 6+ calls (one per stand) = 83% cost reduction with identical data quality
- **Complexity reduction**: Simpler data model, easier analysis, no need for weather data aggregation
- **API limitations**: Weather stations typically cover much larger areas than 0.5km radius

#### **Dawn/Dusk Temperature Strategy** 
**Decision**: Use sunrise/sunset times to interpolate temperatures for hunting conditions  
**Reasoning**:
- **Hunting behavior**: Animals are most active at actual sunrise/sunset, not fixed times like 6 AM/PM
- **Seasonal accuracy**: Sunrise/sunset times change significantly throughout hunting season (Oct-Jan in NC)
- **Data availability**: Visual Crossing provides both exact sunrise/sunset times AND hourly temperature data
- **Precision**: Interpolating from hourly data gives accurate temperature at optimal hunting times

#### **Visual Crossing API Choice**
**Decision**: Use Visual Crossing as primary (and only) weather data source  
**Reasoning**:
- **Data availability timing**: Historical data complete by 6-8 AM following day (perfect for 8 AM collection)
- **Field completeness**: Provides all needed fields in consistent format
- **Cost effectiveness**: $0.0001 per record = $0.0365/year for daily collection
- **API reliability**: Well-documented, stable API with good uptime
- **NOAA complexity**: While free, NOAA APIs are significantly more complex to integrate and parse

#### **No Backup Weather API**
**Decision**: Single weather source without automatic failover to secondary API  
**Reasoning**:
- **Data consistency**: Different APIs have different formats, units, and calculation methods
- **Mapping complexity**: Converting between API formats introduces error potential
- **Simple failure handling**: Better to preserve data gaps than risk data quality issues
- **Cost vs benefit**: Visual Crossing has high reliability; backup complexity not justified for $0.04/year service

### **Camera Data Architecture**

#### **Dual-Table Approach**
**Decision**: Maintain existing `camera_status_reports` AND create new `daily_camera_snapshots`  
**Reasoning**:
- **Operational separation**: Current reports serve real-time monitoring; snapshots serve historical analysis
- **Query performance**: Separate tables allow optimized indexes for different use cases
- **Data integrity**: Existing camera system continues unchanged during snapshot system development
- **Migration safety**: Can develop and test snapshot system without affecting current operations

#### **Complete Field Preservation**
**Decision**: Store ALL 15 camera status fields in daily snapshots, not just "core" metrics  
**Reasoning**:
- **Future flexibility**: Cannot predict which fields will become important for analysis
- **Storage cost**: Additional fields add negligible storage cost (~500 bytes per camera per day)
- **Consistency**: Matches existing camera_status_reports schema for easy comparison
- **Debugging capability**: Complete data trail helpful for troubleshooting camera issues

#### **Activity Scoring Based on SD Images**
**Decision**: Use `sd_images_count` (not image_queue) for activity trend calculations  
**Reasoning**:
- **Reliability**: SD card count represents actual camera activity over time
- **Cumulative nature**: SD count increases predictably, image_queue is more volatile
- **Historical accuracy**: SD count persists through camera resets, queue count doesn't
- **Trend calculation**: Daily differences in SD count give true "images added today"

#### **Location Change Detection (Skipped)**
**Decision**: Skip GPS-based location change detection in Phase 3, Step 3.3  
**Reasoning**:
- **Data quality**: Daily reports have limited GPS precision for meaningful change detection
- **Report purpose**: Cuddeback reports focus on status updates, not precise location tracking
- **Implementation complexity**: GPS parsing and distance calculations add complexity with limited value
- **Alternative detection**: Physical camera deployments are tracked manually in deployment table

### **Database Schema Design**

#### **Three-Table Snapshot Architecture**
**Decision**: Create separate tables for weather, camera snapshots, and collection logging  
**Reasoning**:
- **Data separation**: Weather and camera data have different collection schedules and sources
- **Query optimization**: Each table optimized for specific query patterns and indexes
- **Monitoring capability**: Collection log enables comprehensive system health tracking
- **Scalability**: Separate tables scale independently as data volumes grow

#### **Quality Scoring System**
**Decision**: Implement 0-100 quality scores for both weather and camera snapshots  
**Reasoning**:
- **Data reliability**: Provides clear metric for data completeness and validity
- **Alerting thresholds**: Easy to create alerts when quality drops below acceptable levels
- **Historical tracking**: Can track data quality trends over time
- **Debug assistance**: Helps identify API issues or collection problems quickly

#### **Raw Data Preservation**
**Decision**: Store complete raw API responses alongside processed fields  
**Reasoning**:
- **Future reprocessing**: Can extract new fields or recalculate metrics without re-fetching
- **Debugging capability**: Full context available when troubleshooting data issues
- **API changes**: Protects against losing data if API response format changes
- **Storage efficiency**: JSON compression keeps storage costs low

---

## 🏗️ **System Architecture**

### **Data Collection Pipeline**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   7:30 AM EST   │    │    8:00 AM EST   │    │   8:30 AM EST   │
│ Camera Data     │    │  Weather Data    │    │ Analysis &      │
│ Collection      │    │  Collection      │    │ Alerting        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Cuddeback       │    │ Visual Crossing  │    │ Anomaly         │
│ Report Scraping │    │ API Integration  │    │ Detection       │
│ (Existing +     │    │                  │    │                 │
│ Enhanced)       │    │ • Historical     │    │ • Activity      │
│                 │    │   Weather Query  │    │   Anomalies     │
│ • Status Fields │    │ • Dawn/Dusk      │    │ • Quality       │
│ • Activity      │    │   Temperature    │    │   Issues        │
│   Trends        │    │   Calculation    │    │ • Missing Data  │
│ • Snapshot      │    │ • Quality        │    │ • Email Alerts │
│   Creation      │    │   Scoring        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ daily_camera_   │    │ daily_weather_   │    │ Alerts &        │
│ snapshots       │    │ snapshots        │    │ Notifications   │
│                 │    │                  │    │                 │
│ • Complete      │    │ • Raw API Data   │    │ • Dashboard     │
│   Status Data   │    │ • Processed      │    │   Updates       │
│ • Activity      │    │   Metrics        │    │ • Email         │
│   Analysis      │    │ • Quality Score  │    │   Notifications │
│ • Trend         │    │ • Dawn/Dusk      │    │ • System Health │
│   Calculations  │    │   Temperatures   │    │   Monitoring    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Processing Flow Details**

#### **Camera Data Processing**
1. **Enhanced Web Scraping**: Existing Cuddeback scraping enhanced to dual-write snapshots
2. **Activity Analysis**: Calculate daily activity scores, trends, and anomalies
3. **Data Validation**: Ensure all fields populated correctly with quality scoring
4. **Snapshot Storage**: Store complete status data in daily_camera_snapshots table

#### **Weather Data Processing**
1. **API Integration**: Fetch previous day weather from Visual Crossing API
2. **Data Transformation**: Parse and extract all relevant weather metrics
3. **Dawn/Dusk Calculation**: Interpolate temperatures at sunrise/sunset times
4. **Quality Assessment**: Score data quality based on field completeness and validity

#### **Analysis & Alerting**
1. **Anomaly Detection**: Identify unusual patterns in camera activity and weather
2. **Alert Generation**: Create notifications for missing data, quality issues, anomalies
3. **Dashboard Updates**: Refresh cached metrics for UI components
4. **Notifications**: Send email alerts for critical issues

---

## 📊 **Database Schema Summary**

### **daily_weather_snapshots** (20 core fields + metadata)
```sql
-- Key fields: date, tempmax/min, humidity, precip, wind, moon phase
-- Quality: data_quality_score, missing_fields, processing_notes
-- Times: sunrise, sunset, temp_dawn, temp_dusk
-- Storage: raw_weather_data (complete API response)
```

### **daily_camera_snapshots** (30 fields including analysis)
```sql
-- Core: Complete status fields (battery, SD count, signal, etc.)
-- Activity: images_added_today, activity_score, trend analysis
-- Quality: data_quality_score, missing_fields
-- Calculated: seven_day_average, anomaly_detection
```

### **daily_collection_log** (monitoring and debugging)
```sql
-- Tracking: collection_type, status, timing, records_processed
-- Errors: error_message, error_details, retry_count
-- Quality: data_quality_issues, performance_metrics
```

---

## 🔄 **Implementation Strategy**

### **Phase Order (Updated)**
**Note**: Phase 5 (UI Integration) will be completed before Phase 4 (Background Processing) to enable better testing of UI components before building full automation.

1. **✅ Phase 1: Database Foundation** - Create tables, functions, triggers
2. **✅ Phase 2: Weather Data Collection** - API integration and automation  
3. **✅ Phase 3: Camera Data Integration** - Enhance scraping with snapshots
4. **🔄 Phase 5: UI Integration** - Dashboard widgets and trend displays *(Done before Phase 4)*
5. **Phase 4: Background Processing** - Monitoring and error handling *(Done after Phase 5)*
6. **Phase 6: Analytics & Alerting** - Email notifications and advanced analysis

### **Development Principles**
- **Incremental Implementation**: Each phase builds on previous foundations
- **Backward Compatibility**: Existing camera system continues working unchanged
- **Comprehensive Testing**: Each phase includes testing before moving forward
- **Documentation-Driven**: Complete documentation for each phase
- **Error Resilience**: Robust error handling and recovery procedures

### **Quality Assurance Strategy**
- **Data Validation**: Quality scoring for all collected data
- **System Monitoring**: Comprehensive logging and health checks
- **Testing Strategy**: Unit tests, integration tests, end-to-end validation
- **Performance Optimization**: Efficient queries, caching, resource management

---

## 🎯 **Success Metrics**

### **System Reliability**
- **Data Collection Success Rate**: >95% successful daily collections
- **Data Quality Scores**: >80 average quality score for all snapshots
- **API Response Times**: <2 seconds average for weather API calls
- **Error Recovery**: <5 minutes to detect and recover from failures

### **User Experience**
- **Dashboard Load Times**: <3 seconds for daily highlights widget
- **Mobile Responsiveness**: Full functionality on mobile devices
- **Alert Effectiveness**: <2% false positive rate for anomaly detection
- **Documentation Quality**: Complete user guides and troubleshooting docs

### **Data Value**
- **Trend Analysis**: 30+ days of reliable trend data for hunting decisions
- **Pattern Recognition**: Identify optimal hunting conditions and stand effectiveness
- **Property Management**: Camera deployment optimization and maintenance planning
- **Long-term Insights**: Seasonal patterns and year-over-year comparisons

---

## 🔧 **Technical Specifications**

### **Technology Stack**
- **Database**: Supabase (PostgreSQL) with RLS policies
- **API Integration**: Visual Crossing Weather API, Cuddeback web scraping
- **Automation**: GitHub Actions workflows with EST scheduling
- **Frontend**: Next.js 15, React components, Tailwind CSS
- **Monitoring**: Custom logging, error tracking, performance metrics

### **Security & Privacy**
- **API Keys**: Stored in GitHub Secrets, environment variable access only
- **Database Access**: Supabase RLS policies for data protection
- **Error Handling**: No sensitive data exposed in error messages
- **Data Retention**: Configurable retention periods for different data types

### **Scalability Considerations**
- **Query Optimization**: Proper indexes for time-series data queries
- **Caching Strategy**: Dashboard metrics cached for performance
- **Resource Management**: Efficient memory usage in GitHub Actions
- **Future Growth**: Schema designed to handle years of daily data

---

## 🚀 **Deployment Strategy**

### **Staged Rollout**
1. **Development Testing**: Complete testing in development environment
2. **Staging Validation**: Test with production-like data and workflows
3. **Production Deployment**: Gradual rollout with monitoring
4. **User Training**: Documentation and training for club members

### **Monitoring & Maintenance**
- **System Health Checks**: Automated monitoring of all collection processes
- **Performance Tracking**: Regular analysis of system performance metrics
- **User Feedback**: Continuous improvement based on club member feedback
- **Seasonal Adjustments**: Adapt system for hunting season patterns

---

## 📋 **Risk Management**

### **Technical Risks**
- **API Changes**: Visual Crossing API format or availability changes
- **Database Issues**: Supabase outages or performance problems
- **GitHub Actions**: Workflow execution limits or reliability issues
- **Web Scraping**: Cuddeback website changes breaking scraping logic

### **Mitigation Strategies**
- **Error Resilience**: Comprehensive retry logic and graceful degradation
- **Monitoring**: Real-time detection of issues with automated alerts
- **Backup Plans**: Manual collection procedures for critical failures
- **Documentation**: Detailed troubleshooting guides for common issues

### **Business Continuity**
- **Existing Systems**: Current camera management continues working unchanged
- **Gradual Enhancement**: New features added incrementally without disruption
- **Rollback Procedures**: Can disable new features if issues arise
- **User Training**: Ensure club members can use both old and new features

---

## 🏁 **Conclusion**

The Daily Snapshot System represents a significant enhancement to the Caswell County Yacht Club's hunting property management capabilities. By automating the collection and analysis of weather and camera activity data, the system provides valuable insights for optimizing hunting strategies and property management decisions.

The phased implementation approach ensures reliable development while the detailed specifications enable confident execution. 

The system's modular design allows for future enhancements while maintaining robust core functionality. With proper implementation, this will transform the hunting club's ability to understand and optimize their property management and hunting strategies.

**Next Step**: Follow the detailed implementation plan in `daily-snapshot-system-implementation.md` with specific tasks, timeframes, and technical specifications for each phase.