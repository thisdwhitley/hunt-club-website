# Hunt history (2018-2024)

Hunt records from before the website existed. The original sources are copied here as
plain CSV files, so they stay readable without Google or Supabase. A build script turns
them into normalized records ready to load into the database.

Seasons from 2025 on are logged on the website and are never imported from here.

## Layout

```
data/history/
  raw/                  copies of the original sources - treat as read-only
    sheets/             2018-2020 spreadsheet logs, one row per sit
    forms/              2021-2023 Google Form responses, one row per sit
    calendar/           exports from the "hunting+past" Google Calendar
  stands.csv            old stand name -> stand on the site (or a new inactive stand)
  hunters.csv           hunter name as written in the sources -> hunter on the site
  corrections.csv       per-row fixes and decisions, each with a reason
  normalized/           build output - regenerate, don't edit by hand
    hunts.csv
    sightings.csv
```

## Sources

| File | Original | Notes |
|---|---|---|
| `raw/sheets/2018-hunting.csv` | Google Sheet "2018 HUNTING", tab ALL | harvest column is free text (`6-pt`, `Missed Doe`, `Hit`) |
| `raw/sheets/2019-hunting.csv` | Google Sheet "2019 HUNTING", tab ALL | |
| `raw/sheets/2019-camera.csv` | "2019 HUNTING", tab CAMERA | trail-camera sightings Oct 9 - Nov 16, 2019; not imported yet |
| `raw/sheets/2020-hunting.csv` | Google Sheet "2020 HUNTING", tab ALL | |
| `raw/forms/2021-hunt-observations.csv` | "DW - Hunt Observations Final Copy (Responses)" | |
| `raw/forms/2022-hunt-observations.csv` | "2022 Hunt Observations Final Copy (Responses)", tab Form Responses 3 | only 3 sits were logged in 2022 |
| `raw/forms/2023-hunt-observations.csv` | "2023 Hunt Log", tab Form Responses | |
| `raw/calendar/harvests.csv` | Google Calendar "hunting+past", recurring harvest events | one row per harvest (the yearly repeats are collapsed) |
| `raw/calendar/season-dates.csv` | same calendar | NC season dates 2020-2026, for backfilling `season_calendar` |
| `raw/calendar/rut-predictions.csv` | same calendar | Field & Stream, Outdoor Life, Bowhunter, Realtree and NC Wildlife rut predictions |

The only changes made while exporting:
- spreadsheet date and time numbers converted to `YYYY-MM-DD` and `H:MM`
- 0/1 checkbox values written as `TRUE`/`FALSE`
- email-address columns and blank rows removed
- the two "Arrival Direction" form columns renamed to "Buck Arrival Direction" and "Doe Arrival Direction"
- links to the original Google Sheets removed from the calendar descriptions

Everything else, including typos, is exactly as it was in the source. Fixes go in `corrections.csv` instead.

## Building

```bash
node scripts/history/build-history.js           # writes normalized/hunts.csv and sightings.csv
node scripts/history/build-history.js --check   # report only, writes nothing
```

The script needs no dependencies and never touches the database. It reports a sit and
harvest count per year, and lists anything it couldn't resolve, such as an unmapped
stand or hunter, an unreadable sighting, or a correction that matched nothing. It exits
non-zero while any problems remain.

Each normalized hunt has a `source_ref` like `forms/2023-hunt-observations.csv#14`
(file plus data-row number, header excluded). Because the raw files never change,
these references are stable. Corrections are keyed by them, and the database load uses
them to avoid importing the same row twice.

## Loading into the database

```bash
NODE_PATH=node_modules node scripts/history/load-history.js           # dry run: shows what would change
NODE_PATH=node_modules node scripts/history/load-history.js --apply   # writes
```

It uses the service key from `.env.local` and makes no schema changes. It:

1. creates the inactive historical stands from `stands.csv` that don't exist yet
2. inserts each hunt into `hunt_logs`, with its `hunt_sightings` and, for harvests, a
   `hunt_harvests` row (gender, antler points, and the original description in recovery notes)
