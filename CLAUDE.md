# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Caswell County Yacht Club** - A hunting club management system for a 3-member club on 100 acres in North Carolina.

**Tech Stack:**
- Next.js 15 (App Router) + React 19
- Supabase (authentication + PostgreSQL database)
- Tailwind CSS 4 with custom hunting club theme
- Podman for containerized development
- Deployment: Vercel (main → staging, production → live site)

## Essential Commands

### Development
```bash
# Start development server (primary command)
# IMPORTANT: On macOS, must run from /Users path (see note below)
cd /Users/daniel/GIT/hunt-club-website
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev

# Build and check
npm run build              # Production build
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run type-check         # TypeScript type checking
npm run build:safe         # Lint + type-check + build
```

**⚠️ macOS Podman Path Requirement:**
Podman on macOS runs in a VM that only has access to paths under `/Users` by default. If you access the repo via symlinks or alternate paths (e.g., `/depot/git/...` or `/System/Volumes/Data/...`), podman volume mounts will fail with "no such file or directory".

**Always run podman commands from:** `/Users/daniel/GIT/hunt-club-website`

### Database Management
```bash
# Export database schema (run after any schema changes in Supabase)
npm run db:export

# Test database connection
npm run db:test

# Commit database changes (export + git add + commit + push)
npm run db:commit
```

**CRITICAL: When to sync database**
- ✅ After making schema changes in Supabase dashboard
- ✅ After modifying tables, columns, policies, or functions
- ✅ Before implementing features that depend on new schema
- ❌ NOT needed for frontend-only changes

### Cuddeback Camera Sync
```bash
npm run cuddeback:sync     # Sync Cuddeback cameras
npm run cuddeback:test     # Test sync in debug mode
```

## Code Architecture

See `PROJECT_CONTEXT.md` for directory structure and full project background.

### Supabase Integration Patterns

**Client-side (use in Client Components):**
```typescript
import { createClient } from '@/lib/supabase/client'

// In component
const supabase = createClient()
const { data, error } = await supabase.from('table_name').select()
```

**Server-side (use in Server Components, API routes, Server Actions):**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

// In async server component or action
const supabase = await createServerSupabaseClient()
const { data, error } = await supabase.from('table_name').select()
```

**Authentication (use `useAuth` hook):**
```typescript
import { useAuth } from '@/hooks/useAuth'

function Component() {
  const { user, loading, signOut } = useAuth()
  // user is User | null, loading is boolean
}
```

### Centralized Icon System

**IMPORTANT: Always use the centralized icon registry instead of importing from `lucide-react` directly.**

**Location:** `src/lib/shared/icons/`

**Why:** Type-safe icon names, consistent imports across the app, semantic naming (e.g., 'target' for hunting, 'stands' for stand management).

**Usage Pattern:**
```typescript
// ✅ CORRECT - Use the icon registry
import { getIcon } from '@/lib/shared/icons'

function MyComponent() {
  const TargetIcon = getIcon('target')
  const EditIcon = getIcon('edit')

  return (
    <>
      <TargetIcon className="w-5 h-5" />
      <EditIcon className="w-4 h-4 text-burnt-orange" />
    </>
  )
}

