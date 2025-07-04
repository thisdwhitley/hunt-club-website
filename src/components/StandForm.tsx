// src/components/StandForm.tsx - Debug Version
import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Target, AlertTriangle } from 'lucide-react';

// Types - in your actual project, import from '../lib/types/database'
type HuntingSeason = 'archery' | 'blackpowder' | 'gun' | 'all_seasons';
type StandStyle = 'tree_stand' | 'ground_blind' | 'elevated_box' | 'ladder_stand' | 'climbing_stand' | 'popup_blind' | 'permanent_blind';
type StandCondition = 'excellent' | 'good' | 'fair' | 'needs_repair' | 'unsafe';
type DifficultyLevel = 'easy' | 'moderate' | 'difficult';
type TimeOfDay = 'morning' | 'evening' | 'all_day';
type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

interface Stand {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  active: boolean;
  latitude?: number | null;
  longitude?: number | null;
  trail_name?: string | null;
  walking_time_minutes?: number | null;
  difficulty_level?: DifficultyLevel | null;
  access_notes?: string | null;
  height_feet?: number | null;
  capacity?: number | null;
  construction_material?: string | null;
  stand_style?: StandStyle | null;
  weight_limit_lbs?: number | null;
  primary_wind_directions?: WindDirection[] | null;
  game_trails_nearby?: boolean | null;
  best_time_of_day?: TimeOfDay | null;
  best_season?: HuntingSeason | null;
  cover_rating?: number | null;
  view_distance_yards?: number | null;
  last_inspection_date?: string | null;
  condition?: StandCondition | null;
  maintenance_notes?: string | null;
  safety_equipment_required?: string[] | null;
  nearby_water_source?: boolean | null;
  food_plot_proximity_yards?: number | null;
  bedding_area_distance_yards?: number | null;
  trail_camera_coverage?: boolean | null;
  total_hunts?: number | null;
  total_harvests?: number | null;
  last_used_date?: string | null;
  success_rate?: number | null;
  created_at: string;
  updated_at: string;
}

interface StandInsert {
  name: string;
  description?: string | null;
  type?: string;
  active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  trail_name?: string | null;
  walking_time_minutes?: number | null;
  difficulty_level?: DifficultyLevel | null;
  access_notes?: string | null;
  height_feet?: number | null;
  capacity?: number | null;
  construction_material?: string | null;
  stand_style?: StandStyle | null;
  weight_limit_lbs?: number | null;
  primary_wind_directions?: WindDirection[] | null;
  game_trails_nearby?: boolean | null;
  best_time_of_day?: TimeOfDay | null;
  best_season?: HuntingSeason | null;
  cover_rating?: number | null;
  view_distance_yards?: number | null;
  last_inspection_date?: string | null;
  condition?: StandCondition | null;
  maintenance_notes?: string | null;
  safety_equipment_required?: string[] | null;
  nearby_water_source?: boolean | null;
  food_plot_proximity_yards?: number | null;
  bedding_area_distance_yards?: number | null;
  trail_camera_coverage?: boolean | null;
  total_hunts?: number | null;
  total_harvests?: number | null;
  last_used_date?: string | null;
  success_rate?: number | null;
}

interface StandUpdate extends Partial<StandInsert> {}

// Validation function
const validateStandData = (data: Partial<StandInsert>): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Stand name is required');
  }

  if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (data.height_feet && data.height_feet < 0) {
    errors.push('Height cannot be negative');
  }

  if (data.capacity && data.capacity < 1) {
    errors.push('Capacity must be at least 1');
  }

  if (data.cover_rating && (data.cover_rating < 1 || data.cover_rating > 5)) {
    errors.push('Cover rating must be between 1 and 5');
  }

  if (data.weight_limit_lbs && data.weight_limit_lbs < 0) {
    errors.push('Weight limit cannot be negative');
  }

  if (data.view_distance_yards && data.view_distance_yards < 0) {
    errors.push('View distance cannot be negative');
  }

  if (data.walking_time_minutes && data.walking_time_minutes < 0) {
    errors.push('Walking time cannot be negative');
  }

  return errors;
};

interface StandFormProps {
  stand?: Stand | null;
  onSave: (standData: StandInsert | StandUpdate) => Promise<void>;
  onCancel: () => void;
}

