import { Suspense } from 'react'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDefaultSeason, getReportSits, seasonOptions } from '@/lib/reports/data'
import ReportsView from '@/components/reports/ReportsView'

export const metadata = { title: 'Reports | Caswell County Yacht Club' }

// Hunt reports: read-only analysis of all logged sits (AM vs PM, season type, stand, season).
// Members only. Data is small enough to send whole; filters run client-side.
export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // middleware normally redirects first; this covers a session that expired mid-request
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center px-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-sm">
          <h1 className="text-lg font-semibold text-forest-shadow mb-2">Members only</h1>
          <p className="text-sm text-weathered-wood mb-4">Sign in to see hunt reports.</p>
          <Link href="/?redirectTo=/reports" className="inline-block bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg text-sm font-medium">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const sits = await getReportSits(supabase)
  const seasons = seasonOptions(sits)
  const defaultSeason = await getDefaultSeason(seasons, supabase)

  return (
    <Suspense fallback={<div className="min-h-screen bg-morning-mist" />}>
      <ReportsView sits={sits} seasons={seasons} defaultSeason={defaultSeason} />
    </Suspense>
  )
}
