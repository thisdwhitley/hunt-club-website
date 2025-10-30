# Universal Card System Refactoring

**Status:** 🚧 In Progress - Phase 1: COMPLETE ✅
**Started:** 2025-10-30
**Last Updated:** 2025-10-30
**Current Phase:** Phase 2 - Stand Management V2 (Ready to Start)

---

## 🎯 Quick Context for New Sessions

This project creates a **universal card system** for the hunting club website to standardize the display of Hunts, Stands, and Cameras. Currently, each feature has its own card implementation with duplicated code. We're building **composable base components** that can be reused across all three domains while preserving domain-specific logic.

**Critical Constraint:** The Hunt Data Management system (`HuntDataManagement.tsx`, `HuntCard.tsx`) is working perfectly and must **NOT be modified**. We'll create new components in parallel and apply them to Stands first, then Cameras.

**Strategy:** Create new V2 components alongside existing code, test thoroughly, then migrate. Keep backups of all original files.

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

**Next Session Starts Here:**
🎯 **User Review Phase:** Test the preview page at http://localhost:3000/management/stands-preview

**Instructions for User:**
1. Start dev server: `podman run -it --rm --name hunt-club-dev -p 3000:3000 -v $(pwd):/app:Z -v /app/node_modules --env-file .env.local hunt-club-dev`
2. Visit: http://localhost:3000/management/stands-preview
3. Try all three modes: Full, Compact, List (table)
4. Compare old (left) vs new (right)
5. Test with your actual Stand data
6. Provide feedback before we proceed to Phase 2

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
