# Composable Card System Refactoring

**Status:** 🚧 In Progress - Phase 1: COMPLETE ✅
**Started:** 2025-10-30
**Last Updated:** 2025-10-31
**Current Phase:** Refinement - Preview implementations complete

**Original Name:** "Universal Card System"
**Current Name:** "Composable Card System" (evolved understanding - see Architecture Reality Check below)

---

## 🎯 Quick Context for New Sessions

This project creates a **composable card system** for the hunting club website to standardize common patterns across Hunt, Stand, and Camera cards. We're building **reusable base components** (header, wrapper, styling) that provide consistency while allowing domain-specific content customization.

### 🚨 Important: This is a Parallel Preview System

**Current Status:**
- ✅ **NO production code has been modified** - Everything is working as before
- ✅ **V2 components are completely separate** - Built in parallel, not touching existing code
- ✅ **Preview pages for safe comparison** - View old vs new side-by-side at:
  - `/management/stands-preview` - Compare StandCard vs StandCardV2
  - `/management/hunts-preview` - Compare HuntCard vs HuntCardV2
- ⏳ **Migration happens later** - Once we're satisfied with V2 components, THEN we'll replace production code

**What Exists Now:**
- **Production (unchanged)**: `StandCard.tsx`, `HuntCard.tsx`, `CameraCard.tsx` - still in use
- **Preview (new V2)**: `StandCardV2.tsx`, `HuntCardV2.tsx` - built for testing
- **Shared primitives**: `BaseCard`, `CardHeader` - ready for any domain to use

**Eventually (Phase 4 - not started):**
- Replace production Stand management with StandCardV2 ✅ When approved
- Apply same pattern to Cameras ✅ When ready
- Hunt management stays untouched (already perfect) ✅ Reference only

**Critical Constraint:** The Hunt Data Management system (`HuntDataManagement.tsx`, `HuntCard.tsx`) is working perfectly and must **NOT be modified**. We'll create new components in parallel and apply them to Stands first, then Cameras.

**Strategy:** Create new V2 components alongside existing code, test thoroughly in preview pages, get approval, THEN migrate production code. Keep backups of all original files.

---

## 🧠 Architecture Reality Check (2025-10-31)

### Original Goal vs. Reality

**Original Vision:** Create a single "universal card" component that could render Hunts, Stands, and Cameras with minimal customization.

**What We Learned Through Implementation:**
- Hunt, Stand, and Camera cards have **fundamentally different content structures**
- Stands show: Features grid, History stats, GPS location
- Hunts show: Time ranges, Weather data, Notes, Stand reference
- Cameras show: Hardware info, Report data, Signal metrics
- List/table modes are completely different per domain

**Evolved Understanding:** We've built a **Composable Card System**, not a "Universal Card".

### What IS Shared (The Real Benefits) ✅

1. **BaseCard Wrapper**
   - Consistent card shell (border, shadow, padding, hover states)
   - Mode support (full, compact, list)
   - Clickability handling
   - Responsive behavior

2. **CardHeader Component** ⭐ **This is the biggest win**
   - Icon + Title + Badges + Actions layout
   - Consistent action button colors:
     - View: dark-teal
     - Edit: olive-green
     - Delete: clay-earth
   - Badge styling and positioning
   - **Fully reusable across all domains**

3. **Design Standards**
   - Centralized icon registry (no more direct lucide-react imports)
   - Consistent color tokens (olive-green, burnt-orange, etc.)
   - Unified spacing and typography
   - Standardized section styling (bordered boxes, morning-mist backgrounds)

4. **Patterns & Conventions**
   - How to structure badges
   - How to display stats
   - How to format dates/times
   - How to show "Prior season" indicators

### What Is NOT Shared (Reality) ❌

1. **Card Body Content** - Each domain needs custom layout:
   - Feature grids, stat displays, info boxes are all domain-specific
   - No way to "configure" these without making code more complex

2. **List/Table Mode** - Completely different structures:
   - Different columns per domain
   - Different data transformations
   - Each returns its own `<tr>` implementation

3. **Data Fetching & Processing** - Domain-specific logic:
   - Stands query hunt_logs for history stats
   - Hunts query hunt_logs_with_temperature view
   - Cameras query hardware and reports
   - Each has unique data needs

### The Honest Assessment

**We have NOT reduced the customization burden significantly.** You still need to:
- Build custom V2 cards for each domain (StandCardV2, HuntCardV2, CameraCardV2)
- Design domain-specific layouts and sections
- Handle domain-specific data structures
- Implement separate list mode logic

**BUT** you HAVE gained:
- ✅ Consistent headers that work everywhere
- ✅ Standardized action buttons and colors
- ✅ Shared design patterns to follow
- ✅ Less duplication of header/wrapper/styling code
- ✅ Icon registry for consistency
- ✅ Clear patterns for future cards

### Terminology Going Forward

- **"Composable Card System"** = accurate description
- **"Shared Card Primitives"** = also accurate
- **"Card Component Library"** = also acceptable
- **"Universal Card"** = misleading, avoid going forward

### Why This Is Still Valuable

Even though each domain needs a custom V2 card, having shared primitives means:
1. Headers look and behave consistently
2. Action buttons have standard colors and behavior
3. New developers see clear patterns to follow
4. Icon usage is centralized and type-safe
5. Design tokens are consistently applied
6. Less code duplication in headers and wrappers

