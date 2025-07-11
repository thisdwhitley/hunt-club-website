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
- **Cumulative nature**: SD count increases predictably, image_queue fluctuates with connectivity
- **Historical value**: SD count preserves activity history even during network outages
- **Trend accuracy**: Day-to-day SD count changes reflect true activity patterns

### **Automation & Timing Strategy**

#### **GitHub Actions for Automation**
**Decision**: Use GitHub Actions for all daily collection automation  
**Reasoning**:
- **Cost**: Completely free for public repositories and reasonable for private
- **Integration**: Already using for camera scraping - proven to work reliably
- **Simplicity**: No additional infrastructure or services to manage
- **Reliability**: GitHub's uptime is excellent, with built-in retry mechanisms
- **Monitoring**: Built-in logging and failure notifications

#### **Collection Timing Schedule**
**Decision**: 7:30 AM cameras, 8:00 AM weather, 8:30 AM analysis (all EST)  
**Reasoning**:
- **Data availability**: Cuddeback updates ~6 AM CST (7 AM EST), Visual Crossing complete by 6-8 AM
- **Sequential processing**: Weather collection happens after camera collection completes
- **Error handling**: 30-minute gaps allow for retries without overlap
- **Timezone consistency**: All times in EST to match property location

#### **Daily Collection Frequency**
**Decision**: Collect data every day regardless of activity  
**Reasoning**:
- **Trend analysis**: Need continuous data to identify patterns and changes
- **Missing data detection**: Can only detect camera failures if collecting daily
- **Weather correlation**: Weather affects animal behavior even on non-hunting days
- **Cost justification**: $0.0365/year for weather, negligible camera processing cost

### **Data Quality & Storage Strategy**

#### **No Data Interpolation**
**Decision**: Never estimate or interpolate missing data  
**Reasoning**:
- **Data integrity**: Actual gaps more valuable than estimated data for analysis
- **Failure visibility**: Missing data alerts to collection problems that need fixing
- **Analysis accuracy**: Better to have known gaps than unknown estimation errors
- **Debugging**: Actual failure patterns help improve collection reliability

#### **Indefinite Data Retention**
**Decision**: Store daily snapshots permanently (no automatic deletion)  
**Reasoning**:
- **Storage cost**: 2MB/year total storage is essentially free
- **Multi-year analysis**: Hunting patterns and weather correlations span multiple seasons
- **Historical value**: Data becomes more valuable over time for trend analysis
- **Unknown future uses**: Cannot predict what analysis will be valuable years from now

#### **Data Quality Scoring**
**Decision**: Calculate quality scores for weather data with specific deduction rules  
**Reasoning**:
- **Monitoring capability**: Quantifies data reliability for alert thresholds
- **API monitoring**: Tracks Visual Crossing API performance over time
- **Analysis confidence**: Provides context for conclusions drawn from data
- **Improvement tracking**: Helps optimize collection process over time

### **User Interface Strategy**

#### **Web-Based Snapshot Viewer**
**Decision**: Create dedicated web interface for viewing daily snapshot data  
**Reasoning**:
- **Data complexity**: Raw JSON data difficult to interpret without formatting
- **Search capability**: Need to find specific dates and patterns quickly
- **Comparison features**: Side-by-side date comparisons valuable for analysis
- **Mobile access**: Club members need access from field locations

#### **Combined View Priority**
**Decision**: Default to combined weather + camera view rather than separate tabs  
**Reasoning**:
- **Correlation analysis**: Most valuable insights come from weather-camera relationships
- **Hunting decisions**: Users need both data types to make informed decisions
- **Context preservation**: Weather provides context for camera activity patterns
- **User workflow**: Matches how hunters naturally think about conditions

---

## 📺 **Web Interface for Data Viewing**

### **Snapshot Viewer Dashboard**

#### **Main Interface Component**
```typescript
const SnapshotViewerDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getYesterday())
  const [activeTab, setActiveTab] = useState<'weather' | 'cameras' | 'combined'>('combined')
  const [weatherSnapshot, setWeatherSnapshot] = useState<WeatherSnapshot | null>(null)
  const [cameraSnapshots, setCameraSnapshots] = useState<CameraSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            📊 Daily Snapshot Viewer
          </h1>
          
          {/* Date Selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getYesterday()}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => setSelectedDate(getYesterday())}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Latest
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1">
            {[
              { key: 'combined', label: '🔗 Combined View', icon: '📊' },
              { key: 'weather', label: '🌤️ Weather Data', icon: '🌡️' },
              { key: 'cameras', label: '📷 Camera Activity', icon: '📸' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        {activeTab === 'combined' && <CombinedView date={selectedDate} />}
        {activeTab === 'weather' && <WeatherSnapshotView date={selectedDate} />}
        {activeTab === 'cameras' && <CameraSnapshotView date={selectedDate} />}
      </div>
    </div>
  )
}
```

