# Component Specifications

This document provides detailed technical specifications for all components in the Universal Card System.

---

## Table of Contents

1. [Card Components](#card-components)
   - [BaseCard](#basecard)
   - [CardHeader](#cardheader)
   - [CardStatsGrid](#cardstatsgrid)
   - [CardSection](#cardsection)
   - [CardBadge](#cardbadge)
2. [Management Page Components](#management-page-components)
   - [ManagementLayout](#managementlayout)
   - [SearchAndSort](#searchandsort)
   - [FilterPanel](#filterpanel)
   - [PaginationControls](#paginationcontrols)
   - [ViewToggle](#viewtoggle)
   - [BulkActionsBar](#bulkactionsbar)
3. [TypeScript Types](#typescript-types)
4. [Design Tokens](#design-tokens)

---

## Card Components

### BaseCard

**Purpose:** Wrapper component that provides consistent styling and mode support for all card types.

**File:** `src/components/shared/cards/BaseCard.tsx`

#### Props Interface

```typescript
interface BaseCardProps {
  // Display mode
  mode?: 'full' | 'compact' | 'list'

  // Interaction
  onClick?: () => void
  clickable?: boolean

  // Selection state
  isSelected?: boolean
  onSelect?: () => void
  showCheckbox?: boolean

  // Styling
  className?: string
  highlighted?: boolean
  highlightColor?: string

  // Children
  children: React.ReactNode

  // Accessibility
  ariaLabel?: string
  role?: string
}
```

#### Mode Behaviors

**Full Mode (default):**
- Width: 100% of grid cell (min 320px)
- Padding: 16px
- All content visible
- Hover shadow: `club-shadow-lg`
- Border: `border-2 border-gray-200`

**Compact Mode:**
- Width: 100% (min 240px)
- Padding: 12px
- Condensed content
- Smaller font sizes
- Minimal spacing

**List Mode:**
- Renders as table row `<tr>`
- Padding: 12px 16px
- Horizontal layout
- Fixed heights
- Hover background: `bg-morning-mist`

#### Example Usage

```typescript
import { BaseCard } from '@/components/shared/cards'

// Full mode card
<BaseCard mode="full" onClick={() => handleClick(item)}>
  <CardHeader {...headerProps} />
  <CardStatsGrid stats={stats} />
</BaseCard>

// List mode (table row)
<BaseCard mode="list" isSelected={selected} onSelect={toggleSelect}>
  <CardHeader {...headerProps} compact />
  <CardStatsGrid stats={stats} inline />
</BaseCard>
```

#### Styling Classes

```typescript
const cardStyles = {
  full: 'bg-white rounded-lg border-2 border-gray-200 p-4 hover:shadow-lg transition-shadow club-shadow',
  compact: 'bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow',
  list: 'hover:bg-morning-mist transition-colors border-b border-gray-200'
}
```

---

### CardHeader

**Purpose:** Displays icon, title, badges, and action buttons consistently.

**File:** `src/components/shared/cards/CardHeader.tsx`

#### Props Interface

```typescript
interface CardHeaderProps {
  // Icon (left side)
  icon?: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  iconBgColor?: string
  iconSize?: number

  // Title
  title: string
  subtitle?: string

  // Badges (inline with title)
  badges?: Array<{
    label: string
    className?: string
    color?: string
    icon?: React.ComponentType
  }>

  // Actions (right side)
  actions?: Array<{
    icon: React.ComponentType
    onClick: (e: React.MouseEvent) => void
    label: string // For aria-label
    variant?: 'edit' | 'delete' | 'view' | 'navigate'
    disabled?: boolean
  }>

  // Layout
  compact?: boolean
  showActions?: boolean

  // Selection
  showCheckbox?: boolean
  isSelected?: boolean
  onSelect?: () => void
}
```

#### Example Usage

```typescript
import { CardHeader } from '@/components/shared/cards'
import { Target, Edit, Trash2 } from 'lucide-react'

<CardHeader
  icon={Target}
  iconColor="#FA7921"
  iconBgColor="#FA792120"
  title="North Ridge Stand"
  subtitle="Ladder Stand"
  badges={[
    { label: 'AM', className: 'bg-bright-orange text-white' },
    { label: '5 Harvests', className: 'bg-olive-green/10 text-olive-green' }
  ]}
  actions={[
    { icon: Edit, onClick: handleEdit, label: 'Edit stand', variant: 'edit' },
    { icon: Trash2, onClick: handleDelete, label: 'Delete stand', variant: 'delete' }
  ]}
/>
```

#### Layout Variants

**Full/Compact Mode:**
```
┌─────────────────────────────────────────────┐
│ [Icon] Title + Badges       [Actions] │
│        Subtitle                               │
└─────────────────────────────────────────────┘
```

**List Mode:**
```
[Checkbox] [Icon] Title + Badges | Field 2 | Field 3 | [Actions]
```

---

### CardStatsGrid

**Purpose:** Display statistics in a consistent grid layout.

**File:** `src/components/shared/cards/CardStatsGrid.tsx`

#### Props Interface

```typescript
interface Stat {
  icon?: React.ComponentType
  iconColor?: string
  label: string
  value: string | number
  unit?: string
  highlighted?: boolean
  tooltip?: string
}

interface CardStatsGridProps {
  stats: Stat[]
  columns?: 2 | 3 | 4
  inline?: boolean // For list mode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

#### Example Usage

```typescript
import { CardStatsGrid } from '@/components/shared/cards'
import { Users, Eye, Thermometer } from 'lucide-react'

const stats = [
  { icon: Users, iconColor: '#566E3D', label: 'Capacity', value: 2 },
  { icon: Eye, iconColor: '#0C4767', label: 'View', value: '100 yards' },
  { icon: Thermometer, iconColor: '#FA7921', label: 'Temp', value: 45, unit: '°F', highlighted: true }
]

<CardStatsGrid stats={stats} columns={2} size="md" />
```

#### Layout

**Grid Mode (full/compact):**
```
┌──────────────┬──────────────┐
│ [Icon] Label │ [Icon] Label │
│ Value Unit   │ Value Unit   │
├──────────────┼──────────────┤
│ [Icon] Label │ [Icon] Label │
│ Value Unit   │ Value Unit   │
└──────────────┴──────────────┘
```

**Inline Mode (list):**
```
[Icon] Value Unit | [Icon] Value Unit | [Icon] Value Unit
```

---

### CardSection

**Purpose:** Generic content wrapper for custom sections within cards.

**File:** `src/components/shared/cards/CardSection.tsx`

#### Props Interface

```typescript
interface CardSectionProps {
  title?: string
  titleIcon?: React.ComponentType
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  bordered?: boolean
  background?: 'white' | 'mist' | 'green' | 'orange'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}
```

#### Example Usage

```typescript
import { CardSection } from '@/components/shared/cards'
import { Trophy } from 'lucide-react'

<CardSection
  title="Harvest Details"
  titleIcon={Trophy}
  background="orange"
  bordered
  padding="md"
>
  <p>Custom content here...</p>
</CardSection>
```

---

### CardBadge

**Purpose:** Consistent badge/pill styling for status indicators.

**File:** `src/components/shared/cards/CardBadge.tsx`

#### Props Interface

```typescript
interface CardBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'custom'
  color?: string // For custom variant
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType
  className?: string
  onClick?: () => void
}
```

#### Variants

```typescript
const badgeVariants = {
  success: 'bg-bright-orange/10 text-bright-orange border-bright-orange/20',
  warning: 'bg-muted-gold/10 text-muted-gold border-muted-gold/20',
  error: 'bg-clay-earth/10 text-clay-earth border-clay-earth/20',
  info: 'bg-dark-teal/10 text-dark-teal border-dark-teal/20',
  neutral: 'bg-weathered-wood/10 text-weathered-wood border-weathered-wood/20'
}
```

#### Example Usage

```typescript
import { CardBadge } from '@/components/shared/cards'
import { Trophy } from 'lucide-react'

<CardBadge label="Harvest" variant="success" icon={Trophy} size="sm" />
<CardBadge label="Warning" variant="warning" />
<CardBadge label="5 Harvests" variant="custom" color="#FA7921" />
```

---

## Management Page Components

### ManagementLayout

**Purpose:** Consistent page wrapper for all management pages.

**File:** `src/components/shared/management/ManagementLayout.tsx`

#### Props Interface

```typescript
interface ManagementLayoutProps {
  // Header
  title: string
  description?: string
  icon?: React.ComponentType

  // Actions (top right)
  actions?: Array<{
    label: string
    icon: React.ComponentType
    onClick: () => void
    variant?: 'primary' | 'secondary'
    disabled?: boolean
  }>

  // Content
  children: React.ReactNode

  // Options
  showBackButton?: boolean
  onBack?: () => void

  // Styling
  headerColor?: string
  className?: string
}
```

#### Example Usage

```typescript
import { ManagementLayout } from '@/components/shared/management'
import { Camera, Plus, Upload } from 'lucide-react'

<ManagementLayout
  title="Trail Camera Management"
  description="Monitor and manage all trail cameras across the property"
  icon={Camera}
  actions={[
    { label: 'Import GPX', icon: Upload, onClick: handleImport, variant: 'secondary' },
    { label: 'Add Camera', icon: Plus, onClick: handleAdd, variant: 'primary' }
  ]}
>
  {/* Page content */}
</ManagementLayout>
```

---

### SearchAndSort

**Purpose:** Combined search input and sort controls.

**File:** `src/components/shared/management/SearchAndSort.tsx`

#### Props Interface

```typescript
interface SortOption {
  value: string
  label: string
}

interface SearchAndSortProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  // Sort
  sortValue: string
  sortOptions: SortOption[]
  onSortChange: (value: string) => void
  sortDirection: 'asc' | 'desc'
  onDirectionChange: () => void

  // Display
  hideSort?: boolean
  className?: string
}
```

#### Example Usage

```typescript
import { SearchAndSort } from '@/components/shared/management'

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
  { value: 'status', label: 'Status' }
]

<SearchAndSort
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search stands by name, trail..."
  sortValue={sortField}
  sortOptions={sortOptions}
  onSortChange={setSortField}
  sortDirection={sortDir}
  onDirectionChange={toggleDirection}
/>
```

---

### FilterPanel

**Purpose:** Collapsible filter sidebar.

**File:** `src/components/shared/management/FilterPanel.tsx`

#### Props Interface

```typescript
interface FilterGroup {
  label: string
  key: string
  type: 'select' | 'multi-select' | 'checkbox' | 'radio' | 'range'
  options?: Array<{ value: string; label: string }>
  value: any
  onChange: (value: any) => void
}

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filterGroups: FilterGroup[]
  onClearAll: () => void
  hasActiveFilters: boolean
  className?: string
}
```

#### Example Usage

```typescript
import { FilterPanel } from '@/components/shared/management'

const filterGroups = [
  {
    label: 'Status',
    key: 'status',
    type: 'select',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    value: filters.status,
    onChange: (val) => updateFilter('status', val)
  }
]

<FilterPanel
  isOpen={showFilters}
  onClose={() => setShowFilters(false)}
  filterGroups={filterGroups}
  onClearAll={clearFilters}
  hasActiveFilters={hasFilters}
/>
```

---

### PaginationControls

**Purpose:** Page navigation component.

**File:** `src/components/shared/management/PaginationControls.tsx`

#### Props Interface

```typescript
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void

  // Options
  pageSizeOptions?: number[] // Default: [10, 25, 50, 100]
  showFirstLast?: boolean // Show first/last page buttons
  isMobile?: boolean // Simplified mobile view

  className?: string
}
```

#### Example Usage

```typescript
import { PaginationControls } from '@/components/shared/management'

<PaginationControls
  currentPage={page}
  totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
  itemsPerPage={itemsPerPage}
  totalItems={filteredItems.length}
  onPageChange={setPage}
  onItemsPerPageChange={setItemsPerPage}
  pageSizeOptions={[10, 25, 50, 100]}
  showFirstLast={!isMobile}
  isMobile={isMobile}
/>
```

---

### ViewToggle

**Purpose:** Switch between table and card views.

**File:** `src/components/shared/management/ViewToggle.tsx`

#### Props Interface

```typescript
interface ViewToggleProps {
  view: 'table' | 'cards'
  onChange: (view: 'table' | 'cards') => void
  disabled?: boolean
  className?: string
}
```

#### Example Usage

```typescript
import { ViewToggle } from '@/components/shared/management'

<ViewToggle
  view={viewMode}
  onChange={setViewMode}
  disabled={isMobile}
/>
```

---

### BulkActionsBar

**Purpose:** Display bulk selection actions.

**File:** `src/components/shared/management/BulkActionsBar.tsx`

#### Props Interface

```typescript
interface BulkAction {
  label: string
  icon: React.ComponentType
  onClick: () => void
  variant?: 'danger' | 'primary' | 'secondary'
  requiresConfirmation?: boolean
}

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onClear: () => void
  onSelectAll: () => void
  actions: BulkAction[]
  isVisible: boolean
  className?: string
}
```

#### Example Usage

```typescript
import { BulkActionsBar } from '@/components/shared/management'
import { Trash2, Archive } from 'lucide-react'

<BulkActionsBar
  selectedCount={selectedIds.size}
  totalCount={items.length}
  onClear={clearSelection}
  onSelectAll={selectAll}
  actions={[
    {
      label: 'Delete Selected',
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: 'danger',
      requiresConfirmation: true
    },
    {
      label: 'Archive Selected',
      icon: Archive,
      onClick: handleBulkArchive,
      variant: 'secondary'
    }
  ]}
  isVisible={selectedIds.size > 0 && !isMobile}
/>
```

---

## TypeScript Types

### Shared Card Types

```typescript
// src/components/shared/cards/types.ts

export type CardMode = 'full' | 'compact' | 'list'

export interface BaseCardProps {
  mode?: CardMode
  onClick?: () => void
  clickable?: boolean
  isSelected?: boolean
  onSelect?: () => void
  showCheckbox?: boolean
  className?: string
  highlighted?: boolean
  highlightColor?: string
  children: React.ReactNode
  ariaLabel?: string
  role?: string
}

export interface Action {
  icon: React.ComponentType<{ size?: number; className?: string }>
  onClick: (e: React.MouseEvent) => void
  label: string
  variant?: 'edit' | 'delete' | 'view' | 'navigate'
  disabled?: boolean
}

export interface Badge {
  label: string
  className?: string
  color?: string
  icon?: React.ComponentType
}

export interface Stat {
  icon?: React.ComponentType
  iconColor?: string
  label: string
  value: string | number
  unit?: string
  highlighted?: boolean
  tooltip?: string
}
```

### Shared Management Types

```typescript
// src/components/shared/management/types.ts

export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'table' | 'cards'

export interface SortOption {
  value: string
  label: string
}

export interface FilterGroup {
  label: string
  key: string
  type: 'select' | 'multi-select' | 'checkbox' | 'radio' | 'range'
  options?: Array<{ value: string; label: string }>
  value: any
  onChange: (value: any) => void
}

export interface ManagementAction {
  label: string
  icon: React.ComponentType
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export interface BulkAction {
  label: string
  icon: React.ComponentType
  onClick: () => void
  variant?: 'danger' | 'primary' | 'secondary'
  requiresConfirmation?: boolean
}

export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}
```

---

## Design Tokens

### Colors (from DESIGN_SYSTEM.md)

```typescript
export const HUNTING_COLORS = {
  // Primary
  oliveGreen: '#566E3D',
  burntOrange: '#FA7921',
  brightOrange: '#FE9920',
  mutedGold: '#B9A44C',
  darkTeal: '#0C4767',

  // Secondary
  forestShadow: '#2D3E1F',
  weatheredWood: '#8B7355',
  morningMist: '#E8E6E0',
  clayEarth: '#A0653A',
  pineNeedle: '#4A5D32',
  sunsetAmber: '#D4A574'
}
```

### Spacing

```typescript
export const CARD_SPACING = {
  full: {
    padding: '1rem',      // 16px
    gap: '0.75rem'        // 12px
  },
  compact: {
    padding: '0.75rem',   // 12px
    gap: '0.5rem'         // 8px
  },
  list: {
    padding: '0.75rem 1rem', // 12px 16px
    gap: '0.5rem'            // 8px
  }
}
```

### Typography

```typescript
export const CARD_TYPOGRAPHY = {
  title: {
    full: 'text-lg font-bold',      // 18px
    compact: 'text-base font-bold', // 16px
    list: 'text-sm font-medium'     // 14px
  },
  subtitle: {
    full: 'text-sm text-weathered-wood',
    compact: 'text-xs text-weathered-wood',
    list: 'text-xs text-weathered-wood'
  },
  stat: {
    label: 'text-xs text-forest-shadow',
    value: 'text-sm font-medium text-forest-shadow'
  }
}
```

### Shadows

```typescript
export const CARD_SHADOWS = {
  default: 'club-shadow',
  hover: 'club-shadow-lg',
  active: 'club-shadow-xl'
}
```

---

**End of Document** - Last updated: 2025-10-30
