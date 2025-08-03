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
      <main className={`max-w-7xl mx-auto px-4 lg:px-6 ${className}`}>
        {children}
      </main>
    </div>
  )
}