**This is a practical, maintainable solution** even if it's not the "magic universal component" we initially envisioned.

---

## 📊 Overall Progress

### Phase 1: Base Components (100% - COMPLETE ✅)
**Goal:** Create reusable card and management page primitives

- [x] Planning complete ✅
- [x] Create `src/components/shared/cards/` directory
- [x] Create `src/components/shared/management/` directory (created, not populated yet)
- [x] BaseCard.tsx (supports full, compact, list modes)
- [x] CardHeader.tsx (icon, title, badges, actions)
- [x] CardStatsGrid.tsx (grid and inline modes)
- [x] CardSection.tsx (collapsible sections)
- [x] CardBadge.tsx (status indicators)
- [x] TypeScript types and interfaces (types.ts)
- [x] Barrel export (index.ts)
- [x] StandCardV2.tsx (example implementation)
- [x] Preview page at `/management/stands-preview`
- [x] Code quality checks (0 lint errors, 0 type errors)
- [ ] ManagementLayout.tsx (deferred to Phase 2)
- [ ] SearchAndSort.tsx (deferred to Phase 2)
- [ ] FilterPanel.tsx (deferred to Phase 2)
- [ ] PaginationControls.tsx (deferred to Phase 2)
- [ ] ViewToggle.tsx (deferred to Phase 2)
- [ ] BulkActionsBar.tsx (deferred to Phase 2)

**Completed:** Session 1 (2025-10-30)
**Commit:** c98d498

### Phase 2: Stand Management V2 (0% - Not Started)
**Goal:** Rebuild Stand Management using new base components

- [ ] Create `StandManagementV2.tsx` (new file)
- [ ] Create `StandCardV2.tsx` (new file)
- [ ] Add mobile detection (< 768px)
- [ ] Add table/list view mode
- [ ] Add pagination (default 25 items)
- [ ] Add list mode to StandCard
- [ ] Update `StandFormModal.tsx` (backdrop click to close)
- [ ] Test on desktop (table + card views)
- [ ] Test on mobile (forced card view)
- [ ] Compare with old implementation

**Estimated:** 2-3 sessions

### Phase 3: Camera Compatibility Review (0% - Not Started)
**Goal:** Verify camera management can use the same system

- [ ] Review CameraCard.tsx structure
- [ ] Document required changes
- [ ] Identify domain-specific logic
- [ ] Create conversion plan
- [ ] Get approval before implementation

**Estimated:** 1 session

### Phase 4: Integration & Migration (0% - Not Started)
**Goal:** Deploy new system and retire old code

- [ ] Test Stands V2 thoroughly
- [ ] Create backup branch of old code
- [ ] Switch stands route to V2
- [ ] Update navigation if needed
- [ ] Document differences
- [ ] Create camera migration plan
- [ ] Update CLAUDE.md with new patterns

**Estimated:** 1-2 sessions

---

## 🎨 Design Decisions Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-10-30 | Use composition over inheritance | Allows flexibility while sharing common patterns | All components |
| 2025-10-30 | Keep HuntDataManagement untouched | Working perfectly, too risky to change | No changes to hunt code |
| 2025-10-30 | Create V2 files alongside originals | Safe migration path with backups | Temporary duplication |
| 2025-10-30 | Stands first, then cameras | Stands are simpler, lower risk | Phased rollout |
| 2025-10-30 | Separate card and management concerns | Card display vs page layout are different | Clean separation |
| 2025-10-30 | Support 3 card modes: full, compact, list | Covers all use cases (grid, mobile, table) | All cards |
| 2025-10-30 | Default pagination: 25 items | Matches hunt management | All management pages |
| 2025-10-30 | Mobile breakpoint: 768px | Standard tablet/mobile boundary | All responsive logic |

---

## 📁 File Structure

### New Files to Create

```
src/components/shared/
├── cards/
│   ├── BaseCard.tsx              # Card wrapper with mode support
│   ├── CardHeader.tsx            # Icon + title + badges + actions
│   ├── CardStatsGrid.tsx         # Stats display grid
│   ├── CardSection.tsx           # Generic content section
│   ├── CardBadge.tsx             # Status/alert badges
│   ├── types.ts                  # Shared TypeScript types
│   └── index.ts                  # Barrel export
│
└── management/
    ├── ManagementLayout.tsx      # Page wrapper with header
    ├── SearchAndSort.tsx         # Search + sort controls
    ├── FilterPanel.tsx           # Collapsible filter sidebar
    ├── PaginationControls.tsx    # Pagination component
    ├── ViewToggle.tsx            # Table/Card view toggle
    ├── BulkActionsBar.tsx        # Bulk selection actions
    ├── types.ts                  # Shared TypeScript types
    └── index.ts                  # Barrel export

src/components/stands/
├── StandManagementV2.tsx         # NEW: Using base components
└── StandCardV2.tsx               # NEW: Using base card components

src/app/management/stands/
└── page.tsx                      # Will switch to V2 components
```

### Files NOT to Touch

**❌ DO NOT MODIFY THESE FILES:**
- `src/components/hunt-logging/HuntDataManagement.tsx` ✅ Working perfectly
- `src/components/hunt-logging/HuntCard.tsx` ✅ Working perfectly
- `src/components/hunt-logging/HuntEntryForm.tsx` ✅ Working perfectly
- `src/app/management/hunts/*` ✅ All hunt pages working