#### **Weather Snapshot View**
```typescript
const WeatherSnapshotView: React.FC<{ date: string }> = ({ date }) => {
  const { data: snapshot, loading } = useWeatherSnapshot(date)
  
  if (loading) return <SnapshotSkeleton />
  if (!snapshot) return <NoDataMessage type="weather" date={date} />
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Temperature Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🌡️ Temperature Analysis
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{snapshot.tempmax}°F</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{snapshot.tempmin}°F</div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{snapshot.temp}°F</div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Dawn:</span>
                <span className="ml-2 font-medium">{snapshot.temp_dawn}°F</span>
              </div>
              <div>
                <span className="text-gray-600">Dusk:</span>
                <span className="ml-2 font-medium">{snapshot.temp_dusk}°F</span>
              </div>
            </div>
          </div>
          
          {snapshot.temp_change_24h && (
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600">24h Change:</span>
              <span className={`ml-2 font-bold ${
                snapshot.temp_change_24h > 0 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {snapshot.temp_change_24h > 0 ? '+' : ''}{snapshot.temp_change_24h}°F
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Hunting Conditions Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🎯 Hunting Conditions
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Pressure:</span>
              <span className="ml-2 font-medium">{snapshot.pressure} mb</span>
            </div>
            <div>
              <span className="text-gray-600">Trend:</span>
              <span className={`ml-2 font-medium ${
                snapshot.pressure_trend === 'rising' ? 'text-green-600' :
                snapshot.pressure_trend === 'falling' ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {snapshot.pressure_trend === 'rising' ? '↗ Rising' :
                 snapshot.pressure_trend === 'falling' ? '↘ Falling' : '→ Steady'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Wind:</span>
              <span className="ml-2 font-medium">{snapshot.windspeed} mph</span>
            </div>
            <div>
              <span className="text-gray-600">Direction:</span>
              <span className="ml-2 font-medium">{getWindDirection(snapshot.winddir)}</span>
            </div>
            <div>
              <span className="text-gray-600">Cloud Cover:</span>
              <span className="ml-2 font-medium">{snapshot.cloudcover}%</span>
            </div>
            <div>
              <span className="text-gray-600">Moon Phase:</span>
              <span className="ml-2 font-medium">{getMoonPhaseDescription(snapshot.moonphase)}</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm font-medium text-blue-800 mb-1">Conditions</div>
            <div className="text-blue-700">{snapshot.conditions}</div>
            {snapshot.description && (
              <div className="text-blue-600 text-sm mt-1">{snapshot.description}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Raw Data Viewer */}
      <div className="lg:col-span-2">
        <RawDataViewer
          title="🔍 Raw Weather Data"
          data={snapshot.raw_weather_data}
          type="weather"
        />
      </div>
    </div>
  )
}
```

#### **Camera Snapshot View**
```typescript
const CameraSnapshotView: React.FC<{ date: string }> = ({ date }) => {
  const { data: snapshots, loading } = useCameraSnapshots(date)
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  
  if (loading) return <SnapshotSkeleton />
  if (!snapshots?.length) return <NoDataMessage type="cameras" date={date} />
  
  return (
    <div className="space-y-6">
      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {snapshots.map(snapshot => (
          <CameraSnapshotCard
            key={snapshot.camera_device_id}
            snapshot={snapshot}
            onClick={() => setSelectedCamera(snapshot.camera_device_id)}
            isSelected={selectedCamera === snapshot.camera_device_id}
          />
        ))}
      </div>
      
      {/* Activity Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📈 Activity Summary for {date}
        </h3>
        <CameraActivitySummary snapshots={snapshots} />
      </div>
      
      {/* Selected Camera Details */}
      {selectedCamera && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <CameraSnapshotDetails
            snapshot={snapshots.find(s => s.camera_device_id === selectedCamera)!}
            onClose={() => setSelectedCamera(null)}
          />
        </div>
      )}
    </div>
  )
}
```

#### **Raw Data Viewer Component**
```typescript
const RawDataViewer: React.FC<{
  title: string
  data: any
  type: 'weather' | 'camera'
}> = ({ title, data, type }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const formatData = (obj: any): string => {
    return JSON.stringify(obj, null, 2)
  }
  
  const highlightSearch = (text: string, search: string): string => {
    if (!search) return text
    const regex = new RegExp(`(${search})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search in data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          
          {/* Data Display */}
          <div className="relative">
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96 border">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightSearch(formatData(data), searchTerm)
                }}
              />
            </pre>
            
            {/* Copy Button */}
            <button
              onClick={() => navigator.clipboard.writeText(formatData(data))}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### **Database Query API Endpoints**

#### **Weather Snapshot API**
```typescript
// pages/api/snapshots/weather/[date].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query
  
  try {
    const { data, error } = await supabase
      .from('daily_weather_snapshots')
      .select('*')
      .eq('date', date)
      .single()
    
    if (error) throw error
    
    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

#### **Camera Snapshots API**
```typescript
// pages/api/snapshots/cameras/[date].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query
  
  try {
    const { data, error } = await supabase
      .from('daily_camera_snapshots')
      .select(`
        *,
        camera_hardware:camera_hardware!camera_device_id (
          brand, model, device_id
        )
      `)
      .eq('date', date)
      .order('activity_score', { ascending: false })
    
    if (error) throw error
    
    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

### **Navigation Integration**
```typescript
// Add to main navigation
{
  name: 'Daily Snapshots',
  href: '/snapshots',
  icon: '📊',
  description: 'View daily weather and camera activity data'
}
```

---

## 📋 **Executive Summary**

This document defines the design for an automated daily snapshot system that collects weather and camera activity data to enable trend analysis, hunting pattern identification, and smart alerting. The system will run automatically via GitHub Actions and provide rich analytics for the 100-acre hunting property.

### **Key Goals**
- **Trend Analysis**: Track weather patterns and camera activity changes over time
- **Hunting Insights**: Correlate environmental conditions with animal activity
- **Smart Alerts**: Notify when cameras fail or show significant activity changes
- **Historical Data**: Build comprehensive database for multi-season analysis

### **Success Metrics**
- 99%+ daily data collection success rate
- Sub-24 hour alert notifications for issues
- Zero data interpolation (preserve actual gaps)
- Enable powerful analytics queries for hunting optimization

---

## 🏗️ **System Architecture Overview**

```
Daily Collection Schedule (EST):
├── 7:30 AM: Camera Data Collection
│   ├── Scrape Cuddeback report (existing process)
│   ├── Create daily_camera_snapshots record
│   ├── Detect camera location changes
│   └── Calculate activity trends
│
├── 8:00 AM: Weather Data Collection  
│   ├── Fetch previous day from Visual Crossing API (data complete by ~6-8 AM)
│   ├── Interpolate dawn/dusk temperatures from hourly data
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

### **Data Flow Architecture**
```
Visual Crossing API → daily_weather_snapshots
Cuddeback Scraping → camera_status_reports → daily_camera_snapshots
Both Sources → Analytics Engine → Dashboard Widgets + Email Alerts
```

---

## 🗄️ **Database Design**

### **New Tables**

#### **daily_weather_snapshots**
**Purpose**: Store complete daily weather data for property center
```sql
CREATE TABLE daily_weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata
  date date NOT NULL,
  property_center_lat numeric(10,8) NOT NULL DEFAULT 36.42723577,
  property_center_lng numeric(11,8) NOT NULL DEFAULT -79.51088069,
  collection_timestamp timestamptz DEFAULT now(),
  api_source text DEFAULT 'visual_crossing',
  
  -- Raw API Response (for future flexibility)
  raw_weather_data jsonb NOT NULL,
  
  -- Extracted Key Metrics (for fast queries) - Based on Visual Crossing API
  tempmax numeric(4,1),            -- Daily maximum temperature  
  tempmin numeric(4,1),            -- Daily minimum temperature
  temp numeric(4,1),               -- Daily average temperature
  temp_dawn numeric(4,1),          -- Temperature at sunrise (interpolated from hourly)
  temp_dusk numeric(4,1),          -- Temperature at sunset (interpolated from hourly)
  temp_change_24h numeric(4,1),    -- Key metric for animal movement
  
  -- Pressure (critical for hunting) - Visual Crossing provides daily average
  pressure numeric(6,2),           -- Daily average pressure (millibars)
  pressure_change_24h numeric(5,2), -- vs previous day
  pressure_trend text CHECK (pressure_trend IN ('rising', 'falling', 'steady')),
  
  -- Wind conditions - Visual Crossing fields
  windspeed numeric(4,1),          -- Daily average wind speed
  windgust numeric(4,1),           -- Daily maximum wind gust  
  winddir numeric(3,0),            -- Wind direction (degrees from north)
  wind_direction_changes integer,   -- Calculated: significant direction shifts
  
  -- Precipitation - Visual Crossing fields
  precip numeric(4,2),             -- Total precipitation (inches)
  precipprob numeric(3,0),         -- Precipitation probability (0-100)
  precipcover numeric(3,0),        -- Precipitation coverage (0-100)
  preciptype text[],               -- Types: rain, snow, ice
  
  -- Sky conditions - Visual Crossing fields
  cloudcover numeric(3,0),         -- Cloud cover percentage (0-100)
  visibility numeric(4,1),         -- Visibility in miles
  conditions text,                 -- "Clear", "Rain", "Snow", etc.
  description text,                -- Longer weather description
  icon text,                       -- Weather icon identifier
  
  -- Astronomical data - Visual Crossing fields
  sunrise timestamptz,             -- Sunrise time (ISO 8601 local time)
  sunset timestamptz,              -- Sunset time (ISO 8601 local time)
  daylight_hours numeric(4,2),     -- Calculated from sunrise/sunset
  moonphase numeric(3,2),          -- 0.0 = new moon, 0.5 = full moon
  
  -- Additional Visual Crossing fields
  humidity numeric(3,0),           -- Relative humidity percentage
  dew numeric(4,1),               -- Dew point temperature
  uvindex integer,                 -- UV index (0-10)
  solarradiation numeric(6,1),     -- Solar radiation (W/m2)
  
  -- Data quality tracking
  data_quality_score integer CHECK (data_quality_score BETWEEN 0 AND 100),
  missing_fields text[],
  anomaly_flags text[],
  
  -- Constraints
  UNIQUE(date),
  CHECK (date >= '2025-07-11'),  -- No historical backfill initially
  CHECK (tempmax >= tempmin),
  CHECK (daylight_hours BETWEEN 8 AND 16), -- Reasonable for North Carolina
  CHECK (moonphase BETWEEN 0.0 AND 1.0),
  CHECK (cloudcover BETWEEN 0 AND 100),
  CHECK (humidity BETWEEN 0 AND 100)
);

