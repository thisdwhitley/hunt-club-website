# Migration Guide

This guide explains how to convert existing card and management page implementations to use the Universal Card System.

**Last Updated:** 2025-10-30

---

## Table of Contents

1. [Overview](#overview)
2. [Before You Start](#before-you-start)
3. [Migrating Card Components](#migrating-card-components)
4. [Migrating Management Pages](#migrating-management-pages)
5. [Common Patterns](#common-patterns)
6. [Testing Your Migration](#testing-your-migration)
7. [Rollback Plan](#rollback-plan)

---

## Overview

The migration strategy is designed to be **safe and incremental**:

- ✅ Create new V2 components alongside existing ones
- ✅ Test V2 components thoroughly
- ✅ Switch routes to use V2 components
- ✅ Keep old components as backup
- ✅ Only delete old code after V2 is proven stable

**Order of Migration:**
1. **Stands** (simplest, lowest risk)
2. **Cameras** (similar to stands)
3. **Hunts** (SKIP - already perfect, use as reference only)

---

## Before You Start

### Prerequisites

1. **Read the documentation:**
   - UNIVERSAL_CARD_SYSTEM.md (master plan)
   - COMPONENT_SPECS.md (API details)
   - TESTING_CHECKLIST.md (QA requirements)

2. **Ensure base components exist:**
   - All files in `src/components/shared/cards/`
   - All files in `src/components/shared/management/`

3. **Create a backup branch:**
   ```bash
   git checkout -b backup/pre-migration-$(date +%Y%m%d)
   git push origin backup/pre-migration-$(date +%Y%m%d)
   ```

4. **Test existing functionality:**
   - Verify current implementation works
   - Take screenshots for comparison
   - Document any known issues

5. **Verify development environment:**
   ```bash
   npm run lint          # Should pass with 0 errors
   npm run type-check    # Should pass with 0 errors
   npm run build         # Should build successfully
   ```

---

## Migrating Card Components

### Example: Converting StandCard to StandCardV2

**Original Structure:**
```typescript
// src/components/stands/StandCard.tsx (EXISTING)
export default function StandCard({ stand, mode, onClick, onEdit, onDelete }) {
  // 600+ lines of custom layout code
  // Manual styling
  // Custom header rendering
  // Custom stats display
  // etc.
}
```

**New Structure:**
```typescript
// src/components/stands/StandCardV2.tsx (NEW)
import { BaseCard, CardHeader, CardStatsGrid, CardSection } from '@/components/shared/cards'

export default function StandCardV2({ stand, mode, onClick, onEdit, onDelete }) {
  // Use composable components
  // ~200 lines of domain logic only
}
```

### Step-by-Step Conversion

#### Step 1: Create the new file

```bash
# Don't modify the original!
touch src/components/stands/StandCardV2.tsx
```

#### Step 2: Import base components

```typescript
import React from 'react'
import { BaseCard, CardHeader, CardStatsGrid, CardSection, CardBadge } from '@/components/shared/cards'
import { getIcon } from '@/lib/shared/icons'
import type { Stand } from '@/lib/database/stands'
```

#### Step 3: Convert props interface

```typescript
// Keep the same props interface for easy swapping
interface StandCardV2Props {
  stand: Stand
  mode?: 'full' | 'compact' | 'list'
  onClick?: (stand: Stand) => void
  onEdit?: (stand: Stand) => void
  onDelete?: (stand: Stand) => void
  showLocation?: boolean
  showStats?: boolean
  showActions?: boolean
  className?: string
}
```

#### Step 4: Use BaseCard wrapper

```typescript
export default function StandCardV2({
  stand,
  mode = 'full',
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}: StandCardV2Props) {
  return (
    <BaseCard
      mode={mode}
      onClick={onClick ? () => onClick(stand) : undefined}
      clickable={!!onClick}
      className={className}
    >
      {/* Content here */}
    </BaseCard>
  )
}
```

#### Step 5: Use CardHeader

**Before (custom header):**
```typescript
<div className="flex items-start justify-between mb-3">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
      <StandIcon size={24} style={{ color }} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-olive-green">{stand.name}</h3>
    </div>
  </div>
  {showActions && (
    <div className="flex gap-1">
      <button onClick={onEdit}><Edit3 /></button>
      <button onClick={onDelete}><Trash2 /></button>
    </div>
  )}
</div>
```

**After (using CardHeader):**
```typescript
<CardHeader
  icon={getIcon(getStandIcon(stand.type))}
  iconColor="#FA7921"
  iconBgColor="#FA792120"
  title={stand.name}
  subtitle={stand.type.replace('_', ' ')}
  badges={getBadges(stand)}
  actions={showActions ? [
    { icon: Edit3, onClick: () => onEdit?.(stand), label: 'Edit stand', variant: 'edit' },
    { icon: Trash2, onClick: () => onDelete?.(stand), label: 'Delete stand', variant: 'delete' }
  ] : []}
/>
```

#### Step 6: Use CardStatsGrid

**Before (custom stats):**
```typescript
<div className="grid grid-cols-2 gap-2 text-xs">
  <div className="flex items-center gap-2">
    <Users size={14} style={{ color: '#566E3D' }} />
    <span><strong>Capacity:</strong> {stand.capacity}</span>
  </div>
  <div className="flex items-center gap-2">
    <Eye size={14} style={{ color: '#566E3D' }} />
    <span><strong>View:</strong> {stand.view_distance_yards} yards</span>
  </div>
</div>
```

**After (using CardStatsGrid):**
```typescript
<CardStatsGrid
  stats={[
    { icon: Users, iconColor: '#566E3D', label: 'Capacity', value: stand.capacity },
    { icon: Eye, iconColor: '#0C4767', label: 'View', value: stand.view_distance_yards, unit: 'yards' }
  ]}
  columns={2}
  size="md"
/>
```

#### Step 7: Use CardSection for custom content

```typescript
<CardSection
  title="History"
  titleIcon={Trophy}
  background="mist"
  bordered
>
  <div className="grid grid-cols-3 gap-2 text-center text-xs">
    <div>
      <div className="text-lg font-bold text-burnt-orange">{stand.total_harvests || 0}</div>
      <div className="text-forest-shadow">Harvests</div>
    </div>
    {/* More custom content */}
  </div>
</CardSection>
```

#### Step 8: Handle list mode

```typescript
// List mode renders differently
if (mode === 'list') {
  return (
    <BaseCard mode="list" isSelected={isSelected} onSelect={onSelect}>
      <td className="px-4 py-3">
        <CardHeader
          icon={getIcon(getStandIcon(stand.type))}
          title={stand.name}
          badges={getBadges(stand)}
          compact
        />
      </td>
      <td className="px-4 py-3">
        <CardStatsGrid stats={getStats(stand)} inline size="sm" />
      </td>
      <td className="px-4 py-3 text-right">
        {/* Actions */}
      </td>
    </BaseCard>
  )
}
```

---

## Migrating Management Pages

### Example: Converting Stand Management to StandManagementV2

#### Step 1: Create the new file

```bash
touch src/components/stands/StandManagementV2.tsx
```

#### Step 2: Import shared components

```typescript
import React, { useState, useEffect } from 'react'
import {
  ManagementLayout,
  SearchAndSort,
  FilterPanel,
  PaginationControls,
  ViewToggle,
  BulkActionsBar
} from '@/components/shared/management'
import StandCardV2 from './StandCardV2'
```

#### Step 3: Add mobile detection

```typescript
const [isMobile, setIsMobile] = useState(false)
const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

useEffect(() => {
  const checkMobile = () => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    if (mobile) {
      setViewMode('cards')
    }
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])
```

#### Step 4: Use ManagementLayout

**Before:**
```typescript
<div className="min-h-screen bg-morning-mist">
  <div className="bg-olive-green text-white">
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1>Stand Management</h1>
      <p>Manage your hunting stands</p>
      <button onClick={handleCreate}>Add Stand</button>
    </div>
  </div>
  {/* Content */}
</div>
```

**After:**
```typescript
<ManagementLayout
  title="Stand Management"
  description="Manage your hunting stands across the property"
  icon={Target}
  actions={[
    { label: 'Add Stand', icon: Plus, onClick: handleCreate, variant: 'primary' }
  ]}
>
  {/* Content */}
</ManagementLayout>
```

#### Step 5: Use SearchAndSort

```typescript
<SearchAndSort
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="Search stands by name, trail..."
  sortValue={sortField}
  sortOptions={[
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'last_used', label: 'Last Used' }
  ]}
  onSortChange={setSortField}
  sortDirection={sortDirection}
  onDirectionChange={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
/>
```

#### Step 6: Add ViewToggle

```typescript
{!isMobile && (
  <ViewToggle
    view={viewMode}
    onChange={setViewMode}
  />
)}
```

#### Step 7: Add PaginationControls

```typescript
<PaginationControls
  currentPage={currentPage}
  totalPages={Math.ceil(filteredStands.length / itemsPerPage)}
  itemsPerPage={itemsPerPage}
  totalItems={filteredStands.length}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={setItemsPerPage}
  pageSizeOptions={[10, 25, 50, 100]}
  showFirstLast={!isMobile}
  isMobile={isMobile}
/>
```

#### Step 8: Render cards or table

```typescript
{viewMode === 'cards' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {paginatedStands.map(stand => (
      <StandCardV2
        key={stand.id}
        stand={stand}
        mode={isMobile ? 'compact' : 'full'}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClick={handleView}
        showActions={true}
      />
    ))}
  </div>
) : (
  <table className="min-w-full bg-white">
    <thead className="bg-morning-mist">
      <tr>
        <th>Stand</th>
        <th>Location</th>
        <th>Stats</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {paginatedStands.map(stand => (
        <StandCardV2
          key={stand.id}
          stand={stand}
          mode="list"
          onEdit={handleEdit}
          onDelete={handleDelete}
          showActions={true}
        />
      ))}
    </tbody>
  </table>
)}
```

---

## Common Patterns

### Pattern 1: Domain-Specific Badge Logic

```typescript
// Keep domain logic in your card component
const getBadges = (stand: Stand) => {
  const badges = []

  if (stand.time_of_day) {
    badges.push({
      label: stand.time_of_day,
      className: 'bg-bright-orange text-white'
    })
  }

  if (stand.total_harvests > 0) {
    badges.push({
      label: `${stand.total_harvests} Harvests`,
      className: 'bg-olive-green/10 text-olive-green',
      icon: Trophy
    })
  }

  return badges
}

// Use in CardHeader
<CardHeader badges={getBadges(stand)} />
```

### Pattern 2: Conditional Stats Display

```typescript
const getStats = (stand: Stand) => {
  const stats = []

  if (stand.capacity) {
    stats.push({
      icon: Users,
      iconColor: '#566E3D',
      label: 'Capacity',
      value: stand.capacity
    })
  }

  if (stand.view_distance_yards) {
    stats.push({
      icon: Eye,
      iconColor: '#0C4767',
      label: 'View',
      value: stand.view_distance_yards,
      unit: 'yards'
    })
  }

  return stats
}

<CardStatsGrid stats={getStats(stand)} columns={2} />
```

### Pattern 3: Mode-Specific Rendering

```typescript
// Full and compact modes
if (mode === 'full' || mode === 'compact') {
  return (
    <BaseCard mode={mode} onClick={onClick}>
      <CardHeader {...headerProps} />
      {mode === 'full' && <CardStatsGrid stats={stats} />}
      {mode === 'full' && <CardSection>Custom content</CardSection>}
    </BaseCard>
  )
}

// List mode (table row)
if (mode === 'list') {
  return (
    <BaseCard mode="list">
      <td><CardHeader {...headerProps} compact /></td>
      <td><CardStatsGrid stats={stats} inline /></td>
      <td>Actions</td>
    </BaseCard>
  )
}
```

---

## Testing Your Migration

After converting to V2 components, test thoroughly:

### 1. Visual Comparison Test

```bash
# Run both versions side by side
# Old: /management/stands
# New: /management/stands-v2 (temporary route)
```

Take screenshots and compare:
- Desktop: Table view
- Desktop: Card view
- Tablet: Card view
- Mobile: Compact card view

### 2. Functional Testing

Use the TESTING_CHECKLIST.md to verify:
- ✅ Search works
- ✅ Filters work
- ✅ Sorting works
- ✅ Pagination works
- ✅ Edit modal works
- ✅ Delete works
- ✅ Mobile responsive
- ✅ Accessibility

### 3. Performance Testing

```typescript
// Check render performance
console.time('Card render')
// Render 100 cards
console.timeEnd('Card render')
```

### 4. Cross-Browser Testing

Test in:
- Chrome
- Firefox
- Safari (mobile and desktop)
- Edge

---

## Rollback Plan

If something goes wrong, you can quickly rollback:

### Option 1: Git Revert

```bash
# Revert to backup branch
git checkout backup/pre-migration-$(date +%Y%m%d)
```

### Option 2: Route Swap

```typescript
// In src/app/management/stands/page.tsx
// Just change the import back
import StandManagement from '@/components/stands/StandManagement' // Old
// import StandManagement from '@/components/stands/StandManagementV2' // New
```

### Option 3: Feature Flag

```typescript
// Use environment variable for gradual rollout
const useV2 = process.env.NEXT_PUBLIC_USE_V2_STANDS === 'true'

export default function StandsPage() {
  return useV2 ? <StandManagementV2 /> : <StandManagement />
}
```

---

## Migration Checklist

Use this checklist for each feature migration:

### Pre-Migration
- [ ] Read all documentation
- [ ] Create backup branch
- [ ] Test existing functionality
- [ ] Take screenshots

### During Migration
- [ ] Create V2 files (don't modify originals)
- [ ] Convert card component
- [ ] Convert management page
- [ ] Add mobile detection
- [ ] Add pagination
- [ ] Add table/list view
- [ ] Test incrementally
- [ ] **Code Quality Checks (after each component):**
  - [ ] Run `npm run lint` - must pass with 0 errors
  - [ ] Run `npm run type-check` - must pass with 0 errors
  - [ ] Run `npm run build` - must build successfully
  - [ ] No console warnings or errors
  - [ ] Follow React/TypeScript best practices

### Post-Migration
- [ ] Complete TESTING_CHECKLIST.md
- [ ] Compare screenshots
- [ ] Test on mobile device
- [ ] **Final Code Quality:**
  - [ ] Run `npm run build:safe` (lint + type-check + build)
  - [ ] All checks pass
  - [ ] No regressions in existing features
- [ ] Get user approval
- [ ] Switch routes
- [ ] Monitor for issues
- [ ] Keep old files for 1 week
- [ ] Delete old files after stable

---

**End of Document** - Last updated: 2025-10-30