// ❌ WRONG - Don't import from lucide-react directly
import { Target, Edit } from 'lucide-react'
```

**Adding New Icons:**
If you need an icon that doesn't exist in the registry:
1. Add it to `src/lib/shared/icons/types.ts` in the `IconName` type
2. Import it in `src/lib/shared/icons/index.ts`
3. Add it to the `ICONS` registry object
4. Add it to the appropriate category

### Navigation Configuration

Navigation is centralized in `src/lib/navigation/navigation-config.ts`:
- All navigation items are defined in `navigationItems` array
- User menu items in `userMenuItems` array
- Brand configuration in `brandConfig`
- Theme colors in `navigationTheme`

To add a new navigation item, edit this config file rather than modifying the Navigation component directly.

### Database Schema

See `supabase/schema.sql` for the authoritative schema and `docs/database/migrations.md` for change history.

**Before proposing any schema change, always verify the current schema first.** The exported file in the repo can be stale.

**Step 1 — Refresh and verify the schema:**
Ask the user to run:
```bash
npm run db:export
```
Then read `supabase/schema.sql` to understand what currently exists.

**Step 2 — Propose changes:**
Show the exact SQL to run in the Supabase SQL editor and explain what it does. Do not write any code yet.

**Step 3 — Wait for confirmation:**
Ask the user to apply the SQL in the Supabase dashboard and confirm it succeeded.

**Step 4 — Refresh again:**
Ask the user to run `npm run db:export` again, then proceed with code changes.

**Never write code that assumes a schema change has been applied until the user explicitly confirms it.**

**After schema changes:**
1. Make changes in Supabase dashboard
2. Run `npm run db:export`
3. Document in `docs/database/migrations.md`
4. Commit: `git add supabase/ docs/ && git commit -m "db: description"`

## Design System

### Color Palette

The app uses a hunting club theme with earth tones:

**Primary Colors:**
- `bg-olive-green` (#566E3D) - Navigation, primary brand
- `bg-burnt-orange` (#FA7921) - CTAs, accents
- `bg-bright-orange` (#FE9920) - Success states
- `bg-muted-gold` (#B9A44C) - Secondary actions, warnings
- `bg-dark-teal` (#0C4767) - Professional accents

**Secondary Colors:**
- `bg-forest-shadow` (#2D3E1F) - Dark text, borders
- `bg-weathered-wood` (#8B7355) - Secondary text
- `bg-morning-mist` (#E8E6E0) - Light backgrounds
- `bg-clay-earth` (#A0653A) - Errors, warnings
- `bg-pine-needle` (#4A5D32) - Hover states
- `bg-sunset-amber` (#D4A574) - Highlights

**Semantic Mappings:**
- `bg-primary` → olive-green
- `bg-secondary` → muted-gold
- `bg-accent` → burnt-orange
- `bg-success` → bright-orange
- `bg-warning` → muted-gold
- `bg-destructive` → clay-earth

**Custom Utilities:**
- `.club-shadow`, `.club-shadow-lg`, `.club-shadow-xl` - Olive-tinted shadows
- `bg-hunt-gradient` - Olive to pine needle gradient
- `bg-autumn-gradient` - Burnt to bright orange gradient
- `bg-earth-gradient` - Weathered wood to clay earth gradient

**Component Patterns:**
- Navigation: `bg-olive-green text-white`
- Primary buttons: `bg-burnt-orange text-white hover:bg-clay-earth`
- Secondary buttons: `bg-muted-gold text-forest-shadow hover:bg-sunset-amber`
- Cards: `bg-white border border-gray-200 rounded-club shadow-club`

See `DESIGN_SYSTEM.md` for complete color specifications.

## Development Workflows

See `WORKFLOW.md` for complete git workflows, database procedures, and container troubleshooting.

### Production Deployment Workflow

**CRITICAL: This project uses a two-branch deployment strategy.**

- **`main` branch** → Deployed to staging/preview for development and testing
- **`production` branch** → Deployed to live public site (what users see)

**When a feature is ready for production:**
```bash
# 1. Ensure feature is merged to main and tested
git checkout main
git pull origin main

# 2. Test thoroughly on staging deployment
# Verify all functionality works as expected

# 3. Merge main into production for live deployment
git checkout production
git pull origin production
git merge main

# 4. Push to deploy to live site
git push origin production

# 5. Switch back to main for continued development
git checkout main
```

**Important Notes:**
- The public site ONLY deploys from the `production` branch
- Always test features in `main` (staging) before merging to `production`
- Never commit directly to `production` - always merge from `main`
- Keep `production` stable and ready for public use at all times

## Important Notes

### Date and Timezone Handling

**🚨 CRITICAL: Database date timezone issue**

**The Problem:** Database date strings in `YYYY-MM-DD` format are interpreted as UTC by JavaScript's `Date` constructor, causing dates to display as the **previous day** in Eastern timezone.

Example:
```javascript
// ❌ WRONG - "2025-08-01" displays as "2025-07-31" in Eastern time
const badDate = new Date("2025-08-01")
```

**The Solution:** ALWAYS use the date utilities from `src/lib/utils/date.ts`:

```typescript
import { parseDBDate, formatDate, formatForDB } from '@/lib/utils/date'

// ✅ CORRECT - Parse database dates in local timezone
const date = parseDBDate("2025-08-01") // Correctly shows Aug 1

// ✅ Display dates properly
const display = formatDate(dateString, { style: 'short' })

// ✅ Format for HTML date inputs
const inputValue = formatDateForInput(dateString)

