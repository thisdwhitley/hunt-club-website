# Plan: Hunt reports page (`/reports`)

**Status:** Decisions 2-4 made 2026-11-15; route (decision 1) awaiting confirmation
**Issues:** #117 (stand AM/PM and season-type breakdown), #115 (season summary, partly). Later phases: #119 (weather), #118 (sightings).
**Builds on:** PR #172 (2018-2024 history import), PR #173 (season dates and weather backfill)

## Goal

Answer "what works" questions from the club's hunt history, starting with the one that prompted
this work: **are AM or PM hunts more successful at seeing deer, and at harvests?** Then the same
question by stand, season type and season.

Preview from the data as of 2026-11-15 (all seasons except 2022, calendar-only hunts excluded):

| | Sits | Saw deer | Deer seen per sit | Harvests |
|---|---|---|---|---|
| AM | 144 | 25% | 0.33 | 6 |
| PM | 120 | 38% | 0.63 | 13 |

PM beats AM on deer seen in every season except 2025. The sample sizes are small enough that the
page must always show how many sits a number rests on.

## Data (no schema changes)

Everything needed already exists:

| Table | Used for |
|---|---|
| `hunt_logs` | one row per sit: date, `hunt_type` (AM/PM), member, stand, `had_harvest` / `harvest_count`, `season`, `hunting_season`, notes; weather columns and `weather_conditions` |
| `hunt_sightings` | animals seen per sit (`animal_type`, `count`, `gender`, `time_observed`) |
| `hunt_harvests` | harvest details (gender, antler points) |
| `stands`, `members` | names, active/inactive, guest account |

The data is small (about 270 sits and 160 sightings, growing by roughly 60 sits a season), so the page
fetches it all server-side and aggregates in TypeScript. No database views, RPCs or caching are needed
yet. Revisit if it ever passes a few thousand rows.

### Metric definitions (one place: `src/lib/reports/metrics.ts`)

- **Sit:** one `hunt_logs` row.
- **Saw deer:** the sit has at least one `hunt_sightings` row with `animal_type = 'Deer'`.
- **Deer seen per sit:** sum of deer sighting `count` / sits. Also split into bucks and does.
- **Harvest rate:** sits with a harvest (`had_harvest` or `harvest_count > 0`) / sits.
- **Sample size:** every rate is shown with its sit count. Below 10 sits it's shown muted and marked "small sample".
  "Morning stand" / "evening stand" labels need at least 10 sits on each side.

### Data quality rules

Defined once as constants in `src/lib/reports/data-quality.ts`, applied by default, each with a toggle:

| Rule | Why | Default |
|---|---|---|
| Exclude **2022** | only 3 sits were logged; mostly missing data, not a slow season | excluded |
| Exclude **calendar-only hunts** (notes start with `From calendar entry`: 2021-11-11, 2024-12-13) | they exist only because they were harvests, which would inflate harvest rates | excluded from rates, still counted in harvest totals |
| Flag **2021** | form logging covered Oct-Dec only | included, footnoted |
| Flag **2024** | only the one calendar harvest exists | excluded with the calendar-only rule |
| Flag **2019 season types** | 2019 season dates are estimated | included, footnoted |
| **Stand moves** | stands moved over the years with no record of when (#90), so per-stand history mixes locations | footnote on the stand table |
| **Guest sits** | logged under the shared Guest account, real name in notes (`Guest: <name>`) | included; hunter filter shows guests as one group |

Known issues that affect accuracy, linked from the page footer: #168 (removing a sighting in the
edit form doesn't delete it), #167 (harvests don't auto-add a sighting), #102 (hunt_logs audit).

## Page design (v1: tables, no charts)

