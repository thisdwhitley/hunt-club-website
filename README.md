# Caswell County Yacht Club

Hunting club management system for tracking hunts, maintenance, and camp activities.

## 📋 Quick Links
- **[Development Workflow](WORKFLOW.md)** ← **START HERE!**
- [Development Setup](DEVELOPMENT.md)  
- [Project Context](PROJECT_CONTEXT.md)

## 🎯 Key Commands
```bash
# Start development
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev

# After database changes
npm run db:export && git add supabase/ && git commit -m "db: your changes" && git push
```

## Current Status
- [x] Initial Next.js setup
- [x] Supabase integration ready
- [x] Database schema (11 tables)
- [x] Secure database workflow
- [ ] Authentication system
- [ ] Hunt logging
- [ ] Property map features

## **⏰ Quick Summary: When to Run Database Commands**

**🔔 TELL CLAUDE & RUN `npm run db:export` WHEN:**
- ✅ You add/modify tables in Supabase dashboard
- ✅ You change database policies or functions  
- ✅ You want to work on features that need the latest schema
- ✅ Before asking Claude to help with database-related features

**📅 TYPICAL FLOW:**
1. **Make database changes** in Supabase dashboard
2. **Run**: `npm run db:export`
3. **Document**: Update `docs/database/migrations.md`
4. **Commit**: `git add supabase/ docs/ && git commit -m "db: describe changes"`
5. **Push**: `git push`
6. **Tell Claude**: "I've updated the database schema and pushed to main"

**🎯 The key thing: Whenever you change the database structure, run the export and push to main so I can see your latest schema and help you build features that match it perfectly!**