**⚠️ Keep as Backup (will eventually replace):**
- `src/app/management/stands/page.tsx` (current implementation)
- `src/components/stands/StandCard.tsx` (current implementation)
- `src/components/stands/StandFormModal.tsx` (minor update needed)

**📋 Reference for Patterns:**
- `src/components/hunt-logging/HuntDataManagement.tsx` (mobile detection, pagination, view toggle)
- `src/components/hunt-logging/HuntCard.tsx` (list mode at lines 204-323)

---

## 🏗️ Architecture Overview

### Card Component Hierarchy

```
BaseCard (wrapper with modes)
├── CardHeader (icon, title, badges, actions)
├── CardStatsGrid (stat display)
├── CardSection (custom content area)
└── CardBadge (status indicators)
```

### Management Page Hierarchy

```
ManagementLayout (page wrapper)
├── Header (title, description, actions)
├── SearchAndSort (search input + sort dropdown)
├── FilterPanel (optional filters)
├── ViewToggle (table/card switcher)
├── BulkActionsBar (selection actions)
├── Content Area (cards or table)
└── PaginationControls (page navigation)
```

### Key Features to Support

**Card Modes:**
- `full`: Complete card with all details (grid view)
- `compact`: Minimal card for tight spaces (mobile)
- `list`: Table row format (desktop table view)

**Management Page Features:**
- Mobile detection (auto-switch to cards on < 768px)
- Search and filtering
- Sorting (configurable fields)
- Pagination (configurable page sizes)
- View toggle (table/card) - hidden on mobile
- Bulk selection and actions - hidden on mobile
- Empty states and loading states

**Modal Features:**
- Backdrop click to close
- Header with title and X button
- Cancel button in footer
- Loading states

---

## 📝 Session Notes

### Session 1 (2025-10-30) - Planning & Phase 1 Implementation
**Duration:** ~2 hours
**Participants:** User + Claude
**Token Usage:** Started at 42k, ended at ~110k/200k (55% used)

**Completed:**
- ✅ Analyzed existing Hunt, Stand, and Camera implementations
- ✅ Identified common patterns and differences
- ✅ Designed composable component architecture
- ✅ Created multi-session documentation structure
- ✅ Created UNIVERSAL_CARD_SYSTEM.md (master tracking)
- ✅ Created COMPONENT_SPECS.md (technical specs)
- ✅ Created MIGRATION_GUIDE.md (conversion guide)
- ✅ Created TESTING_CHECKLIST.md (QA checklist)
- ✅ **Implemented Phase 1 - Base Card Components:**
  - BaseCard.tsx (full, compact, list modes)
  - CardHeader.tsx (icon, title, badges, actions)
  - CardStatsGrid.tsx (grid and inline display)
  - CardSection.tsx (collapsible sections)
  - CardBadge.tsx (status indicators)
  - types.ts (TypeScript interfaces)
  - index.ts (barrel exports)
- ✅ **Created StandCardV2.tsx** (example using base components)
- ✅ **Created preview page** at `/management/stands-preview`
- ✅ **Code quality verified:** 0 lint errors, 0 type errors in new code

**Key Insights:**
- Hunt management is perfect - use as reference but don't touch
- Stand and Camera cards are similar but have no table view or pagination
- Mobile responsiveness is missing from Stands and Cameras
- Edit modals need backdrop click to close (minor enhancement)

**Decisions Made:**
- Use composition over inheritance
- Create new V2 files alongside originals
- Migrate Stands first, then Cameras
- Keep comprehensive documentation in git for multi-session work

**Blockers:** None

**Token Status at End:**
- Current: ~110k/200k (55% used)
- Remaining: ~90k tokens
- Status: ✅ Excellent progress, plenty of room

**Files Created This Session:**
- `src/components/shared/cards/` (5 components + types + index)
- `src/components/stands/StandCardV2.tsx`
- `src/app/management/stands-preview/page.tsx`
- All refactoring documentation

**Commits:**
- `7e88e4a` - Documentation
- `93f47b2` - Code quality requirements
- `c98d498` - Phase 1 base components

### Session 1 (Continued) - Iterative Refinement Based on User Feedback

**Round 3 Feedback Implementation - COMPLETED ✅**
**Duration:** ~30 minutes
**Token Usage:** ~47k/200k

**User Feedback (Round 3 - Full Mode specific):**
1. Combine Seats, Walk, Camera, etc. into teal-bordered features box
2. Remove ALL badges from Full Mode title
3. Streamline History section (reduce padding/spacing)
4. Change "Last Hunted" display from button-style to border-top style (like Hunt card "daily range")
5. Update action button colors to match Hunt Data cards
6. Add View action with Eye icon

**Completed:**
- ✅ Removed ALL badges from Full Mode (getBadges returns empty array for mode === 'full')
- ✅ Combined stats and features into single teal-bordered section (all stand details in one place)
- ✅ Streamlined History section with reduced padding (p-2, text-xs, smaller gaps)
- ✅ Changed "Last Hunted" to border-top style like Hunt card "daily range"
- ✅ Added View action with Eye icon to StandCardV2
- ✅ Updated CardHeader action button colors:
  - View: `text-dark-teal hover:text-dark-teal/80 hover:bg-dark-teal/10`
  - Edit: `text-olive-green hover:text-pine-needle hover:bg-olive-green/10`
  - Delete: `text-clay-earth hover:text-clay-earth/80 hover:bg-clay-earth/10`
