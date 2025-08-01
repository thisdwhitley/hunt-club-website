// src/app/page.tsx
"use client";

import { 
  Target, 
  Calendar, 
  Camera, 
  MapPin, 
  Settings, 
  Users, 
  FileText, 
  Wrench,
  BarChart3,
  Bell,
  Menu,
  X,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  LogOut,
  ChevronDown,
  ClipboardList,
  LogIn,
  Eye,
  Lock,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CalendarView } from "@/components/CalendarView";
import Link from "next/link";
import PropertyMap from '@/components/map/PropertyMap';
import { useModal } from '@/components/modals/ModalSystem'
import { createClient } from '@/lib/supabase/client'

export default function MainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showWipBanner, setShowWipBanner] = useState(true);
  // ADD THIS: Force logout state
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { showModal } = useModal();

  // Data state for real stats
  const [stands, setStands] = useState([]);
  const [hunts, setHunts] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [harvests, setHarvests] = useState([]);

  const supabase = createClient()

  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'

  // Show logo-only page if:
  // 1. User is not logged in, OR
  // 2. User is logged in but we're on production site
  const showLogoOnly = !user || isProduction || isSigningOut

  // Load real data when user logs in
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // UPDATED: Enhanced mobile state reset effect with debugging
  useEffect(() => {
    console.log('Auth state changed:', { user: !!user, loading, isSigningOut }) // Debug log
    if (!loading && (!user || isSigningOut)) {
      console.log('Redirecting to logo page') // Debug log
      // Reset to dashboard section when logged out
      setActiveSection('dashboard')
      // Close any open menus - MOBILE FIX
      setUserMenuOpen(false)
      setMobileMenuOpen(false) // Reset mobile menu state
    }
  }, [user, loading, isSigningOut])

  useEffect(() => {
    // Auto-open login modal if redirected from protected route
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const authRequired = urlParams.get('auth')
      const redirectTo = urlParams.get('redirectTo')
      
      if (authRequired === 'required' && !user) {
        // Store redirect destination for after login
        if (redirectTo) {
          sessionStorage.setItem('loginRedirect', redirectTo)
        }
        
        // Auto-open login modal
        showModal('login')
        
        // Clean up URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('auth')
        newUrl.searchParams.delete('redirectTo')
        window.history.replaceState({}, '', newUrl.toString())
      }
    }
  }, [user, showModal])

  const loadData = async () => {
    try {
      // Load stands
      const { data: standsData } = await supabase
        .from('stands')
        .select('*')
        .order('name')
      setStands(standsData || [])

      // Load hunts
      const { data: huntsData } = await supabase
        .from('hunt_logs')
        .select(`
          id,
          hunt_date,
          start_time,
          end_time,
          hunt_type,
          harvest_count,
          notes,
          created_at,
          stands (name, type)
        `)
        .eq('member_id', user.id)
        .order('hunt_date', { ascending: false })
        .limit(50)
      setHunts(huntsData || [])

      // Load sightings
      const { data: sightingsData } = await supabase
        .from('hunt_sightings')
        .select(`
          id,
          animal_type,
          count,
          gender,
          behavior,
          time_observed,
          hunt_logs!inner (
            hunt_date,
            member_id,
            stands (name)
          )
        `)
        .eq('hunt_logs.member_id', user.id)
        .order('created_at', { ascending: false })  // <- Fixed: Order by sightings table field
        .limit(100)
      
      const formattedSightings = sightingsData?.map(sighting => ({
        id: sighting.id,
        animal_type: sighting.animal_type,
        count: sighting.count,
        gender: sighting.gender,
        behavior: sighting.behavior,
        time_observed: sighting.time_observed,
        hunt_date: sighting.hunt_logs.hunt_date,
        stand_name: sighting.hunt_logs.stands?.name || 'Unknown'
      })) || []
      // ADDED: Sort by hunt_date in JavaScript since we can't do it in SQL
      formattedSightings.sort((a, b) => new Date(b.hunt_date).getTime() - new Date(a.hunt_date).getTime())

      setSightings(formattedSightings)

    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  // Show all navigation items, but indicate which require auth
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, requiresAuth: false },
    { id: 'calendar', label: 'Calendar', icon: Calendar, requiresAuth: false },
    { id: 'hunts', label: 'Hunt Logs', icon: Target, requiresAuth: true },
    { id: 'season', label: 'Season Prep', icon: ClipboardList, requiresAuth: true },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, requiresAuth: true },
    { id: 'cameras', label: 'Trail Cams', icon: Camera, requiresAuth: true },
    { id: 'property', label: 'Property Map', icon: MapPin, requiresAuth: false },
    { id: 'members', label: 'Members', icon: Users, requiresAuth: true },
    { id: 'reports', label: 'Reports', icon: FileText, requiresAuth: true },
    { id: 'settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  // Public stats for non-authenticated users
  const publicStats = [
    { label: 'Club Members', value: '3', icon: Users, change: '' },
    { label: 'Property Size', value: '100 acres', icon: MapPin, change: '' },
    { label: 'Hunting Stands', value: '12', icon: Target, change: '' },
    { label: 'Trail Cameras', value: '8', icon: Camera, change: '' },
  ];

  // FIXED: Mobile-aware nav click handler
  const handleNavClick = (sectionId: string) => {
    if (navigationItems.find(item => item.id === sectionId)?.requiresAuth && !user) {
      // For mobile, show login modal instead of redirect
      if (window.innerWidth < 1024) { // lg breakpoint
        showModal('login')
        setMobileMenuOpen(false)
        return
      }
      // Desktop redirect
      window.location.href = `/login?redirectTo=/?section=${sectionId}`;
      return;
    }
    setActiveSection(sectionId);
    setMobileMenuOpen(false); // MOBILE FIX: Always close mobile menu on nav
  }
  
  // FIXED: Enhanced signOut handler with mobile state reset and immediate redirect
  const handleSignOut = async () => {
    try {
      // FORCE logout state immediately
      setIsSigningOut(true)

      // Close all menus immediately - MOBILE FIX
      setUserMenuOpen(false)
      setMobileMenuOpen(false) // Close mobile menu
      // Reset to dashboard section
      setActiveSection('dashboard')
      // Clear any local data immediately
      setStands([])
      setHunts([])
      setSightings([])
      setHarvests([])
      // Sign out - this will trigger the useEffect above to show logo page
      await signOut()

      // Keep the forced logout state for a moment to ensure redirect
      setTimeout(() => {
        setIsSigningOut(false)
      }, 500)

    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false) // Reset on error
    }
  }

