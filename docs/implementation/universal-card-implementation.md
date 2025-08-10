# Universal Card System Implementation Plan

**Project**: Caswell County Yacht Club - Universal Card System  
**Status**: 📋 READY FOR IMPLEMENTATION  
**Created**: January 2025  
**Last Updated**: January 2025  
**Related Design**: `docs/design/universal-card-design.md`



## 📊 **Progress Tracking**

### **Current Phase**: ✅ **Ready for Phase 1: Foundation**
- [x] Design document created and approved
- [x] Implementation plan finalized  
- [x] Database schema reviewed and validated
- [x] Icon registry integration planned
- [ ] **Ready to begin Phase 1: Core Component System**

### **Phase Completion Status**
- [ ] **Phase 1**: Core Component System (Steps 1.1-1.5)
- [ ] **Phase 2**: Entity Configuration System (Steps 2.1-2.4)  
- [ ] **Phase 3**: Development Environment (Steps 3.1-3.4)
- [ ] **Phase 4**: Management Interface Integration (Steps 4.1-4.4)
- [ ] **Phase 5**: Site-Wide Deployment (Steps 5.1-5.3)

### **Git Workflow for Each Phase**
```bash
# Start new phase
git checkout main
git pull origin main
git checkout -b feature/universal-card-phase-1

# Work on individual steps, merging to main frequently
# ... complete Step 1.1 ...
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git checkout feature/universal-card-phase-1

# ... complete Step 1.2 ...
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git checkout feature/universal-card-phase-1

# Continue pattern for each step in phase
# Complete phase
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git branch -d feature/universal-card-phase-1

# Update this document with progress
```

### **Step 4.5: Add GPX Import and GPS Features**
**Files**: `src/components/management/GPXImport.tsx`, GPS utilities
**Dependencies**: Step 4.4 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 4.5 ready. What GitHub issue number corresponds to 'Add GPX import functionality'?
>
> Then: Create GPX import functionality for entities with GPS coordinates (stands, cameras). Support intelligent parsing of GPX files, coordinate validation, batch import of multiple entities, and visual preview of imported coordinates on map. Integrate with existing management interface."

**Expected deliverables**:
- GPX file import component
- Coordinate validation and parsing
- Batch import functionality
- Map preview of imported locations

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/management/GPXImport.tsx src/lib/gps/
git commit -m "step-4.5: add GPX import functionality

Fixes #XXX

- Create GPX file import component
- Add coordinate validation and parsing
- Implement batch import functionality
- Add map preview of imported locations"
git checkout main
git merge feature/universal-card-phase-4
git push origin main
git branch -d feature/universal-card-phase-4
```

---

## 🚀 **Phase 1: Core Component System (2-3 days)**

**Objective**: Build the foundational universal card component with all variants

### **Step 1.1: Create TypeScript Interfaces**
**Files**: `src/components/cards/types.ts`, `src/lib/cards/types.ts`
**Dependencies**: None
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 1.1 ready. What GitHub issue number corresponds to 'Create universal card TypeScript interfaces'? I'll need this for the git commit message.
>
> Then: Create TypeScript interfaces for universal card system. Reference the design document at docs/design/universal-card-design.md. Include CardVariant, CardSlotConfig, EntityConfig types. Use existing database schema fields from camera_hardware, camera_deployments, stands, auth.users tables."

**Expected deliverables**:
- Complete TypeScript interfaces for card system
- Integration with existing database types
- Type safety for all card configurations
- JSDoc documentation for interfaces

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/cards/types.ts src/lib/cards/types.ts
git commit -m "step-1.1: create universal card TypeScript interfaces

Fixes #XXX

- Add CardVariant, CardSlotConfig, EntityConfig interfaces
- Define slot types: header, location, properties, stats, history, actions
- Integration with existing database schema types
- Complete JSDoc documentation"
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git checkout feature/universal-card-phase-1
```

### **Step 1.2: Build Universal Card Component**
**Files**: `src/components/cards/UniversalCard.tsx`
**Dependencies**: Step 1.1 complete, existing icon registry
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 1.2 ready. What GitHub issue number corresponds to 'Build core UniversalCard component'?
>
> Then: Create the core UniversalCard component. Use the TypeScript interfaces from Step 1.1. Integrate with existing ICONS registry from src/lib/shared/icons/. Use hunting club design system colors (olive-green, burnt-orange, etc.) and existing utility classes like shadow-club."

