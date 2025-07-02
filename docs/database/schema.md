# Hunting Club Database Schema

Last Updated: $(date)
Supabase Project: [YOUR_PROJECT_ID]

## Tables

### Overview
Document your tables here. Example:

### `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** User profile information
**Relationships:** References auth.users(id)
**RLS:** Users can view all profiles, only update their own

## Indexes
List your performance indexes here.

## Views
Document any database views here.