export const StandForm: React.FC<StandFormProps> = ({ stand, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<StandInsert>>({
    name: '',
    description: '',
    type: 'tree_stand',
    active: true,
    stand_style: 'tree_stand',
    difficulty_level: 'moderate',
    condition: 'good',
    best_time_of_day: 'all_day',
    best_season: 'all_seasons',
    capacity: 1,
    cover_rating: 3,
    game_trails_nearby: false,
    nearby_water_source: false,
    trail_camera_coverage: false,
    primary_wind_directions: [],
    safety_equipment_required: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (stand) {
      console.log('🔍 StandForm: Initializing with stand data:', stand);
      
      setFormData({
        name: stand.name,
        description: stand.description || '',
        type: stand.type,
        active: stand.active,
        latitude: stand.latitude || undefined,
        longitude: stand.longitude || undefined,
        trail_name: stand.trail_name || '',
        walking_time_minutes: stand.walking_time_minutes || undefined,
        difficulty_level: stand.difficulty_level || 'moderate',
        access_notes: stand.access_notes || '',
        height_feet: stand.height_feet || undefined,
        capacity: stand.capacity || 1,
        construction_material: stand.construction_material || '',
        stand_style: stand.stand_style || 'tree_stand',
        weight_limit_lbs: stand.weight_limit_lbs || undefined,
        primary_wind_directions: stand.primary_wind_directions || [],
        game_trails_nearby: stand.game_trails_nearby || false,
        best_time_of_day: stand.best_time_of_day || 'all_day',
        best_season: stand.best_season || 'all_seasons',
        cover_rating: stand.cover_rating || 3,
        view_distance_yards: stand.view_distance_yards || undefined,
        last_inspection_date: stand.last_inspection_date || '',
        condition: stand.condition || 'good',
        maintenance_notes: stand.maintenance_notes || '',
        safety_equipment_required: stand.safety_equipment_required || [],
        nearby_water_source: stand.nearby_water_source || false,
        food_plot_proximity_yards: stand.food_plot_proximity_yards || undefined,
        bedding_area_distance_yards: stand.bedding_area_distance_yards || undefined,
        trail_camera_coverage: stand.trail_camera_coverage || false,
        total_hunts: stand.total_hunts || undefined,
        total_harvests: stand.total_harvests || undefined,
        last_used_date: stand.last_used_date || '',
      });
    }
  }, [stand]);

  const standStyles: { value: StandStyle; label: string }[] = [
    { value: 'tree_stand', label: 'Tree Stand' },
    { value: 'ground_blind', label: 'Ground Blind' },
    { value: 'elevated_box', label: 'Elevated Box' },
    { value: 'ladder_stand', label: 'Ladder Stand' },
    { value: 'climbing_stand', label: 'Climbing Stand' },
    { value: 'popup_blind', label: 'Pop-up Blind' },
    { value: 'permanent_blind', label: 'Permanent Blind' }
  ];

  const conditions: { value: StandCondition; label: string }[] = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'needs_repair', label: 'Needs Repair' },
    { value: 'unsafe', label: 'Unsafe' }
  ];

  const difficultyLevels: { value: DifficultyLevel; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'difficult', label: 'Difficult' }
  ];

  const huntingSeasons: { value: HuntingSeason; label: string }[] = [
    { value: 'archery', label: 'Archery' },
    { value: 'blackpowder', label: 'Blackpowder' },
    { value: 'gun', label: 'Gun' },
    { value: 'all_seasons', label: 'All Seasons' }
  ];

  const timesOfDay: { value: TimeOfDay; label: string }[] = [
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
    { value: 'all_day', label: 'All Day' }
  ];

  const handleChange = (field: keyof StandInsert, value: any) => {
    console.log(`📝 Form field changed: ${field} = ${value} (type: ${typeof value})`);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const validationErrors = validateStandData(formData);
    const errorObj: Record<string, string> = {};
    
    validationErrors.forEach(error => {
      // Map error messages to field names (simplified)
      if (error.includes('name')) errorObj.name = error;
      if (error.includes('latitude')) errorObj.latitude = error;
      if (error.includes('longitude')) errorObj.longitude = error;
      if (error.includes('height')) errorObj.height_feet = error;
      if (error.includes('capacity')) errorObj.capacity = error;
      if (error.includes('cover')) errorObj.cover_rating = error;
      if (error.includes('weight')) errorObj.weight_limit_lbs = error;
    });

    setErrors(errorObj);
    return validationErrors.length === 0;
  };

  // ENHANCED SUBMIT HANDLING WITH DEBUGGING
  const handleSubmit = async () => {
    console.log('🚀 StandForm: Submit triggered');
    console.log('📋 Current form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    setSaving(true);
    try {
      // Calculate success rate if we have hunt data
      const submissionData = { ...formData };
      if (submissionData.total_hunts && submissionData.total_hunts > 0) {
        submissionData.success_rate = ((submissionData.total_harvests || 0) / submissionData.total_hunts) * 100;
      }

      // Clean the data - remove undefined/null values and empty strings that might cause issues
      const cleanedData: any = {};
      Object.entries(submissionData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanedData[key] = value;
        }
      });

      console.log('🧹 Cleaned submission data:', cleanedData);
      console.log('📊 Data being sent to onSave:');
      Object.entries(cleanedData).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (${typeof value})`);
      });

      await onSave(cleanedData);
      console.log('✅ onSave completed successfully');
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Full error object:', error);
      // Handle error (could show a toast notification)
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {stand ? 'Edit Stand' : 'Add New Stand'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Debug Info */}
          <div className="p-3 bg-blue-50 rounded border">
            <h4 className="font-medium text-blue-800 mb-2">🔍 Debug Info</h4>
            <p className="text-sm text-blue-700">
              Mode: {stand ? `Editing "${stand.name}"` : 'Creating new stand'}
            </p>
            <p className="text-sm text-blue-700">
              Form fields populated: {Object.keys(formData).length}
            </p>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stand Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., North Ridge Stand"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the stand location and features..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stand Style
                </label>
                <select
                  value={formData.stand_style || 'tree_stand'}
                  onChange={(e) => handleChange('stand_style', e.target.value as StandStyle)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {standStyles.map(style => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={formData.condition || 'good'}
                  onChange={(e) => handleChange('condition', e.target.value as StandCondition)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Best Hunting Season
                </label>
                <select
                  value={formData.best_season || 'all_seasons'}
                  onChange={(e) => handleChange('best_season', e.target.value as HuntingSeason)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {huntingSeasons.map(season => (
                    <option key={season.value} value={season.value}>
                      {season.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hunter Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active || false}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Stand is active and available for use
              </label>
            </div>
          </div>

          {/* Success Rate Display */}
          {formData.total_hunts && formData.total_hunts > 0 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-1">
                <Target size={16} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">Calculated Success Rate</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {(((formData.total_harvests || 0) / formData.total_hunts) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{stand ? 'Update Stand' : 'Create Stand'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