3. appends each loaded hunt to `loaded.csv` (`source_ref` -> `hunt_log_id`) as it goes
4. recalculates every stand's statistics (total hunts, harvests, last hunted...) from the full
   hunt log, because the insert triggers would otherwise leave them wrong

How the data maps:
- Guests without a site account (Glenn, Ben) go under the shared, login-less **Guest** account.
  The notes start with `Guest: <name>`.
- Misses and hits not recovered are noted as `Shot outcome: ...` in the notes.
- When the old stand name differs from the current one, the notes say `Recorded as stand: <old name>`.
- `season` is the season's starting year. `hunting_season` (archery/blackpowder/gun) stays
  empty until `season_calendar` has dates for 2018-2024.

Re-running is safe. Rows already in `loaded.csv` are skipped, and so is any hunt that already
exists with the same date, AM/PM, hunter and stand.

Rollback: delete the `hunt_logs` ids in `loaded.csv` (sightings and harvests are deleted with
them), delete the inactive stands the load created, then run
`load-history.js --recalc-only --apply` to recalculate stand statistics.

## Season dates and weather

```bash
NODE_PATH=node_modules node scripts/history/load-seasons.js [--apply]   # season_calendar 2018-2024 + label hunts
node scripts/history/backfill-weather.js [--apply] [--limit N]         # Visual Crossing weather for old hunt dates
```

- `season-dates.csv` holds the NC central-zone deer seasons for 2018-2024, with the source and
  confidence of each row. 2019 is estimated (no published source found).
- The weather backfill fetches each hunt date plus the day before it (for pressure trend). It costs
  24 Visual Crossing records per day, so it runs 38 days at a time to stay under the free tier's
  1000/day. Run it once a day until it reports 0 remaining.

## Corrections

Each row in `corrections.csv` is `source_ref, field, value, reason`. Fields:

| field | effect |
|---|---|
| `skip` | drop the row (form tests, duplicates, entries that didn't happen) |
| `shot_outcome` | `harvest`, `miss` or `wounded_not_recovered` |
| `harvest_description` | e.g. `8pt`, `doe`, `button buck` |
| `sightings` | replace the sightings text, parsed like the 2018-2020 sheets |
| `hunt_date`, `stand`, `hunter`, `notes`, ... | override that column |

## Adding more history later

If more records turn up (for example, the rest of 2022 or any of 2024):

1. Export the source to CSV under `raw/` without editing it. Use a new file and never
   change an existing one, because that would shift the `source_ref` row numbers.
2. If the source has a new layout, add a reader for it in `scripts/history/build-history.js`.
3. Add any new stand or hunter names to `stands.csv` / `hunters.csv`.
4. Run with `--check` until it reports no problems, then build and load. Rows already in
   the database are skipped by `source_ref`.

## Decisions (2026-11-15)

- Stands have moved over the years and nobody recorded when, so history links to each
  stand's current record. Per-stand statistics therefore mix old and new locations.
- The 2023 "New Field Stand" is today's Wild West Stand (moved across Hogan's in 2026).
  The old "Swamp Road Stand" is today's Mrs Herrs Ridge Stand.
- "Trail Stand" (2018-19) and "(Old) Trail Stand (bottom of field)" are one stand.
  "(New) Trail Stand" (2020-21) and "New Trail Stand" (2023) are one stand, which sat over
  what is now the Bale Blind field.
- Stands that no longer exist become inactive stands, so their history stays attached:
  Old Trail Stand, New Trail Stand, Daniel's Stand, Swamp Stand, Red Blind, Black Blind,
  Popup Blind.
- Guest hunters are included. Glenn and Ben have no site account.
- 2022 is mostly missing data, not a slow season. Treat it as incomplete in any analysis.
- Three harvests that appeared only in the form responses (Graham 10/22/2021,
  Jim 12/4/2021, Jim 9/13/2023) were test entries and are skipped. Jim's 10/20/2023 harvest
  is real (gut shot, recovered after tracking).
- The calendar puts Jim's 2025-10-17 harvest at Penny Loafer, but it was actually at Mrs Herrs
  Ridge ground blind, as the site has it. (2025 isn't imported from here, so this is only a note.)
