# Known Issues & Technical Debt

This document tracks known issues, limitations, and technical debt that need to be addressed in future work.

## Camera System

### CameraCardV2 Implementation Status
**Status:** ✅ Complete - Ready for Production
**Last Updated:** 2025-11-05

CameraCardV2 is fully implemented with three display modes (Full, Compact, List). All features working except for the timestamp issue below.

See `docs/refactoring/CARD_SYSTEM_V2_FINAL.md` for complete details.

### Camera "Report Data From" Timestamp Accuracy
**Status:** Known Limitation - Requires Investigation
**Priority:** Medium
**Location:** `src/app/management/cameras-preview/page.tsx:90-108`, `src/components/cameras/CameraCardV2.tsx:162-189`

**Issue:**
The "Report Data From" field (showing "X days ago") is currently **suspect and unreliable**.

**Root Cause:**
Camera data is currently sourced from webpage scraping, which populates timestamps with current dates even for non-deployed cameras. This makes all timestamp fields unreliable for calculating report age.

**Accurate Data Source:**
Daily email reports provide accurate "last seen" information.

**Options to Investigate:**
1. Parse daily email reports instead of webpage scraping
2. Check if camera vendor provides an API or alternative data export
3. Set up email forwarding to a parseable address for automated ingestion
4. Investigate why webpage always shows current dates

**Next Steps:**
- Analyze the daily email report format
- Investigate camera vendor's data export options
- Determine most reliable automated approach

---

## Stand Management

### Stand Activity Statistics Accuracy
**Status:** Known Limitation - Requires Investigation
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

**Workaround:**
Query hunt_logs directly for accurate counts until stand statistics are verified and corrected.

---

## Template for New Issues

### [Issue Title]
**Status:** [Known Limitation | Bug | Tech Debt | Enhancement]
**Priority:** [High | Medium | Low]
**Location:** `[file:line]`

**Issue:** [Description]

**Next Steps:** [Action items]
