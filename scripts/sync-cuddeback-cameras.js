#!/usr/bin/env node

/**
 * 🎯 Cuddeback Camera Data Sync Script - Production Version
 * 
 * Automates daily extraction of camera data from Cuddeback web interface
 * and syncs to Supabase database for the hunting club management system.
 * 
 * Usage: node scripts/sync-cuddeback-cameras.js
 * Environment Variables Required:
 * - CUDDEBACK_EMAIL: Login email for Cuddeback account
 * - CUDDEBACK_PASSWORD: Password for Cuddeback account  
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for database access
 * - DEBUG_MODE: Enable verbose logging (optional)
 */

// Add this line for local testing
require('dotenv').config({ path: '.env.local' });

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// Configuration
const CONFIG = {
  CUDDEBACK_LOGIN_URL: 'https://camp.cuddeback.com/Identity/Account/Login',
  SYNC_TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  DEBUG: process.env.DEBUG_MODE === 'true'
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Logging utilities
 */
const logger = {
  info: (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${msg}`);
  },
  debug: (msg) => {
    if (CONFIG.DEBUG) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${msg}`);
    }
  },
  error: (msg, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${msg}`);
    if (error) console.error(error);
  },
  warn: (msg) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${msg}`);
  }
};

// Parse numeric values safely
const parseIntSafe = (value) => {
  if (!value || value === 'N/A' || value === '-') return null;
    const parsed = parseInt(value.replace(/[^\d]/g, ''));
    return isNaN(parsed) ? null : parsed;
};

/**
 * Main sync function
 */
