/**
 * Enhanced Camera Sync Logger
 * 
 * Integrates with daily_collection_log table to track enhanced camera sync operations.
 * Add this to your scripts/sync-cuddeback-cameras.js or use as separate utility.
 */

const { createClient } = require('@supabase/supabase-js');

class EnhancedCameraSyncLogger {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.startTime = new Date();
    this.collectionId = null;
  }

  /**
   * Log the start of camera sync collection
   */
  async logCollectionStart() {
    const today = new Date().toISOString().split('T')[0];
    
    const logEntry = {
      collection_date: today,
      collection_type: 'camera',
      status: 'retrying', // Use allowed status instead of 'running'
      started_at: this.startTime.toISOString(),
      completed_at: null,
      processing_duration_ms: null,
      records_processed: 0,
      errors_encountered: 0,
      data_completeness_score: 0,
      alerts_generated: 0,
      error_details: null,
      processing_summary: 'Enhanced camera sync started with trend analysis'
    };

    try {
      const { data, error } = await this.supabase
        .from('daily_collection_log')
        .insert(logEntry)
        .select()
        .single();
        
      if (error) {
        console.warn('Failed to log collection start:', error.message);
        return null;
      }
      
      this.collectionId = data.id;
      console.log(`📝 Collection started - ID: ${this.collectionId}`);
      return this.collectionId;
      
    } catch (error) {
      console.warn('Error logging collection start:', error.message);
      return null;
    }
  }

  /**
   * Update collection progress during sync
   */
  async updateProgress(progressData) {
    if (!this.collectionId) return;

    const updateData = {
      records_processed: progressData.cameras_processed || 0,
      processing_summary: `Processing: ${progressData.cameras_processed || 0} cameras, ${progressData.cameras_updated || 0} status reports updated`
    };

    try {
      await this.supabase
        .from('daily_collection_log')
        .update(updateData)
        .eq('id', this.collectionId);
        
      console.log('📊 Progress updated:', updateData.processing_summary);
    } catch (error) {
      console.warn('Error updating progress:', error.message);
    }
  }

  /**
   * Log collection completion with results
   */
  async logCollectionComplete(syncResults) {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    
    // Calculate data completeness score
    const totalExpected = syncResults.cameras_processed || 1;
    const successfulUpdates = syncResults.cameras_updated || 0;
    const snapshotsCreated = syncResults.snapshots_created || 0;
    
    let completenessScore = 100;
    if (syncResults.errors && syncResults.errors.length > 0) {
      completenessScore = Math.max(0, 100 - (syncResults.errors.length * 10));
    }
    if (successfulUpdates < totalExpected) {
      completenessScore = Math.min(completenessScore, (successfulUpdates / totalExpected) * 100);
    }

    // Count alerts generated (anomalies + quiet cameras)
    let alertsGenerated = 0;
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Count anomalies
      const { data: anomalies } = await this.supabase
        .from('daily_camera_snapshots')
        .select('id')
        .eq('date', today)
        .eq('anomaly_detected', true);
        
      // Count quiet cameras (5+ days since activity)
      const { data: quietCameras } = await this.supabase
        .from('daily_camera_snapshots')
        .select('id')
        .eq('date', today)
        .gte('days_since_last_activity', 5);
        
      alertsGenerated = (anomalies?.length || 0) + (quietCameras?.length || 0);
    } catch (error) {
      console.warn('Error counting alerts:', error.message);
    }

    const finalLogEntry = {
      status: syncResults.success ? 'success' : 'failed',
      completed_at: endTime.toISOString(),
      processing_duration_ms: duration,
      records_processed: totalExpected,
      errors_encountered: syncResults.errors?.length || 0,
      data_completeness_score: Math.round(completenessScore),
      alerts_generated: alertsGenerated,
      error_details: (syncResults.errors?.length > 0 || syncResults.warnings?.length > 0) ? {
        errors: syncResults.errors || [],
        warnings: syncResults.warnings || [],
        timestamp: endTime.toISOString()
      } : null,
      processing_summary: this.generateProcessingSummary(syncResults, alertsGenerated, duration)
    };

    try {
      if (this.collectionId) {
        await this.supabase
          .from('daily_collection_log')
          .update(finalLogEntry)
          .eq('id', this.collectionId);
      } else {
        // Create new entry if we couldn't create one at start
        const today = new Date().toISOString().split('T')[0];
        await this.supabase
          .from('daily_collection_log')
          .insert({
            collection_date: today,
            collection_type: 'camera',
            started_at: this.startTime.toISOString(),
            ...finalLogEntry
          });
      }
      
      console.log('✅ Collection results logged to database');
      console.log('📊 Summary:', finalLogEntry.processing_summary);
      
      // Log alerts if any
      if (alertsGenerated > 0) {
        console.log(`🚨 Generated ${alertsGenerated} alerts (anomalies + quiet cameras)`);
      }
      
    } catch (error) {
      console.error('Failed to log collection completion:', error.message);
    }
  }

  /**
   * Generate human-readable processing summary
   */
  generateProcessingSummary(syncResults, alertsGenerated, duration) {
    const parts = [];
    
    // Core metrics
    parts.push(`Enhanced sync: ${syncResults.cameras_updated || 0} status reports`);
    parts.push(`${syncResults.snapshots_created || 0} snapshots created`);
    
    // Hardware updates
    if (syncResults.hardware_updated > 0) {
      parts.push(`${syncResults.hardware_updated} hardware updates`);
    }
    
    // Performance
    const durationSec = Math.round(duration / 1000);
    parts.push(`completed in ${durationSec}s`);
    
    // Issues
    if (syncResults.errors?.length > 0) {
      parts.push(`${syncResults.errors.length} errors`);
    }
    if (syncResults.warnings?.length > 0) {
      parts.push(`${syncResults.warnings.length} warnings`);
    }
    
    // Alerts
    if (alertsGenerated > 0) {
      parts.push(`${alertsGenerated} alerts generated`);
    }
    
    return parts.join(', ');
  }

  /**
   * Generate alert summary for monitoring
   */
  async generateAlertSummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get anomalies
      const { data: anomalies } = await this.supabase
        .from('daily_camera_snapshots')
        .select('camera_device_id, anomaly_type, anomaly_severity, images_added_today')
        .eq('date', today)
        .eq('anomaly_detected', true);
        
      // Get quiet cameras
      const { data: quietCameras } = await this.supabase
        .from('daily_camera_snapshots')
        .select('camera_device_id, days_since_last_activity')
        .eq('date', today)
        .gte('days_since_last_activity', 5);
        
      const summary = {
        anomalies: anomalies || [],
        quietCameras: quietCameras || [],
        totalAlerts: (anomalies?.length || 0) + (quietCameras?.length || 0)
      };
      
      return summary;
      
    } catch (error) {
      console.warn('Error generating alert summary:', error.message);
      return { anomalies: [], quietCameras: [], totalAlerts: 0 };
    }
  }

  /**
   * Log an error during processing
   */
  async logError(error, context = '') {
    console.error(`❌ ${context ? context + ': ' : ''}${error.message}`);
    
    if (this.collectionId) {
      try {
        // Increment error count
        const { data: currentLog } = await this.supabase
          .from('daily_collection_log')
          .select('errors_encountered, error_details')
          .eq('id', this.collectionId)
          .single();
          
        if (currentLog) {
          const newErrorCount = (currentLog.errors_encountered || 0) + 1;
          const existingDetails = currentLog.error_details || {};
          const updatedDetails = {
            ...existingDetails,
            errors: [...(existingDetails.errors || []), {
              message: error.message,
              context: context,
              timestamp: new Date().toISOString()
            }]
          };
          
          await this.supabase
            .from('daily_collection_log')
            .update({
              errors_encountered: newErrorCount,
              error_details: updatedDetails
            })
            .eq('id', this.collectionId);
        }
      } catch (logError) {
        console.warn('Failed to log error to database:', logError.message);
      }
    }
  }
}

module.exports = { EnhancedCameraSyncLogger };
