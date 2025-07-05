'use client'

// src/components/MainLayout.tsx
// Main layout component with navigation for Caswell County Yacht Club

import React from 'react'
import Navigation from './Navigation'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function MainLayout({ children, className = '' }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <main className={`lg:ml-64 lg:pt-0 pt-16 ${className}`}>
        {children}
      </main>
    </div>
  )
}