// ✅ Format for database storage
const dbDate = formatForDB(new Date())
```

**Key Utilities:**
- `parseDBDate(dateString)` - Parse database dates in local timezone
- `formatDate(dateString, options)` - Display dates with various styles
- `formatHuntDate(dateString)` - Hunt-specific formatting (Today, Yesterday, etc.)
- `formatDateForInput(date)` - Format for HTML `<input type="date">`
- `formatForDB(date)` - Format for database storage (YYYY-MM-DD)
- `isToday(dateString)` - Check if date is today
- `isValidHuntDate(dateString)` - Validate hunt dates (not in future)

**Never use:**
- ❌ `new Date(dbDateString)` for YYYY-MM-DD strings
- ❌ Manual date string parsing
- ❌ Direct `.toLocaleDateString()` without timezone handling

**Why this matters:**
Hunt dates, camera deployment dates, and maintenance dates will all display incorrectly (off by one day) if you don't use these utilities.

### Security
- Never commit `.env.local` - it contains database credentials
- All database operations use scripts that load environment variables securely
- Database password is only in `.env.local`, never in git

### Mobile-First Design
- All components should be responsive and mobile-first
- Navigation is always visible (not hamburger menu)
- Test layouts at multiple breakpoints (xs, sm, md, lg, xl, 2xl, 3xl)

### State Management
- React hooks for local state
- Supabase for server state and real-time subscriptions
- No external state management library (Redux, Zustand, etc.)

### Feature Flags
- Unfinished features use "Coming Soon" pattern
- Authentication-aware UI (public vs member views)

## Common Patterns

### Creating a New Page
1. Create page in `src/app/[route]/page.tsx`
2. Add to navigation config if needed (`src/lib/navigation/navigation-config.ts`)
3. Use consistent layout with Navigation component
4. Follow mobile-first responsive patterns
5. Use semantic color classes from design system

### Adding a Database Table
1. Create table in Supabase dashboard with RLS policies
2. Run `npm run db:export`
3. Document in `docs/database/migrations.md`
4. Create TypeScript types in `src/types/database.ts` or feature-specific types
5. Create service functions in `src/lib/[feature]/` directory
6. Create custom hook if needed in `src/hooks/`
7. Commit schema changes before implementing UI

### Working with Cards (V2 System)
**IMPORTANT:** Use the V2 card components for all new development:
- `StandCardV2` — `src/components/stands/StandCardV2.tsx`
- `HuntCardV2` — `src/components/hunt-logging/HuntCardV2.tsx`
- `CameraCardV2` — `src/components/cameras/CameraCardV2.tsx`

**Three Display Modes:** All cards support `mode` prop:
- `'full'` - Complete card with all details
- `'compact'` - Mini card for grids
- `'list'` - Table row for list views

**Architecture: Composable, not Universal**
Hunts, Stands, and Cameras have genuinely different content — do not try to force shared inner components. What IS shared and must be consistent:
- `BaseCard` wrapper (`src/components/shared/cards/BaseCard.tsx`) — use for all cards
- Action button colors — identical across every card type, no exceptions:
  - View: `text-dark-teal hover:bg-dark-teal/10`
  - Edit: `text-olive-green hover:bg-olive-green/10`
  - Delete: `text-clay-earth hover:bg-clay-earth/10`
- Icon sizing: Full/Compact → `p-2 rounded-lg` size `24` · List → `p-1 rounded` size `16`

**Color Management — HUNTING_COLORS constant**
Each card component must define a `HUNTING_COLORS` constant at the top of the file with named hex values. Never mix hardcoded hex values and Tailwind color names for the same color within a component.

```typescript
const HUNTING_COLORS = {
  oliveGreen: '#566E3D',
  burntOrange: '#FA7921',
  brightOrange: '#FE9920',
  mutedGold: '#B9A44C',
  darkTeal: '#0C4767',
  forestShadow: '#2D3E1F',
  weatheredWood: '#8B7355',
  morningMist: '#E8E6E0',
  clayEarth: '#A0653A',
}
```

**Inactive / undeployed state**
Every card must handle inactive items visually — never display an inactive item identically to an active one. Use muted opacity and a visible "Not Deployed" or "Inactive" badge. Management pages default to showing **active items only**; inactive items require the user to explicitly toggle a filter.

See `docs/refactoring/CARD_SYSTEM_V2_FINAL.md` for full implementation reference.

### Camera Data Model
The camera system is split into two separate concepts — never conflate them:

- **`camera_hardware`** — the physical device. Persists forever. Fields: `device_id`, `brand`, `model`, `battery_type`, `condition`, `active`.
- **`camera_deployments`** — where the device is deployed this season. Seasonal. Fields: `hardware_id` (FK), `location_name`, `latitude`, `longitude`, `season_year`, `has_solar_panel`, `solar_panel_id`, `active`.
- **`camera_status_reports`** — automated daily status from sync. Fields: `battery_status`, `signal_level`, `sd_images_count`, etc.

When a camera is pulled from the field, its **deployment** is deactivated (`active=false`) — the hardware record is untouched. Historical deployments are preserved for every season.

### Working with Forms
- Use `react-hook-form` for form state management
- Use `zod` for validation schemas
- Follow pattern in `src/components/hunt-logging/` for reference

## Session Workflow Skills

Two slash commands are available to keep sessions focused:

- **`/start`** — Run at the beginning of every session. Asks "what does done look like?" and holds the conversation accountable to that goal.
- **`/done`** — Run at the end of every session. Checks git status, captures any new decisions into CLAUDE.md, flags obsolete docs, and summarizes what was accomplished.

Skills live in `.claude/skills/`. If you don't use `/start`, ask yourself: "what exactly am I trying to finish today?"

## Key Files Reference

- `package.json` - Scripts and dependencies
- `tailwind.config.ts` - Complete theme configuration
- `src/components/Navigation.tsx` - Main navigation component
- `src/lib/navigation/navigation-config.ts` - Navigation configuration
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server Supabase client
- `src/lib/shared/icons/` - Centralized icon registry
- `src/lib/utils/date.ts` - Date/timezone utilities (CRITICAL!)
- `src/hooks/useAuth.ts` - Authentication hook
- `WORKFLOW.md` - Detailed development workflows
- `PROJECT_CONTEXT.md` - Project requirements and context
- `DESIGN_SYSTEM.md` - Complete design system documentation
- `docs/database/migrations.md` - Database change history
- `docs/KNOWN_ISSUES.md` - Known limitations and technical debt
- `docs/refactoring/CARD_SYSTEM_V2_FINAL.md` - Card System V2 implementation guide