**Expected deliverables**:
- Functional UniversalCard React component
- Integration with icon registry
- Proper prop handling and error boundaries
- Initial styling with hunting club theme

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/cards/UniversalCard.tsx
git commit -m "step-1.2: build core UniversalCard component

Fixes #XXX

- Create main UniversalCard React component
- Integrate with existing ICONS registry
- Apply hunting club design system styling
- Add proper prop handling and TypeScript types"
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git checkout feature/universal-card-phase-1
```

### **Step 1.3: Implement Card Slot Components**
**Files**: `src/components/cards/slots/`, individual slot components
**Dependencies**: Step 1.2 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 1.3 ready. What GitHub issue number corresponds to 'Create card slot components'?
>
> Then: Create individual slot components: CardHeader, CardBody, LocationSlot, PropertiesSlot, StatsSlot, HistorySlot, CardActions (no MediaSlot needed). Each should handle responsive design and variant-specific styling. Reference camera_hardware and stands table structures for real data examples."

**Expected deliverables**:
- Individual slot components for all card sections
- Responsive design for mobile/tablet/desktop
- Variant-specific styling (compact, list, popup)
- Integration with database field types

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/cards/slots/
git commit -m "step-1.3: implement card slot components

Fixes #XXX

- Create CardHeader, CardBody, LocationSlot components
- Add PropertiesSlot, StatsSlot, HistorySlot, CardActions
- Implement responsive design for all screen sizes
- No MediaSlot component (not needed per requirements)"
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git checkout feature/universal-card-phase-1
```

### **Step 1.4: Add Card Variant Styling**
**Files**: Update component styles for variants
**Dependencies**: Step 1.3 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 1.4 ready. What GitHub issue number corresponds to 'Implement card variant styling'?
>
> Then: Implement styling for all four card variants: Full (default), Compact (dashboard widgets), List (table rows), Popup (map overlays). Use conditional classes and ensure mobile responsiveness. Reference existing StandCard component for visual consistency."

**Expected deliverables**:
- Complete styling for all four variants
- Mobile-optimized responsive behavior
- Visual consistency with existing cards
- Hover states and animations

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/cards/
git commit -m "step-1.4: add card variant styling

Fixes #XXX

- Implement Full, Compact, List, Popup variant styles
- Add responsive behavior for all screen sizes
- Create hover states and smooth animations
- Ensure visual consistency with existing cards"
git checkout main
git merge feature/universal-card-phase-1
git push origin main
git checkout feature/universal-card-phase-1
```

### **Step 1.5: Create Card Component Tests**
**Files**: `src/components/cards/__tests__/`
**Dependencies**: Step 1.4 complete
**Git Issue**: [#UC-005] Add universal card tests

**How to prompt Claude**:
> "Step 1.5 ready. Create comprehensive tests for UniversalCard component and slots. Include unit tests, variant testing, responsive behavior, accessibility testing. Test with mock data that matches our database schema structure."

**Expected deliverables**:
- Unit tests for all card components
- Variant-specific testing
- Accessibility and responsive tests
- Mock data matching database schema

**Git commands**:
```bash
git add src/components/cards/__tests__/
git commit -m "step-1.5: create card component tests

- Add unit tests for UniversalCard and all slots
- Test all four card variants thoroughly
- Include accessibility and responsive tests
- Create mock data matching database schema"
git push origin feature/universal-card-phase-1
```

---

## 🔧 **Phase 2: Entity Configuration System (3-4 days)**

**Objective**: Create configuration system for different entity types

### **Step 2.1: Create Entity Configuration Framework**
**Files**: `src/lib/cards/entity-configs.ts`, `src/lib/cards/registry.ts`
**Dependencies**: Phase 1 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 2.1 ready. What GitHub issue number corresponds to 'Build entity configuration framework'?
>
> Then: Create entity configuration framework. Build EntityConfig interface and registry system. Reference actual database schemas for stands, camera_hardware, camera_deployments, camera_status_reports, auth.users, members tables."

**Expected deliverables**:
- EntityConfig interface and registry
- Framework for adding new entity types
- Type-safe configuration system
- Integration with database schemas

**Git commands**:
```bash
git checkout main
git pull origin main
git checkout -b feature/universal-card-phase-2
# Replace XXX with actual issue number from user
git add src/lib/cards/
git commit -m "step-2.1: create entity configuration framework

