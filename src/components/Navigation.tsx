// src/components/Navigation.tsx
// Simple top navigation for Caswell County Yacht Club

'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/components/modals/ModalSystem'
import { 
  Calendar,
  MapPin, 
  Target, 
  Settings,
  User,
  Plus,
  Menu,
  X,
  Camera,
  Bell,
  ChevronDown,
  LogOut,
  LogIn,
  ClipboardList
} from 'lucide-react'

// Navigation configuration
const navigationItems = [
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Property Map', href: '/map', icon: MapPin },
  { name: 'Hunt Logs', href: '/hunts', icon: ClipboardList },
  { name: 'Management', href: '/management', icon: Settings }
]

const managementTabs = [
  { name: 'Trail Cameras', href: '/management/cameras', icon: Camera },
  { name: 'Stands', href: '/management/stands', icon: Target }
]

// Shared styling constants
const styles = {
  navItem: {
    base: "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap",
    active: "bg-pine-needle text-white shadow-club",
    inactive: "text-green-100 hover:bg-pine-needle hover:text-white"
  },
  managementTab: {
    base: "flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium whitespace-nowrap",
    active: "bg-pine-needle text-white shadow-club", 
    inactive: "text-green-200 hover:bg-pine-needle hover:text-white"
  },
  mobileNavItem: {
    base: "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
    active: "bg-pine-needle text-white shadow-club",
    inactive: "text-green-100 hover:bg-pine-needle hover:text-white"
  }
}

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showWipBanner, setShowWipBanner] = useState(true)
  const [managementExpanded, setManagementExpanded] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { showModal } = useModal()

  // Computed values
  const isManagementPage = pathname.startsWith('/management')
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
  const showMinimalNav = !user || isProduction
  const showFullNavigation = !showMinimalNav

  // Auto-expand management if we're on a management page
  useEffect(() => {
    if (isManagementPage) {
      setManagementExpanded(true)
    }
  }, [isManagementPage])

  // Reset mobile state when user changes
  useEffect(() => {
    if (!user) {
      setUserMenuOpen(false)
      setIsMobileMenuOpen(false)
      setManagementExpanded(false)
    }
  }, [user])

  // Measure header height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }

    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [isMobileMenuOpen, managementExpanded, showWipBanner])

  // Helper functions
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isManagementTabActive = (href: string) => {
    return pathname === href || (href === '/management' && pathname === '/management')
  }

  const handleMobileLogin = () => {
    setIsMobileMenuOpen(false)
    setTimeout(() => {
      showModal('login')
    }, 100)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUserMenuOpen(false)
      setIsMobileMenuOpen(false)
      setManagementExpanded(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleLogHunt = () => {
    showModal('hunt-form')
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // Navigation item renderers
  const renderNavItem = (item: typeof navigationItems[0], isMobile = false) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const styleSet = isMobile ? styles.mobileNavItem : styles.navItem
    
    if (item.name === 'Management') {
      const buttonClass = [
        styleSet.base,
        managementExpanded || isManagementPage ? styleSet.active : styleSet.inactive,
        isMobile ? 'w-full' : ''
      ].join(' ')

      return (
        <li key={item.name}>
          <button
            onClick={() => setManagementExpanded(!managementExpanded)}
            className={buttonClass}
          >
            <Icon size={isMobile ? 20 : 16} />
            <span className={isMobile ? "font-medium" : ""}>{item.name}</span>
          </button>
        </li>
      )
    }
    
    const linkClass = [
      styleSet.base,
      active ? styleSet.active : styleSet.inactive
    ].join(' ')

    return (
      <li key={item.name}>
        <Link
          href={item.href}
          onClick={isMobile ? closeMobileMenu : undefined}
          className={linkClass}
        >
          <Icon size={isMobile ? 20 : 16} />
          <span className={isMobile ? "font-medium" : ""}>{item.name}</span>
        </Link>
      </li>
    )
  }

  const renderManagementTabs = (isMobile = false) => {
    if (!managementExpanded) return null

    if (isMobile) {
      return (
        <div className="pt-4 border-t border-pine-needle">
          <h3 className="text-green-200 text-sm font-medium mb-2 px-3">Management</h3>
          <ul className="space-y-1">
            {managementTabs.map((tab) => {
              const Icon = tab.icon
              const active = isManagementTabActive(tab.href)
              const linkClass = [
                styles.mobileNavItem.base,
                active ? styles.mobileNavItem.active : styles.mobileNavItem.inactive
              ].join(' ')
              
              return (
                <li key={tab.name}>
                  <Link
                    href={tab.href}
                    onClick={closeMobileMenu}
                    className={linkClass}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{tab.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )
    }

    return (
      <div className="flex items-center">
        <div className="w-px h-6 bg-morning-mist/30 mx-3"></div>
        <ul className="flex items-center gap-1">
          {managementTabs.map((tab) => {
            const Icon = tab.icon
            const active = isManagementTabActive(tab.href)
            const linkClass = [
              styles.managementTab.base,
              active ? styles.managementTab.active : styles.managementTab.inactive
            ].join(' ')
            
            return (
              <li key={tab.name}>
                <Link
                  href={tab.href}
                  className={linkClass}
                >
                  <Icon size={14} />
                  <span>{tab.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <>
      {/* Fixed Top Header Bar */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 bg-olive-green text-white shadow-club-lg z-50">
        
        {/* WIP Banner */}
        {showWipBanner && (
          <div className="bg-muted-gold text-forest-shadow">
            <div className="max-w-5xl mx-auto px-4 lg:px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell size={16} className="text-forest-shadow" />
                  <span className="text-sm font-medium">
                    🚧 System under development.
                  </span>
                </div>
                <button
                  onClick={() => setShowWipBanner(false)}
                  className="text-forest-shadow hover:text-weathered-wood"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Header Row */}
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between py-3">
            
            {/* Brand/Title with Logo */}
            <Link href="/" className="hover:opacity-90 transition-opacity flex items-center gap-3">
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

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Quick Hunt Log Button - only for logged in users */}
              {user && (
                <button
                  onClick={handleLogHunt}
                  className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <Plus size={18} />
                  <span>Log Hunt</span>
                </button>
              )}
              
              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-green-100 hover:text-white hover:bg-pine-needle px-3 py-2 rounded-lg transition-colors"
                  >
                    <User size={20} />
                    <span className="font-medium max-w-32 truncate hidden sm:block">{user.email}</span>
                    <ChevronDown size={16} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-club-lg py-1 z-50">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-weathered-wood hover:bg-morning-mist w-full text-left"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => showModal('login')}
                  className="flex items-center gap-2 bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-pine-needle rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation - Only show for full navigation */}
        {showFullNavigation && (
          <>
            <div className="h-px bg-morning-mist/20"></div>
            <nav className="hidden lg:block">
              <div className="max-w-5xl mx-auto px-4 lg:px-6">
                <div className="py-2">
                  <div className="flex items-center justify-between">
                    {/* Main Navigation Items */}
                    <ul className="flex items-center gap-1">
                      {navigationItems.map(item => renderNavItem(item))}
                    </ul>

                    {/* Management Tabs */}
                    {renderManagementTabs()}
                  </div>
                </div>
              </div>
            </nav>
          </>
        )}

        {/* Orange Separator */}
        <div className="h-1 bg-burnt-orange"></div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
          />
          
          {/* Mobile Menu Panel */}
          <div 
            className="lg:hidden fixed left-0 right-0 bg-olive-green border-t border-pine-needle shadow-club-xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
            style={{ top: `${headerHeight}px` }}
          >
            <div className="max-w-5xl mx-auto px-4">
              <div className="py-4">
                
                {/* Mobile Quick Actions */}
                <div className="mb-4 pb-4 border-b border-pine-needle">
                  {user && (
                    <button
                      onClick={handleLogHunt}
                      className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-3 rounded-lg flex items-center gap-3 transition-colors font-medium w-full mb-3"
                    >
                      <Plus size={20} />
                      <span>Log Hunt</span>
                    </button>
                  )}
                  
                  {/* Mobile User Section */}
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 text-green-100 hover:text-white hover:bg-pine-needle px-3 py-2 rounded-lg transition-colors w-full"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Sign Out ({user.email})</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleMobileLogin}
                      className="flex items-center gap-3 text-green-100 hover:text-white hover:bg-pine-needle px-3 py-2 rounded-lg transition-colors w-full text-left"
                    >
                      <LogIn size={20} />
                      <span className="font-medium">Sign In</span>
                    </button>
                  )}
                </div>

                {/* Mobile Navigation Items - Only show for full navigation */}
                {showFullNavigation && (
                  <>
                    <ul className="space-y-1 mb-4">
                      {navigationItems.map(item => renderNavItem(item, true))}
                    </ul>

                    {/* Mobile Management Tabs */}
                    {renderManagementTabs(true)}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      {/* Dynamic Content Spacer */}
      <div style={{ height: `${headerHeight}px` }}></div>
    </>
  )
}