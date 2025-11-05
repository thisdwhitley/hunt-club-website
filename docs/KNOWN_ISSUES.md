# Known Issues & Technical Debt

This document tracks known issues, limitations, and technical debt that need to be addressed in future work.

## Camera System

### Camera "Report Data From" Timestamp Accuracy
**Status:** Known Limitation - Requires Investigation
**Priority:** Medium
**Location:** `src/app/management/cameras-preview/page.tsx:89-108`, `src/components/cameras/CameraCardV2.tsx:162-189`

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

## Template for New Issues

### [Issue Title]
**Status:** [Known Limitation | Bug | Tech Debt | Enhancement]
**Priority:** [High | Medium | Low]
**Location:** `[file:line]`

**Issue:** [Description]

**Next Steps:** [Action items]
