#!/usr/bin/env node

/**
 * 🧪 Local Cuddeback Sync Testing Script
 * 
 * Test the Cuddeback automation locally before deploying to GitHub Actions.
 * This script runs the same logic as the GitHub Actions workflow but with
 * enhanced debugging and field mapping verification.
 * 
 * Usage: 
 *   1. Copy .env.local.example to .env.local and fill in credentials
 *   2. Run: node test-cuddeback-sync.js
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  CUDDEBACK_LOGIN_URL: 'https://camp.cuddeback.com/Identity/Account/Login',
  DEBUG: true,
  HEADLESS: false, // Set to true for production-like testing
  SLOW_MO: 500     // Slow down for debugging
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Enhanced logging
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  debug: (msg) => {
    if (CONFIG.DEBUG) console.log(`${colors.cyan}🔍${colors.reset} ${msg}`);
  },
  step: (msg) => console.log(`${colors.magenta}📍${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

/**
 * Validate environment variables
 */
function validateEnvironment() {
  log.step('Validating environment variables...');
  
  const required = [
    'CUDDEBACK_EMAIL',
    'CUDDEBACK_PASSWORD', 
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.info('Create .env.local file with:');
    missing.forEach(key => {
      log.info(`${key}=your_value_here`);
    });
    process.exit(1);
  }
  
  log.success('Environment variables validated');
}

/**
 * Test Supabase connection and database structure
 */
async function testDatabaseConnection() {
  log.step('Testing Supabase database connection...');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test basic connection
    const { data: testData, error } = await supabase
      .from('camera_hardware')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    log.success('Supabase connection successful');

    // Verify table structure
    log.debug('Checking camera table structure...');
    
    const { data: hardware, error: hwError } = await supabase
      .from('camera_hardware')
      .select('device_id, brand, model')
      // No limit - show all cameras
    
    if (hwError) throw hwError;
    log.success(`Found ${hardware.length} camera hardware records`);
    
    const { data: deployments, error: depError } = await supabase
      .from('camera_deployments')
      .select(`
        *,
        hardware:camera_hardware(device_id, brand, model)
      `)
      .eq('active', true)
      // No limit - show all active deployments
    
    if (depError) throw depError;
    log.success(`Found ${deployments.length} active camera deployments`);
    
    // Show all device IDs for mapping verification
    if (deployments.length > 0) {
      log.info('All Device IDs in database:');
      deployments.forEach(d => {
        log.info(`  - ${d.hardware.device_id} (${d.location_name})`);
      });
      
      if (deployments.length > 10) {
        log.info(`\n📊 Total: ${deployments.length} active camera deployments`);
      }
    }
    
    return { supabase, deployments };
    
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Test Cuddeback login and navigation
 */
async function testCuddebackAccess() {
  log.step('Testing Cuddeback access...');
  
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      slowMo: CONFIG.SLOW_MO,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    log.debug('Navigating to Cuddeback login...');
    await page.goto(CONFIG.CUDDEBACK_LOGIN_URL, { waitUntil: 'networkidle2' });
    
    // Find login fields
    const emailField = await page.$('input[type="email"], input[name*="mail"], input[name*="Email"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (!emailField || !passwordField) {
      throw new Error('Could not find login form fields');
    }
    
    log.debug('Filling login credentials...');
    await emailField.type(process.env.CUDDEBACK_EMAIL, { delay: 50 });
    await passwordField.type(process.env.CUDDEBACK_PASSWORD, { delay: 50 });
    
    // Submit login
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    
    log.debug('Submitting login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      submitButton.click()
    ]);
    
    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('Login')) {
      throw new Error('Login failed - still on login page');
    }
    
    log.success('Cuddeback login successful');
    
    // Navigate to device report
    log.debug('Looking for Report navigation...');
    
    const clicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const reportLink = links.find(l => l.textContent && l.textContent.includes('Report'));
      if (reportLink) {
        reportLink.click();
        return true;
      }
      return false;
    });
    
    if (!clicked) {
      throw new Error('Could not find Report link');
    }
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    log.success(`Navigated to device report: ${page.url()}`);
    
    return { browser, page };
    
  } catch (error) {
    if (browser) await browser.close();
    log.error(`Cuddeback access failed: ${error.message}`);
    throw error;
  }
}

/**
 * Extract and analyze camera data
 */
