// src/app/hunts/page.tsx
// Redirect to /management/hunts for consistent management interface

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HuntsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new management location
    router.replace('/management/hunts')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-morning-mist">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-green mx-auto mb-4"></div>
        <p className="text-weathered-wood">Redirecting to Hunt Data Management...</p>
      </div>
    </div>
  )
}