-- Performance indexes
CREATE INDEX idx_weather_snapshots_date ON daily_weather_snapshots(date DESC);
CREATE INDEX idx_weather_snapshots_temp_change ON daily_weather_snapshots(temp_change_24h);
CREATE INDEX idx_weather_snapshots_pressure_trend ON daily_weather_snapshots(pressure_trend);
CREATE INDEX idx_weather_snapshots_quality ON daily_weather_snapshots(data_quality_score);
```

#### **daily_camera_snapshots**
**Purpose**: Historical camera activity tracking with location change detection
```sql
CREATE TABLE daily_camera_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Camera identification
  camera_device_id varchar(10) NOT NULL REFERENCES camera_hardware(device_id),
  date date NOT NULL,
  
  -- Location tracking (for move detection)
  location_name text NOT NULL,
  deployment_id uuid REFERENCES camera_deployments(id),
  
  -- Core metrics from scraping (ALL camera_status_reports fields)
  battery_status text,             -- Original Cuddeback values (e.g., "Ext OK", "Low")
  signal_level text,               -- Signal strength level
  network_links text,              -- CuddeLink network connections
  sd_images_count integer,         -- Images stored on SD card
  sd_free_space_mb integer,        -- Available SD card space
  image_queue integer,             -- Images waiting to upload
  
  -- Calculated trend metrics
  sd_images_change_24h integer,      -- vs yesterday
  sd_images_change_7d_avg integer,   -- vs 7-day average
  activity_percentile integer,       -- 0-100 rank for this camera
  activity_score numeric(3,1),       -- 1-10 relative scoring
  
  -- Camera status tracking  
  is_missing boolean DEFAULT false,
  consecutive_missing_days integer DEFAULT 0,
  days_since_location_change integer DEFAULT 0,
  location_change_detected boolean DEFAULT false,
  
  -- Data lineage
  source_report_id uuid REFERENCES camera_status_reports(id),
  collection_timestamp timestamptz DEFAULT now(),
  
  -- Alert triggers
  needs_attention boolean DEFAULT false,
  alert_reasons text[],
  
  -- Constraints
  UNIQUE(camera_device_id, date),
  CHECK (date >= '2025-07-11'),
  CHECK (sd_images_count >= 0),
  CHECK (activity_score BETWEEN 1.0 AND 10.0),
  CHECK (activity_percentile BETWEEN 0 AND 100),
  CHECK (consecutive_missing_days >= 0)
);

-- Performance indexes
CREATE INDEX idx_camera_snapshots_device_date ON daily_camera_snapshots(camera_device_id, date DESC);
CREATE INDEX idx_camera_snapshots_date ON daily_camera_snapshots(date DESC);
CREATE INDEX idx_camera_snapshots_activity_score ON daily_camera_snapshots(activity_score DESC);
CREATE INDEX idx_camera_snapshots_missing ON daily_camera_snapshots(is_missing) WHERE is_missing = true;
CREATE INDEX idx_camera_snapshots_alerts ON daily_camera_snapshots(needs_attention) WHERE needs_attention = true;
CREATE INDEX idx_camera_snapshots_location_changes ON daily_camera_snapshots(location_change_detected) WHERE location_change_detected = true;
```

#### **daily_collection_log**
**Purpose**: Track daily collection success/failure for monitoring
```sql
CREATE TABLE daily_collection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_date date NOT NULL,
  collection_type text NOT NULL CHECK (collection_type IN ('weather', 'cameras', 'analysis')),
  
  -- Execution tracking
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'success', 'partial_success', 'failed')),
  
  -- Results tracking
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_messages text[],
  
  -- Data quality metrics
  api_response_time_ms integer,
  data_completeness_percent numeric(5,2),
  
  -- GitHub Actions context
  github_run_id text,
  workflow_name text,
  
  UNIQUE(collection_date, collection_type)
);

CREATE INDEX idx_collection_log_date_type ON daily_collection_log(collection_date DESC, collection_type);
CREATE INDEX idx_collection_log_status ON daily_collection_log(status) WHERE status != 'success';
```

### **Enhanced Existing Tables**

#### **camera_status_reports** (modifications)
```sql
-- Add snapshot linkage
ALTER TABLE camera_status_reports 
ADD COLUMN daily_snapshot_created boolean DEFAULT false,
ADD COLUMN snapshot_creation_errors text[];

-- Add index for snapshot processing
CREATE INDEX idx_camera_reports_snapshot_pending 
ON camera_status_reports(report_date) 
WHERE daily_snapshot_created = false;
```

---

## 🌤️ **Weather Data Collection**

### **Visual Crossing API Integration**

#### **API Configuration**
```typescript
interface WeatherAPIConfig {
  baseUrl: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline'
  apiKey: process.env.WEATHER_API_KEY
  location: '36.42723577,-79.51088069'  // Property center
  unitGroup: 'us'  // Fahrenheit, inches, mph
  elements: [
    // Temperature fields
    'datetime', 'tempmax', 'tempmin', 'temp', 'humidity', 'dew',
    // Pressure and wind
    'pressure', 'windspeed', 'windgust', 'winddir', 
    // Precipitation
    'precip', 'precipprob', 'precipcover', 'preciptype',
    // Sky conditions
    'cloudcover', 'visibility', 'conditions', 'description', 'icon',
    // Astronomical 
    'sunrise', 'sunset', 'moonphase',
    // Additional
    'uvindex', 'solarradiation'
  ]
  include: ['days', 'hours']  // Get both daily summary and hourly data for dawn/dusk interpolation
}
```

#### **Data Collection Service**
```typescript
interface WeatherCollectionResult {
  success: boolean
  date: string
  weatherData?: ProcessedWeatherData
  rawResponse?: any
  errors?: string[]
  apiResponseTime?: number
  dataQualityScore?: number
}