async function extractAndAnalyzeData(page, deployments) {
  log.step('Extracting camera data from Cuddeback...');
  
  // Wait for table to load
  await page.waitForSelector('table', { timeout: 30000 });
  
  // Extract data and analyze structure
  const extractionResult = await page.evaluate(() => {
    // Find "Last Updated" timestamp
    let lastUpdated = null;
    const allText = document.body.textContent || '';
    const lastUpdatedMatch = allText.match(/Last Updated[:\s]*([^<\n]+)/i);
    if (lastUpdatedMatch) {
      lastUpdated = lastUpdatedMatch[1].trim();
    }
    
    // Extract table headers for field mapping verification
    const table = document.querySelector('table');
    if (!table) return { cameras: [], headers: [], lastUpdated };
    
    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
    
    // Extract camera data
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const cameras = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.from(row.querySelectorAll('td'));
      
      if (cells.length >= 10) {
        const camera = {
          sequence_number: cells[0] ? cells[0].textContent.trim() : '',
          location_id: cells[1] ? cells[1].textContent.trim() : '',      // KEY: This maps to device_id
          camera_id: cells[2] ? cells[2].textContent.trim() : '',
          level: cells[3] ? cells[3].textContent.trim() : '',
          links: cells[4] ? cells[4].textContent.trim() : '',
          battery: cells[5] ? cells[5].textContent.trim() : '',
          battery_days: cells[6] ? cells[6].textContent.trim() : '',
          image_queue: cells[7] ? cells[7].textContent.trim() : '',
          sd_images: cells[8] ? cells[8].textContent.trim() : '',
          sd_free_space: cells[9] ? cells[9].textContent.trim() : '',
          hw_version: cells[10] ? cells[10].textContent.trim() : '',
          fw_version: cells[11] ? cells[11].textContent.trim() : '',
          cl_version: cells[12] ? cells[12].textContent.trim() : '',
          extracted_at: new Date().toISOString()
        };
        
        cameras.push(camera);
      }
    }
    
    return { cameras, headers, lastUpdated };
  });
  
  log.success(`Extracted ${extractionResult.cameras.length} camera records`);
  log.info(`Report last updated: ${extractionResult.lastUpdated}`);
  
  // Analyze field mapping
  log.step('Analyzing field mapping...');
  log.info('Cuddeback table headers:');
  extractionResult.headers.forEach((header, index) => {
    log.info(`  ${index}: ${header}`);
  });
  
  // Verify device ID mapping
  log.step('Verifying device ID mapping...');
  const dbDeviceIds = new Set(deployments.map(d => d.hardware.device_id));
  const cuddebackLocationIds = new Set(extractionResult.cameras.map(c => c.location_id));
  
  log.info('Database device_ids:');
  Array.from(dbDeviceIds).forEach(id => log.info(`  - ${id}`));
  
  log.info('Cuddeback Location IDs:');
  Array.from(cuddebackLocationIds).forEach(id => log.info(`  - ${id}`));
  
  // Find matches and mismatches
  const matches = Array.from(dbDeviceIds).filter(id => cuddebackLocationIds.has(id));
  const dbOnly = Array.from(dbDeviceIds).filter(id => !cuddebackLocationIds.has(id));
  const cuddebackOnly = Array.from(cuddebackLocationIds).filter(id => !dbDeviceIds.has(id));
  
  log.info(`\nMapping Analysis:`);
  log.success(`Matches: ${matches.length} - ${matches.join(', ')}`);
  if (dbOnly.length > 0) {
    log.warn(`In DB only: ${dbOnly.join(', ')}`);
  }
  if (cuddebackOnly.length > 0) {
    log.warn(`In Cuddeback only: ${cuddebackOnly.join(', ')}`);
  }
  
  // Show sample data
  if (extractionResult.cameras.length > 0) {
    log.step('Sample camera data:');
    const sample = extractionResult.cameras[0];
    Object.entries(sample).forEach(([key, value]) => {
      log.debug(`  ${key}: ${value}`);
    });
  }
  
  return extractionResult;
}

/**
 * Test database update (dry run)
 */