- ✅ Code quality verified: 0 new lint/type errors in modified files
- ✅ Committed: `731a2a5` - Action button color updates

**Files Modified:**
- `src/components/stands/StandCardV2.tsx` - All Round 3 improvements
- `src/components/shared/cards/CardHeader.tsx` - Hunt-style action button colors

### Session 1 (Continued) - Round 4 Refinements

**Round 4 Feedback Implementation - COMPLETED ✅**
**Duration:** ~20 minutes
**Token Usage:** ~61k/200k

**User Feedback (Round 4 - Full Mode specific):**
1. View action not showing in title bar
2. Reorder features: Seats and Walk first (even if Walk unknown, show "[unknown]"), Camera last
3. GPS coordinates should be more subtle
4. Too much padding at bottom of card

**Completed:**
- ✅ Added onClick handler to preview page (View action now shows)
- ✅ Reordered features with specific priority:
  - Row 1: Seats (col 1), Walk (col 2) - Walk ALWAYS shows, displays "[unknown]" if no value
  - Row 2: Height, View distance
  - Row 3: Time of day, Water source
  - Row 4: Food source, Archery season
  - Last row: Camera (always last per user preference)
- ✅ Made GPS coordinates subtle:
  - Reduced to text-[10px] (from text-xs)
  - Changed to weathered-wood/60 opacity (was dark-teal)
  - Smaller MapPin icon (10px from 12px)
- ✅ Reduced bottom padding (mb-3 → mb-1 on History section)
- ✅ Removed unused CardSection import
- ✅ Code quality verified: 0 lint errors in modified files
- ✅ Committed: `5211365` - Layout and styling refinements

**Files Modified:**
- `src/components/stands/StandCardV2.tsx` - Feature ordering, GPS styling, padding
- `src/app/management/stands-preview/page.tsx` - Added onClick handler

### Session 1 (Continued) - Round 5: Flexible History Section

**Round 5 Implementation - COMPLETED ✅**
**Duration:** ~25 minutes
**Token Usage:** ~72k/200k

**User Feedback:**
- Revert GPS coordinates to previous styling (not subtle)
- Make History section flexible for different card types (Camera, Stand, etc.)
- History data should be dynamic and come from database
- Show current year dynamically (not hardcoded "[2025]")
- Include AM/PM time of day with last activity date

**Completed:**
- ✅ Reverted GPS coordinates to original styling (text-xs, dark-teal, 12px icon)
- ✅ Created flexible `HistoryStat` interface for any card type
- ✅ Created flexible `LastActivityInfo` interface with optional timeOfDay
- ✅ Added optional `historyStats` and `lastActivity` props to StandCardV2
- ✅ Default stand history now shows current year dynamically (e.g., "2025 Hunts")
- ✅ Grid columns adjust automatically based on number of stats
- ✅ Last activity shows date + optional AM/PM time
- ✅ Added TODO comments noting data should come from hunt_logs queries
- ✅ Structure allows Camera cards to pass different stats (Photos, Battery, etc.)
- ✅ Code quality verified: 0 lint errors
- ✅ Committed: `cbce850` - Flexible History section

**Architecture Benefits:**
This flexible design means:
- **Stand cards** can pass: Total Harvests, Season Hunts, All-Time Hunts
- **Camera cards** can pass: Photos Taken, Last Upload, Battery Status
- **Any card** can customize the history section without duplicating code

**Example Usage (for future Camera cards):**
```typescript
<CameraCardV2
  camera={camera}
  historyStats={[
    { label: 'Photos', value: 342, color: 'text-burnt-orange' },
    { label: 'Last Week', value: 28, color: 'text-muted-gold' },
    { label: 'Battery', value: '92%', color: 'text-olive-green' }
  ]}
  lastActivity={{
    date: '2025-10-29',
    timeOfDay: undefined,
    label: 'Last Upload'
  }}
/>
```

**Files Modified:**
- `src/components/stands/StandCardV2.tsx` - Flexible History interfaces and rendering

**Next Steps:**
- User should test preview to ensure current year shows correctly
- Future: Query hunt_logs table for true dynamic data (not just stand aggregates)

### Session 1 (Continued) - Round 6: Dynamic Hunt Data

**Round 6 Implementation - COMPLETED ✅**
**Duration:** ~30 minutes
**Token Usage:** ~88k/200k

**User Feedback:**
- Hunt Data Management shows "Sun, Oct 19 - AM" but Stand card doesn't
- Need to review Camera card's "History" section layout for compatibility

**Investigation:**
1. **Camera Card Layout**: Reviewed Camera cards - they have a "CAMERA REPORT DATA" section (not "History"). Layout:
   - Header: "CAMERA REPORT DATA" with freshness indicator
   - Grid (2-col): Season, Battery, Photos, Storage, Signal, Links, Queue
   - Bottom banner: Green bar with "Report Data From: X days ago"

2. **Stand vs Camera Sections**:
   - **Stands**: Features box (teal border) + History (3 stats + last hunted)
   - **Cameras**: Hardware info + Report Data (gray box with grid + timestamp banner)
   - These are DIFFERENT patterns - cameras won't use History section at all

3. **Hunt Data Issue**: Stand's `last_used_date` field doesn't include time of day. Need to query `hunt_logs` table for `hunt_type` ('AM'|'PM'|'All Day').