Route `/reports`, members only (same auth as `/management`). Read-only: management stays in
`/management` (#24, #115).

1. **Filters** (sticky toolbar, same pattern as the cameras page: `sticky top-[68px] z-10`):
   seasons (multi-select, defaulting per decision 2), season type, hunter, stand (with "include inactive"), and a
   "data quality rules" popover with the toggles above. Filters live in URL search params so a view can be bookmarked or shared.
2. **Summary tiles:** sits, saw-deer %, deer per sit, harvests, each with its sit count.
3. **AM vs PM:** the headline table (sits, saw deer %, deer/sit, bucks/sit, does/sit, harvests, harvest rate).
4. **Season type x AM/PM:** archery / blackpowder / gun rows, AM and PM columns (#117).
5. **By stand:** sits, AM/PM split, saw-deer %, deer/sit, harvests, plus a morning/evening stand label when the sample allows it (#117).
   Sortable. Inactive historical stands shown only when the filter includes them.
6. **By season:** one row per season (sits, saw-deer %, deer/sit, harvests), with data-quality flags inline (#115).

Mobile-first: tables become stacked cards below `sm`. Colors and info boxes follow the design
system in CLAUDE.md (no new palette). The icon registry, not direct lucide imports.

## Implementation phases

**Phase 0 - finish the weather backfill** (prerequisite only for phase 4)
`node scripts/history/backfill-weather.js --apply` once a day until it reports 0 remaining (111 days left after batch 1, about 3 runs).

**Phase 1 - data layer** (`src/lib/reports/`, server-only, no `'use client'`)
- `types.ts`: `ReportSit` (one denormalized row per sit: date, season, season type, AM/PM, hunter, guest name, stand, stand active, deer/bucks/does seen, harvest, source flags)
- `data.ts`: `getReportSits()` builds `ReportSit[]` with `createServerSupabaseClient` (four selects, joined in memory)
- `metrics.ts`: pure functions `summarize(sits)`, `groupBy(sits, key)` returning `{ sits, sawDeer, deer, bucks, does, harvests, rates, smallSample }`
- `data-quality.ts`: the rules table above as constants plus `applyRules(sits, toggles)`
- **Acceptance check:** a small script reproduces the spreadsheets' own tallies through the same functions (2019 sheet: AM 3/21, PM 11/18 sits with sightings; 2020: AM 7/26, PM 10/23) and the preview table above.

**Phase 2 - page**
- `src/app/reports/page.tsx` (Server Component): fetch with `getReportSits()`, pass to the client view
- `src/components/reports/ReportsView.tsx` (Client): filters, URL params, tables
- `src/components/reports/` table components, one per section

**Phase 3 - wiring and docs**
- Add "Reports" to `src/lib/navigation/navigation-config.ts`, and to `src/components/Navigation.tsx`, which has its own hard-coded list (see #86).
- CLAUDE.md: a "Reports" section with the metric definitions and data-quality rules.
- Update #117 (done) and #115 (season table done; streaks, milestones and "days remaining" still open).
- `npm run build:safe` before pushing; test on staging (main) before merging to production.

**Phase 4 - later (separate PRs)**
- Weather breakdowns (#119): pressure trend, dawn/dusk temperature bands, moon illumination, wind. Uses
  `weather_conditions` with the rules already in CLAUDE.md (dawn values for AM, dusk for PM, the moon phase formula, "Steady" not "Stable").
- Sightings analytics (#118), member breakdown and milestones (#115), and charts. Charts need a library;
  none is installed, so that's a dependency decision when it comes.

## Decisions

1. **Route:** recommended `/reports` as its own read-only page, separate from `/management` (editing), as #115
   and #24 intend. It gets a "Reports" nav link next to Property Map. The alternative is a Reports tab inside
   `/management`. *Awaiting confirmation.*
2. **Default scope (decided 2026-11-15):** if deer season is open today, default to the current season;
   otherwise default to the most recent season that has started. For example, spring 2027 shows the 2026
   season, and early September before archery opens still shows last season. Use `getCurrentSeason('deer')`
   from `src/lib/seasons`; when it returns null, take the latest deer `season_year` whose `opens` is on or
   before today. Other seasons, or all seasons, can be picked in the season filter. The data-quality rules
   still apply when more than one season is selected.
3. **Charts (decided):** not in v1. Tables only; charts in phase 4.
4. **Access (decided):** all logged-in members.
