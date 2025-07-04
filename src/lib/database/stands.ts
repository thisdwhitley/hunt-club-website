// src/lib/database/stands.ts - Debug Version with Better Error Handling
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';

type Stand = Database['public']['Tables']['stands']['Row'];
type StandInsert = Database['public']['Tables']['stands']['Insert'];
type StandUpdate = Database['public']['Tables']['stands']['Update'];

export class StandService {
  private supabase = createClient();

  // Get all stands with optional filtering
  async getStands(filters?: {
    active?: boolean;
    condition?: string;
    search?: string;
    huntingSeason?: string;
  }) {
    console.log('🔍 getStands called with filters:', filters);
    
    let query = this.supabase
      .from('stands')
      .select('*')
      .order('name');

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    if (filters?.condition && filters.condition !== 'all') {
      query = query.eq('condition', filters.condition);
    }

    if (filters?.huntingSeason && filters.huntingSeason !== 'all') {
      query = query.eq('best_season', filters.huntingSeason);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching stands:', error);
      throw new Error(`Failed to fetch stands: ${error.message || JSON.stringify(error)}`);
    }
    
    console.log('✅ Fetched stands:', data?.length || 0);
    return data;
  }

  // Get single stand by ID
  async getStand(id: string) {
    console.log('🔍 getStand called with id:', id);
    
    const { data, error } = await this.supabase
      .from('stands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching stand:', error);
      throw new Error(`Failed to fetch stand: ${error.message || JSON.stringify(error)}`);
    }
    
    console.log('✅ Fetched stand:', data);
    return data;
  }

  // Create new stand
  async createStand(standData: StandInsert) {
    console.log('🔍 createStand called with data:', standData);
    
    const { data, error } = await this.supabase
      .from('stands')
      .insert({
        ...standData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating stand:', error);
      throw new Error(`Failed to create stand: ${error.message || JSON.stringify(error)}`);
    }
    
    console.log('✅ Created stand:', data);
    return data;
  }

  // Update existing stand - ENHANCED DEBUGGING
  async updateStand(id: string, updates: StandUpdate) {
    console.log('🔍 updateStand called with:');
    console.log('  - ID:', id);
    console.log('  - Updates:', updates);
    
    // First, let's see what the current stand looks like
    const { data: currentStand, error: fetchError } = await this.supabase
      .from('stands')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching current stand for update:', fetchError);
      throw new Error(`Failed to fetch stand for update: ${fetchError.message || JSON.stringify(fetchError)}`);
    }
    
    console.log('📋 Current stand data:', currentStand);
    
    // Filter out undefined values and empty strings that might cause issues
    const cleanUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        cleanUpdates[key] = value;
      }
    });
    
    // Always update the updated_at field
    cleanUpdates.updated_at = new Date().toISOString();
    
    console.log('🧹 Cleaned updates:', cleanUpdates);
    
    const { data, error } = await this.supabase
      .from('stands')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating stand - Full error object:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      
      throw new Error(`Failed to update stand: ${error.message || error.code || JSON.stringify(error)}`);
    }
    
    console.log('✅ Updated stand:', data);
    return data;
  }

  // Delete stand (admin only)
  async deleteStand(id: string) {
    console.log('🔍 deleteStand called with id:', id);
    
    const { error } = await this.supabase
      .from('stands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting stand:', error);
      throw new Error(`Failed to delete stand: ${error.message || JSON.stringify(error)}`);
    }
    
    console.log('✅ Deleted stand');
  }

  // Get stands statistics
  async getStandsStats() {
    console.log('🔍 getStandsStats called');
    
    const { data, error } = await this.supabase
      .from('stands')
      .select('active, condition, success_rate, total_hunts, total_harvests');

    if (error) {
      console.error('❌ Error fetching stands stats:', error);
      throw new Error(`Failed to fetch stands stats: ${error.message || JSON.stringify(error)}`);
    }

    const stats = {
      total: data.length,
      active: data.filter(s => s.active).length,
      needsRepair: data.filter(s => s.condition === 'needs_repair' || s.condition === 'unsafe').length,
      avgSuccessRate: data.length > 0 
        ? Math.round((data.reduce((acc, s) => acc + (s.success_rate || 0), 0) / data.length) * 100) / 100
        : 0
    };

    console.log('✅ Calculated stats:', stats);
    return stats;
  }

  // Test database connection and check stands table structure
  async testConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await this.supabase
        .from('stands')
        .select('count')
        .limit(1);
        
      if (connectionError) {
        console.error('❌ Connection test failed:', connectionError);
        return { success: false, error: connectionError };
      }
      
      // Get table structure info
      const { data: stands, error: standsError } = await this.supabase
        .from('stands')
        .select('*')
        .limit(1);
        
      if (standsError) {
        console.error('❌ Stands table query failed:', standsError);
        return { success: false, error: standsError };
      }
      
      console.log('✅ Connection successful');
      console.log('📋 Sample stand structure:', stands?.[0] ? Object.keys(stands[0]) : 'No stands found');
      
      return { 
        success: true, 
        structure: stands?.[0] ? Object.keys(stands[0]) : [],
        sampleData: stands?.[0] || null
      };
      
    } catch (error) {
      console.error('❌ Unexpected error during connection test:', error);
      return { success: false, error };
    }
  }
}

// Export singleton instance
export const standService = new StandService();
