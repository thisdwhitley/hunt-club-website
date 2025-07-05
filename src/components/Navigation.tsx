'use client'

// src/components/Navigation.tsx
// Always-visible navigation for Caswell County Yacht Club

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  MapPin, 
  Target, 
  Wrench, 
  Camera, 
  Calendar,
  CheckSquare,
  User,
  Menu,
  X,
  Settings
} from 'lucide-react'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Overview and recent activity'
  },
  {
    name: 'Stands',
    href: '/stands',
    icon: Target,
    description: 'Manage hunting stands'
  },
  {
    name: 'Hunt Logs',
    href: '/hunts',
    icon: Target,
    description: 'Log and track hunts'
  },
  {
    name: 'Property Map',
    href: '/map',
    icon: MapPin,
    description: 'Interactive property map'
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    description: 'Track maintenance tasks'
  },
  {
    name: 'Trail Cameras',
    href: '/cameras',
    icon: Camera,
    description: 'Manage trail camera photos'
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'Hunt calendar and events'
  },
  {
    name: 'Camp Supplies',
    href: '/supplies',
    icon: CheckSquare,
    description: 'Shared todo and supply lists'
  }
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block fixed top-0 left-0 w-64 h-full bg-olive-green text-white shadow-club-lg z-40">
        <div className="p-6">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white">
              Caswell County<br />Yacht Club
            </h1>
            <p className="text-green-200 text-sm mt-1">
              Hunting Club Management
            </p>
          </div>

          {/* Navigation Items */}
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                      active
                        ? 'bg-pine-needle text-white shadow-club'
                        : 'text-green-100 hover:bg-pine-needle hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-green-200 group-hover:text-green-100 truncate">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* User/Settings Section */}
          <div className="mt-8 pt-8 border-t border-pine-needle">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-pine-needle hover:text-white transition-colors"
            >
              <User size={20} />
              <span className="font-medium">Profile</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-pine-needle hover:text-white transition-colors"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-olive-green text-white shadow-club z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">CCYC</h1>
            <p className="text-xs text-green-200">Hunting Club</p>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-pine-needle rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="lg:hidden fixed top-16 left-0 right-0 bg-olive-green text-white shadow-club-xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                          active
                            ? 'bg-pine-needle text-white shadow-club'
                            : 'text-green-100 hover:bg-pine-needle hover:text-white'
                        }`}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-green-200">{item.description}</div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Mobile User Section */}
              <div className="mt-6 pt-6 border-t border-pine-needle space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-green-100 hover:bg-pine-needle hover:text-white transition-colors"
                >
                  <User size={20} />
                  <span className="font-medium">Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-green-100 hover:bg-pine-needle hover:text-white transition-colors"
                >
                  <Settings size={20} />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Content Spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
      <div className="lg:hidden h-16 flex-shrink-0" />
    </>
  )
}
