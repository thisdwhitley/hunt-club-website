# Database Schema Documentation

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

### camera_status_reports (14 fields)
Daily email report data with automatic alerts
- id (uuid, PK)  
- deployment_id (FK to camera_deployments)
- hardware_id (FK to camera_hardware)
- report_date (date)
- battery_status, signal_level, network_links
- sd_images_count, sd_free_space_mb, image_queue
- needs_attention (boolean), alert_reason (text)
- report_processing_date - When we processed the report
- created_at

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