Fixes #XXX

- Build EntityConfig interface and registry
- Create type-safe configuration system  
- Framework for adding new entity types
- Integration with existing database schemas"
git checkout main
git merge feature/universal-card-phase-2
git push origin main
git checkout feature/universal-card-phase-2
```

### **Step 2.2: Build Stand Configuration**
**Files**: Update `src/lib/cards/entity-configs.ts`
**Dependencies**: Step 2.1 complete, existing stands table
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 2.2 ready. What GitHub issue number corresponds to 'Create stand entity configuration'?
>
> Then: Create stand entity configuration based on existing StandCard implementation. Use actual stands table fields: name, type (ladder_stand/bale_blind/box_stand/tripod), latitude, longitude, capacity, walking_time_minutes, view_distance_yards, height_feet, trail_camera_name. NO condition field tracking. Reference existing StandCardSimple component for accurate field mapping."

**Expected deliverables**:
- Complete stand configuration
- Mapping to existing stands table
- Integration with existing constants
- Visual consistency with current StandCard

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/lib/cards/entity-configs.ts
git commit -m "step-2.2: build stand entity configuration

Fixes #XXX

- Create standConfig with actual stands table fields
- Map to existing STAND_TYPES constants
- Implement location, properties, stats slots
- Match existing StandCard visual design"
git checkout main
git merge feature/universal-card-phase-2
git push origin main
git checkout feature/universal-card-phase-2
```

### **Step 2.3: Build Camera Configuration**
**Files**: Update `src/lib/cards/entity-configs.ts` 
**Dependencies**: Step 2.2 complete, camera schema
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 2.3 ready. What GitHub issue number corresponds to 'Create camera entity configuration'?
>
> Then: Create camera entity configuration based on existing CameraCard implementation. Use three-table camera system: camera_hardware (device_id, brand, model), camera_deployments (location_name, latitude, longitude, missing detection), camera_status_reports (battery_status, signal_level, sd_images_count, needs_attention, alert_reason). NO last photo tracking, NO media slot. Reference existing CameraCard component for accurate field mapping."

**Expected deliverables**:
- Complete camera configuration
- Three-table data integration
- Missing detection and alert support
- Status badge integration

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/lib/cards/entity-configs.ts
git commit -m "step-2.3: build camera entity configuration

Fixes #XXX

- Create cameraConfig with three-table integration
- Support missing detection and alert features
- Add battery, signal, storage status properties
- Implement location slot with deployment data"
git checkout main
git merge feature/universal-card-phase-2
git push origin main
git checkout feature/universal-card-phase-2
```

### **Step 2.4: Build User and Task Configurations**
**Files**: Update `src/lib/cards/entity-configs.ts`
**Dependencies**: Step 2.3 complete
**Git Issue**: [#UC-009] Create user and task configurations

**How to prompt Claude**:
> "Step 2.4 ready. Create user configuration based on actual members table schema: id (FK to auth.users), email, full_name, display_name, role, phone, avatar_url, emergency_contact_name, emergency_contact_phone. NO location slot for users. Task config: maintenance_tasks table (placeholder since not implemented yet - basic structure only)."

**Expected deliverables**:
- User configuration for auth.users + members
- Task configuration for maintenance_tasks
- Proper field mapping for each entity
- No location slot for users

**Git commands**:
```bash
git add src/lib/cards/entity-configs.ts
git commit -m "step-2.4: build user and task configurations