class WeatherCollectionService {
  async collectDailyWeather(targetDate: string): Promise<WeatherCollectionResult> {
    const startTime = Date.now()
    
    try {
      // 1. Fetch from Visual Crossing
      const rawData = await this.fetchFromVisualCrossing(targetDate)
      
      // 2. Validate and process data
      const processedData = await this.processWeatherData(rawData)
      
      // 3. Calculate data quality score
      const qualityScore = this.calculateDataQuality(processedData)
      
      // 4. Store in database
      await this.storeWeatherSnapshot(targetDate, processedData, rawData)
      
      // 5. Run anomaly detection
      await this.detectWeatherAnomalies(processedData)
      
      return {
        success: true,
        date: targetDate,
        weatherData: processedData,
        rawResponse: rawData,
        apiResponseTime: Date.now() - startTime,
        dataQualityScore: qualityScore
      }
    } catch (error) {
      return {
        success: false,
        date: targetDate,
        errors: [error.message],
        apiResponseTime: Date.now() - startTime
      }
    }
  }
}
```

#### **Data Processing Logic**
```typescript
interface ProcessedWeatherData {
  // Temperature analysis - Visual Crossing field names
  tempmax: number
  tempmin: number
  temp: number         // Daily average
  tempDawn: number     // Interpolated from hourly data at sunrise time
  tempDusk: number     // Interpolated from hourly data at sunset time
  tempChange24h: number  // vs previous day
  
  // Pressure analysis (key for hunting)
  pressure: number           // Daily average pressure
  pressureChange24h: number  // vs previous day
  pressureTrend: 'rising' | 'falling' | 'steady'
  
  // Wind analysis - Visual Crossing fields
  windspeed: number          // Daily average
  windgust: number          // Daily maximum
  winddir: number           // Wind direction in degrees
  windDirectionChanges: number   // Calculated significant shifts
  
  // Precipitation - Visual Crossing fields
  precip: number            // Total precipitation
  precipprob: number        // Precipitation probability
  precipcover: number       // Coverage percentage
  preciptype: string[]      // Array of types
  
  // Sky conditions - Visual Crossing fields  
  cloudcover: number        // Cloud cover percentage
  visibility: number        // Visibility in miles
  conditions: string        // Weather conditions
  description: string       // Detailed description
  icon: string             // Weather icon
  
  // Astronomical - Visual Crossing fields
  sunrise: Date            // Sunrise time
  sunset: Date             // Sunset time
  daylightHours: number    // Calculated duration
  moonphase: number        // 0.0-1.0 cycle
  
  // Additional fields
  humidity: number         // Relative humidity
  dew: number             // Dew point
  uvindex: number         // UV index
  solarradiation: number  // Solar radiation
}

function calculateDataQuality(data: ProcessedWeatherData): number {
  let score = 100
  const requiredFields = [
    'tempmax', 'tempmin', 'pressure', 'windspeed', 
    'precip', 'sunrise', 'sunset', 'moonphase'
  ]
  
  // Deduct points for missing critical fields
  requiredFields.forEach(field => {
    if (data[field] === null || data[field] === undefined) {
      score -= 10
    }
  })
  
  // Deduct points for unrealistic values
  if (data.tempmax < data.tempmin) score -= 20
  if (data.daylightHours < 8 || data.daylightHours > 16) score -= 15
  if (Math.abs(data.pressureChange24h) > 2) score -= 5 // Extreme but possible
  if (data.moonphase < 0 || data.moonphase > 1) score -= 10
  
  return Math.max(0, score)
}
```

### **Anomaly Detection Rules**
```typescript
interface WeatherAnomaly {
  type: 'extreme_temp' | 'pressure_spike' | 'missing_data' | 'unrealistic_value'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedFields: string[]
}

function detectWeatherAnomalies(data: ProcessedWeatherData, historical: ProcessedWeatherData[]): WeatherAnomaly[] {
  const anomalies: WeatherAnomaly[] = []
  
  // Extreme temperature changes (>30°F in 24 hours)
  if (Math.abs(data.tempChange24h) > 30) {
    anomalies.push({
      type: 'extreme_temp',
      severity: 'high',
      description: `Extreme temperature change: ${data.tempChange24h}°F in 24 hours`,
      affectedFields: ['tempChange24h']
    })
  }
  
  // Pressure spikes (>1.5 inHg change suggests data error)
  if (Math.abs(data.pressureChange24h) > 1.5) {
    anomalies.push({
      type: 'pressure_spike',
      severity: 'medium',
      description: `Unusual pressure change: ${data.pressureChange24h} inHg`,
      affectedFields: ['pressureChange24h']
    })
  }
  
  // Temperature inversion (high < low)
  if (data.tempHigh < data.tempLow) {
    anomalies.push({
      type: 'unrealistic_value',
      severity: 'high',
      description: 'Temperature high is lower than temperature low',
      affectedFields: ['tempHigh', 'tempLow']
    })
  }
  
  return anomalies
}
```

---

## 📷 **Camera Data Integration**

### **Enhanced Scraping → Snapshot Flow**

#### **Modified Scraping Process**
```typescript
// Existing scraping continues as-is, but now also creates daily snapshots
async function processScrapedCameraData(scrapedData: CuddlebackReportRow[]): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  for (const row of scrapedData) {
    // 1. Update camera_status_reports (existing process)
    const reportRecord = await updateCameraStatusReport(row)
    
    // 2. CREATE NEW: Generate daily snapshot
    await createDailyCameraSnapshot(row, reportRecord.id, today)
    
    // 3. CREATE NEW: Detect location changes
    await detectCameraLocationChange(row.device_id, row.location_name)
    
    // 4. CREATE NEW: Calculate activity trends
    await calculateCameraActivityTrends(row.device_id, today)
  }
}
```

#### **Daily Snapshot Creation Logic**
```typescript
async function createDailyCameraSnapshot(
  scrapedRow: CuddlebackReportRow, 
  reportId: string, 
  date: string
): Promise<void> {
  
  // Get yesterday's snapshot for trend calculation
  const yesterdaySnapshot = await getDailyCameraSnapshot(scrapedRow.device_id, getPreviousDate(date))
  const weeklySnapshots = await getWeeklyCameraSnapshots(scrapedRow.device_id, date)
  
  // Calculate trend metrics using sd_images_count
  const sdImagesChange24h = yesterdaySnapshot 
    ? scrapedRow.sd_images_count - yesterdaySnapshot.sd_images_count 
    : null
    
  const weeklyAverage = weeklySnapshots.length > 0
    ? weeklySnapshots.reduce((sum, snap) => sum + snap.sd_images_count, 0) / weeklySnapshots.length
    : scrapedRow.sd_images_count
    
  const sdImagesChange7dAvg = scrapedRow.sd_images_count - weeklyAverage
  
  // Calculate activity percentile for this camera's history
  const cameraHistory = await getCameraActivityHistory(scrapedRow.device_id)
  const activityPercentile = calculatePercentile(scrapedRow.sd_images_count, cameraHistory)
  
  // Generate activity score (1-10 scale)
  const activityScore = calculateActivityScore(scrapedRow.sd_images_count, weeklyAverage, cameraHistory)
  
  // Check for location change
  const locationChange = await detectLocationChange(scrapedRow.device_id, scrapedRow.location_name)
  
  // Generate alerts
  const alertReasons = generateCameraAlerts(scrapedRow, sdImagesChange24h)
  
  // Store snapshot with ALL camera_status_reports fields
  await supabase.from('daily_camera_snapshots').insert({
    camera_device_id: scrapedRow.device_id,
    date,
    location_name: scrapedRow.location_name,
    
    // ALL camera status fields
    battery_status: scrapedRow.battery_status,
    signal_level: scrapedRow.signal_level,
    network_links: scrapedRow.network_links,
    sd_images_count: scrapedRow.sd_images_count,
    sd_free_space_mb: scrapedRow.sd_free_space_mb,
    image_queue: scrapedRow.image_queue,
    
    // Calculated trend metrics
    sd_images_change_24h: sdImagesChange24h,
    sd_images_change_7d_avg: Math.round(sdImagesChange7dAvg),
    activity_percentile: activityPercentile,
    activity_score: activityScore,
    
    // Location tracking
    days_since_location_change: locationChange.daysSinceChange,
    location_change_detected: locationChange.detected,
    
    // Metadata
    source_report_id: reportId,
    needs_attention: alertReasons.length > 0,
    alert_reasons: alertReasons
  })
}
```

#### **Camera Location Change Detection**
```typescript
interface LocationChangeResult {
  detected: boolean
  daysSinceChange: number
  previousLocation?: string
}

