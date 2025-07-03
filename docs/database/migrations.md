
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

