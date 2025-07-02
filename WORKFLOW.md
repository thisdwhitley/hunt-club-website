# 🎯 Caswell County Yacht Club - Development Workflow

## 📋 Quick Reference

### Daily Development Workflow
```bash
# 1. Start development
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev

# 2. Work on features in feature branches
git checkout -b feature/your-feature-name

# 3. When done with feature
git add .
git commit -m "feat: describe your changes"
git checkout main
git merge feature/your-feature-name  
git push origin main
```

### 🗄️ Database Management

#### When to Run Database Sync Commands

**⚠️ RUN THESE COMMANDS WHEN:**
- ✅ You make changes in Supabase dashboard (add tables, columns, etc.)
- ✅ You modify database schema, policies, or functions
- ✅ You want to share database changes with Claude/teammates
- ✅ Before committing database-related work
- ✅ After pulling changes that might include database updates

**❌ DON'T RUN THESE WHEN:**
- ❌ Just working on frontend code (components, styles, etc.)
- ❌ Only changing business logic that doesn't touch schema
- ❌ Adding new features that use existing database structure

#### Database Sync Commands
```bash
# Quick schema export (most common)
npm run db:export

# Full sync (schema + types, if types generation works)
npm run db:sync

# Test database connection
npm run db:test

# Commit database changes
npm run db:commit
```

## 🔄 Complete Development Workflows

### Workflow 1: Frontend Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/hunt-logging-ui

# 2. Start container
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev

# 3. Develop your feature (no database changes needed)
# - Edit components
# - Update styles  
# - Add new pages

# 4. Commit and merge
git add .
git commit -m "feat: add hunt logging interface"
git checkout main
git merge feature/hunt-logging-ui
git push origin main
```

### Workflow 2: Database Schema Changes
```bash
# 1. Create feature branch
git checkout -b feature/add-weather-tracking

# 2. Make changes in Supabase dashboard
# - Add columns to hunt_logs table
# - Update policies
# - Add new triggers

# 3. Sync database schema
npm run db:export

# 4. Document the changes
echo "
### $(date '+%Y-%m-%d'): Added weather tracking to hunt logs
- Added temperature_high, temperature_low columns
- Added wind_speed, wind_direction columns  
- Updated hunt logging policies
" >> docs/database/migrations.md

# 5. Commit database changes
git add supabase/ docs/
git commit -m "db: add weather tracking fields to hunt_logs

- Add temperature and wind columns
- Update documentation
- Ready for UI implementation"

# 6. Merge to main
git checkout main
git merge feature/add-weather-tracking
git push origin main

# 7. Tell Claude you've made database changes!
```

### Workflow 3: Full Feature with Database Changes
```bash
# 1. Create feature branch
git checkout -b feature/trail-camera-management

# 2. Database changes first
# - Create trail_camera_photos table in Supabase
# - Set up RLS policies
# - Add relationships

# 3. Sync database
npm run db:export
# Update docs/database/migrations.md

# 4. Commit database changes
git add supabase/ docs/
git commit -m "db: add trail camera photo management tables"

# 5. Build frontend features
# - Create components
# - Add pages
# - Implement photo upload

# 6. Commit frontend changes
git add .
git commit -m "feat: trail camera photo management interface"

# 7. Merge complete feature
git checkout main
git merge feature/trail-camera-management
git push origin main
```

## 🤖 Working with Claude

### When to Tell Claude About Database Changes
```bash
# After running these commands, mention it to Claude:
npm run db:export
git add supabase/
git commit -m "db: your changes"
git push origin main

# Then tell Claude: "I've updated the database schema and pushed to main"
```

### What Claude Needs to Know
- ✅ "I added a new table for trail camera photos"
- ✅ "I updated the hunt_logs schema with weather fields"  
- ✅ "I changed the RLS policies for members"
- ✅ "I've pushed database changes to main"

### What Claude Can Help With
- 🎯 Building components that match your database structure
- 🔧 Writing TypeScript interfaces based on your schema
- 📝 Creating forms that work with your table structure
- 🔍 Suggesting database optimizations
- 🛠️ Helping debug database-related issues

## 🚨 Important Reminders

### Security Checklist
- ✅ `.env.local` is in `.gitignore` 
- ✅ Never commit database passwords
- ✅ Database credentials only in `.env.local`
- ✅ Use secure scripts that load environment variables

### Before Every Major Feature
1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make database changes** (if needed) in Supabase dashboard
3. **Sync database**: `npm run db:export` 
4. **Document changes** in `docs/database/migrations.md`
5. **Commit database changes** before building UI
6. **Build frontend features**
7. **Test everything works**
8. **Merge to main** and push
9. **Tell Claude** about database changes

### Container Management
```bash
# Your standard container command (save this!)
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev

# If container gets stuck
podman stop hunt-club-dev
podman rm hunt-club-dev

# Check running containers
podman ps
```

## 📁 File Structure Reference

```
hunt-club/
├── docs/database/           # Database documentation
│   ├── migrations.md        # Change history (update this!)
│   └── schema.md           # Schema documentation
├── scripts/                # Database management scripts  
│   ├── db-export.sh        # Export schema securely
│   ├── db-types.sh         # Generate TypeScript types
│   └── db-test.sh          # Test database connection
├── supabase/               # Database exports
│   └── schema.sql          # Current schema (auto-generated)
├── src/types/              # TypeScript definitions
│   └── database.ts         # Database types (when working)
├── .env.local              # Secure credentials (NOT in git)
├── .env.local.example      # Template for others
└── package.json            # Scripts and dependencies
```

## 🎯 Success Indicators

You're doing it right when:
- ✅ Database changes are committed before UI changes
- ✅ Migration log is updated with each schema change
- ✅ Feature branches are used for all development
- ✅ Claude can see your latest database structure in main branch
- ✅ No passwords are committed to git
- ✅ Container workflow is smooth and reliable

## 🆘 Common Issues

### "Database sync failed"
```bash
# Check your .env.local file exists and has credentials
cat .env.local

# Test database connection
npm run db:test

# Check if scripts are executable
chmod +x scripts/*.sh
```

### "Claude can't see my database changes"
```bash
# Make sure you've pushed to main
git status
git push origin main

# Verify schema.sql was updated
ls -la supabase/schema.sql
```

### "Container won't start"
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill any existing containers
podman stop hunt-club-dev
podman rm hunt-club-dev
```

---

## 🔮 Next Steps

As your project grows, consider:
- Setting up automated database migrations
- Adding database testing
- Creating staging environment
- Setting up CI/CD pipeline

**Remember: Database changes → Export → Document → Commit → Tell Claude!**