# Database Schema

## Core Tables
- members (auth + profile info)
- stands (locations on property)
- hunts (logging + weather data)
- maintenance_tasks (camp upkeep)
- camp_todos (shared supply/task lists)
- photos (trail camera images)

## Key Relationships
- hunts → members (who went)
- hunts → stands (where they sat)
- hunts → weather_data (auto-populated)