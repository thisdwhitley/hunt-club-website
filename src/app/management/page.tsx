import { Suspense } from 'react'
import ManagementHub from '@/components/management/ManagementHub'

export default function ManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ManagementHub />
    </Suspense>
  )
}