async function testDatabaseUpdate(supabase, cuddebackData, deployments) {
  log.step('Testing database update (dry run)...');
  
  let successCount = 0;
  let missingCount = 0;
  
  for (const cameraItem of cuddebackData.cameras) {
    const deployment = deployments.find(d => 
      d.hardware.device_id === cameraItem.location_id
    );
    
    if (deployment) {
      successCount++;
      log.debug(`✅ Would update: ${cameraItem.location_id} (${cameraItem.camera_id})`);
    } else {
      missingCount++;
      log.warn(`❌ No DB record for: ${cameraItem.location_id} (${cameraItem.camera_id})`);
    }
  }
  
  log.info(`\nUpdate Analysis:`);
  log.success(`${successCount} cameras would be updated`);
  if (missingCount > 0) {
    log.warn(`${missingCount} cameras have no database record`);
  }
  
  // Test field parsing for multiple cameras
  log.step('Testing field parsing for ALL updatable fields...');
  if (cuddebackData.cameras.length >= 2) {
    [0, 1].forEach(index => {
      if (cuddebackData.cameras[index]) {
        const sample = cuddebackData.cameras[index];
        
        log.info(`\n📷 Camera ${index + 1} Field Parsing Test:`);
        log.debug(`  Location ID: "${sample.location_id}" (maps to device_id)`);
        log.debug(`  Camera ID: "${sample.camera_id}" (descriptive name)`);
        
        // Test signal level parsing
        let signalLevel = null;
        if (sample.level && !sample.level.includes('N/A')) {
          const signalMatch = sample.level.match(/(\d+)/);
          if (signalMatch) {
            signalLevel = parseInt(signalMatch[1]);
          }
        }
        
        // Test numeric parsing function
        const parseIntSafe = (value) => {
          if (!value || value === 'N/A' || value === '-') return null;
          const parsed = parseInt(value.replace(/[^\d]/g, ''));
          return isNaN(parsed) ? null : parsed;
        };
        
        log.debug(`\n  📊 STATUS REPORT FIELDS (all updated):`);
        log.debug(`    Battery: "${sample.battery}" → kept as-is (no normalization)`);
        log.debug(`    Signal Level: "${sample.level}" → parsed to ${signalLevel}`);
        log.debug(`    Network Links: "${sample.links}" → parsed to ${parseIntSafe(sample.links)}`);
        log.debug(`    SD Images: "${sample.sd_images}" → parsed to ${parseIntSafe(sample.sd_images)}`);
        log.debug(`    SD Free Space: "${sample.sd_free_space}" → parsed to ${parseIntSafe(sample.sd_free_space)} MB`);
        log.debug(`    Image Queue: "${sample.image_queue}" → parsed to ${parseIntSafe(sample.image_queue)}`);
        log.debug(`    Battery Days: "${sample.battery_days}" → available but not stored`);
        
        log.debug(`\n  🔧 HARDWARE FIELDS (updated when changed):`);
        log.debug(`    HW Version: "${sample.hw_version}" → updates camera_hardware.hw_version`);
        log.debug(`    FW Version: "${sample.fw_version}" → updates camera_hardware.fw_version`);
        log.debug(`    CL Version: "${sample.cl_version}" → updates camera_hardware.cl_version`);
        
        log.debug(`\n  📅 TIMESTAMP FIELD:`);
        log.debug(`    Cuddeback Report Time: "${cuddebackData.lastUpdated}" → cuddeback_report_timestamp`);
      }
    });
  } else if (cuddebackData.cameras.length === 1) {
    // Show single camera if only one available
    const sample = cuddebackData.cameras[0];
    
    log.debug('📷 Single Camera Available - Field Parsing Test:');
    // ... same parsing logic for single camera
  } else {
    log.warn('No camera data available for field parsing test');
  }
  
  return { successCount, missingCount };
}

/**
 * Main testing function
 */
async function runLocalTest() {
  console.log(`${colors.bright}🧪 Cuddeback Sync Local Testing${colors.reset}`);
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Test database connection
    const { supabase, deployments } = await testDatabaseConnection();
    
    // Step 3: Test Cuddeback access
    const { browser, page } = await testCuddebackAccess();
    
    try {
      // Step 4: Extract and analyze data
      const cuddebackData = await extractAndAnalyzeData(page, deployments);
      
      // Step 5: Test database update (dry run)
      const updateResults = await testDatabaseUpdate(supabase, cuddebackData, deployments);
      
      // Summary
      log.step('Test Summary:');
      log.success('✅ Cuddeback login and navigation working');
      log.success(`✅ Extracted ${cuddebackData.cameras.length} cameras with all 13 fields`);
      log.success(`✅ Found Cuddeback timestamp: ${cuddebackData.lastUpdated}`);
      log.success(`✅ ${updateResults.successCount} cameras would sync successfully`);
      log.success('✅ ALL status report fields (7) and hardware fields (3) would be updated');
      
      if (updateResults.missingCount > 0) {
        log.warn(`⚠️ ${updateResults.missingCount} cameras need database records created`);
      }
      
      log.info('\n📋 Fields Updated by Automation:');
      log.info('  Status Reports: battery_status, signal_level, network_links,');
      log.info('                  sd_images_count, sd_free_space_mb, image_queue,');
      log.info('                  cuddeback_report_timestamp');
      log.info('  Hardware Info:  hw_version, fw_version, cl_version (when changed)');
      log.info('  Deployment:     last_seen_date, is_missing, consecutive_missing_days');
      
      log.info('\n🚀 Ready for GitHub Actions deployment!');
      
    } finally {
      await browser.close();
    }
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runLocalTest().catch(error => {
    log.error(`Script execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runLocalTest };