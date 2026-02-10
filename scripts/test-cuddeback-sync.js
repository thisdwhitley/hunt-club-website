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
  // CUDDEBACK_LOGIN_URL: 'https://camp.cuddeback.com/Identity/Account/Login',
  CUDDEBACK_LOGIN_URL: 'https://camp.cuddeback.com/account/login',
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

    // Hide automation detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    log.debug('Navigating to Cuddeback login...');
    await page.goto(CONFIG.CUDDEBACK_LOGIN_URL, { waitUntil: 'networkidle2' });

    // Wait for page to fully render - try waiting for a form or input to appear
    log.debug('Waiting for login form to render...');

    // Try waiting for any visible input or form element
    try {
      await page.waitForSelector('input[type="email"], input[type="text"], input[type="password"], form', {
        visible: true,
        timeout: 15000
      });
      log.success('Found a form element!');
    } catch (e) {
      log.warn(`No form element appeared after 15 seconds: ${e.message}`);
    }

    // Extra wait for any late-loading JavaScript
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Debug: log page HTML structure
    const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
    log.debug('Page body HTML (first 2000 chars):');
    console.log(bodyHtml);

    // Check for iframes first
    const frames = page.frames();
    log.info(`Found ${frames.length} frames on page`);
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      log.debug(`  Frame ${i}: ${frame.url()}`);
    }

    // Try to find inputs in each frame
    let emailField = null;
    let passwordField = null;
    let targetFrame = page; // Default to main page

    // Check for Fluent UI web components (used by new Cuddeback site)
    log.info('Looking for Fluent UI web components...');

    // Try Fluent UI selectors first (new site uses these)
    const fluentEmailSelectors = [
      'fluent-text-field#username',
      'fluent-text-field[name="username"]',
      'fluent-text-field[type="email"]'
    ];
    const fluentPasswordSelectors = [
      'fluent-text-field#password',
      'fluent-text-field[name="password"]',
      'fluent-text-field[type="password"]'
    ];

    // Try Fluent UI components
    for (const selector of fluentEmailSelectors) {
      const field = await page.$(selector);
      if (field) {
        log.success(`Found Fluent email field with selector: ${selector}`);
        emailField = field;
        break;
      }
    }

    for (const selector of fluentPasswordSelectors) {
      const field = await page.$(selector);
      if (field) {
        log.success(`Found Fluent password field with selector: ${selector}`);
        passwordField = field;
        break;
      }
    }

    // Fallback to standard input selectors if Fluent UI not found
    if (!emailField || !passwordField) {
      log.debug('Fluent UI not found, trying standard inputs...');

      const emailSelectors = ['input[type="email"]', 'input[name*="mail"]', 'input[name*="Email"]', 'input[name*="username"]', 'input[type="text"]'];
      const passwordSelectors = ['input[type="password"]', 'input[name*="password"]', 'input[name*="Password"]'];

      for (const selector of emailSelectors) {
        const field = await page.$(selector);
        if (field) {
          const isVisible = await field.isVisible();
          if (isVisible && !emailField) {
            emailField = field;
            log.success(`Found email field with selector: ${selector}`);
            break;
          }
        }
      }

      for (const selector of passwordSelectors) {
        const field = await page.$(selector);
        if (field) {
          const isVisible = await field.isVisible();
          if (isVisible && !passwordField) {
            passwordField = field;
            log.success(`Found password field with selector: ${selector}`);
            break;
          }
        }
      }
    }

    if (!emailField || !passwordField) {
      // Debug: show what inputs exist on the page (including all frames)
      log.error('Could not find login fields. Dumping page structure...');

      for (const frame of frames) {
        try {
          const foundInputs = await frame.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            return inputs.map(i => ({
              type: i.type,
              name: i.name,
              id: i.id,
              placeholder: i.placeholder,
              className: i.className,
              visible: i.offsetParent !== null
            }));
          });
          log.error(`Inputs in frame "${frame.url().substring(0, 50)}...": ${JSON.stringify(foundInputs, null, 2)}`);
        } catch (e) {
          log.debug(`Could not get inputs from frame: ${e.message}`);
        }
      }

      log.error(`Current URL: ${page.url()}`);

      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-login-local.png', fullPage: true });
      log.info('Screenshot saved to debug-login-local.png');

      throw new Error('Could not find login form fields');
    }
    
    log.debug('Filling login credentials...');

    // For Fluent UI components in Blazor, we need to simulate real user interaction:
    // 1. Click to focus
    // 2. Type the value character by character (slower to trigger Blazor bindings)
    // 3. Use Tab to move between fields (triggers blur/change events)

    // Clear any existing content and fill email field
    await emailField.click();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Select all and delete any existing content
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Type email slowly to allow Blazor bindings to process
    await page.keyboard.type(process.env.CUDDEBACK_EMAIL, { delay: 80 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use Tab to move to password field (triggers blur event on email)
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Type password slowly
    await page.keyboard.type(process.env.CUDDEBACK_PASSWORD, { delay: 80 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Tab away from password field to trigger validation
    await page.keyboard.press('Tab');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Wait for Blazor to fully process and enable the submit button
    log.debug('Waiting for submit button to be enabled...');

    // Poll for button enabled state with timeout
    let buttonEnabled = false;
    for (let i = 0; i < 20; i++) {
      const buttonState = await page.evaluate(() => {
        const btn = document.querySelector('fluent-button[type="submit"]');
        return {
          disabled: btn?.hasAttribute('disabled'),
          className: btn?.className
        };
      });

      if (!buttonState.disabled) {
        buttonEnabled = true;
        log.success('Submit button is enabled');
        break;
      }

      log.debug(`Button still disabled (attempt ${i + 1}/20), waiting...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!buttonEnabled) {
      log.warn('Button still disabled after polling - attempting to enable it manually...');
      await page.evaluate(() => {
        const btn = document.querySelector('fluent-button[type="submit"]');
        if (btn) {
          btn.removeAttribute('disabled');
          btn.classList.remove('disabled');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get submit button reference
    let submitButton = await page.$('fluent-button[type="submit"]');
    if (!submitButton) {
      submitButton = await page.$('button[type="submit"]');
    }
    if (!submitButton) {
      submitButton = await page.$('input[type="submit"]');
    }
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    log.success('Found submit button');

    // Try multiple login submission strategies
    const loginStrategies = [
      {
        name: 'Button click',
        action: async () => {
          await submitButton.click();
        }
      },
      {
        name: 'Enter key on password field',
        action: async () => {
          await passwordField.click();
          await page.keyboard.press('Enter');
        }
      },
      {
        name: 'JavaScript click',
        action: async () => {
          await page.evaluate(() => {
            const btn = document.querySelector('fluent-button[type="submit"]');
            if (btn) btn.click();
          });
        }
      }
    ];

    let loginSuccess = false;
    let currentUrl = page.url();

    for (const strategy of loginStrategies) {
      if (loginSuccess) break;

      log.debug(`Trying login strategy: ${strategy.name}...`);
      await strategy.action();

      // Wait for navigation or URL change
      try {
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }),
          new Promise(resolve => setTimeout(resolve, 8000))
        ]);
      } catch (e) {
        // Navigation timeout is expected for SPA
      }

      currentUrl = page.url();
      log.debug(`URL after ${strategy.name}: ${currentUrl}`);

      // Check if we're no longer on the login page
      if (!currentUrl.includes('login') && !currentUrl.includes('Login') && !currentUrl.includes('chrome-error')) {
        loginSuccess = true;
        log.success(`Login succeeded with strategy: ${strategy.name}`);
        break;
      }

      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorSelectors = [
          '.error', '.alert-danger', '.validation-message',
          '[class*="error"]', '[class*="invalid"]',
          '.text-danger', '.field-validation-error'
        ];
        for (const selector of errorSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent?.trim()) {
            return el.textContent.trim();
          }
        }
        return null;
      });

      if (errorMessage) {
        log.error(`Login error: ${errorMessage}`);
      }
    }

    if (!loginSuccess) {
      await page.screenshot({ path: 'debug-login-failed.png', fullPage: true });
      const fs = require('fs').promises;
      const failedHtml = await page.content();
      await fs.writeFile('debug-login-failed.html', failedHtml);
      log.error('Saved debug-login-failed.png and .html');
      throw new Error('Login failed after trying all strategies. Check debug files.');
    }

    log.success('Cuddeback login successful');

    const fs = require('fs').promises;

    // Navigate directly to the device report page
    log.info('Navigating directly to device report page...');
    await page.goto('https://camp.cuddeback.com/devices/report', { waitUntil: 'networkidle2' });
    log.success(`Navigated to: ${page.url()}`);

    // Wait for the page content to fully render (Blazor SPA)
    log.debug('Waiting for report page to fully render...');
    try {
      // Wait for either fluent-button (view tabs) or fluent-data-grid-row (data) to appear
      await Promise.race([
        page.waitForSelector('fluent-button:not([class*="Manage"])', { timeout: 15000 }),
        page.waitForSelector('fluent-data-grid-row', { timeout: 15000 }),
        page.waitForSelector('.device-row', { timeout: 15000 })
      ]);
      log.success('Report page content loaded');
    } catch (e) {
      log.warn('Timeout waiting for report content, proceeding anyway...');
    }
    // Extra wait for any late-loading content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Save initial report page
    log.info('📸 Saving initial report page...');
    await page.screenshot({ path: 'debug-report-initial.png', fullPage: true });
    const reportInitialHtml = await page.content();
    await fs.writeFile('debug-report-initial.html', reportInitialHtml);
    log.success('Saved debug-report-initial.png and debug-report-initial.html');

    // Look for and click "Table" button/tab (Fluent UI button)
    log.info('Looking for "Table" button/tab...');
    const tableClicked = await page.evaluate(() => {
      // Try various ways to find the Table button, including Fluent UI
      const buttons = Array.from(document.querySelectorAll('button, a, [role="tab"], .nav-link, .tab, fluent-button'));
      const tableButton = buttons.find(b => {
        const text = b.textContent?.trim().toLowerCase();
        // Match "Table" but not column sort buttons
        return text === 'table' && !b.classList.contains('col-sort-button');
      });
      if (tableButton) {
        tableButton.click();
        return { found: true, text: tableButton.textContent?.trim() };
      }
      return { found: false };
    });

    if (tableClicked.found) {
      log.success(`Clicked "${tableClicked.text}" button`);
      // Wait for table content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Save table view
      log.info('📸 Saving table view...');
      await page.screenshot({ path: 'debug-report-table.png', fullPage: true });
      const reportTableHtml = await page.content();
      await fs.writeFile('debug-report-table.html', reportTableHtml);
      log.success('Saved debug-report-table.png and debug-report-table.html');
    } else {
      log.warn('Could not find "Table" button - listing all clickable elements...');
      const allButtons = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a, [role="tab"], .nav-link, .tab, fluent-tab, fluent-button'));
        return elements.map(e => ({
          tag: e.tagName,
          text: e.textContent?.trim().substring(0, 50),
          className: e.className,
          role: e.getAttribute('role')
        }));
      });
      log.info('Available clickable elements:');
      allButtons.forEach(b => log.debug(`  ${b.tag}: "${b.text}" (class: ${b.className}, role: ${b.role})`));
    }

    log.info('');
    log.info('📁 Debug files saved to project root:');
    log.info('   - debug-report-initial.png/html');
    if (tableClicked.found) {
      log.info('   - debug-report-table.png/html');
    }
    log.info('');
    log.info('Open the HTML files in a browser to inspect the page structure.');

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

  // Wait for fluent data grid to load (new Cuddeback site structure)
  log.debug('Waiting for Fluent Data Grid...');
  try {
    await page.waitForSelector('fluent-data-grid-row[row-type="default"]', { timeout: 10000 });
    log.success('Found Fluent Data Grid rows');
  } catch (e) {
    // Fallback to traditional table if no fluent data grid
    log.debug('No Fluent Data Grid found, trying traditional table...');
    try {
      await page.waitForSelector('table', { timeout: 10000 });
    } catch (e2) {
      log.error('No table or data grid found on page');
      throw new Error('Could not find camera data table');
    }
  }

  // Extract data and analyze structure
  const extractionResult = await page.evaluate(() => {
    // Find "Last Updated" timestamp - look in fluent-data-grid-cell or page text
    let lastUpdated = null;

    // Try to find header row to determine column indices
    const headers = [];
    const headerRow = document.querySelector('fluent-data-grid-row[row-type="header"]');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('fluent-data-grid-cell');
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '');
      });
    }

    // Also check for col-sort-button elements which indicate headers
    const sortButtons = document.querySelectorAll('fluent-button.col-sort-button');
    if (headers.length === 0 && sortButtons.length > 0) {
      sortButtons.forEach(btn => {
        const text = btn.textContent?.trim();
        if (text) headers.push(text);
      });
    }

    // Extract camera data from fluent-data-grid-row elements
    // The Table view has 12 columns with grid-template-columns containing many values
    // We filter for rows with 10+ cells to get only the Table view data
    const dataRows = document.querySelectorAll('fluent-data-grid-row[row-type="default"]');
    const cameras = [];

    for (const row of dataRows) {
      const cells = row.querySelectorAll('fluent-data-grid-cell');

      // Only process rows with 10+ cells (Table view has 12 columns)
      // Skip rows with fewer cells (other views like Overview/Health)
      if (cells.length >= 10) {
        // Table structure based on headers:
        // 0: (empty/icon), 1: Camera Number, 2: Camera Name, 3: Level, 4: Links,
        // 5: Battery, 6: Battery Days, 7: Photo Queue, 8: SD Photos, 9: SD Free Space,
        // 10: HW Version, 11: FW Version
        const camera = {
          location_id: cells[1] ? cells[1].textContent?.trim() : '',      // Camera Number (maps to device_id)
          camera_id: cells[2] ? cells[2].textContent?.trim() : '',        // Camera Name
          level: cells[3] ? cells[3].textContent?.trim() : '',            // Signal Level
          links: cells[4] ? cells[4].textContent?.trim() : '',            // Network Links
          battery: cells[5] ? cells[5].textContent?.trim() : '',          // Battery status
          battery_days: cells[6] ? cells[6].textContent?.trim() : '',     // Battery Days
          image_queue: cells[7] ? cells[7].textContent?.trim() : '',      // Photo Queue
          sd_images: cells[8] ? cells[8].textContent?.trim() : '',        // SD Photos
          sd_free_space: cells[9] ? cells[9].textContent?.trim() : '',    // SD Free Space
          hw_version: cells[10] ? cells[10].textContent?.trim() : '',     // HW Version
          fw_version: cells[11] ? cells[11].textContent?.trim() : '',     // FW Version
          extracted_at: new Date().toISOString()
        };

        // Only add if we have a valid camera number (location_id)
        if (camera.location_id && !isNaN(parseInt(camera.location_id))) {
          cameras.push(camera);
        }
      }
    }

    // Fallback to traditional table extraction
    if (cameras.length === 0) {
      const table = document.querySelector('table');
      if (table) {
        const tableHeaders = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        headers.push(...tableHeaders);

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 10) {
            cameras.push({
              sequence_number: cells[0]?.textContent?.trim() || '',
              location_id: cells[1]?.textContent?.trim() || '',
              camera_id: cells[2]?.textContent?.trim() || '',
              level: cells[3]?.textContent?.trim() || '',
              links: cells[4]?.textContent?.trim() || '',
              battery: cells[5]?.textContent?.trim() || '',
              battery_days: cells[6]?.textContent?.trim() || '',
              image_queue: cells[7]?.textContent?.trim() || '',
              sd_images: cells[8]?.textContent?.trim() || '',
              sd_free_space: cells[9]?.textContent?.trim() || '',
              hw_version: cells[10]?.textContent?.trim() || '',
              fw_version: cells[11]?.textContent?.trim() || '',
              cl_version: cells[12]?.textContent?.trim() || '',
              extracted_at: new Date().toISOString()
            });
          }
        }
      }
    }

    return { cameras, headers, lastUpdated };
  });

  log.success(`Extracted ${extractionResult.cameras.length} camera records`);
  if (extractionResult.lastUpdated) {
    log.info(`Last camera update: ${extractionResult.lastUpdated}`);
  }

  // Analyze field mapping
  log.step('Analyzing field mapping...');
  if (extractionResult.headers.length > 0) {
    log.info('Detected table headers:');
    extractionResult.headers.forEach((header, index) => {
      log.info(`  ${index}: ${header}`);
    });
  }

  // Verify device ID mapping
  log.step('Verifying device ID mapping...');
  const dbDeviceIds = new Set(deployments.map(d => String(d.hardware.device_id)));
  const cuddebackLocationIds = new Set(extractionResult.cameras.map(c => String(c.location_id)));

  log.info('Database device_ids:');
  Array.from(dbDeviceIds).forEach(id => log.info(`  - ${id}`));

  log.info('Cuddeback Camera Numbers:');
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
    log.step('Sample camera data (first 2):');
    extractionResult.cameras.slice(0, 2).forEach((camera, idx) => {
      log.info(`\n📷 Camera ${idx + 1}:`);
      Object.entries(camera).forEach(([key, value]) => {
        if (value) log.debug(`  ${key}: ${value}`);
      });
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
    // Match by device_id (stored as string or number in DB)
    const deployment = deployments.find(d =>
      String(d.hardware.device_id) === String(cameraItem.location_id)
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

  // Helper function for parsing numbers safely
  const parseIntSafe = (value) => {
    if (!value || value === 'N/A' || value === '-') return null;
    const parsed = parseInt(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  };

  const parseFloatSafe = (value) => {
    if (!value || value === 'N/A' || value === '-') return null;
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  };

  if (cuddebackData.cameras.length >= 1) {
    const showCount = Math.min(2, cuddebackData.cameras.length);
    for (let index = 0; index < showCount; index++) {
      const sample = cuddebackData.cameras[index];

      log.info(`\n📷 Camera ${index + 1} Field Parsing Test:`);
      log.debug(`  Location ID: "${sample.location_id}" (maps to device_id)`);
      log.debug(`  Camera Name: "${sample.camera_id}"`);

      // Test signal level parsing
      let signalLevel = null;
      if (sample.level && !sample.level.includes('N/A') && sample.level !== '-') {
        const signalMatch = sample.level.match(/(\d+)/);
        if (signalMatch) {
          signalLevel = parseInt(signalMatch[1]);
        }
      }

      log.debug(`\n  📊 STATUS REPORT FIELDS (all updated):`);
      log.debug(`    Battery: "${sample.battery}" → kept as-is`);
      log.debug(`    Signal Level: "${sample.level}" → parsed to ${signalLevel}`);
      log.debug(`    Network Links: "${sample.links}" → parsed to ${parseIntSafe(sample.links)}`);
      log.debug(`    SD Images: "${sample.sd_images}" → parsed to ${parseIntSafe(sample.sd_images)}`);
      log.debug(`    SD Free Space: "${sample.sd_free_space}" → parsed to ${parseFloatSafe(sample.sd_free_space)} GB`);
      log.debug(`    Image Queue: "${sample.image_queue}" → parsed to ${parseIntSafe(sample.image_queue)}`);
      log.debug(`    Battery Days: "${sample.battery_days}" → parsed to ${parseIntSafe(sample.battery_days)}`);

      log.debug(`\n  🔧 HARDWARE FIELDS (updated when changed):`);
      log.debug(`    HW Version: "${sample.hw_version}"`);
      log.debug(`    FW Version: "${sample.fw_version}"`);
    }
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
      log.success(`✅ Extracted ${cuddebackData.cameras.length} cameras from Fluent Data Grid`);
      log.success(`✅ ${updateResults.successCount} cameras would sync successfully`);

      if (updateResults.missingCount > 0) {
        log.warn(`⚠️ ${updateResults.missingCount} cameras in Cuddeback have no database record`);
      }

      log.info('\n📋 Fields Available from Cuddeback Table:');
      log.info('  Camera Number (location_id), Camera Name, Level, Links,');
      log.info('  Battery, Battery Days, Photo Queue, SD Photos,');
      log.info('  SD Free Space, HW Version, FW Version');

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