**Solution:**
- Updated preview page to demonstrate proper data fetching:
  - Query `hunt_logs` for most recent hunt per stand
  - Pass hunt data via `lastActivity` prop
  - Display: "Last Hunted: Sun, Oct 19 (AM)"

**Completed:**
- ✅ Analyzed Camera card Report Data section
- ✅ Confirmed flexible system accommodates both patterns
- ✅ Added hunt_logs query to preview page
- ✅ Pass dynamic hunt data (date + time of day) to StandCardV2
- ✅ Last Hunted now shows: "{Day}, {Date} ({AM/PM})"
- ✅ Code quality verified: 0 lint errors
- ✅ Committed: `ed6f7d7` - Dynamic hunt data demonstration

**Architecture Clarity:**
- **History section** is flexible but optional
- **Stands** use it for Harvests/Hunts stats
- **Cameras** will build their own Report Data section using same base patterns
- Both card types share: BaseCard, CardHeader, styling system
- Each composes sections differently based on domain needs

**Files Modified:**
- `src/app/management/stands-preview/page.tsx` - Query hunt_logs and pass to card

**How to Use in Other Components:**
```typescript
// 1. Query for last hunt
const { data: lastHunt } = await supabase
  .from('hunt_logs')
  .select('hunt_date, hunt_type')
  .eq('stand_id', standId)
  .order('hunt_date', { ascending: false })
  .limit(1)
  .single()

// 2. Pass to card
<StandCardV2
  stand={stand}
  lastActivity={lastHunt ? {
    date: lastHunt.hunt_date,
    timeOfDay: lastHunt.hunt_type,
    label: 'Last Hunted'
  } : undefined}
/>
```

### Session 1 (Continued) - Round 7: Accurate History Data

**Round 7 Implementation - COMPLETED ✅**
**Duration:** ~20 minutes
**Token Usage:** ~97k/200k

**User Feedback:**
- History data still doesn't look accurate

**Issue:**
The History section was still using aggregate fields stored on the `stands` table:
- `total_harvests` - might be stale
- `season_hunts` - might be stale
- `total_hunts` - might be stale

These are denormalized counts that may not reflect actual hunt_logs data.

**Solution:**
Query the `hunt_logs` table directly and calculate stats in real-time:
1. **Total Harvests**: Sum all `harvest_count` from hunt_logs for this stand
2. **Season Hunts**: Count hunt_logs where year = current year (2025)
3. **All-Time Hunts**: Count all hunt_logs for this stand

**Completed:**
- ✅ Updated preview page to query all hunt_logs for displayed stands
- ✅ Calculate Total Harvests by summing harvest_count field
- ✅ Calculate Season Hunts by filtering on current year
- ✅ Calculate All-Time Hunts by counting all entries
- ✅ Pass calculated stats to StandCardV2 via historyStats prop
- ✅ History section now shows accurate real-time data
- ✅ Code quality verified: 0 lint errors
- ✅ Committed: `9bdc314` - Dynamic history stats calculation

**Data Flow:**
```typescript
// 1. Query all hunts for stands
const hunts = await supabase
  .from('hunt_logs')
  .select('stand_id, hunt_date, harvest_count')
  .in('stand_id', standIds)

// 2. Calculate stats per stand
for (const hunt of hunts) {
  stats.allTimeHunts++
  stats.totalHarvests += hunt.harvest_count || 0

  const huntYear = new Date(hunt.hunt_date).getFullYear()
  if (huntYear === currentYear) {
    stats.seasonHunts++
  }
}

// 3. Pass to card
<StandCardV2
  historyStats={[
    { label: 'Total Harvests', value: stats.totalHarvests, color: 'text-burnt-orange' },
    { label: '2025 Hunts', value: stats.seasonHunts, color: 'text-muted-gold' },
    { label: 'All-Time Hunts', value: stats.allTimeHunts, color: 'text-olive-green' }
  ]}
/>
```

**Files Modified:**
- `src/app/management/stands-preview/page.tsx` - Calculate stats from hunt_logs

### Session 1 (Continued) - Round 8: Compact Mode Redesign

**Round 8 Implementation - COMPLETED ✅**
**Duration:** ~25 minutes
**Token Usage:** ~110k/200k

**User Feedback:**
- Prefer OLD compact layout with just title and feature icons below
- No action buttons in compact mode
- Clicking compact card should open modal with full details

**Analysis of Old Compact Mode:**
- Stand icon (orange) + Title (green) in header
- Feature icons displayed inline below title (just icons, no labels)
- Icons: time of day, water source, food source, archery season
- No badges, no action buttons
- Whole card clickable

**Solution:**
Created separate rendering for compact vs full mode:
- **Compact Mode**: Custom simple layout matching old design
- **Full Mode**: Uses CardHeader with all features

**Completed:**
- ✅ Analyzed old StandCard compact mode structure
- ✅ Created dedicated compact mode layout in StandCardV2
- ✅ Show stand icon + title with feature icons inline
- ✅ Icons only (no labels) for: time, water, food, archery
- ✅ Removed action buttons from compact mode
- ✅ Removed badges from compact mode
- ✅ Entire card clickable via onClick prop
- ✅ Full mode unchanged - still has complete details
- ✅ Code quality verified: 0 lint errors
- ✅ Committed: `831eb74` - Compact mode redesign

