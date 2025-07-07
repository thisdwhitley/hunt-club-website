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

---

# Enhanced WORKFLOW.md - Add this Database Section

## Database Modification Workflow

### Before Making Schema Changes
1. **Document the change**: Add entry to `docs/database/migrations.md`
2. **Create feature branch**: `git checkout -b feature/db-[change-name]`
3. **Backup critical data**: Export from Supabase if needed
4. **Test in development**: Use Supabase staging if available

### Making Schema Changes
1. **Write migration SQL**: Include rollback procedures
2. **Update schema docs**: Modify `docs/database/SCHEMA.md`
3. **Test migration**: Verify all constraints and triggers work
4. **Export schema**: Run `npm run db:export`

### After Schema Changes
1. **Commit changes**: Include migration, docs, and exported schema
2. **Merge to main**: So Claude can see current structure
3. **Update team**: Document breaking changes if any
4. **Monitor**: Watch for issues in production

### For Claude Integration
- **Always merge schema changes to main** before asking Claude for code
- **Include current schema** in conversation context when needed
- **Reference migration entries** when explaining database structure
- **Export schema after every change**: `npm run db:export`

### Database Export Workflow

**Standard Export Command:**
```bash
npm run db:export
```

**Verify Export Success:**
```bash
# Check that schema contains your changes
grep "CREATE TABLE public.your_table" supabase/schema.sql

# Verify functions and triggers
grep "CREATE FUNCTION" supabase/schema.sql
```

**Troubleshooting Export Issues:**
```bash
# Test public schema only export
podman run --rm \
  -e PGPASSWORD="$SUPABASE_DB_PASSWORD" \
  postgres:17 pg_dump \
  --host="$SUPABASE_DB_HOST" \
  --port="$SUPABASE_DB_PORT" \
  --username="$SUPABASE_DB_USER" \
  --dbname="$SUPABASE_DB_NAME" \
  --schema=public \
  --schema-only \
  > supabase/schema_test.sql

# Compare with main export
diff supabase/schema.sql supabase/schema_test.sql
```

### Migration Documentation Template

**Add to `docs/database/migrations.md`:**
```markdown
### [Feature Name] - [Date]

**Type**: Schema Addition | Schema Modification | Data Migration | Performance
**Affected Tables**: table1, table2, table3
**Breaking Changes**: Yes/No
**Rollback Available**: Yes/No

**Purpose**: Brief description of why this change was needed

**Changes Made**:
- Added table `new_table` with fields: field1, field2, field3
- Modified table `existing_table`: added field4, removed field5
- Added indexes: idx_name1, idx_name2
- Added functions: function_name

**Migration SQL**: 
```sql
-- SQL commands used (or reference to artifact)
```

**Verification Steps**:
- [ ] Step 1: Verify tables created
- [ ] Step 2: Test triggers and functions
- [ ] Step 3: Verify data integrity

**Files Modified**:
- supabase/schema.sql (exported)
- docs/database/SCHEMA.md (if structure changed)
- docs/database/[feature]-system.md (if new feature)
- src/types/database.ts (if types changed)

**Claude Context**: Include this migration when asking Claude about [specific feature]

**Key Business Logic**:
- Important behavior notes
- Special constraints or rules
- Performance considerations
```

### Common Database Tasks

**Create New Feature Tables:**
1. Design table structure with relationships
2. Write CREATE TABLE statements with constraints
3. Add appropriate indexes for performance
4. Create any functions or triggers needed
5. Enable RLS if required
6. Test with sample data
7. Document in migrations.md
8. Export schema and commit

**Modify Existing Tables:**
1. Plan backward compatibility
2. Create migration with ALTER statements
3. Update related functions/triggers
4. Test data integrity
5. Update SCHEMA.md documentation
6. Export and commit changes

**Performance Optimization:**
1. Analyze slow queries
2. Add appropriate indexes
3. Consider partitioning for large tables
4. Update statistics
5. Document performance changes

### Emergency Procedures

**Rollback Schema Changes:**
1. **Immediate**: Use Supabase dashboard to restore from backup
2. **Code rollback**: Revert commits and redeploy
3. **Manual fix**: Write corrective SQL statements
4. **Data recovery**: Restore from recent backup if needed

**Schema Export Failure:**
1. Check database connectivity
2. Verify credentials in .env.local
3. Test with simplified export (public schema only)
4. Use Supabase dashboard export as backup
5. Manual table-by-table export if needed

### Best Practices

**Schema Design:**
- Use meaningful table and column names
- Include created_at/updated_at timestamps
- Add proper foreign key constraints
- Design for scalability from start
- Include soft delete capabilities where appropriate

**Migration Safety:**
- Always backup before major changes
- Test migrations on copy of production data
- Include rollback procedures
- Document breaking changes clearly
- Coordinate with team before deploying

**Documentation:**
- Keep SCHEMA.md current with all changes
- Document business logic in migrations.md
- Include performance considerations
- Update Claude context notes
- Cross-reference related features