async function detectLocationChange(deviceId: string, currentLocation: string): Promise<LocationChangeResult> {
  // Get most recent snapshot
  const lastSnapshot = await supabase
    .from('daily_camera_snapshots')
    .select('location_name, date, days_since_location_change')
    .eq('camera_device_id', deviceId)
    .order('date', { ascending: false })
    .limit(1)
    .single()
    
  if (!lastSnapshot) {
    return { detected: false, daysSinceChange: 0 }
  }
  
  const locationChanged = lastSnapshot.location_name !== currentLocation
  
  if (locationChanged) {
    // Reset counter - camera was moved
    return {
      detected: true,
      daysSinceChange: 0,
      previousLocation: lastSnapshot.location_name
    }
  } else {
    // Increment counter - camera in same location
    return {
      detected: false,
      daysSinceChange: (lastSnapshot.days_since_location_change || 0) + 1
    }
  }
}
```

#### **Activity Scoring Algorithm**
```typescript
function calculateActivityScore(
  currentCount: number, 
  weeklyAverage: number, 
  cameraHistory: number[]
): number {
  
  // Base score from weekly average comparison
  let score = 5.0 // Neutral
  
  if (currentCount > weeklyAverage * 2) {
    score = 9.0 // Very high activity
  } else if (currentCount > weeklyAverage * 1.5) {
    score = 7.5 // High activity  
  } else if (currentCount > weeklyAverage * 1.2) {
    score = 6.5 // Above average
  } else if (currentCount < weeklyAverage * 0.5) {
    score = 2.0 // Very low activity
  } else if (currentCount < weeklyAverage * 0.8) {
    score = 3.5 // Below average
  }
  
  // Adjust based on camera's historical performance
  if (cameraHistory.length >= 30) {
    const historicalPercentile = calculatePercentile(currentCount, cameraHistory)
    
    if (historicalPercentile > 90) score = Math.min(10.0, score + 1.0)
    if (historicalPercentile < 10) score = Math.max(1.0, score - 1.0)
  }
  
  return Math.round(score * 10) / 10 // Round to 1 decimal
}

function calculatePercentile(value: number, dataset: number[]): number {
  const sorted = dataset.sort((a, b) => a - b)
  const below = sorted.filter(x => x < value).length
  return Math.round((below / sorted.length) * 100)
}
```

### **Camera Alert Generation**
```typescript
function generateCameraAlerts(
  cameraData: CuddlebackReportRow, 
  imageChange24h: number | null
): string[] {
  const alerts: string[] = []
  
  // Battery alerts
  if (cameraData.battery_status === 'Low') {
    alerts.push('Low battery detected')
  }
  if (cameraData.battery_status === 'Critical') {
    alerts.push('Critical battery - immediate attention needed')
  }
  
  // Signal alerts
  if (cameraData.signal_level === 'Poor' || cameraData.signal_level === 'No Signal') {
    alerts.push('Poor signal strength')
  }
  
  // Storage alerts
  if (cameraData.sd_free_space_mb < 100) {
    alerts.push('SD card nearly full')
  }
  
  // Activity alerts
  if (imageChange24h !== null) {
    if (imageChange24h > 500) {
      alerts.push('Unusually high activity (+500 photos)')
    }
    if (imageChange24h < -100) {
      alerts.push('Significant activity decrease (-100+ photos)')
    }
  }
  
  return alerts
}
```

---

## ⚙️ **GitHub Actions Automation**

### **Workflow Schedule**
```yaml
# .github/workflows/daily-snapshots.yml
name: Daily Data Collection

on:
  schedule:
    # 7:30 AM EST = 12:30 PM UTC (accounting for EST timezone)
    - cron: '30 12 * * *'  # Camera collection
    # 8:00 AM EST = 1:00 PM UTC
    - cron: '0 13 * * *'   # Weather collection  
    # 8:30 AM EST = 1:30 PM UTC
    - cron: '30 13 * * *'  # Analysis & alerts
  
  workflow_dispatch:  # Allow manual triggers
    inputs:
      collection_type:
        description: 'Type of collection to run'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - cameras
          - weather
          - analysis
      target_date:
        description: 'Target date (YYYY-MM-DD, default: yesterday)'
        required: false
        type: string

env:
  NODE_VERSION: '18'
  