**Compact Mode Layout:**
```tsx
{mode === 'compact' && (
  <div className="flex items-start gap-3">
    {/* Stand Icon */}
    <StandIcon in colored box />

    {/* Title + Feature Icons */}
    <div>
      <h3>{stand.name}</h3>
      <div className="flex gap-2">
        {/* Just icons for: time, water, food, archery */}
      </div>
    </div>
  </div>
)}
```

**User Flow:**
1. Compact cards display in grid (mobile-friendly)
2. User clicks compact card → onClick fires
3. Parent component opens modal showing full details
4. Modal uses Full Mode card or custom detail view

**Files Modified:**
- `src/components/stands/StandCardV2.tsx` - Separate compact/full rendering

**Next Steps:**
- User should test compact mode at /management/stands-preview
- Implement modal for viewing full details when compact card clicked

### Session 1 (Continued) - Round 9: Detail Modal Integration

**Round 9 Implementation - COMPLETED ✅**
**Duration:** ~30 minutes
**Token Usage:** ~127k/200k

**User Feedback:**
- Want clicking stand card (compact or full) to open modal with details
- Modal should match Camera card behavior (Edit, Navigate buttons)
- Modal should show all stand information

**Analysis:**
Examined CameraDetailModal structure:
- **Backdrop overlay** (fixed inset-0 with opacity)
- **Header** (olive-green) with camera name, Edit/Navigate/Close buttons
- **Scrollable content** with gray section blocks
- **Grid layouts** for key-value pairs

**Solution:**
Created StandDetailModal following same pattern for consistency.

**Completed:**
- ✅ Created StandDetailModal component matching Camera modal
- ✅ Modal header with stand name, type, Edit/Navigate/Close buttons
- ✅ Sections: Description, Stand Details, Hunt History, Status
- ✅ Accepts dynamic historyStats and lastActivity props
- ✅ Updated preview page to open modal on card click
- ✅ Modal shows all stand information with accurate hunt data
- ✅ Edit button triggers callback (placeholder for edit form)
- ✅ Navigate button for GPS navigation (placeholder)
- ✅ Backdrop click to close
- ✅ Code quality verified: 0 lint errors
- ✅ Committed: `dd28c16` - Modal implementation

**StandDetailModal Structure:**
```tsx
<StandDetailModal
  stand={stand}
  onClose={() => setShowModal(false)}
  onEdit={(s) => openEditForm(s)}
  onNavigate={(s) => navigateToGPS(s)}
  historyStats={[...dynamic stats...]}
  lastActivity={{ date, timeOfDay, label }}
/>
```

**Modal Sections:**
1. **Header** (olive-green):
   - Stand icon + name + type
   - Edit button (opens edit form)
   - Navigate button (GPS navigation)
   - X close button

2. **Description** (if present):
   - Morning-mist background
   - Full stand description

3. **Stand Details** (gray-50 background):
   - Grid layout (2 columns on desktop)
   - Capacity, Walking Time, Height, View Distance
   - Time of Day, Water Source, Food Source, Archery
   - Trail Camera, GPS Coordinates, Access Notes

4. **Hunt History** (gray-50 background):
   - 3 large stats (Total Harvests, Season Hunts, All-Time Hunts)
   - Last Hunted date with time (e.g., "Oct 19 - AM")

5. **Status Badge** (centered):
   - Active/Inactive indicator

**User Flow:**
1. User clicks stand card (any mode: full, compact, list)
2. Modal opens with all details
3. User can Edit (opens form) or Navigate (GPS)
4. User closes modal via X button or backdrop click

**Files Modified:**
- `src/components/stands/StandDetailModal.tsx` (NEW) - Stand detail modal
- `src/app/management/stands-preview/page.tsx` - Added modal integration

**Universal Card System Pattern:**
This establishes the pattern for all card types:
- **Stand cards** → StandDetailModal
- **Camera cards** → CameraDetailModal (already exists)
- **Hunt cards** → HuntDetailModal (future)

Each modal follows same structure but shows domain-specific information.

### Session 1 (Continued) - Round 9b: Remove Navigate Button

**Round 9b Update - COMPLETED ✅**
**Duration:** ~5 minutes
**Token Usage:** ~130k/200k

**User Feedback:**
- Don't want Navigate button in modal - will never use it

**Completed:**
- ✅ Removed onNavigate prop from StandDetailModal interface
- ✅ Removed Navigate button from modal header
- ✅ Removed Navigation import from lucide-react
- ✅ Removed handleNavigateToStand from preview page
- ✅ Committed: Updates to modal and preview

**Files Modified:**
- `src/components/stands/StandDetailModal.tsx` - Removed Navigate button
- `src/app/management/stands-preview/page.tsx` - Removed Navigate handler

### Session 1 (Continued) - Round 10: List Mode Implementation

**Round 10 Implementation - COMPLETED ✅**
**Duration:** ~40 minutes
**Token Usage:** ~143k/200k → ~60k/200k (new session started)

**User Feedback:**
- Need List Mode (table view) for Stand Cards
- Keep each row to single line like Hunt log data
- Columns: Name (icon + name), Details (compact features), Last Hunted (date + AM/PM badge), Location (GPS), Actions (View/Edit/Delete)