- Create userConfig for auth.users + members integration
- Build taskConfig for maintenance_tasks table
- Implement entity-specific slot configurations
- Add proper action buttons for each entity type"
git push origin feature/universal-card-phase-2
```

---

## 🛠️ **Phase 3: Development Environment (2-3 days)**

**Objective**: Create safe development area for designing cards

### **Step 3.1: Create Development Layout**
**Files**: `src/app/dev/cards/layout.tsx`, `src/app/dev/cards/page.tsx`
**Dependencies**: Phase 2 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 3.1 ready. What GitHub issue number corresponds to 'Build card development environment'?
>
> Then: Create card development environment at /dev/cards route that integrates with existing site navigation. Build layout with sidebar controls and main preview canvas. Include entity selector, variant selector, and live editing controls. Use existing navigation patterns and ensure development area is accessible through main site navigation."

**Expected deliverables**:
- Card development page at /dev/cards
- Sidebar with configuration controls
- Main canvas for live preview
- Real-time updates and editing

**Git commands**:
```bash
git checkout main
git pull origin main
git checkout -b feature/universal-card-phase-3
# Replace XXX with actual issue number from user
git add src/app/dev/cards/
git commit -m "step-3.1: create development layout

Fixes #XXX

- Build /dev/cards development environment
- Add sidebar controls and preview canvas
- Implement real-time card preview
- Create safe isolated development space"
git checkout main
git merge feature/universal-card-phase-3
git push origin main
git checkout feature/universal-card-phase-3
```

### **Step 3.2: Build Configuration Controls**
**Files**: `src/components/dev/CardConfigPanel.tsx`
**Dependencies**: Step 3.1 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 3.2 ready. What GitHub issue number corresponds to 'Create development controls'?
>
> Then: Build configuration control panel for card development. Include entity type selector, variant selector, mock data editors, section toggles, appearance controls (width, padding). Allow live editing of card properties."

**Expected deliverables**:
- Configuration control panel component
- Live editing of card properties
- Section show/hide toggles
- Appearance customization controls

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/dev/CardConfigPanel.tsx
git commit -m "step-3.2: build configuration controls

Fixes #XXX

- Create CardConfigPanel with live editing
- Add entity type and variant selectors
- Implement section toggles and appearance controls
- Support real-time card property editing"
git checkout main
git merge feature/universal-card-phase-3
git push origin main
git checkout feature/universal-card-phase-3
```

### **Step 3.3: Add Mock Data System**
**Files**: `src/lib/dev/mock-data.ts`
**Dependencies**: Step 3.2 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 3.3 ready. What GitHub issue number corresponds to 'Create mock data system'?
>
> Then: Create mock data system for development environment. Generate realistic sample data for stands, cameras, users, tasks that matches actual database schemas. Include edge cases and different states (active/inactive, missing cameras, etc.)."

**Expected deliverables**:
- Mock data for all entity types
- Realistic sample data matching schemas
- Edge cases and different states
- Easy switching between mock scenarios

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/lib/dev/mock-data.ts
git commit -m "step-3.3: add mock data system

Fixes #XXX

- Create realistic mock data for all entities
- Match actual database schema structure
- Include edge cases and different states
- Support easy scenario switching"
git checkout main
git merge feature/universal-card-phase-3
git push origin main
git checkout feature/universal-card-phase-3
```

### **Step 3.4: Add Export/Import Features**
**Files**: Update dev components with export functionality
**Dependencies**: Step 3.3 complete
**Git Issue**: [#UC-013] Add configuration export features

**How to prompt Claude**:
> "Step 3.4 ready. Add configuration export/import features to development environment. Allow copying working configurations, saving custom mock data, and exporting card configurations for production use."

**Expected deliverables**:
- Configuration export/import system
- Copy to clipboard functionality
- Save/load custom configurations
- Production configuration export

**Git commands**:
```bash
git add src/components/dev/ src/lib/dev/
git commit -m "step-3.4: add export/import features

- Implement configuration export/import system
- Add copy to clipboard functionality
- Support saving custom configurations
- Enable production configuration export"
git push origin feature/universal-card-phase-3
```

---

## 🎯 **Phase 4: Management Interface Integration (2-3 days)**

**Objective**: Integrate universal cards into management interface

### **Step 4.1: Update Management Interface**
**Files**: `src/app/management/page.tsx`, `src/components/management/`
**Dependencies**: Phase 3 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 4.1 ready. What GitHub issue number corresponds to 'Integrate with management interface'?
>
> Then: Update management interface to use universal card system. Replace existing entity-specific components with UniversalCard. Add entity tab switching and view selection controls. Reference existing management interface structure."

**Expected deliverables**:
- Updated management interface using UniversalCard
- Entity tab switching functionality
- View selection controls (Full/Compact/List/Popup)
- Preserved existing functionality

**Git commands**:
```bash
git checkout main
git pull origin main
git checkout -b feature/universal-card-phase-4
# Replace XXX with actual issue number from user
git add src/app/management/ src/components/management/
git commit -m "step-4.1: update management interface

