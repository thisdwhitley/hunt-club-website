# Caswell County Yacht Club - Project Overview

## Purpose
Hunting club management system for 3-member club on 100 acres in North Carolina.

## Key Requirements
- Member authentication & management
- Hunt logging with automatic weather data
- Maintenance task tracking
- Shared camp supply/todo lists
- Interactive property map with stands/trails/cameras
- Trail camera photo management
- Mobile-first responsive design
- Always-visible navigation

## Tech Stack
- Next.js 15 + React 19
- Supabase (auth + database)
- Tailwind CSS 4
- Deployment: Vercel
- Development: Podman

## Member Count
3 members total - all can have full access

## Design System & Color Palette

### Primary Colors
- **Burnt Orange**: `#FA7921` - Primary accent, call-to-action buttons
- **Bright Orange**: `#FE9920` - Success states, notifications
- **Muted Gold**: `#B9A44C` - Secondary actions, warnings
- **Olive Green**: `#566E3D` - Primary brand color, navigation
- **Dark Teal**: `#0C4767` - Professional accents, headers

### Secondary Colors
- **Forest Shadow**: `#2D3E1F` - Dark borders, depth
- **Weathered Wood**: `#8B7355` - Neutral backgrounds
- **Morning Mist**: `#E8E6E0` - Light backgrounds
- **Clay Earth**: `#A0653A` - Warnings, notifications
- **Pine Needle**: `#4A5D32` - Secondary buttons
- **Sunset Amber**: `#D4A574` - Highlights, hover states

### Usage Guidelines
- **Navigation**: Olive green background with white text
- **Primary buttons**: Burnt orange with white text
- **Secondary buttons**: Muted gold with dark text
- **Success states**: Bright orange
- **Hunt logs**: Olive green theme
- **Maintenance**: Muted gold theme
- **Alerts/warnings**: Clay earth
- **Calendar events**: Color-coded by type

## Development Instructions for AI Assistants

When working on this project, always:
1. Use the established hunting club color palette (olive green, burnt orange, etc.)
2. Apply semantic color classes (bg-primary, bg-accent) first, specific colors second
3. Maintain the outdoor/hunting aesthetic with earth tones
4. Use the .club-shadow utility for consistent shadows
5. Follow the mobile-first responsive approach
6. Keep the always-visible navigation pattern
7. Use the established "Coming Soon" pattern for unfinished features
8. Maintain authentication-aware UI (public vs member views)

## Future Features
- Stand recommendations based on weather/historical data
- Hunting season calendars
- Advanced photo analysis
- Weather correlation analytics
