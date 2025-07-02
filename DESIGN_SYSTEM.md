# Caswell County Yacht Club - Design System

## Color Palette

### Primary Colors (Main Brand)
- **Burnt Orange**: `#FA7921` - `bg-burnt-orange` / `text-burnt-orange`
  - Usage: Primary CTAs, accents, highlights
  - Examples: "Log Hunt" button, important notifications
  
- **Bright Orange**: `#FE9920` - `bg-bright-orange` / `text-bright-orange`
  - Usage: Success states, positive feedback
  - Examples: Successful hunt indicators, completion status
  
- **Muted Gold**: `#B9A44C` - `bg-muted-gold` / `text-muted-gold`
  - Usage: Secondary actions, warnings, maintenance alerts
  - Examples: Maintenance due notifications, secondary buttons
  
- **Olive Green**: `#566E3D` - `bg-olive-green` / `text-olive-green`
  - Usage: Primary brand color, navigation, main buttons
  - Examples: Navigation bar, primary authentication buttons
  
- **Dark Teal**: `#0C4767` - `bg-dark-teal` / `text-dark-teal`
  - Usage: Professional accents, headers, external calendar events
  - Examples: Google Calendar integration, professional highlights

### Secondary Colors (Supporting Palette)
- **Forest Shadow**: `#2D3E1F` - `bg-forest-shadow` / `text-forest-shadow`
  - Usage: Primary text, dark borders, depth
  - Examples: Main headings, important text content
  
- **Weathered Wood**: `#8B7355` - `bg-weathered-wood` / `text-weathered-wood`
  - Usage: Secondary text, muted content, subtle elements
  - Examples: Labels, descriptions, placeholder text
  
- **Morning Mist**: `#E8E6E0` - `bg-morning-mist` / `text-morning-mist`
  - Usage: Light backgrounds, subtle containers
  - Examples: Page backgrounds, card backgrounds, input fields
  
- **Clay Earth**: `#A0653A` - `bg-clay-earth` / `text-clay-earth`
  - Usage: Warnings, errors, urgent alerts
  - Examples: Overdue maintenance, error states, critical alerts
  
- **Pine Needle**: `#4A5D32` - `bg-pine-needle` / `text-pine-needle`
  - Usage: Secondary actions, hover states
  - Examples: Button hover states, secondary navigation
  
- **Sunset Amber**: `#D4A574` - `bg-sunset-amber` / `text-sunset-amber`
  - Usage: Highlights, low-priority notifications
  - Examples: Information callouts, gentle highlights

### Semantic Mappings
- `bg-primary` → `bg-olive-green` (Navigation, main brand)
- `bg-secondary` → `bg-muted-gold` (Secondary actions)
- `bg-accent` → `bg-burnt-orange` (Call-to-action)
- `bg-success` → `bg-bright-orange` (Success states)
- `bg-warning` → `bg-muted-gold` (Warnings)
- `bg-destructive` → `bg-clay-earth` (Errors, dangerous actions)

### Custom Utility Classes
- `.hunt-gradient` - Olive to pine needle gradient
- `.autumn-gradient` - Burnt to bright orange gradient  
- `.earth-gradient` - Weathered wood to clay earth gradient
- `.club-shadow` - Subtle olive-tinted shadows
- `.club-shadow-lg` - Larger olive-tinted shadows

## Component Color Guidelines

### Navigation
- Background: `bg-olive-green`
- Text: `text-white`
- Hover: `hover:bg-pine-needle`

### Buttons
- Primary: `bg-burnt-orange text-white hover:bg-clay-earth`
- Secondary: `bg-muted-gold text-forest-shadow hover:bg-sunset-amber`
- Tertiary: `bg-olive-green text-white hover:bg-pine-needle`

### Calendar Events
- Hunt (successful): `bg-olive-green/10 border-olive-green text-olive-green`
- Hunt (unsuccessful): `bg-pine-needle/10 border-pine-needle text-pine-needle`
- Maintenance (high): `bg-clay-earth/10 border-clay-earth text-clay-earth`
- Maintenance (medium): `bg-muted-gold/10 border-muted-gold text-muted-gold`
- Maintenance (low): `bg-sunset-amber/10 border-sunset-amber text-sunset-amber`
- Events: `bg-burnt-orange/10 border-burnt-orange text-burnt-orange`
- Google Calendar: `bg-dark-teal/10 border-dark-teal text-dark-teal`

### Status Indicators
- Success: `text-bright-orange`
- Warning: `text-muted-gold`
- Error: `text-clay-earth`
- Info: `text-dark-teal`
- Neutral: `text-weathered-wood`

## Usage Rules
1. Always use semantic classes (bg-primary) over specific colors when possible
2. Maintain consistent hover states using the pine-needle and sunset-amber variants
3. Use the opacity modifiers (/10, /20) for subtle backgrounds
4. Apply club-shadow for consistent depth throughout the app
5. Follow the established color hierarchy for information architecture