Fixes #XXX

- Integrate UniversalCard into management interface
- Add entity tab switching and view controls
- Replace existing entity-specific components
- Preserve all existing functionality"
git checkout main
git merge feature/universal-card-phase-4
git push origin main
git checkout feature/universal-card-phase-4
```

### **Step 4.2: Add View Selection Controls**
**Files**: `src/components/management/ViewControls.tsx`
**Dependencies**: Step 4.1 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 4.2 ready. What GitHub issue number corresponds to 'Create view selection controls'?
>
> Then: Create view selection controls for management interface. Build icon-based buttons for Full/Compact/List/Popup views. Include grid layout switching and responsive behavior. Use existing icon registry."

**Expected deliverables**:
- ViewControls component with icon buttons
- Grid layout switching functionality
- Responsive view selection
- Integration with existing icons

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/management/ViewControls.tsx
git commit -m "step-4.2: add view selection controls

Fixes #XXX

- Create ViewControls with icon-based selection
- Implement grid layout switching
- Add responsive view behavior
- Integrate with existing icon registry"
git checkout main
git merge feature/universal-card-phase-4
git push origin main
git checkout feature/universal-card-phase-4
```

### **Step 4.3: Add Search and Filtering**
**Files**: `src/components/management/EntityFilters.tsx`
**Dependencies**: Step 4.2 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 4.3 ready. What GitHub issue number corresponds to 'Implement search and filtering'?
>
> Then: Implement search and filtering for universal card management interface. Support entity-specific filters, search across relevant fields, sortable columns (click headers to sort), and integration with card display. Maintain existing filtering patterns but add column sorting functionality."

**Expected deliverables**:
- EntityFilters component
- Entity-specific filtering logic
- Search functionality across card data
- Sortable columns functionality

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/management/EntityFilters.tsx
git commit -m "step-4.3: add search and filtering

Fixes #XXX

- Implement EntityFilters component
- Add entity-specific filtering logic
- Create search functionality across card data
- Add sortable columns with click-to-sort"
git checkout main
git merge feature/universal-card-phase-4
git push origin main
git checkout feature/universal-card-phase-4
```

### **Step 4.4: Add Bulk Operations**
**Files**: `src/components/management/BulkActions.tsx`
**Dependencies**: Step 4.3 complete
**Git Issue**: [#UC-017] Create bulk operations

**How to prompt Claude**:
> "Step 4.4 ready. Create bulk operations for list view management. Support multi-select checkboxes, bulk delete with confirmation (only action that applies to multiple items), and integration with existing permissions and database operations. No bulk edit - only bulk delete functionality."

**Expected deliverables**:
- BulkActions component for list view
- Multi-select functionality
- Bulk edit/delete operations
- Export functionality

**Git commands**:
```bash
git add src/components/management/BulkActions.tsx
git commit -m "step-4.4: add bulk operations

- Create BulkActions component for list view
- Implement multi-select functionality
- Add bulk edit and delete operations
- Support export functionality"
git push origin feature/universal-card-phase-4
```

---

## 🌐 **Phase 5: Site-Wide Deployment (2-3 days)**

**Objective**: Deploy universal cards throughout the site

### **Step 5.1: Update Property Map Integration**
**Files**: `src/components/PropertyMap.tsx`, map popup components
**Dependencies**: Phase 4 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 5.1 ready. What GitHub issue number corresponds to 'Integrate with property map'?
>
> Then: Update property map to use universal cards for stand and camera popups. Use popup variant for map overlays. Maintain existing map functionality while standardizing popup appearance."

**Expected deliverables**:
- Property map using UniversalCard popups
- Popup variant for stand and camera details
- Preserved map functionality
- Consistent popup appearance

**Git commands**:
```bash
git checkout main
git pull origin main
git checkout -b feature/universal-card-phase-5
# Replace XXX with actual issue number from user
git add src/components/PropertyMap.tsx src/components/map/
git commit -m "step-5.1: update property map integration

