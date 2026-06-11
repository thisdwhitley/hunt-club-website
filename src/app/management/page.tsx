import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCameraDeployments } from '@/lib/cameras/database'
import { fetchHunts } from '@/lib/hunt-logging/hunt-service'
import { lookupSeasonStatus } from '@/app/actions/season'
import ManagementHub from '@/components/management/ManagementHub'
import type { CameraWithStatus } from '@/lib/cameras/types'
import type { HuntWithDetails } from '@/lib/hunt-logging/hunt-service'
import type { Stand } from '@/lib/stands/types'
import type { SeasonStatus } from '@/app/actions/season'

export default async function ManagementPage() {
  const supabase = await createServerSupabaseClient()

  const [camerasResult, standsResult, huntsResult, seasonResult] = await Promise.allSettled([
    getCameraDeployments({ active: true }, supabase),
    supabase.from('stands').select('*').order('name'),
    fetchHunts(supabase),
    lookupSeasonStatus('deer'),
  ])

  const initialCameras: CameraWithStatus[] | undefined =
    camerasResult.status === 'fulfilled' ? (camerasResult.value.data ?? undefined) : undefined

  const initialStands: Stand[] | undefined =
    standsResult.status === 'fulfilled' && standsResult.value.data
      ? (standsResult.value.data as unknown as Stand[])
      : undefined

  const initialHunts: HuntWithDetails[] | undefined =
    huntsResult.status === 'fulfilled' ? huntsResult.value : undefined

  const initialSeasonStatus: SeasonStatus | undefined =
    seasonResult.status === 'fulfilled' ? seasonResult.value : undefined

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ManagementHub
        initialCameras={initialCameras}
        initialStands={initialStands}
        initialHunts={initialHunts}
        initialSeasonStatus={initialSeasonStatus}
      />
    </Suspense>
  )
}