jobs:
  camera-collection:
    if: github.event_name == 'schedule' && github.event.schedule == '30 12 * * *' || 
        github.event_name == 'workflow_dispatch' && 
        (github.event.inputs.collection_type == 'all' || github.event.inputs.collection_type == 'cameras')
    
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm install puppeteer
        
      - name: Run camera data collection
        env:
          CUDDEBACK_USERNAME: ${{ secrets.CUDDEBACK_USERNAME }}
          CUDDEBACK_PASSWORD: ${{ secrets.CUDDEBACK_PASSWORD }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          TARGET_DATE: ${{ github.event.inputs.target_date || '' }}
        run: node scripts/collect-camera-snapshots.js
        
      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: camera-collection-logs
          path: logs/camera-collection-*.log
          retention-days: 7

  weather-collection:
    if: github.event_name == 'schedule' && github.event.schedule == '0 13 * * *' || 
        github.event_name == 'workflow_dispatch' && 
        (github.event.inputs.collection_type == 'all' || github.event.inputs.collection_type == 'weather')
    
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Run weather data collection
        env:
          WEATHER_API_KEY: ${{ secrets.WEATHER_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          TARGET_DATE: ${{ github.event.inputs.target_date || '' }}
        run: node scripts/collect-weather-snapshots.js
        
      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: weather-collection-logs
          path: logs/weather-collection-*.log
          retention-days: 7

  analysis-and-alerts:
    if: github.event_name == 'schedule' && github.event.schedule == '30 13 * * *' || 
        github.event_name == 'workflow_dispatch' && 
        (github.event.inputs.collection_type == 'all' || github.event.inputs.collection_type == 'analysis')
    
    needs: [camera-collection, weather-collection]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Run analysis and alerting
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SMTP_HOST: ${{ secrets.SMTP_HOST }}
          SMTP_USER: ${{ secrets.SMTP_USER }}
          SMTP_PASS: ${{ secrets.SMTP_PASS }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
        run: node scripts/run-analysis-and-alerts.js
```

### **Collection Scripts**

#### **Camera Snapshot Collection**
```javascript
// scripts/collect-camera-snapshots.js
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

async function collectCameraSnapshots() {
  const targetDate = process.env.TARGET_DATE || getPreviousDay();
  const logFile = `logs/camera-collection-${targetDate}.log`;
  
  console.log(`Starting camera snapshot collection for ${targetDate}`);
  
  try {
    // Log collection start
    await logCollectionStart('cameras', targetDate);
    
    // Run existing Cuddeback scraping (modified to return data)
    const scrapedData = await scrapeCuddebackReport();
    
    // Process each camera into daily snapshots
    const results = [];
    for (const cameraRow of scrapedData) {
      try {
        const snapshot = await createDailyCameraSnapshot(cameraRow, targetDate);
        results.push({ success: true, deviceId: cameraRow.device_id, snapshot });
      } catch (error) {
        results.push({ success: false, deviceId: cameraRow.device_id, error: error.message });
      }
    }
    
    // Log results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    await logCollectionComplete('cameras', targetDate, {
      recordsProcessed: results.length,
      recordsFailed: failureCount,
      errors: results.filter(r => !r.success).map(r => r.error)
    });
    
    console.log(`Camera collection complete: ${successCount} success, ${failureCount} failed`);
    
  } catch (error) {
    await logCollectionError('cameras', targetDate, error.message);
    throw error;
  }
}

// Helper functions
function getPreviousDay() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

async function logCollectionStart(type, date) {
  await supabase.from('daily_collection_log').insert({
    collection_date: date,
    collection_type: type,
    status: 'running',
    started_at: new Date().toISOString(),
    github_run_id: process.env.GITHUB_RUN_ID,
    workflow_name: 'daily-snapshots'
  });
}

// Run if called directly
if (require.main === module) {
  collectCameraSnapshots()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Camera collection failed:', error);
      process.exit(1);
    });
}
```

#### **Weather Snapshot Collection**
```javascript
// scripts/collect-weather-snapshots.js
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

async function collectWeatherSnapshots() {
  const targetDate = process.env.TARGET_DATE || getPreviousDay();
  
  console.log(`Starting weather snapshot collection for ${targetDate}`);
  
  try {
    await logCollectionStart('weather', targetDate);
    
    // Fetch from Visual Crossing API
    const apiResponse = await fetchVisualCrossingWeather(targetDate);
    
    // Process and validate data
    const processedData = processWeatherData(apiResponse.data);
    const qualityScore = calculateDataQuality(processedData);
    
    // Detect anomalies
    const anomalies = await detectWeatherAnomalies(processedData, targetDate);
    
    // Store in database
    await storeWeatherSnapshot(targetDate, processedData, apiResponse.data, qualityScore, anomalies);
    
    await logCollectionComplete('weather', targetDate, {
      recordsProcessed: 1,
      recordsFailed: 0,
      dataCompletenessPercent: qualityScore
    });
    
    console.log(`Weather collection complete for ${targetDate}, quality score: ${qualityScore}`);
    
  } catch (error) {
    await logCollectionError('weather', targetDate, error.message);
    throw error;
  }
}

async function fetchVisualCrossingWeather(date) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/36.42723577,-79.51088069/${date}/${date}`;
  
  const params = {
    key: process.env.WEATHER_API_KEY,
    unitGroup: 'us',
    elements: 'temp,tempmax,tempmin,humidity,pressure,windspeed,winddir,cloudcover,visibility,conditions,sunrise,sunset,moonphase,precipcover,precip',
    include: 'days,hours'
  };
  
  const startTime = Date.now();
  const response = await axios.get(url, { params, timeout: 30000 });
  const responseTime = Date.now() - startTime;
  
  return {
    data: response.data,
    responseTime
  };
}

// Run if called directly
if (require.main === module) {
  collectWeatherSnapshots()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Weather collection failed:', error);
      process.exit(1);
    });
}
```

---

## 🚨 **Alerting System**

### **Alert Generation Logic**
```typescript
interface DailyAlert {
  id: string
  alertType: 'camera_missing' | 'camera_battery' | 'weather_anomaly' | 'collection_failure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affectedItems: string[]  // Camera IDs, dates, etc.
  actionRequired: boolean
  createdAt: Date
  resolvedAt?: Date
}

async function generateDailyAlerts(date: string): Promise<DailyAlert[]> {
  const alerts: DailyAlert[] = []
  
  // 1. Check for missing cameras (3+ days)
  const missingCameras = await findMissingCameras(date)
  for (const camera of missingCameras) {
    if (camera.consecutive_missing_days >= 3) {
      alerts.push({
        id: `camera-missing-${camera.device_id}-${date}`,
        alertType: 'camera_missing',
        severity: camera.consecutive_missing_days >= 7 ? 'critical' : 'high',
        title: `Camera ${camera.device_id} Missing`,
        description: `Camera "${camera.location_name}" has been missing from reports for ${camera.consecutive_missing_days} consecutive days.`,
        affectedItems: [camera.device_id],
        actionRequired: true,
        createdAt: new Date()
      })
    }
  }
  
  // 2. Check for camera battery issues
  const batteryAlerts = await findBatteryIssues(date)
  alerts.push(...batteryAlerts)
  
  // 3. Check for collection failures
  const collectionFailures = await findCollectionFailures(date)
  alerts.push(...collectionFailures)
  
  // 4. Check for weather anomalies
  const weatherAnomalies = await findWeatherAnomalies(date)
  alerts.push(...weatherAnomalies)
  
  return alerts
}
```

