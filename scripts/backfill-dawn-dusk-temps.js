#!/usr/bin/env node
/**
 * FILE: scripts/backfill-dawn-dusk-temps.js
 *
 * Backfills temp_dawn / temp_dusk on existing daily_weather_snapshots rows
 * using the same hourly-averaging logic as the weather service.
 *
 * Safe to run multiple times — only updates rows where raw_weather_data has
 * hourly data. Rows without hourly data are skipped.
 *
 * Run with:
 *   node scripts/backfill-dawn-dusk-temps.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

function computeDawnDuskTemps(dayData) {
  if (!dayData?.hours?.length || !dayData.sunrise || !dayData.sunset) return null;

  const sunriseMin = toMinutes(dayData.sunrise);
  const sunsetMin  = toMinutes(dayData.sunset);
  const dawnStart  = sunriseMin - 120;
  const dawnEnd    = sunriseMin + 60;
  const duskStart  = sunsetMin  - 60;
  const duskEnd    = sunsetMin  + 60;

  const avgWindow = (hours, start, end) => {
    const vals = hours
      .map(h => ({ min: toMinutes(h.datetime), t: h.temp }))
      .filter(h => h.t != null && h.min >= start && h.min <= end);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((s, h) => s + h.t, 0) / vals.length * 10) / 10;
  };

  return {
    temp_dawn: avgWindow(dayData.hours, dawnStart, dawnEnd),
    temp_dusk: avgWindow(dayData.hours, duskStart, duskEnd),
  };
}

async function run() {
  console.log(`🌡️  Backfilling temp_dawn / temp_dusk${dryRun ? ' (DRY RUN)' : ''}\n`);

  const { data: rows, error } = await supabase
    .from('daily_weather_snapshots')
    .select('id, date, temp_dawn, temp_dusk, raw_weather_data')
    .order('date', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch rows:', error.message);
    process.exit(1);
  }

  console.log(`📋 Found ${rows.length} total rows\n`);

  let updated = 0, skipped = 0, failed = 0;

  for (const row of rows) {
    const dayData = row.raw_weather_data?.days?.[0];
    const result = computeDawnDuskTemps(dayData);

    if (!result || (result.temp_dawn == null && result.temp_dusk == null)) {
      console.log(`⏭️  ${row.date} — no hourly data, skipping`);
      skipped++;
      continue;
    }

    const { temp_dawn, temp_dusk } = result;

    if (dryRun) {
      console.log(`🔍 ${row.date} — would set temp_dawn=${temp_dawn}°F, temp_dusk=${temp_dusk}°F (was ${row.temp_dawn}/${row.temp_dusk})`);
      updated++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('daily_weather_snapshots')
      .update({ temp_dawn, temp_dusk })
      .eq('id', row.id);

    if (updateError) {
      console.error(`❌ ${row.date} — update failed: ${updateError.message}`);
      failed++;
    } else {
      console.log(`✅ ${row.date} — temp_dawn=${temp_dawn}°F, temp_dusk=${temp_dusk}°F`);
      updated++;
    }
  }

  console.log(`\n📊 Done: ${updated} updated, ${skipped} skipped (no hourly data), ${failed} failed`);
  if (dryRun) console.log('ℹ️  Dry run — no changes written');
}

run().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
