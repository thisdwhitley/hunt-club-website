'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { getIcon } from '@/lib/shared/icons'
import { ManagementHubToolbar } from '@/components/shared/ManagementHubToolbar'
import { CamerasTab } from './CamerasTab'
import { StandsTab } from './StandsTab'
import type { TabConfig } from '@/components/shared/ManagementHubToolbar'

const TABS: TabConfig[] = [
  { key: 'cameras', label: 'Cameras', icon: 'camera' },
  { key: 'stands', label: 'Stands', icon: 'stands' },
  { key: 'hunts', label: 'Hunts', icon: 'hunts' },
]

function TabPlaceholder({
  tabs,
  activeTab,
  onTabChange,
  label,
}: {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (key: string) => void
  label: string
}) {
  const WarningIcon = getIcon('warning')
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagementHubToolbar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        title="Management"
        icon="management"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <WarningIcon className="mx-auto h-12 w-12 text-weathered-wood mb-4" />
        <h3 className="text-lg font-medium text-forest-shadow mb-2">{label} management coming soon</h3>
        <p className="text-weathered-wood">This tab is under construction.</p>
      </div>
    </div>
  )
}

export default function ManagementHub() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') ?? 'cameras'

  const handleTabChange = (tab: string) => {
    router.push(`/management?tab=${tab}`)
  }

  if (activeTab === 'cameras') {
    return <CamerasTab tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
  }

  if (activeTab === 'stands') {
    return <StandsTab tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
  }

  return (
    <TabPlaceholder
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      label="Hunts"
    />
  )
}
