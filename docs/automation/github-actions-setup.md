# 🎯 GitHub Actions - Cuddeback Sync Setup Documentation

## Overview
This document provides setup instructions for the automated daily Cuddeback camera data sync using GitHub Actions.

## Prerequisites
- ✅ GitHub repository with hunting club code
- ✅ Working Cuddeback account with access to device reports
- ✅ Supabase project with camera management system (15-field camera_status_reports table)
- ✅ Admin access to GitHub repository

## Required GitHub Secrets

The automation requires 4 secrets configured in your GitHub repository:

### CUDDEBACK_EMAIL
- **Purpose**: Login email for Cuddeback account
- **Format**: `your-email@example.com`
- **Source**: Your Cuddeback account login

### CUDDEBACK_PASSWORD
- **Purpose**: Password for Cuddeback account  
- **Format**: Your actual password (handle special characters carefully)
- **Source**: Your Cuddeback account password

### SUPABASE_URL
- **Purpose**: Supabase project connection URL
- **Format**: `https://your-project-id.supabase.co`
- **Source**: Supabase Dashboard → Settings → API → Project URL
- **Note**: Same as your `NEXT_PUBLIC_SUPABASE_URL`

### SUPABASE_SERVICE_ROLE_KEY
- **Purpose**: Service role key for full database access
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)
- **Source**: Supabase Dashboard → Settings → API → service_role (secret)
- **⚠️ Critical**: Use service_role key, NOT anon key

## Setup Instructions

### 1. Navigate to Repository Secrets
1. Go to your GitHub repository
2. Click **Settings** tab
3. Left sidebar: **Secrets and variables** → **Actions**

### 2. Add Each Secret
For each of the 4 secrets above:
1. Click **New repository secret**
2. Enter the exact **Name** (case-sensitive)
3. Paste the **Secret** value
4. Click **Add secret**

### 3. Verify Setup
After adding all secrets, you should see 4 entries:
- CUDDEBACK_EMAIL
- CUDDEBACK_PASSWORD
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Workflow Configuration

### Schedule
- **Automatic**: Daily at 6:00 AM EST (11:00 AM UTC)
- **Manual**: Can be triggered manually for testing
- **Cron**: `0 11 * * *`

### Features
- **All 13 Fields**: Complete Cuddeback data extraction
- **Smart Mapping**: Location ID → camera_hardware.device_id
- **Hardware Updates**: Versions updated when changed
- **Missing Detection**: Automatic after each sync
- **Error Alerts**: Creates GitHub issues on failures
- **Monitoring**: Detailed logs and artifacts

## Testing

### Manual Test Run
1. Go to **Actions** tab in GitHub
2. Find "🎯 Daily Cuddeback Camera Sync" workflow
3. Click **Run workflow**
4. Enable **debug logging**: `true`
5. Click green **Run workflow** button

### Expected Results
- ✅ Successful login to Cuddeback
- ✅ Navigation to device report page
- ✅ Extraction of all camera data (13 fields)
- ✅ Database updates in camera_status_reports
- ✅ Hardware version updates when changed
- ✅ Missing camera detection runs
- ✅ Sync artifacts uploaded

## Monitoring

### Workflow Status
- **Actions Tab**: Shows recent runs and status
- **Green Check**: Successful sync
- **Red X**: Failed sync (creates GitHub issue)

### Sync Artifacts
Each run uploads these files (retained for 7 days):
- `sync-results.json`: Detailed sync statistics
- `sync-log.txt`: Human-readable log

### Database Verification
```sql
-- Check recent status reports
SELECT COUNT(*) FROM camera_status_reports 
WHERE report_date >= CURRENT_DATE - INTERVAL '1 day';

-- Verify Cuddeback timestamps
SELECT COUNT(*) FROM camera_status_reports 
WHERE cuddeback_report_timestamp IS NOT NULL
AND report_date >= CURRENT_DATE - INTERVAL '1 day';

-- Check all 13 fields captured
SELECT 
  ch.device_id,
  csr.battery_status,
  csr.signal_level,
  csr.network_links,
  csr.sd_images_count,
  csr.sd_free_space_mb,
  csr.image_queue,
  csr.cuddeback_report_timestamp,
  ch.hw_version,
  ch.fw_version,
  ch.cl_version
FROM camera_status_reports csr
JOIN camera_deployments cd ON csr.deployment_id = cd.id
JOIN camera_hardware ch ON cd.hardware_id = ch.id
WHERE csr.report_date = CURRENT_DATE
ORDER BY ch.device_id;
```

## Troubleshooting

### Common Issues

#### Login Failed
- Verify CUDDEBACK_EMAIL and CUDDEBACK_PASSWORD secrets
- Test login manually at https://camp.cuddeback.com
- Check for special characters in password

#### Database Connection Failed
- Verify SUPABASE_URL format (include https://)
- Ensure SUPABASE_SERVICE_ROLE_KEY is service role (not anon)
- Check Supabase project is active

#### No Data Extracted
- Verify cameras are reporting to Cuddeback
- Check device report page loads manually
- Review workflow logs for navigation issues

#### Device ID Mismatches
- Verify camera_hardware.device_id matches Cuddeback "Location ID"
- Check for missing camera records in database
- Review warnings in sync artifacts

### Debug Mode
Enable debug logging in manual workflow runs:
1. Run workflow manually
2. Set "Enable debug logging" to `true`
3. Review detailed logs for troubleshooting

## Security Notes

- 🔐 Never commit credentials to git
- 🔐 Service role key has full database access
- 🔐 Regularly audit secret access
- 🔐 Monitor workflow logs for credential exposure
- 🔐 Use GitHub's secret masking features

## Maintenance

### Regular Tasks
- Monitor daily workflow execution
- Review sync artifacts for warnings
- Check database for missing cameras
- Update credentials if changed

### Seasonal Tasks
- Update camera deployment records
- Verify device ID mappings
- Test manual workflow execution
- Review automation performance

## Success Metrics

The automation is working correctly when:
- ✅ Workflow runs daily at 6 AM EST without errors
- ✅ All cameras update status reports daily
- ✅ Cuddeback report timestamps captured
- ✅ Hardware versions update when changed
- ✅ Missing camera detection runs after sync
- ✅ No manual intervention required

---

**Last Updated**: Step 5.4 - GitHub Actions automation fully configured
**Next Maintenance**: Monitor first week of automated runs