async function syncCuddebackCameras() {
  let browser = null;
  const syncResults = {
    timestamp: new Date().toISOString(),
    success: false,
    cameras_processed: 0,
    cameras_updated: 0,
    hardware_updated: 0,
    cuddeback_report_time: null,
    errors: [],
    warnings: [],
    raw_data: []
  };

  try {
    logger.info('🎯 Starting Cuddeback camera data sync');
    
    // 1. Launch browser and extract camera data
    logger.info('🌐 Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const extractionResult = await extractCuddebackData(browser);
    syncResults.raw_data = extractionResult.cameras;
    syncResults.cameras_processed = extractionResult.cameras.length;
    syncResults.cuddeback_report_time = extractionResult.lastUpdated;

    logger.info(`📊 Extracted data for ${extractionResult.cameras.length} cameras from Cuddeback`);
    logger.info(`🕒 Cuddeback report last updated: ${extractionResult.lastUpdated}`);

    // 2. Get current database state
    logger.info('🗄️ Loading current camera database state...');
    const { data: deployments, error: dbError } = await supabase
      .from('camera_deployments')
      .select(`
        *,
        hardware:camera_hardware(*)
      `)
      .eq('active', true);

    if (dbError) {
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    logger.debug(`Found ${deployments?.length || 0} active camera deployments in database`);

    // 3. Match and sync camera data
    const updateResults = await syncCameraData(extractionResult.cameras, deployments || [], extractionResult.lastUpdated);
    syncResults.cameras_updated = updateResults.status_reports_updated;
    syncResults.hardware_updated = updateResults.hardware_updated;
    syncResults.warnings = updateResults.warnings;

    // 4. NEW: Create daily snapshots 
    const snapshotsCreated = await createDailySnapshots(extractionResult.cameras, deployments || []);
    syncResults.snapshots_created = snapshotsCreated;  // Add this tracking
    logger.info(`📸 Created ${snapshotsCreated} daily camera snapshots`);

    // 5. Run missing camera detection
    logger.info('🔍 Running missing camera detection...');
    const { error: detectionError } = await supabase.rpc('detect_missing_cameras', {
      check_date: new Date().toISOString().split('T')[0]
    });

    if (detectionError) {
      logger.warn(`Missing camera detection failed: ${detectionError.message}`);
      syncResults.warnings.push(`Missing detection failed: ${detectionError.message}`);
    }

    syncResults.success = true;
    logger.info(`✅ Sync completed successfully!`);
    logger.info(`📊 Updated ${syncResults.cameras_updated} status reports, ${syncResults.hardware_updated} hardware records`);

  } catch (error) {
    logger.error('❌ Sync failed with error:', error);
    syncResults.errors.push(error.message);
    syncResults.success = false;
  } finally {
    if (browser) {
      await browser.close();
      logger.debug('🌐 Browser closed');
    }
  }

  // 6. Save results and exit
  await saveResults(syncResults);
  
  if (!syncResults.success) {
    process.exit(1);
  }

  logger.info('🎉 Cuddeback camera sync completed successfully');
}

/**
 * Extract camera data from Cuddeback web interface using dynamic navigation
 */
async function extractCuddebackData(browser) {
  const page = await browser.newPage();
  
  try {
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    logger.info('🔐 Logging into Cuddeback...');
    
    // Navigate to login page
    await page.goto(CONFIG.CUDDEBACK_LOGIN_URL, { waitUntil: 'networkidle2' });
    
    // Find and fill login fields using multiple selectors
    logger.debug('🔍 Looking for login form...');
    
    let emailField = null;
    let passwordField = null;
    
    // Try multiple selectors for email field
    const emailSelectors = ['input[type="email"]', 'input[name*="mail"]', 'input[name*="Email"]', 'input[name*="username"]', 'input[name*="Username"]'];
    for (const selector of emailSelectors) {
      emailField = await page.$(selector);
      if (emailField) {
        logger.debug(`✅ Found email field with selector: ${selector}`);
        break;
      }
    }
    
    // Try multiple selectors for password field
    const passwordSelectors = ['input[type="password"]', 'input[name*="password"]', 'input[name*="Password"]'];
    for (const selector of passwordSelectors) {
      passwordField = await page.$(selector);
      if (passwordField) {
        logger.debug(`✅ Found password field with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailField || !passwordField) {
      throw new Error('Login form not found - could not locate email/password fields');
    }
    
    // Clear fields and enter credentials
    logger.debug('📝 Filling in credentials...');
    await emailField.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await emailField.type(process.env.CUDDEBACK_EMAIL, { delay: 50 });
    
    await passwordField.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await passwordField.type(process.env.CUDDEBACK_PASSWORD, { delay: 50 });
    
    // Find and click submit button
    logger.debug('🔍 Looking for submit button...');
    const submitButton = await page.$('button[type="submit"], input[type="submit"], .btn-primary');
    
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    
    // Submit the form
    logger.debug('🚀 Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      submitButton.click()
    ]);
    
    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('Login')) {
      throw new Error('Login failed - still on login page');
    }
    
    logger.info('✅ Login successful, navigating to device report...');
    
    // Use dynamic navigation to find Report link (from your working script)
    logger.debug('🔍 Looking for Report navigation link...');
    
    let deviceReportUrl = null;
    
    // Try clicking on "Report" link specifically
    try {
      const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const reportLink = links.find(l => l.textContent && l.textContent.includes('Report'));
        if (reportLink) {
          reportLink.click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        logger.debug(`📍 Navigated via "Report" to: ${page.url()}`);
        
        const hasTable = await page.$('table') !== null;
        if (hasTable) {
          deviceReportUrl = page.url();
          logger.info('✅ Found device report via "Report" link!');
        }
      }
    } catch (e) {
      logger.debug('❌ Report link click failed, trying alternative navigation...');
    }
    
    // Fallback: try other navigation approaches
    if (!deviceReportUrl) {
      logger.debug('🔍 Trying alternative navigation methods...');
      
      const navigationLinks = await page.evaluate(() => {
        const links = [];
        const allLinks = document.querySelectorAll('a');
        
        for (let i = 0; i < allLinks.length; i++) {
          const link = allLinks[i];
          const text = link.textContent ? link.textContent.trim() : '';
          const href = link.href || '';
          
          if (text && (
            text.toLowerCase().includes('device') ||
            text.toLowerCase().includes('camera') ||
            text.toLowerCase().includes('report') ||
            text.toLowerCase().includes('status')
          )) {
            links.push({ text, href });
          }
        }
        
        return links;
      });
      
      logger.debug(`Found ${navigationLinks.length} potential navigation links`);
      
      // Try promising links
      const priorityTerms = ['report', 'device report', 'camera report', 'device', 'camera'];
      
      for (const term of priorityTerms) {
        const matchingLink = navigationLinks.find(link => 
          link.text.toLowerCase().includes(term)
        );
        
        if (matchingLink) {
          try {
            logger.debug(`🔗 Trying to click on: "${matchingLink.text}"`);
            
            await page.evaluate((linkText) => {
              const links = Array.from(document.querySelectorAll('a'));
              const link = links.find(l => l.textContent.includes(linkText));
              if (link) {
                link.click();
                return true;
              }
              return false;
            }, matchingLink.text);
            
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            
            const hasTable = await page.$('table') !== null;
            const hasCameraData = await page.evaluate(() => {
              const headers = Array.from(document.querySelectorAll('th'));
              return headers.some(th => {
                const text = th.textContent ? th.textContent.toLowerCase() : '';
                return text.includes('camera') || text.includes('battery') || text.includes('level') || text.includes('location');
              });
            });
            
            if (hasTable && hasCameraData) {
              deviceReportUrl = page.url();
              logger.info(`✅ Found device report page via navigation: ${deviceReportUrl}`);
              break;
            }
            
          } catch (e) {
            logger.debug(`❌ Failed to navigate via "${matchingLink.text}": ${e.message}`);
            continue;
          }
        }
      }
    }
    
    if (!deviceReportUrl) {
      throw new Error('Could not locate device report page via any navigation method');
    }

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 30000 });

    logger.info('📋 Extracting camera data from device report...');

    // Extract "Last Updated" timestamp and camera data
    const extractionResult = await page.evaluate(() => {
      // Find "Last Updated" text on page
      let lastUpdated = null;
      const allText = document.body.textContent || '';
      const lastUpdatedMatch = allText.match(/Last Updated[:\s]*([^<\n]+)/i);
      if (lastUpdatedMatch) {
        lastUpdated = lastUpdatedMatch[1].trim();
      }

      // Extract camera data from table
      const cameras = [];
      const table = document.querySelector('table');
      if (!table) return { cameras: [], lastUpdated };

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = Array.from(row.querySelectorAll('td'));
        
        // Expecting 13 columns as specified
        if (cells.length >= 10) {
          const camera = {
            sequence_number: cells[0] ? cells[0].textContent.trim() : '',
            location_id: cells[1] ? cells[1].textContent.trim() : '',      // This maps to device_id
            camera_id: cells[2] ? cells[2].textContent.trim() : '',
            level: cells[3] ? cells[3].textContent.trim() : '',            // Signal level
            links: cells[4] ? cells[4].textContent.trim() : '',            // Network links
            battery: cells[5] ? cells[5].textContent.trim() : '',          // Battery level (don't normalize)
            battery_days: cells[6] ? cells[6].textContent.trim() : '',     // Battery days remaining
            image_queue: cells[7] ? cells[7].textContent.trim() : '',      // Images queued for upload
            sd_images: cells[8] ? cells[8].textContent.trim() : '',        // Images on SD card
            sd_free_space: cells[9] ? cells[9].textContent.trim() : '',    // SD free space
            hw_version: cells[10] ? cells[10].textContent.trim() : '',     // Hardware version
            fw_version: cells[11] ? cells[11].textContent.trim() : '',     // Firmware version
            cl_version: cells[12] ? cells[12].textContent.trim() : '',     // CuddeLink version
            extracted_at: new Date().toISOString()
          };
          
          cameras.push(camera);
        }
      }
      
      return { cameras, lastUpdated };
    });

    logger.info(`📊 Successfully extracted ${extractionResult.cameras.length} camera records`);
    logger.info(`🕒 Report last updated: ${extractionResult.lastUpdated}`);
    
    if (CONFIG.DEBUG) {
      logger.debug('📋 Sample camera data:');
      if (extractionResult.cameras.length > 0) {
        logger.debug(JSON.stringify(extractionResult.cameras[0], null, 2));
      }
    }
    
    return extractionResult;

  } catch (error) {
    logger.error('Failed to extract Cuddeback data:', error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Sync extracted camera data with Supabase database
 */
async function syncCameraData(cuddebackData, deployments, cuddebackReportTime) {
  const results = {
    status_reports_updated: 0,
    hardware_updated: 0,
    warnings: []
  };

  logger.info('🔄 Starting database sync...');

  for (const cameraItem of cuddebackData) {
    try {
      // Find matching deployment by location_id -> device_id
      const deployment = deployments.find(d => 
        d.hardware?.device_id === cameraItem.location_id
      );

      if (!deployment) {
        logger.warn(`⚠️ No database record found for device ${cameraItem.location_id}`);
        results.warnings.push(`Unknown device: ${cameraItem.location_id} (${cameraItem.camera_id})`);
        continue;
      }

      // // Parse numeric values safely
      // const parseIntSafe = (value) => {
      //   if (!value || value === 'N/A' || value === '-') return null;
      //   const parsed = parseInt(value.replace(/[^\d]/g, ''));
      //   return isNaN(parsed) ? null : parsed;
      // };

      // Parse signal level (could be percentage or text)
      let signalLevel = null;
      if (cameraItem.level && !cameraItem.level.includes('N/A')) {
        const signalMatch = cameraItem.level.match(/(\d+)/);
        if (signalMatch) {
          signalLevel = parseInt(signalMatch[1]);
        }
      }

      // Create status report with all available data
      const reportData = {
        deployment_id: deployment.id,
        hardware_id: deployment.hardware_id,
        report_date: new Date().toISOString().split('T')[0],
        battery_status: cameraItem.battery || null,  // Keep original, don't normalize
        signal_level: signalLevel,
        network_links: parseIntSafe(cameraItem.links),
        sd_images_count: parseIntSafe(cameraItem.sd_images),
        sd_free_space_mb: parseIntSafe(cameraItem.sd_free_space),
        image_queue: parseIntSafe(cameraItem.image_queue),
        cuddeback_report_timestamp: cuddebackReportTime ? new Date(cuddebackReportTime).toISOString() : null,
        report_processing_date: new Date().toISOString()
      };

      // Insert/update status report using separate logic
      // First, check if record exists
      const { data: existingReport } = await supabase
        .from('camera_status_reports')
        .select('id')
        .eq('deployment_id', deployment.id)
        .eq('report_date', reportData.report_date)
        .single();

      let reportError = null;
      
      if (existingReport) {
        // Update existing record
        const { error } = await supabase
          .from('camera_status_reports')
          .update(reportData)
          .eq('deployment_id', deployment.id)
          .eq('report_date', reportData.report_date);
        reportError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('camera_status_reports')
          .insert(reportData);
        reportError = error;
      }

      if (reportError) {
        logger.error(`Failed to update status for ${cameraItem.location_id}:`, reportError);
        results.warnings.push(`Status update failed for ${cameraItem.location_id}: ${reportError.message}`);
        continue;
      }

      results.status_reports_updated++;
      logger.debug(`✅ Updated status report for ${cameraItem.location_id} (${cameraItem.camera_id})`);

      // Update hardware information if versions have changed
      const hardwareUpdates = {};
      if (cameraItem.hw_version && cameraItem.hw_version !== deployment.hardware.hw_version) {
        hardwareUpdates.hw_version = cameraItem.hw_version;
      }
      if (cameraItem.fw_version && cameraItem.fw_version !== deployment.hardware.fw_version) {
        hardwareUpdates.fw_version = cameraItem.fw_version;
      }
      if (cameraItem.cl_version && cameraItem.cl_version !== deployment.hardware.cl_version) {
        hardwareUpdates.cl_version = cameraItem.cl_version;
      }

      if (Object.keys(hardwareUpdates).length > 0) {
        hardwareUpdates.updated_at = new Date().toISOString();
        
        const { error: hardwareError } = await supabase
          .from('camera_hardware')
          .update(hardwareUpdates)
          .eq('id', deployment.hardware_id);

        if (hardwareError) {
          logger.warn(`Failed to update hardware for ${cameraItem.location_id}:`, hardwareError);
        } else {
          results.hardware_updated++;
          logger.debug(`✅ Updated hardware info for ${cameraItem.location_id}`);
        }
      }

      // Update deployment last_seen_date
      const { error: deploymentError } = await supabase
        .from('camera_deployments')
        .update({
          last_seen_date: new Date().toISOString().split('T')[0],
          is_missing: false,
          consecutive_missing_days: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', deployment.id);

      if (deploymentError) {
        logger.warn(`Failed to update deployment for ${cameraItem.location_id}:`, deploymentError);
      }

    } catch (error) {
      logger.error(`Error processing camera ${cameraItem.location_id}:`, error);
      results.warnings.push(`Processing error for ${cameraItem.location_id}: ${error.message}`);
    }
  }

  logger.info(`🔄 Database sync complete. Updated ${results.status_reports_updated} status reports, ${results.hardware_updated} hardware records`);
  return results;
}

/**
 * Create simple daily camera snapshots using ACTUAL Cuddeback fields
 */
async function createDailySnapshots(cuddebackData, deployments) {
  const today = new Date().toISOString().split('T')[0];
  let snapshotsCreated = 0;
  
  logger.info('📸 Creating daily camera snapshots...');
  
  for (const cameraItem of cuddebackData) {
    try {
      // Find matching deployment
      const deployment = deployments.find(d => 
        d.hardware?.device_id === cameraItem.location_id
      );
      
      if (!deployment) {
        continue; // Skip unknown devices
      }
      
      const deviceId = cameraItem.location_id;
      const currentImages = parseIntSafe(cameraItem.sd_images);
      
      // Get yesterday's image count for comparison
      const { data: previousSnapshot } = await supabase
        .from('daily_camera_snapshots')
        .select('sd_images_count')
        .eq('camera_device_id', deviceId)
        .lt('date', today)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      const previousImages = previousSnapshot?.sd_images_count || null;
      const imagesAddedToday = (currentImages && previousImages) ? 
        Math.max(0, currentImages - previousImages) : 0;
      
      // Simple trend calculation
      let activityTrend = 'insufficient_data';
      if (currentImages && previousImages) {
        const difference = currentImages - previousImages;
        if (difference > 5) activityTrend = 'increasing';
        else if (difference < -2) activityTrend = 'decreasing';  
        else activityTrend = 'stable';
      }
      
      // Create snapshot record using ONLY available Cuddeback fields
      const snapshotData = {
        date: today,
        camera_device_id: deviceId,
        collection_timestamp: new Date().toISOString(),
        
        // ACTUAL Cuddeback fields:
        battery_status: cameraItem.battery || null,
        signal_level: parseIntSafe(cameraItem.level),
        temperature: null,                    // NOT available from Cuddeback
        sd_images_count: currentImages,
        last_image_timestamp: null,           // NOT available from Cuddeback
        
        // No GPS/location tracking (as requested):
        current_coordinates: null,
        previous_coordinates: null,
        location_changed: false,
        distance_moved_meters: null,
        
        // Simple activity tracking:
        activity_score: null,                 // Not using scoring system
        activity_trend: activityTrend,
        images_added_today: imagesAddedToday,
        peak_activity_hour: null,             // Not calculating
        data_source_quality: 100,
        processing_notes: null
      };
      
      // Upsert snapshot (PostgreSQL/Supabase supports this)
      const { error } = await supabase
        .from('daily_camera_snapshots')
        .upsert(snapshotData, { 
          onConflict: 'date,camera_device_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        logger.error(`Failed to create snapshot for device ${deviceId}: ${error.message}`);
      } else {
        snapshotsCreated++;
        logger.debug(`✅ Snapshot created for ${deviceId}: ${imagesAddedToday} images added (${activityTrend})`);
      }
      
    } catch (error) {
      logger.error(`Error creating snapshot for ${cameraItem.location_id}:`, error);
    }
  }
  
  return snapshotsCreated;
}

/**
 * Save sync results to files
 */
async function saveResults(results) {
  try {
    // Save detailed results as JSON
    await fs.writeFile('sync-results.json', JSON.stringify(results, null, 2));
    
    // Save simple log file
    const logLines = [
      `Sync Timestamp: ${results.timestamp}`,
      `Success: ${results.success}`,
      `Cuddeback Report Time: ${results.cuddeback_report_time}`,
      `Cameras Processed: ${results.cameras_processed}`,
      `Status Reports Updated: ${results.cameras_updated}`,
      `Hardware Records Updated: ${results.hardware_updated}`,
      `Warnings: ${results.warnings.length}`,
      `Errors: ${results.errors.length}`,
      '',
      'Warnings:',
      ...results.warnings.map(w => `  - ${w}`),
      '',
      'Errors:',
      ...results.errors.map(e => `  - ${e}`)
    ];
    
    await fs.writeFile('sync-log.txt', logLines.join('\n'));
    
    logger.debug('📁 Results saved to sync-results.json and sync-log.txt');
  } catch (error) {
    logger.error('Failed to save results:', error);
  }
}

// Error handling for uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the sync if this script is executed directly
if (require.main === module) {
  syncCuddebackCameras().catch(error => {
    logger.error('Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { syncCuddebackCameras };