Fixes #XXX

- Integrate UniversalCard popup variant with map
- Update stand and camera popup components
- Maintain existing map functionality
- Standardize popup appearance"
git checkout main
git merge feature/universal-card-phase-5
git push origin main
git checkout feature/universal-card-phase-5
```

### **Step 5.2: Update Dashboard Widgets**
**Files**: Dashboard components using compact cards
**Dependencies**: Step 5.1 complete
**Git Issue**: Ask for issue number

**How to prompt Claude**:
> "Step 5.2 ready. What GitHub issue number corresponds to 'Create dashboard widgets'?
>
> Then: Update dashboard to use universal cards for widgets. Create 'Most Hunted Stand', 'Recent Camera Activity', 'Active Tasks' widgets using compact variant. Maintain dashboard layout and functionality."

**Expected deliverables**:
- Dashboard widgets using compact cards
- "Most Hunted Stand" widget
- "Recent Camera Activity" widget
- "Active Tasks" widget placeholder

**Git commands**:
```bash
# Replace XXX with actual issue number from user
git add src/components/dashboard/
git commit -m "step-5.2: update dashboard widgets

Fixes #XXX

- Create dashboard widgets using compact cards
- Add Most Hunted Stand widget
- Implement Recent Camera Activity widget
- Build Active Tasks widget placeholder"
git checkout main
git merge feature/universal-card-phase-5
git push origin main
git checkout feature/universal-card-phase-5
```

### **Step 5.3: Navigation and Performance Optimization**
**Files**: Navigation updates, performance optimizations
**Dependencies**: Step 5.2 complete
**Git Issue**: [#UC-020] Final optimization and integration

**How to prompt Claude**:
> "Step 5.3 ready. Final integration and optimization. Update navigation to support universal card areas, optimize performance for large card lists, add lazy loading, and ensure accessibility. Complete migration from old card components."

**Expected deliverables**:
- Navigation integration complete
- Performance optimizations for large lists
- Lazy loading implementation
- Accessibility improvements
- Migration from old components complete

**Git commands**:
```bash
git add src/components/ src/app/
git commit -m "step-5.3: final optimization and integration

- Complete navigation integration
- Add performance optimizations for large lists
- Implement lazy loading for card grids
- Ensure accessibility compliance
- Complete migration from old card components"
git push origin feature/universal-card-phase-5