const renderDashboard = () => {
  // Calculate real stats from data
  const totalHunts = hunts?.length || 0
  const totalHarvests = hunts?.reduce((sum, hunt) => sum + hunt.harvest_count, 0) || 0
  const totalSightings = sightings?.length || 0
  const activeStands = stands?.filter(s => s.active).length || 0
  const successRate = totalHunts > 0 ? Math.round((totalHarvests / totalHunts) * 100) : 0
  
  // Recent activity
  const recentHunts = hunts?.slice(0, 3) || []
  const recentSightings = sightings?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg club-shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-forest-shadow">
              Welcome to Caswell County Yacht Club
            </h2>
            <p className="text-weathered-wood mt-2">
              {user 
                ? `Welcome back, ${user.email}! Here's what's happening at the club.`
                : "A premier hunting club in North Carolina. Sign in to access member features."
              }
            </p>
          </div>
          {!user && (
            <button
              onClick={() => showModal('login')}
              className="flex items-center px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
            >
              <LogIn size={16} className="mr-2" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Clickable Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user ? (
          <>
            {/* Total Hunts - Clickable */}
            <button
              onClick={() => showModal('hunts')}
              className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Total Hunts</p>
                  <p className="text-2xl font-bold text-forest-shadow">{totalHunts}</p>
                  <span className="text-sm font-medium text-bright-orange">
                    {successRate}% success rate
                  </span>
                </div>
                <div className="w-12 h-12 bg-olive-green/10 rounded-lg flex items-center justify-center group-hover:bg-olive-green/20 transition-colors">
                  <Target size={24} className="text-olive-green" />
                </div>
              </div>
              <div className="mt-2 text-xs text-weathered-wood">Click to view all hunts</div>
            </button>

            {/* Total Harvests - Clickable */}
            <button
              onClick={() => showModal('harvests')}
              className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Harvests</p>
                  <p className="text-2xl font-bold text-forest-shadow">{totalHarvests}</p>
                  <span className="text-sm font-medium text-burnt-orange">
                    This season
                  </span>
                </div>
                <div className="w-12 h-12 bg-burnt-orange/10 rounded-lg flex items-center justify-center group-hover:bg-burnt-orange/20 transition-colors">
                  <Target size={24} className="text-burnt-orange" />
                </div>
              </div>
              <div className="mt-2 text-xs text-weathered-wood">Click to view harvest details</div>
            </button>

            {/* Total Sightings - Clickable */}
            <button
              onClick={() => showModal('sightings')}
              className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Sightings</p>
                  <p className="text-2xl font-bold text-forest-shadow">{totalSightings}</p>
                  <span className="text-sm font-medium text-muted-gold">
                    Wildlife activity
                  </span>
                </div>
                <div className="w-12 h-12 bg-muted-gold/10 rounded-lg flex items-center justify-center group-hover:bg-muted-gold/20 transition-colors">
                  <Eye size={24} className="text-muted-gold" />
                </div>
              </div>
              <div className="mt-2 text-xs text-weathered-wood">Click to view all sightings</div>
            </button>

            {/* Active Stands - Clickable */}
            <button
              onClick={() => showModal('stands')}
              className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Active Stands</p>
                  <p className="text-2xl font-bold text-forest-shadow">{activeStands}</p>
                  <span className="text-sm font-medium text-dark-teal">
                    Ready to hunt
                  </span>
                </div>
                <div className="w-12 h-12 bg-dark-teal/10 rounded-lg flex items-center justify-center group-hover:bg-dark-teal/20 transition-colors">
                  <MapPin size={24} className="text-dark-teal" />
                </div>
              </div>
              <div className="mt-2 text-xs text-weathered-wood">Click to view stand details</div>
            </button>
          </>
        ) : (
          // Public stats for non-authenticated users
          publicStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg club-shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">{stat.label}</p>
                  <p className="text-2xl font-bold text-forest-shadow">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-morning-mist rounded-lg flex items-center justify-center">
                  <stat.icon size={24} className="text-olive-green" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {user ? (
        // Authenticated user content with real data
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Hunts */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-6 border-b border-morning-mist">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-forest-shadow">Recent Hunts</h3>
                <button
                  onClick={() => showModal('hunts')}
                  className="text-olive-green hover:text-pine-needle text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentHunts.length > 0 ? (
                  recentHunts.map((hunt) => (
                    <div key={hunt.id} className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-olive-green/10 rounded-lg flex items-center justify-center">
                        <Target size={20} className="text-olive-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest-shadow truncate">
                          {hunt.stands?.name || 'Unknown Stand'}
                        </p>
                        <p className="text-sm text-weathered-wood">
                          {new Date(hunt.hunt_date).toLocaleDateString()} • {hunt.hunt_type || 'AM'}
                        </p>
                      </div>
                      <div className="text-xs text-weathered-wood">
                        <div className={`px-2 py-1 rounded ${
                          hunt.harvest_count > 0 ? 'bg-burnt-orange/10 text-burnt-orange' : 'bg-morning-mist text-weathered-wood'
                        }`}>
                          {hunt.harvest_count > 0 ? 'Successful' : 'No harvest'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-weathered-wood">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hunts logged yet</p>
                  </div>
                )}
                
                {/* Quick Log Hunt Button */}
                <button 
                  onClick={() => showModal('hunt-form')}
                  className="flex items-center justify-center w-full p-3 border-2 border-dashed border-olive-green/30 text-olive-green rounded-lg hover:border-olive-green/50 hover:bg-olive-green/5 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log New Hunt
                </button>
              </div>
            </div>
          </div>

          {/* Recent Sightings */}
          <div className="bg-white rounded-lg club-shadow">
            <div className="p-6 border-b border-morning-mist">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-forest-shadow">Recent Sightings</h3>
                <button
                  onClick={() => showModal('sightings')}
                  className="text-olive-green hover:text-pine-needle text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentSightings.length > 0 ? (
                  recentSightings.map((sighting) => (
                    <div key={sighting.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted-gold/10 rounded-lg flex items-center justify-center">
                        <Eye size={16} className="text-muted-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest-shadow">
                          {sighting.count} {sighting.animal_type}
                        </p>
                        <p className="text-xs text-weathered-wood">
                          {sighting.stand_name} • {new Date(sighting.hunt_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-weathered-wood">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sightings recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Public content for non-authenticated users
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* About the Club */}
          <div className="bg-white rounded-lg club-shadow p-6">
            <h3 className="text-lg font-semibold text-forest-shadow mb-4">About Our Club</h3>
            <p className="text-weathered-wood mb-4">
              Caswell County Yacht Club is a premier hunting destination in North Carolina, 
              featuring 100 acres of diverse terrain with established hunting stands and 
              comprehensive trail camera coverage.
            </p>
            <div className="space-y-2 text-sm text-weathered-wood">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-olive-green" />
                100 acres in Caswell County, NC
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-olive-green" />
                12 strategically placed hunting stands
              </div>
              <div className="flex items-center">
                <Camera className="w-4 h-4 mr-2 text-olive-green" />
                8 trail cameras monitoring wildlife
              </div>
            </div>
          </div>

          {/* Member Benefits */}
          <div className="bg-white rounded-lg club-shadow p-6">
            <h3 className="text-lg font-semibold text-forest-shadow mb-4">Member Features</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-olive-green mt-0.5" />
                <div>
                  <p className="font-medium text-forest-shadow">Hunt Logging</p>
                  <p className="text-sm text-weathered-wood">Track your hunts and success rates</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Camera className="w-5 h-5 text-olive-green mt-0.5" />
                <div>
                  <p className="font-medium text-forest-shadow">Trail Camera Access</p>
                  <p className="text-sm text-weathered-wood">Monitor wildlife activity</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-olive-green mt-0.5" />
                <div>
                  <p className="font-medium text-forest-shadow">Interactive Property Map</p>
                  <p className="text-sm text-weathered-wood">Navigate stands and trails</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const renderHunts = () => {
  // Calculate real stats
  const totalHunts = hunts?.length || 0
  const totalHarvests = hunts?.reduce((sum, hunt) => sum + hunt.harvest_count, 0) || 0
  const totalSightings = sightings?.length || 0
  const activeStands = stands?.filter(s => s.active).length || 0

  return (
    <div className="space-y-6">
      {/* Hunt Logging Header */}
      <div className="bg-white rounded-lg club-shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-forest-shadow flex items-center">
              <Target className="w-6 h-6 mr-2" />
              Hunt Logging
            </h2>
            <p className="text-weathered-wood mt-2">
              Track your hunts, log harvests, and record wildlife sightings
            </p>
          </div>
          <button
            onClick={() => showModal('hunt-form')}
            className="flex items-center px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-clay-earth transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log New Hunt
          </button>
        </div>
      </div>

      {/* Clickable Hunt Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => showModal('hunts')}
          className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-weathered-wood">Total Hunts</p>
              <p className="text-2xl font-bold text-forest-shadow">{totalHunts}</p>
              <span className="text-sm font-medium text-bright-orange">Click to view</span>
            </div>
            <div className="w-12 h-12 bg-olive-green/10 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-olive-green" />
            </div>
          </div>
        </button>

        <button
          onClick={() => showModal('harvests')}
          className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-weathered-wood">Harvests</p>
              <p className="text-2xl font-bold text-forest-shadow">{totalHarvests}</p>
              <span className="text-sm font-medium text-burnt-orange">
                {totalHunts > 0 ? Math.round((totalHarvests / totalHunts) * 100) : 0}% rate
              </span>
            </div>
            <div className="w-12 h-12 bg-burnt-orange/10 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-burnt-orange" />
            </div>
          </div>
        </button>

        <button
          onClick={() => showModal('sightings')}
          className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-weathered-wood">Sightings</p>
              <p className="text-2xl font-bold text-forest-shadow">{totalSightings}</p>
              <span className="text-sm font-medium text-muted-gold">Wildlife data</span>
            </div>
            <div className="w-12 h-12 bg-muted-gold/10 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-muted-gold" />
            </div>
          </div>
        </button>

        <button
          onClick={() => showModal('stands')}
          className="bg-white rounded-lg club-shadow p-6 text-left hover:bg-morning-mist/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-weathered-wood">Active Stands</p>
              <p className="text-2xl font-bold text-forest-shadow">{activeStands}</p>
              <span className="text-sm font-medium text-dark-teal">Ready to hunt</span>
            </div>
            <div className="w-12 h-12 bg-dark-teal/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-dark-teal" />
            </div>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg club-shadow p-6">
        <h3 className="text-lg font-semibold text-forest-shadow mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => showModal('hunt-form')}
            className="flex flex-col items-center p-4 border border-weathered-wood/20 rounded-lg hover:bg-morning-mist transition-colors"
          >
            <Plus className="w-6 h-6 text-burnt-orange mb-2" />
            <span className="text-sm font-medium text-forest-shadow">Log Hunt</span>
          </button>
          
          <button
            onClick={() => showModal('hunts')}
            className="flex flex-col items-center p-4 border border-weathered-wood/20 rounded-lg hover:bg-morning-mist transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-olive-green mb-2" />
            <span className="text-sm font-medium text-forest-shadow">View History</span>
          </button>
          
          <button
            onClick={() => showModal('stands')}
            className="flex flex-col items-center p-4 border border-weathered-wood/20 rounded-lg hover:bg-morning-mist transition-colors"
          >
            <MapPin className="w-6 h-6 text-dark-teal mb-2" />
            <span className="text-sm font-medium text-forest-shadow">Stand Info</span>
          </button>
          
          <button
            onClick={() => showModal('sightings')}
            className="flex flex-col items-center p-4 border border-weathered-wood/20 rounded-lg hover:bg-morning-mist transition-colors"
          >
            <Eye className="w-6 h-6 text-muted-gold mb-2" />
            <span className="text-sm font-medium text-forest-shadow">Sightings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

  const renderSection = () => {
    switch (activeSection) {
      case 'calendar':
        return <CalendarView />;
      case 'property':
        return <PropertyMap showControls={false} />;
      case 'hunts':
        return <div className="p-6">{renderHunts()}</div>
      case 'dashboard':
        return renderDashboard();
      default:
        // Coming Soon pages for all other sections
        return (
          <div className="bg-white rounded-lg club-shadow p-6 text-center">
            <div className="w-16 h-16 bg-morning-mist rounded-full flex items-center justify-center mx-auto mb-4">
              {user ? <Wrench size={32} className="text-weathered-wood" /> : <Lock size={32} className="text-weathered-wood" />}
            </div>
            <h3 className="text-lg font-semibold text-forest-shadow mb-2">
              {user ? 'Coming Soon' : 'Sign In Required'}
            </h3>
            <p className="text-weathered-wood mb-4">
              {user 
                ? `The ${activeSection} feature is currently under development and will be available soon.`
                : `Please sign in to access the ${activeSection} feature.`
              }
            </p>
            {!user && (
              <button
                onClick={() => showModal('login')}
                className="inline-flex items-center px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
              >
                <LogIn size={16} className="mr-2" />
                Sign In
              </button>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-olive-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-green mx-auto mb-2"></div>
          <p className="text-weathered-wood">Loading...</p>
        </div>
      </div>
    );
  }

  // FIXED: Show logo-only page for logout redirect
  if (showLogoOnly) {
    return (
      <div className="min-h-screen bg-morning-mist">
        <div className="pt-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo Image */}
            <div className="mb-8">
              <img 
                src="/images/club-logo-whole.svg" 
                alt="Caswell County Yacht Club"
                className="mx-auto w-full h-auto max-w-4xl"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* WIP Banner */}
      {showWipBanner && (
        <div className="bg-muted-gold text-forest-shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell size={16} className="text-forest-shadow" />
                <span className="text-sm font-medium">
                  🚧 Under Development: This hunting club management system is actively being built.
                </span>
                <span className="text-sm ml-1">
                  Some features may be incomplete.
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

      {/* Enhanced Navigation Header with Hunt Logging Button */}
      <header className="bg-olive-green text-white club-shadow relative z-40">
        <div className="flex items-center justify-between p-4">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8" />
              <div>
                <h1 className="font-bold text-lg leading-tight">Caswell County</h1>
                <p className="text-xs text-olive-green/80">Yacht Club</p>
              </div>
            </div>
          </div>

          {/* Center - Hunt Logging Button (always visible when authenticated) */}
          {user && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => showModal('hunt-form')}
                className="bg-burnt-orange hover:bg-clay-earth text-white p-3 rounded-full transition-colors club-shadow-lg flex items-center justify-center"
                title="Log Hunt"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Right Side - User Menu and Notifications */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Notifications Button */}
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-burnt-orange text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <ChevronDown size={16} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg club-shadow py-2 text-forest-shadow z-50">
                      <div className="px-4 py-2 border-b border-morning-mist">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-weathered-wood">Club Member</p>
                      </div>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-morning-mist flex items-center">
                        <User size={16} className="mr-2" />
                        Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-morning-mist flex items-center">
                        <Settings size={16} className="mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-morning-mist flex items-center text-clay-earth"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => showModal('login')}
                className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                <LogIn size={16} className="mr-2" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block border-t border-white/10">
          <div className="flex items-center justify-center space-x-1 px-4 py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isDisabled = item.requiresAuth && !user;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDisabled
                      ? 'text-white/40 cursor-not-allowed'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {isDisabled && <Lock size={12} className="ml-1" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-olive-green border-t border-white/10 club-shadow-lg z-30">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isDisabled = item.requiresAuth && !user;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDisabled
                        ? 'text-white/40 cursor-not-allowed'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                    {isDisabled && <Lock size={16} className="ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSection()}
      </main>

      {/* Click outside to close menus */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}