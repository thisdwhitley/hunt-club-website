// src/app/page.tsx - Properly fixed version with working navigation
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
  Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CalendarView } from "@/components/CalendarView";
import SimplePropertyMap from "@/components/SimplePropertyMap"; // Using our working map
import Link from "next/link";

export default function MainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showWipBanner, setShowWipBanner] = useState(true);
  const { user, signOut, loading } = useAuth();

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

  // Authenticated user stats
  const huntingStats = [
    { label: 'Total Harvests', value: '47', icon: Target, change: '+12%' },
    { label: 'Active Hunters', value: '23', icon: Users, change: '+3' },
    { label: 'Days Until Season', value: '45', icon: Calendar, change: '-1' },
    { label: 'Camera Photos', value: '1,247', icon: Camera, change: '+156' },
  ];

  const recentHunts = [
    { hunter: 'John Smith', game: 'White-tail Buck', date: '2024-01-20', location: 'North Stand' },
    { hunter: 'Mike Johnson', game: 'Doe', date: '2024-01-19', location: 'Creek Bottom' },
    { hunter: 'Dave Wilson', game: 'Turkey', date: '2024-01-18', location: 'Ridge Line' },
  ];

  const maintenanceTasks = [
    { task: 'Repair feeder #3', priority: 'High', assignee: 'Tom Brown', status: 'pending' },
    { task: 'Clear shooting lanes', priority: 'Medium', assignee: 'Mike Johnson', status: 'in-progress' },
    { task: 'Check trail cameras', priority: 'Low', assignee: 'John Smith', status: 'completed' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    // No need to redirect - user stays on same page but sees public view
  };

  const handleNavClick = (sectionId: string) => {
    const section = navigationItems.find(item => item.id === sectionId);
    if (section?.requiresAuth && !user) {
      // Redirect to login for protected sections
      window.location.href = `/login?redirectTo=/${sectionId}`;
      return;
    }
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to Caswell County Yacht Club
            </h2>
            <p className="text-gray-600 mt-2">
              {user 
                ? `Welcome back, ${user.email}! Here's what's happening at the club.`
                : "A premier hunting club in North Carolina. Sign in to access member features."
              }
            </p>
          </div>
          {!user && (
            <Link
              href="/login"
              className="flex items-center px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
            >
              <LogIn size={16} className="mr-2" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(user ? huntingStats : publicStats).map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <p className="text-sm text-green-600">{stat.change}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <stat.icon size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {user ? (
        /* Authenticated Dashboard Content */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Hunts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="mr-2" size={20} />
                  Recent Hunts
                </h3>
                <Link href="/hunts" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentHunts.map((hunt, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{hunt.hunter}</p>
                      <p className="text-sm text-gray-600">{hunt.game} • {hunt.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{hunt.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Maintenance Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Wrench className="mr-2" size={20} />
                  Maintenance Tasks
                </h3>
                <Link href="/maintenance" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {maintenanceTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.task}</p>
                      <p className="text-sm text-gray-600">Assigned to {task.assignee}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      {task.status === 'completed' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : task.status === 'in-progress' ? (
                        <Clock size={16} className="text-yellow-600" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Public Dashboard Content */
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About Our Club</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Caswell County Yacht Club is a premier hunting destination located on 100 acres of pristine North Carolina wilderness. 
              Our club features multiple hunting stands, trail cameras, and carefully managed food plots to ensure excellent hunting opportunities for our members.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <LogIn size={18} className="mr-2" />
                Sign In to Access Member Features
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPropertyMap = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="mr-2" size={24} />
                Property Map
              </h2>
              <p className="text-gray-600 mt-1">
                Interactive map showing hunting stands, trail cameras, food plots, and trails
              </p>
            </div>
            {!user && (
              <div className="flex items-center text-sm text-gray-500">
                <Eye size={16} className="mr-1" />
                Public View
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          <SimplePropertyMap className="w-full" height="500px" />
        </div>
        
        {/* Map Legend */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-3">Map Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
              <span>Hunting Stands</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
              <span>Trail Cameras</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-amber-600 rounded-full mr-2"></div>
              <span>Food Plots</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-1 bg-blue-600 mr-2"></div>
              <span>Trails</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-1 bg-stone-600 mr-2" style={{ borderStyle: 'dashed', borderWidth: '1px 0' }}></div>
              <span>Property Boundary</span>
            </div>
          </div>
          
          {user && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Member Tip:</strong> Click the edit button to add new hunting stands, trail cameras, or food plots. 
                Your changes will sync in real-time with other club members.
              </p>
            </div>
          )}
          
          {!user && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                <Lock size={16} className="inline mr-1" />
                Sign in to add new locations and access detailed information about each hunting spot.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Property Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium">3843 Quick Rd, Ruffin, NC 27326</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Acreage:</span>
              <span className="font-medium">100 acres</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">County:</span>
              <span className="font-medium">Caswell County</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coordinates:</span>
              <span className="font-mono text-xs">36.425°N, 79.515°W</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target size={24} className="text-green-600 mx-auto mb-1" />
              <p className="font-semibold text-gray-900">3</p>
              <p className="text-gray-600">Hunting Stands</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <Camera size={24} className="text-red-600 mx-auto mb-1" />
              <p className="font-semibold text-gray-900">3</p>
              <p className="text-gray-600">Trail Cameras</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-amber-600 mx-auto mb-1">🌾</div>
              <p className="font-semibold text-gray-900">3</p>
              <p className="text-gray-600">Food Plots</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-600 mx-auto mb-1">🥾</div>
              <p className="font-semibold text-gray-900">0</p>
              <p className="text-gray-600">Trails</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'calendar':
        return <CalendarView />;
      case 'property':
        return renderPropertyMap();
      case 'hunts':
      case 'season':
      case 'maintenance':
      case 'cameras':
      case 'members':
      case 'reports':
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Wrench size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature In Development</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                This feature is currently being built. Check back soon for updates!
              </p>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* WIP Banner */}
      {showWipBanner && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <Bell size={16} className="text-yellow-700" />
              <span className="text-yellow-800 text-sm font-medium">
                🚧 Under Development: This hunting club management system is actively being built. Property map now available!
              </span>
            </div>
            <button
              onClick={() => setShowWipBanner(false)}
              className="text-yellow-700 hover:text-yellow-900"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Logo and User Menu */}
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target size={20} className="text-white" />
              </div>
              <div className="min-w-0 flex-shrink-0">
                <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">Caswell County Yacht Club</h1>
                <p className="text-xs text-gray-500">Hunting Club Management</p>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <User size={20} />
                    <span className="text-sm font-medium">{user.email}</span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={() => handleNavClick('settings')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings size={16} className="mr-2" />
                        Settings
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Navigation Row - Full Width */}
          <div className="hidden lg:block border-t border-gray-200">
            <nav className="flex space-x-1 py-3 overflow-x-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeSection === item.id
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${item.requiresAuth && !user ? 'opacity-75' : ''}`}
                >
                  <item.icon size={16} className="mr-2" />
                  {item.label}
                  {item.requiresAuth && !user && <Lock size={12} className="ml-1 opacity-50" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-green-100 text-green-800'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${item.requiresAuth && !user ? 'opacity-75' : ''}`}
                  >
                    <item.icon size={16} className="mr-3" />
                    {item.label}
                    {item.requiresAuth && !user && <Lock size={12} className="ml-auto opacity-50" />}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