# Final merge to main
git checkout main
git pull origin main
git merge feature/universal-card-phase-5
git push origin main
git branch -d feature/universal-card-phase-5
```

---

## 🎯 **Success Criteria**

### **Phase 1 Success**: Core component system functional
✅ UniversalCard component renders with all variants  
✅ TypeScript interfaces provide type safety  
✅ Integration with existing design system complete  
✅ All slot components work responsively  
✅ Tests pass and coverage is adequate  

### **Phase 2 Success**: Entity configurations complete
✅ Stand configuration matches existing StandCard design  
✅ Camera configuration supports three-table system  
✅ User configuration works with auth + members  
✅ Task configuration handles maintenance workflow  
✅ Registry system supports easy entity addition  

### **Phase 3 Success**: Development environment operational
✅ Card development area provides real-time editing  
✅ Configuration controls work for all entity types  
✅ Mock data system supports realistic testing  
✅ Export/import functionality works correctly  
✅ Safe environment isolated from production  

### **Phase 4 Success**: Management interface integrated
✅ Management interface uses universal cards  
✅ Entity tab switching works smoothly  
✅ View selection controls update display correctly  
✅ Search and filtering work with all entity types  
✅ Bulk operations function in list view  

### **Phase 5 Success**: Site-wide deployment complete
✅ Property map uses popup variant appropriately  
✅ Dashboard widgets use compact variant effectively  
✅ Navigation supports universal card areas  
✅ Performance optimized for production use  
✅ All old card components successfully migrated  

---

## 📋 **Git Issues Summary**

### **Phase 1: Core Component System**
- **[#UC-001]**: Create universal card TypeScript interfaces
- **[#UC-002]**: Build core UniversalCard component  
- **[#UC-003]**: Create card slot components
- **[#UC-004]**: Implement card variant styling
- **[#UC-005]**: Add universal card tests

### **Phase 2: Entity Configuration System**
- **[#UC-006]**: Build entity configuration framework
- **[#UC-007]**: Create stand entity configuration
- **[#UC-008]**: Create camera entity configuration
- **[#UC-009]**: Create user and task configurations

### **Phase 3: Development Environment**
- **[#UC-010]**: Build card development environment
- **[#UC-011]**: Create development controls
- **[#UC-012]**: Create mock data system
- **[#UC-013]**: Add configuration export features

### **Phase 4: Management Interface Integration**
- **[#UC-014]**: Integrate with management interface
- **[#UC-015]**: Create view selection controls
- **[#UC-016]**: Implement search and filtering
- **[#UC-017]**: Create bulk operations
- **[#UC-018]**: Add GPX import functionality

### **Phase 5: Site-Wide Deployment**
- **[#UC-019]**: Integrate with property map
- **[#UC-020]**: Create dashboard widgets
- **[#UC-021]**: Final optimization and integration

---

## ⚠️ **Risk Mitigation**

### **Performance Risks**
- **Large Card Lists**: Implement React.memo and virtualization for 100+ cards
- **Bundle Size**: Ensure tree-shaking works correctly for unused variants
- **Memory Usage**: Optimize card component re-rendering

### **Migration Risks**  
- **Existing Functionality**: Maintain all current features during transition
- **User Disruption**: Phase rollout to minimize workflow interruption
- **Data Compatibility**: Ensure all database fields display correctly

### **Integration Risks**
- **Design Consistency**: Validate against existing StandCard appearance
- **Icon Registry**: Ensure all needed icons are available
- **Database Schema**: Handle any schema changes during development

---

## 🚨 **Emergency Procedures**

### **If You Get Stuck**
1. **Check this document** for the exact step you're on
2. **Reference design document** for UX specifications  
3. **Check git history** to see what was last working
4. **Prompt Claude with context**: "I'm on Step X.Y having issue Z. Here's my current code: [paste]"

### **If a Step Fails**
1. **Don't skip ahead** - fix current step first
2. **Check dependencies** - ensure previous steps completed
3. **Verify git state** - ensure you're on right branch
4. **Reference existing code** - look at current StandCard/navigation patterns
5. **Ask for help**: "Step X.Y failed with error: [paste exact error]"

### **Rollback Procedures**
- **Component Level**: Restore individual components from git history
- **Database**: No database changes in this implementation
- **Feature Level**: Disable new cards, re-enable old components temporarily
- **Full Rollback**: Revert entire feature branch if critical issues

---

## 💡 **Key Integration Points**

### **Existing Database Schema**
- **Stands**: name, type, latitude, longitude, active, hunt_count, success_rate
- **Camera System**: Three tables (hardware, deployments, status_reports)
- **Users**: auth.users + members tables
- **Tasks**: maintenance_tasks table

### **Icon Registry**
- **Navigation**: target, camera, user, settings, plus, search, filter
- **Features**: location, calendar, battery, signal, edit, view, delete
- **Stand Types**: From src/lib/stands/constants.ts (ladder, circle-dot, square, triangle)

### **Design System**
- **Colors**: olive-green, burnt-orange, muted-gold, weathered-wood
- **Utilities**: shadow-club, rounded corners, hover effects
- **Mobile**: Touch targets, responsive grids, mobile-first approach

---

## 📚 **Related Documents**

- **Design Document**: `docs/design/universal-card-design.md`
- **Database Schema**: `docs/database/SCHEMA.md`  
- **Existing Cards**: `src/components/stands/StandCard.tsx`
- **Icon Registry**: `src/lib/shared/icons/`
- **Design System**: `DESIGN_SYSTEM.md`

---

**Next Step**: Begin with Phase 1, Step 1.1 (Create TypeScript Interfaces)

**Estimated Timeline**: 12-15 days total with proper testing and documentation  
**Final Result**: Consistent, maintainable card system used throughout the site