### **Email Notification System**
```typescript
interface EmailNotification {
  to: string[]
  subject: string
  htmlContent: string
  textContent: string
  priority: 'low' | 'normal' | 'high'
}

async function sendDailyAlertEmail(alerts: DailyAlert[], date: string): Promise<void> {
  if (alerts.length === 0) {
    console.log('No alerts to send for', date)
    return
  }
  
  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const highAlerts = alerts.filter(a => a.severity === 'high')
  const mediumAlerts = alerts.filter(a => a.severity === 'medium')
  
  const subject = criticalAlerts.length > 0 
    ? `🚨 CRITICAL: ${criticalAlerts.length} hunting club alert(s)`
    : `⚠️ Daily Alert Summary - ${date}`
  
  const htmlContent = generateAlertEmailHTML(alerts, date)
  const textContent = generateAlertEmailText(alerts, date)
  
  await sendEmail({
    to: [process.env.ADMIN_EMAIL],
    subject,
    htmlContent,
    textContent,
    priority: criticalAlerts.length > 0 ? 'high' : 'normal'
  })
}

function generateAlertEmailHTML(alerts: DailyAlert[], date: string): string {
  return `
    <h2>🏕️ Caswell County Yacht Club - Daily Alert Summary</h2>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Total Alerts:</strong> ${alerts.length}</p>
    
    ${alerts.map(alert => `
      <div style="border-left: 4px solid ${getSeverityColor(alert.severity)}; padding: 10px; margin: 10px 0;">
        <h3>${getSeverityIcon(alert.severity)} ${alert.title}</h3>
        <p>${alert.description}</p>
        ${alert.actionRequired ? '<p><strong>Action Required:</strong> Yes</p>' : ''}
        <p><small>Affected: ${alert.affectedItems.join(', ')}</small></p>
      </div>
    `).join('')}
    
    <hr>
    <p><small>Generated by Daily Snapshot System at ${new Date().toISOString()}</small></p>
  `
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626'
    case 'high': return '#ea580c'
    case 'medium': return '#d97706'
    case 'low': return '#65a30d'
    default: return '#6b7280'
  }
}
```

---

## 🎛️ **Dashboard Integration**

### **Dashboard Widget Components**

