# Known Issues & Technical Debt

This document tracks known issues, limitations, and technical debt that need to be addressed in future work.

## Camera System

### CameraCardV2 Implementation Status
**Status:** ✅ Complete - Ready for Production
**Last Updated:** 2025-11-05

CameraCardV2 is fully implemented with three display modes (Full, Compact, List). All features working except for the timestamp issue below.

See `docs/refactoring/CARD_SYSTEM_V2_FINAL.md` for complete details.

### Camera Storage Space Misinterpretation
**Status:** Bug — Requires Fix in Sync Script
**Priority:** Medium
**Location:** `scripts/sync-cuddeback-cameras.js` (scraper parsing logic)

**Issue:**
Free storage space is being stored incorrectly. The app shows e.g. "289 MB free" when the Cuddeback site (authority) shows "28.9 GB free". The `sd_free_space_mb` field stores in MB, but the scraper appears to be stripping the decimal point from the GB value and storing the raw digits as MB (e.g. "28.9 GB" → strips dot → "289" → stored as 289 MB instead of 28,900 MB).

**Next Steps:**
- Inspect scraper parsing of the storage column
- Fix unit conversion: if value is in GB, multiply by 1024 before storing as MB
- Re-sync after fix to refresh stored values

---

---

## Stand Management

### Stand Activity Statistics Accuracy
**Status:** Root cause found 2026-11-15 - trigger fix not yet done
**Priority:** Medium
**Location:** `stands` table (columns: `total_hunts`, `total_harvests`, `last_hunted`, `last_harvest`, `success_rate`)

**Issue:**
Stand activity statistics (total_hunts, total_harvests, success_rate) are showing unexpected values that don't align with actual hunt log data. When querying stand records, the counts and dates don't match expectations based on known hunt activity.

**Potential Causes:**
1. Automatic trigger logic (`update_stand_activity_on_hunt_insert`, `update_stand_activity_on_hunt_update`, `update_stand_activity_on_hunt_delete`) may have bugs or edge cases
2. Historical data migration may have incorrectly initialized counters
3. Manual database edits may have bypassed trigger updates
4. Deleted/corrected hunt logs may not have properly decremented counters

**Next Steps:**
- Audit all hunt_logs entries grouped by stand_id to calculate expected totals
- Compare expected values against actual stand statistics
- Identify discrepancies and determine root cause
- Consider adding database function to recalculate all stand statistics from hunt_logs
- Add validation checks or scheduled jobs to detect drift between hunt_logs and stand statistics

**Root cause (found 2026-11-15 during the history import):**
1. Two AFTER INSERT triggers on `hunt_logs` both update the same counters. `trigger_update_stand_activity` (`update_stand_activity_on_hunt`) and `update_stand_stats` (`update_stand_stats_from_hunt`) each add 1 to `stands.total_hunts`, so every hunt is counted twice.
2. `update_stand_activity_on_hunt` has no DELETE handling, so deleted hunts (including test hunts) are never subtracted.
3. `total_hunts + 1` stays NULL when the column is NULL, so stands created with NULL totals never count anything.
4. `update_stand_activity_on_hunt` sets `last_hunted` / `last_hunted_by` to the inserted hunt even when it is older than the current value.

Before the fix, stored totals were far off. For example, Jimmy's Ridge had 28 stored vs 1 actual, and Creek Stand 32 vs 3.

**Current state:** All stand statistics were recalculated from `hunt_logs` on 2026-11-15 (`node scripts/history/load-history.js --recalc-only --apply` does this again at any time). They will drift again with new hunts until the triggers are fixed. That fix (drop one trigger, handle DELETE, COALESCE NULLs, only move `last_hunted` forward) is a database function change and must follow the schema-change process in CLAUDE.md.

**Workaround:**
Query hunt_logs directly for accurate counts (the stand cards already do), or re-run the recalculation above.

---

## Supabase Security Advisor — Persistent Warnings

### Leaked Password Protection (HaveIBeenPwned)
**Status:** Won't Fix — Pro Plan Required
**Last Reviewed:** 2026-04-08

Supabase's "Leaked Password Protection" feature checks passwords against HaveIBeenPwned.org. Enabling it requires a Pro Plan subscription. This project uses the free tier and will not be upgrading. This warning will remain permanently in the Security Advisor.

### Postgres Version Security Patches
**Status:** Upgrade In Progress (as of 2026-04-08)

Supabase flagged `supabase-postgres-17.4.1.043` as having outstanding security patches. A platform upgrade was initiated via the Supabase dashboard on 2026-04-08. Once complete, this warning should clear automatically.

---

## Template for New Issues

### [Issue Title]
**Status:** [Known Limitation | Bug | Tech Debt | Enhancement]
**Priority:** [High | Medium | Low]
**Location:** `[file:line]`

**Issue:** [Description]

**Next Steps:** [Action items]
