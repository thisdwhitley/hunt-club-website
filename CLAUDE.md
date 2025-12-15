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
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev

# Build and check
npm run build              # Production build
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run type-check         # TypeScript type checking
npm run build:safe         # Lint + type-check + build
```

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

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── management/         # Data management pages (hunts, stands, cameras)
│   ├── hunt-logging/       # Hunt logging interface
│   ├── hunts/              # Hunt data display
│   ├── property-map/       # Interactive property map
│   └── api/                # API routes (calendar integration)
├── components/             # React components
│   ├── Navigation.tsx      # Main navigation component
│   ├── hunt-logging/       # Hunt logging forms and UI
│   ├── stands/             # Stand management components
│   ├── cameras/            # Trail camera components
│   ├── map/                # Map-related components
│   ├── modals/             # Modal dialogs
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility libraries and services
│   ├── supabase/           # Supabase client configuration
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server component client
│   │   └── middleware.ts   # Middleware for auth
│   ├── services/           # External service integrations
│   │   └── googleCalendar.ts
│   ├── weather/            # Weather service integration
│   ├── navigation/         # Navigation configuration
│   ├── hunt-logging/       # Hunt logging utilities
│   ├── stands/             # Stand management logic
│   ├── cameras/            # Camera management logic
│   ├── shared/             # Shared utilities
│   │   └── icons/          # Centralized icon registry (USE THIS!)
│   └── utils/              # General utilities
│       └── date.ts         # Date/timezone utilities (CRITICAL!)
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication hook
│   ├── useStands.ts        # Stand data management
│   └── useMapData.ts       # Map data management
└── types/                  # TypeScript type definitions
    └── database.ts         # Database types

scripts/                    # Database and utility scripts
├── db-export.sh           # Export schema securely
├── db-test.sh             # Test database connection
└── sync-cuddeback-cameras.js  # Cuddeback camera sync

docs/database/             # Database documentation
└── migrations.md          # Database change history
```

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

**Available Icon Categories:**
- Navigation (menu, close, chevrons)
- Features (calendar, map, stands, cameras, hunts)
- Actions (plus, edit, delete, save, search)
- User (user, login, logout, profile, settings)
- Status (check, alert, success, error, warning)
- Hunting (target, binoculars, compass, wind, sun, moon)
- Stand Types (ladderStand, baleBlind, boxStand, tripodStand, groundBlind)
- Hardware (camera, battery, wifi, signal, power)
- Time (clock, timer, sunrise, sunset)
- Data (chartLine, chartBar, trendingUp)

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

Core tables:
- `members` - User profiles and authentication
- `stands` - Hunting stand locations with GPS coordinates
- `hunts` - Hunt logs with weather data integration
- `maintenance_tasks` - Camp maintenance tracking
- `camp_todos` - Shared supply and task lists
- `trail_camera_photos` - Trail camera image management
- `trail_cameras` - Camera device information
- `cuddeback_cameras` - Cuddeback-specific camera data

Key relationships:
- `hunts.member_id` → `members.id`
- `hunts.stand_id` → `stands.id`
- `hunts.weather_data` → Embedded JSON with temperature, wind, etc.

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

### Feature Development Workflow

**Frontend-only changes:**
```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: description"
git checkout main && git merge feature/your-feature
git push origin main
```

**With database changes:**
```bash
git checkout -b feature/your-feature
# 1. Make schema changes in Supabase dashboard
npm run db:export
# 2. Document changes in docs/database/migrations.md
git add supabase/ docs/ && git commit -m "db: schema changes"
# 3. Build frontend features
git add . && git commit -m "feat: feature implementation"
git checkout main && git merge feature/your-feature
git push origin main
```

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

### Container Management

Standard development container command (save this):
```bash
podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev
```

If container issues occur:
```bash
podman stop hunt-club-dev
podman rm hunt-club-dev
podman ps  # Check running containers
```

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

### Testing API Integrations
- Google Calendar integration via `/api/calendar/google` route
- Weather data auto-populated on hunt logging
- Cuddeback camera sync runs as Node.js script

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
- `StandCardV2` - Stand management cards
- `HuntCardV2` - Hunt logging cards
- `CameraCardV2` - Camera management cards

**Three Display Modes:** All cards support `mode` prop:
- `'full'` - Complete card with all details
- `'compact'` - Mini card for grids
- `'list'` - Table row for list views

**Composable Base Components** (`src/components/shared/cards/`):
- `BaseCard` - Container with hover/click effects
- `CardHeader` - Title area with icon, badges, actions
- `CardStatsGrid` - Flexible grid for metrics
- `CardSection` - Collapsible sections

**Icon Sizing Consistency:**
- Full/Compact: `p-2 rounded-lg` with size `24`
- List: `p-1 rounded` with size `16`

See `docs/refactoring/CARD_SYSTEM_V2_FINAL.md` for complete implementation details.

### Working with Forms
- Use `react-hook-form` for form state management
- Use `zod` for validation schemas
- Follow pattern in `src/components/hunt-logging/` for reference

### Using Icons
```typescript
// Always use the centralized icon registry
import { getIcon } from '@/lib/shared/icons'

function Component() {
  const Icon = getIcon('target') // Type-safe icon names
  return <Icon className="w-5 h-5 text-olive-green" />
}
```

### Working with Dates
```typescript
// Always use date utilities for database dates
import { parseDBDate, formatDate, formatForDB } from '@/lib/utils/date'

// Parse from database
const date = parseDBDate(hunt.hunt_date)

// Display to user
const displayDate = formatDate(hunt.hunt_date, { style: 'short' })

// Store to database
const dbDate = formatForDB(new Date())
```

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

## Related Documentation

- See `WORKFLOW.md` for complete development workflows and database procedures
- See `PROJECT_CONTEXT.md` for project requirements and goals
- See `DESIGN_SYSTEM.md` for complete design specifications
- See `FEATURES.md` for planned features and roadmap
- See `docs/KNOWN_ISSUES.md` for known limitations and areas needing improvement
- See `docs/refactoring/CARD_SYSTEM_V2_FINAL.md` for Card V2 system details and integration guide