#### **Daily Highlights Widget**
```typescript
interface DailyHighlights {
  date: string
  weatherSummary: {
    conditions: string
    tempHigh: number
    tempLow: number
    pressureTrend: string
    huntingConditions: 'excellent' | 'good' | 'fair' | 'poor'
  }
  cameraActivity: {
    totalPhotos: number
    mostActiveCamera: string
    biggestIncrease: {
      cameraName: string
      changeCount: number
    }
    alertCount: number
  }
  systemHealth: {
    weatherDataQuality: number
    cameraDataFreshness: number
    missingSensors: number
  }
}

const DailyHighlightsWidget: React.FC = () => {
  const [highlights, setHighlights] = useState<DailyHighlights | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadDailyHighlights()
  }, [])
  
  async function loadDailyHighlights() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const date = yesterday.toISOString().split('T')[0]
    
    try {
      const data = await fetchDailyHighlights(date)
      setHighlights(data)
    } catch (error) {
      console.error('Failed to load daily highlights:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <div>Loading daily highlights...</div>
  if (!highlights) return <div>No data available</div>
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        📊 Yesterday's Highlights
        <span className="text-sm text-gray-500">({highlights.date})</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">🌤️ Weather</h4>
          <div className="space-y-1 text-sm">
            <div>{highlights.weatherSummary.conditions}</div>
            <div>{highlights.weatherSummary.tempHigh}°F / {highlights.weatherSummary.tempLow}°F</div>
            <div>Pressure: {highlights.weatherSummary.pressureTrend}</div>
            <div className={`font-medium ${
              highlights.weatherSummary.huntingConditions === 'excellent' ? 'text-green-600' :
              highlights.weatherSummary.huntingConditions === 'good' ? 'text-blue-600' :
              highlights.weatherSummary.huntingConditions === 'fair' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              Hunting: {highlights.weatherSummary.huntingConditions}
            </div>
          </div>
        </div>
        
        {/* Camera Activity */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-orange-800 mb-2">📷 Camera Activity</h4>
          <div className="space-y-1 text-sm">
            <div>{highlights.cameraActivity.totalPhotos.toLocaleString()} total photos</div>
            <div>Most active: {highlights.cameraActivity.mostActiveCamera}</div>
            <div>Biggest increase: {highlights.cameraActivity.biggestIncrease.cameraName} (+{highlights.cameraActivity.biggestIncrease.changeCount})</div>
            {highlights.cameraActivity.alertCount > 0 && (
              <div className="text-red-600 font-medium">
                {highlights.cameraActivity.alertCount} alerts
              </div>
            )}
          </div>
        </div>
        
        {/* System Health */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">🔧 System Health</h4>
          <div className="space-y-1 text-sm">
            <div>Weather quality: {highlights.systemHealth.weatherDataQuality}%</div>
            <div>Camera freshness: {highlights.systemHealth.cameraDataFreshness}%</div>
            {highlights.systemHealth.missingSensors > 0 ? (
              <div className="text-red-600 font-medium">
                {highlights.systemHealth.missingSensors} missing sensors
              </div>
            ) : (
              <div className="text-green-600">All sensors reporting</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### **Activity Trend Chart Widget**
```typescript
const ActivityTrendWidget: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([])
  
  useEffect(() => {
    loadActivityTrends()
  }, [])
  
  async function loadActivityTrends() {
    // Get last 7 days of camera activity + weather
    const trendData = await fetchActivityTrends(7)
    setData(trendData)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 7-Day Activity Trends</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="photos" orientation="left" />
          <YAxis yAxisId="temp" orientation="right" />
          <Tooltip />
          <Legend />
          
          <Line 
            yAxisId="photos"
            type="monotone" 
            dataKey="totalPhotos" 
            stroke="#ea580c" 
            strokeWidth={2}
            name="Total Photos"
          />
          <Line 
            yAxisId="temp"
            type="monotone" 
            dataKey="tempHigh" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="High Temp (°F)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### **CameraCard Enhancement**
```typescript
// Add to existing CameraCard component
const renderActivityTrend = () => {
  if (!camera.recent_snapshots || camera.recent_snapshots.length < 2) return null
  
  const latest = camera.recent_snapshots[0]
  const previous = camera.recent_snapshots[1]
  const change = latest.image_count - previous.image_count
  const isSignificant = Math.abs(change) > (latest.weekly_average * 0.3)
  
  return (
    <div className="mt-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Activity:</span>
        <span className={`font-medium ${
          change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          {latest.image_count} photos yesterday
        </span>
        {isSignificant && (
          <span className={`px-2 py-1 rounded text-xs ${
            change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {change > 0 ? '↗' : '↘'} {Math.abs(change)}
          </span>
        )}
      </div>
      
      {latest.activity_score && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-600">Score:</span>
          <div className="flex">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full mr-1 ${
                  i < latest.activity_score ? 'bg-orange-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {latest.activity_score}/10
          </span>
        </div>
      )}
    </div>
  )
}
```

---

## 🧪 **Testing Strategy**

### **Data Quality Tests**
```typescript
describe('Daily Snapshot Data Quality', () => {
  test('weather data validates correctly', async () => {
    const mockWeatherData = createMockWeatherData()
    const quality = calculateDataQuality(mockWeatherData)
    expect(quality).toBeGreaterThan(90)
  })
  
  test('detects weather anomalies', async () => {
    const extremeData = createExtremeWeatherData()
    const anomalies = detectWeatherAnomalies(extremeData, [])
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].type).toBe('extreme_temp')
  })
  
  test('camera activity scoring works correctly', async () => {
    const score = calculateActivityScore(150, 100, [50, 75, 100, 125, 150])
    expect(score).toBeGreaterThan(5.0)
    expect(score).toBeLessThan(10.0)
  })
})
```

### **Integration Tests**
```typescript
describe('GitHub Actions Integration', () => {
  test('weather collection runs successfully', async () => {
    const result = await collectWeatherSnapshots()
    expect(result.success).toBe(true)
    expect(result.dataQualityScore).toBeGreaterThan(80)
  })
  
  test('camera collection processes all devices', async () => {
    const result = await collectCameraSnapshots()
    expect(result.processedCameras).toHaveLength(6) // Expected camera count
    expect(result.failures).toHaveLength(0)
  })
})
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Database Foundation** (2-3 days)
**Objective**: Set up database tables and validation functions

**Steps**:
1. Create `daily_weather_snapshots` table with all fields and indexes
2. Create `daily_camera_snapshots` table with trend calculation fields  
3. Create `daily_collection_log` table for monitoring
4. Create database functions for anomaly detection
5. Add validation triggers and constraints
6. Test database schema with sample data

**Deliverables**:
- Migration SQL scripts
- Database schema documentation
- Sample data insertion scripts
- Unit tests for database functions

### **Phase 2: Weather Data Collection** (2-3 days)
**Objective**: Implement Visual Crossing API integration and automation

**Steps**:
1. Create weather collection service with full error handling
2. Implement data processing and quality scoring
3. Create anomaly detection algorithms
4. Build GitHub Actions workflow for weather collection
5. Add comprehensive logging and monitoring
6. Test with historical date collection

**Deliverables**:
- `scripts/collect-weather-snapshots.js`
- Weather API integration service
- GitHub Actions workflow configuration
- Error handling and retry logic
- Data quality validation tests

### **Phase 3: Camera Data Integration** (2-3 days)
**Objective**: Enhance existing camera scraping to create daily snapshots

**Steps**:
1. Modify existing scraping to dual-write data
2. Implement camera activity trend calculations
3. Create location change detection logic
4. Build camera alert generation system
5. Add camera-specific GitHub Actions workflow
6. Test integration with current scraping system

**Deliverables**:
- Enhanced camera scraping logic
- Activity scoring algorithms
- Location change detection
- Camera snapshot creation service
- Integration tests with existing system

### **Phase 4: Background Processing** (1-2 days)
**Objective**: Coordinate daily jobs and implement monitoring

**Steps**:
1. Create analysis and alerting workflow
2. Implement collection status monitoring
3. Add failure detection and retry logic
4. Create system health checks
5. Test complete daily workflow end-to-end

**Deliverables**:
- `scripts/run-analysis-and-alerts.js`
- Collection monitoring dashboard
- Automated retry mechanisms
- Health check endpoints
- Complete workflow integration tests

### **Phase 5: UI Integration** (3-4 days)
**Objective**: Add daily snapshot data to user interface

**Steps**:
1. Create daily highlights dashboard widget
2. Enhance CameraCard with trend indicators
3. Build activity trend chart component
4. Add alert notification display
5. Create daily summary email template
6. Test UI components with real data

**Deliverables**:
- Dashboard widget components
- Enhanced camera card display
- Trend visualization charts
- Alert display system
- Email notification templates

### **Phase 6: Analytics & Alerting** (2-3 days)
**Objective**: Complete alerting system and performance optimization

**Steps**:
1. Implement email notification system
2. Create advanced anomaly detection rules
3. Add performance optimization for large datasets
4. Build administrative monitoring tools
5. Create documentation and user guides
6. Conduct user acceptance testing

**Deliverables**:
- Complete email alerting system
- Advanced analytics queries
- Performance optimization
- Administrative tools
- User documentation
- Testing and validation reports

---

## 📊 **Success Metrics & KPIs**

### **Data Collection Reliability**
- **Target**: 99%+ daily collection success rate
- **Measurement**: `daily_collection_log` success ratio
- **Alert Threshold**: 2 consecutive failures

### **Data Quality**
- **Target**: 95%+ average data quality score
- **Measurement**: Average `data_quality_score` from weather snapshots
- **Alert Threshold**: Quality score below 80%

### **Alert Response Time**
- **Target**: Alerts delivered within 2 hours of detection
- **Measurement**: Time between alert generation and email delivery
- **Alert Threshold**: Delivery delay > 4 hours

### **System Performance**
- **Target**: Database queries under 500ms for dashboard widgets
- **Measurement**: Query execution time monitoring
- **Alert Threshold**: Queries taking > 2 seconds

### **User Adoption**
- **Target**: Daily dashboard widget usage by all 3 club members
- **Measurement**: Widget interaction analytics
- **Alert Threshold**: No usage for 7+ days

---

## 🔮 **Future Enhancements**

### **Advanced Analytics**
- Hunting success correlation with weather patterns
- Predictive activity modeling based on weather forecasts
- Multi-season trend analysis and reporting
- Property zone-specific analytics

### **Enhanced Alerting**
- SMS notifications for critical alerts
- Slack/Discord integration for real-time updates
- Predictive alerts based on weather forecasts
- Custom alert rules per club member

### **Mobile Optimization**
- Progressive Web App for mobile dashboard access
- Push notifications for immediate alerts
- Offline data viewing capabilities
- Mobile-optimized trend charts

### **Integration Expansions**
- Weather forecast integration for predictive insights
- Trail camera photo analysis for animal detection
- Hunting log correlation with environmental data
- Maintenance task scheduling based on weather

---

## 📝 **Conclusion**

This daily snapshot system provides a comprehensive foundation for data-driven hunting property management. The phased implementation approach ensures reliable development while the detailed specifications enable confident execution.

The system's modular design allows for future enhancements while maintaining robust core functionality. With proper implementation, this will transform the hunting club's ability to understand and optimize their property management and hunting strategies.

**Next Step**: Create detailed implementation plan document with specific tasks, timeframes, and technical specifications for each phase.