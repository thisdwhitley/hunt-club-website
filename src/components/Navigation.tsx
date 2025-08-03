// src/components/Navigation.tsx
// Redesigned navigation with hamburger-everywhere approach
// Clean, simple header with all navigation in hamburger menu

'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/components/modals/ModalSystem'
import { ICONS } from '@/lib/shared/icons'

// Navigation configuration
const navigationItems = [
  { name: 'Calendar', href: '/calendar', icon: 'calendar' as const },
  { name: 'Property Map', href: '/map', icon: 'map' as const },
  { name: 'Hunt Logs', href: '/hunts', icon: 'hunts' as const },
]

const managementItems = [
  { name: 'Stands', href: '/management/stands', icon: 'stands' as const },
  { name: 'Trail Cameras', href: '/management/cameras', icon: 'cameras' as const },
  { name: 'Reports', href: '/management/reports', icon: 'analytics' as const },
]

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isManagementExpanded, setIsManagementExpanded] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [menuPosition, setMenuPosition] = useState(0)
  const headerRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { showModal } = useModal()

  // Get icon components from registry
  const MenuIcon = ICONS.menu
  const CloseIcon = ICONS.close
  const PlusIcon = ICONS.plus
  const LoginIcon = ICONS.login
  const LogoutIcon = ICONS.logout
  const UserIcon = ICONS.user
  const ChevronDownIcon = ICONS.chevronDown
  const ChevronUpIcon = ICONS.chevronUp

  // Measure header height and calculate menu position
  useEffect(() => {
    const updatePositions = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
      
      if (hamburgerRef.current && window.innerWidth >= 1024) {
        const hamburgerRect = hamburgerRef.current.getBoundingClientRect()
        const rightEdge = hamburgerRect.right
        setMenuPosition(window.innerWidth - rightEdge)
      }
    }

    updatePositions()
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [isMenuOpen])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setIsManagementExpanded(false)
  }, [pathname])

  // Handle outside clicks on desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node) &&
        window.innerWidth >= 1024 // Only on desktop
      ) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Helper functions
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsManagementExpanded(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      closeMenu()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleSignIn = () => {
    closeMenu()
    setTimeout(() => {
      showModal('login')
    }, 100)
  }

  const handleLogHunt = () => {
    closeMenu()
    setTimeout(() => {
      showModal('hunt-form')
    }, 100)
  }

  const toggleManagement = () => {
    setIsManagementExpanded(!isManagementExpanded)
  }

  // Render navigation item
  const renderNavItem = (item: typeof navigationItems[0]) => {
    const IconComponent = ICONS[item.icon]
    const active = isActive(item.href)
    
    return (
      <li key={item.name}>
        <Link
          href={item.href}
          onClick={closeMenu}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            active
              ? 'bg-pine-needle text-white shadow-club'
              : 'text-green-100 hover:bg-pine-needle hover:text-white'
          }`}
        >
          <IconComponent size={20} />
          <span className="font-medium">{item.name}</span>
        </Link>
      </li>
    )
  }

  // Render management section
  const renderManagementSection = () => {
    const ManagementIcon = ICONS.management
    const ChevronIcon = isManagementExpanded ? ChevronUpIcon : ChevronDownIcon
    
    return (
      <>
        <li>
          <button
            onClick={toggleManagement}
            className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors text-green-100 hover:bg-pine-needle hover:text-white"
          >
            <div className="flex items-center gap-3">
              <ManagementIcon size={20} />
              <span className="font-medium">Management</span>
            </div>
            <ChevronIcon size={16} />
          </button>
        </li>
        
        {isManagementExpanded && (
          <li className="ml-4">
            <ul className="space-y-1">
              {managementItems.map(item => {
                const IconComponent = ICONS[item.icon]
                const active = isActive(item.href)
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        active
                          ? 'bg-pine-needle text-white shadow-club'
                          : 'text-green-200 hover:bg-pine-needle hover:text-white'
                      }`}
                    >
                      <IconComponent size={16} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        )}
      </>
    )
  }

  return (
    <>
      {/* Fixed Header */}
      <header 
        ref={headerRef} 
        className="fixed top-0 left-0 right-0 bg-olive-green text-white shadow-club-lg z-50"
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand/Title with Logo */}
            <Link href="/" className="hover:opacity-90 transition-opacity flex items-center gap-3" onClick={closeMenu}>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-morning-mist/20 rounded-lg flex items-center justify-center border border-morning-mist/30">
                <img 
                  src="/images/club-logo.svg" 
                  alt="Caswell County Yacht Club Logo"
                  className="w-6 h-6 lg:w-10 lg:h-10 object-contain brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                  }}
                />
                <span className="text-xs font-bold text-morning-mist hidden">CCYC</span>
              </div>
              
              <div className="min-w-0">
                <h1 className="text-sm lg:text-xl font-bold text-white leading-tight">
                  <span className="block lg:inline">Caswell County</span>
                  <span className="block lg:inline"> Yacht Club</span>
                </h1>
                <p className="text-green-200 text-xs lg:text-sm hidden lg:block">
                  Hunting Club Management
                </p>
              </div>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              
              {/* Sign In Button OR Hunt Log Button */}
              {user ? (
                <button
                  onClick={handleLogHunt}
                  className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-club"
                >
                  <PlusIcon size={16} />
                  <span className="hidden sm:inline">Hunt Log</span>
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-pine-needle hover:bg-forest-shadow text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <LoginIcon size={16} />
                  <span>Sign In</span>
                </button>
              )}

              {/* Hamburger Menu Button */}
              <button
                ref={hamburgerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-pine-needle rounded-lg transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Orange Accent Border */}
        <div className="h-1 bg-burnt-orange"></div>
      </header>

      {/* Mobile/Desktop Hamburger Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop - Mobile only */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMenu}
          />
          
          {/* Menu Panel - Full width on mobile, positioned dropdown on desktop */}
          <div 
            ref={menuRef}
            className="fixed z-50 max-h-[calc(100vh-4rem)] overflow-y-auto
                       left-0 right-0 lg:left-auto lg:w-80
                       bg-olive-green border-t border-pine-needle shadow-club-xl
                       lg:border lg:rounded-b-lg lg:border-t-0"
            style={{ 
              top: `${headerHeight}px`,
              right: window.innerWidth >= 1024 ? `${menuPosition}px` : '0'
            }}
          >
            <div className="lg:max-w-none max-w-7xl mx-auto lg:mx-0">
              <div className="p-4">
                
                {user ? (
                  <>
                    {/* User Info Section */}
                    <div className="mb-6 p-4 bg-pine-needle rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-burnt-orange rounded-full flex items-center justify-center">
                          <UserIcon size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member'}
                          </p>
                          <p className="text-sm text-green-200">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-green-200 hover:text-white transition-colors"
                      >
                        <LogoutIcon size={16} />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>

                    {/* Main Navigation */}
                    <nav className="mb-6">
                      <ul className="space-y-2">
                        {navigationItems.map(renderNavItem)}
                      </ul>
                    </nav>

                    {/* Management Section */}
                    <nav>
                      <ul className="space-y-2">
                        {renderManagementSection()}
                      </ul>
                    </nav>
                  </>
                ) : (
                  <>
                    {/* Not Signed In Menu */}
                    <nav className="mb-6">
                      <ul className="space-y-2">
                        <li>
                          <Link
                            href="/map"
                            onClick={closeMenu}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              isActive('/map')
                                ? 'bg-pine-needle text-white shadow-club'
                                : 'text-green-100 hover:bg-pine-needle hover:text-white'
                            }`}
                          >
                            <ICONS.map size={20} />
                            <span className="font-medium">Property Map</span>
                          </Link>
                        </li>
                      </ul>
                    </nav>

                    {/* Sign In Option */}
                    <div className="pt-4 border-t border-pine-needle">
                      <button
                        onClick={handleSignIn}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-green-100 hover:bg-pine-needle hover:text-white w-full"
                      >
                        <LoginIcon size={20} />
                        <span className="font-medium">Sign In</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dynamic Content Spacer */}
      <div style={{ height: `${headerHeight}px` }}></div>
    </>
  )
}