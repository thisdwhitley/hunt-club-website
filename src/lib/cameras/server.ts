// Server-only cached reference data for the camera system.
// These functions use unstable_cache for cross-request caching and must not be
// imported from client components or browser-only modules.
// Uses the service client because unstable_cache runs outside the request context
// (no cookies available) and the relevant tables require authenticated role via RLS.

import { unstable_cache } from 'next/cache'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { CameraHardware } from './types'

export const getSeasonYearsCached = unstable_cache(
  async (): Promise<number[]> => {
    const supabase = createServiceSupabaseClient()
    const { data, error } = await supabase
      .from('camera_deployments')
      .select('season_year')
      .not('season_year', 'is', null)
      .order('season_year', { ascending: false })

    if (error) throw new Error(error.message)
    return [...new Set((data || []).map(r => r.season_year as number))]
  },
  ['camera-season-years'],
  { revalidate: 3600, tags: ['season-calendar'] }
)

export const getAvailableHardwareCached = unstable_cache(
  async (): Promise<CameraHardware[]> => {
    const supabase = createServiceSupabaseClient()

    const { data: allHardware, error: hardwareError } = await supabase
      .from('camera_hardware')
      .select('*')
      .eq('active', true)
      .order('device_id', { ascending: true })

    if (hardwareError) throw new Error(hardwareError.message)

    const { data: activeDeployments, error: deploymentsError } = await supabase
      .from('camera_deployments')
      .select('hardware_id')
      .eq('active', true)

    if (deploymentsError) throw new Error(deploymentsError.message)

    const deployedIds = new Set(activeDeployments?.map(d => d.hardware_id) || [])
    return (allHardware || []).filter(hw => !deployedIds.has(hw.id))
  },
  ['camera-available-hardware'],
  { revalidate: 3600, tags: ['camera-hardware'] }
)