**Analysis:**
Examined HuntCard list mode (lines 204-323) for pattern:
- Returns `<tr>` element directly (not wrapped in BaseCard)
- Single-line rows with hover effect
- Icon + text in columns
- Compact horizontal display of details
- Action buttons: dark-teal (view), olive-green (edit), clay-earth (delete)

**Completed:**
- ✅ Implemented Hunt-table-style List Mode in StandCardV2
- ✅ List mode returns `<tr>` directly with 5 columns:
  - **Name**: Small icon (16px) in colored circle + stand name
  - **Details**: Horizontal compact feature icons (capacity, walk, view, time, water, food, archery)
  - **Last Hunted**: Date + AM/PM badge (using getHuntTypeBadge utility)
  - **Location**: GPS coordinates with MapPin icon
  - **Actions**: View/Edit/Delete buttons matching Hunt table colors
- ✅ Updated preview page table headers to match new columns
- ✅ Pass dynamic lastActivity data to list mode
- ✅ AM/PM displayed as styled badges matching hunt list view
- ✅ Feature icons have tooltips for better UX
- ✅ GPS coordinates formatted to 4 decimal places
- ✅ Code quality verified: 0 lint errors in modified files
- ✅ Committed: `b610f1b` - List Mode implementation
- ✅ Committed: `644769a` - AM/PM format fix
- ✅ Committed: `0bf93b4` - AM/PM badge styling

**List Mode Structure:**
```tsx
if (mode === 'list') {
  return (
    <tr className="hover:bg-morning-mist transition-colors">
      <td>{/* Name: Icon + Stand name */}</td>
      <td>{/* Details: Compact horizontal icons */}</td>
      <td>{/* Last Hunted: Date + AM/PM badge */}</td>
      <td>{/* Location: GPS coords */}</td>
      <td>{/* Actions: View/Edit/Delete */}</td>
    </tr>
  )
}
```

**Badge Styling:**
- Imported `getHuntTypeBadge` from `@/lib/utils/date`
- AM/PM badges match hunt list view styling:
  - AM: bright-orange badge with border
  - PM: appropriate color from utility
  - Format: Date followed by colored badge

**Files Modified:**
- `src/components/stands/StandCardV2.tsx` - List mode implementation + badge styling
- `src/app/management/stands-preview/page.tsx` - Updated table headers and props

### Session 2 (Continued) - Additional Refinements & Architecture Discussion

**Session Continuation - 2025-10-31**
**Token Usage:** Starting ~83k/200k

This session continued with several refinements and an important architectural discussion.

#### Part 1: Prior Season Indicator (COMPLETED ✅)

**User Request:** Show "Prior season" label for stands last hunted in previous years

**Implementation:**
- Added `isPriorSeason()` helper function to check if hunt date year < current year
- Updated 3 display locations to show "Prior season (date)":
  - StandCardV2 List Mode - Last Hunted column
  - StandCardV2 Full Mode - History section
  - StandDetailModal - Hunt History section
- Visual styling: italic weathered-wood text for "Prior season", muted color for actual date
- Logic: Current season shows normal date + AM/PM badge, prior season shows indicator only

**Committed:** `83f1d37` - Prior season indicator feature

#### Part 2: Hunt Management Preview Page (COMPLETED ✅)

**User Request:** Create preview page showing Hunt cards built with composable card system

**Created Files:**
- `src/components/hunt-logging/HuntCardV2.tsx` - Hunt card using BaseCard + CardHeader
- `src/app/management/hunts-preview/page.tsx` - Side-by-side comparison page

**HuntCardV2 Features:**
- Uses BaseCard wrapper and CardHeader component
- Hunter name with User icon
- Badges: AM/PM, Harvests, Sightings (integrated in header)
- Stand information section
- Time section (start/end/duration) in teal bordered box
- Weather section (temp, wind, moon) in morning-mist box
- Hunt notes display
- Harvest indicator: orange left border

**Initial Issue:** Data loading failed - was querying `hunt_logs` table directly

**Fix:** Use `HuntService.getHunts()` which queries `hunt_logs_with_temperature` view with proper joins

**Committed:**
- `abad6ef` - Hunt preview page creation
- `81eba83` - Fix data loading with HuntService

**Preview URL:** http://localhost:3000/management/hunts-preview

#### Part 3: Icon Registry Compliance (COMPLETED ✅)

**Issue Discovered:** Both StandCardV2 and HuntCardV2 were importing icons directly from lucide-react instead of using centralized icon registry

**User Requirement:** All icons must use `getIcon()` from centralized registry

**Fixes:**
1. **Added missing icons to registry:**
   - `trophy` and `users` added to `src/lib/shared/icons/index.ts`
   - Added to `types.ts` IconName type
   - Added to HUNTING category

2. **StandCardV2 fixes:**
   - Removed direct imports of Eye, Edit3, Trash2, Users, MapPin
   - Replaced all usages with `getIcon()` calls
   - Used `React.createElement()` for JSX icon rendering in list mode
   - Fixed in: getActions(), getFeatures(), getStats(), list mode details, list mode actions

3. **HuntCardV2 fixes:**
   - Removed direct imports of Trophy, Binoculars, Eye, Edit3, Trash2, User, Clock, Thermometer, Wind, Moon
   - Replaced all usages with `getIcon()` calls throughout component

**Committed:**
- `1320928` - StandCardV2 icon registry compliance
- `4c369e6` - HuntCardV2 icon registry compliance

**All preview pages now work correctly with centralized icon registry**

#### Part 4: Architecture Reality Check & Discussion (CRITICAL)

**User Questions:**
1. Are icons using the registry? ✅ Fixed
2. Can we add list mode to Hunt preview? ⏸️ Deferred
3. **Does this much customization per component make this truly "universal"?** ⚠️

**Key Realization:**
Through implementation of StandCardV2 and HuntCardV2, we discovered:
- Each domain (Hunt/Stand/Camera) has **fundamentally different content structures**
- Card body content cannot be "configured" without extreme complexity
- List/table modes are completely different per domain
- Data fetching and processing is domain-specific

**Architectural Decision:**
- ✅ Renamed from "Universal Card System" to **"Composable Card System"**
- ✅ Honest assessment: This is **shared card primitives**, not a universal component
- ✅ Still valuable for: consistent headers, action buttons, design standards, icon registry

**What IS Shared:**
- BaseCard wrapper (modes, clickability, styling)
- **CardHeader** (biggest win - fully reusable)
- Design standards (colors, icons, spacing)
- Patterns and conventions

**What is NOT Shared:**
- Card body content (domain-specific layouts)
- List/table mode structures
- Data fetching and processing logic

**User Decision:** Accepted this reality and agreed to update documentation to reflect evolved understanding while preserving the journey of how we got here.

**Documentation Updated:** Added "Architecture Reality Check" section to main tracking document explaining original vision vs. reality, benefits, and honest assessment.

**Token Status:** ~126k/200k (63% used)

**Next Steps:**
- List mode for Hunt preview deferred (not critical given architectural understanding)
- Focus on applying composable system to Stands in production when ready
- Pattern is established for future domains

**Next Session Starts Here:**
🎯 **Status:** Composable card system architecture understood and documented. Preview pages complete for both Stands and Hunts.

**What's Ready:**
- ✅ StandCardV2 with 3 modes (full, compact, list)
- ✅ StandDetailModal
- ✅ HuntCardV2 with 2 modes (full, compact) - list mode not yet implemented
- ✅ Both preview pages functional
- ✅ All components use centralized icon registry
- ✅ Documentation reflects reality

**Preview URLs:**
- Stands: http://localhost:3000/management/stands-preview
- Hunts: http://localhost:3000/management/hunts-preview

**Instructions for User:**
1. Start dev server: `podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev`
2. Visit preview pages to see composable card system in action:
   - Stands: http://localhost:3000/management/stands-preview
   - Hunts: http://localhost:3000/management/hunts-preview
3. Try different modes (Full, Compact, List for stands)
4. Compare old vs new implementations
5. When ready, can begin migrating production Stand management to use StandCardV2
6. Camera cards can follow same pattern when needed

**Token Management for Next Session:**
- Monitor token count every ~10k tokens
- When you hit ~180k tokens:
  1. Stop current work at a logical point
  2. Update this document with progress
  3. Commit all work
  4. Add clear "stopped at" notes
  5. Tell user to start a new session

**Context for Next Session:**
- Read this document first to understand current status
- Reference COMPONENT_SPECS.md for detailed API specs
- Start with BaseCard.tsx - it's the foundation for everything
- Use HuntCard.tsx (lines 204-323) as reference for list mode
- Follow hunting club design system colors from CLAUDE.md

---

## 🔗 Related Documentation

- **[COMPONENT_SPECS.md](./COMPONENT_SPECS.md)** - Detailed component APIs and TypeScript interfaces
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - How to convert existing code to new system
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing requirements and QA checklist
- **[CLAUDE.md](../../CLAUDE.md)** - Main project documentation with design system
- **[DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)** - Complete design specifications

---

## ⚠️ Important Reminders

1. **Never modify Hunt management files** - they're working perfectly
2. **Always create backups** before changing existing files
3. **Test mobile first** - responsive design is critical
4. **Update this document** at the end of each session
5. **Document decisions** in the decisions log above
6. **Commit frequently** with clear messages
7. **Reference hunting club colors** from DESIGN_SYSTEM.md
8. **Code Quality:**
   - All code must pass ESLint with zero errors (`npm run lint`)
   - Run type-check before committing (`npm run type-check`)
   - Follow React/TypeScript best practices
   - Use `npm run build:safe` before major commits
9. **Token Management:**
   - Monitor token usage during each session
   - When approaching 180k/200k tokens, wrap up the session
   - Update this document with stopping point
   - Create clear "Next Session" instructions
10. **Branch Strategy:**
    - All development work happens in `main` branch
    - Documentation commits stay in `main` (do NOT push to `production`)
    - Only user-facing features get merged to `production`
    - This refactoring documentation is for developers only

---

## 📞 Troubleshooting & Common Issues

### If a new Claude session seems lost:
1. Read this document top to bottom
2. Check the "Next Session Starts Here" pointer
3. Review the last session notes
4. Read COMPONENT_SPECS.md for technical details

### If unsure what to work on:
1. Check the current phase progress checkboxes
2. Look for the first unchecked item
3. Reference the "Next Session Starts Here" section

### If you need to understand existing code:
1. Hunt management: Reference only, don't modify
2. Stand management: In `src/app/management/stands/page.tsx`
3. Camera management: In `src/app/management/cameras/page.tsx`

---

**End of Document** - Last updated: 2025-10-30
