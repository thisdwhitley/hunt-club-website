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
  Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CalendarView } from "@/components/CalendarView";
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
        // Authenticated user content
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Hunts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Hunts</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentHunts.map((hunt, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {hunt.hunter} - {hunt.game}
                      </p>
                      <p className="text-sm text-gray-500">{hunt.location} • {hunt.date}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Maintenance Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {maintenanceTasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-100' : 
                      task.status === 'in-progress' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      {task.status === 'completed' ? 
                        <CheckCircle size={20} className="text-green-600" /> :
                        task.status === 'in-progress' ? 
                        <Clock size={20} className="text-amber-600" /> :
                        <AlertTriangle size={20} className="text-red-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.task}</p>
                      <p className="text-sm text-gray-500">{task.assignee} • {task.priority} Priority</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Public content for non-authenticated users
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Public View</h3>
            <p className="text-gray-600 mb-4">
              You're viewing the public information about Caswell County Yacht Club. 
              Sign in to access member features including hunt logs, maintenance tracking, 
              trail camera management, and more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <Link
                href="/login"
                className="flex items-center justify-center px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
              >
                <LogIn size={16} className="mr-2" />
                Sign In
              </Link>
              <button
                onClick={() => setActiveSection('calendar')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar size={16} className="mr-2" />
                View Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'calendar':
        return <CalendarView />;
      case 'dashboard':
        return renderDashboard();
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {user ? <Wrench size={32} className="text-gray-600" /> : <Lock size={32} className="text-gray-600" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user ? 'Coming Soon' : 'Sign In Required'}
            </h3>
            <p className="text-gray-600 mb-4">
              {user 
                ? `The ${activeSection} feature is currently under development and will be available soon.`
                : `Please sign in to access the ${activeSection} feature.`
              }
            </p>
            {!user && (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
              >
                <LogIn size={16} className="mr-2" />
                Sign In
              </Link>
            )}
          </div>
        );
    }
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* WIP Banner */}
      {showWipBanner && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <Bell size={16} className="text-amber-600" />
              <span className="text-amber-800 text-sm font-medium">
                🚧 Under Development: This hunting club management system is actively being built. Some features may be incomplete.
              </span>
            </div>
            <button
              onClick={() => setShowWipBanner(false)}
              className="text-amber-600 hover:text-amber-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-800 rounded-lg flex items-center justify-center">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Caswell County Yacht Club</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Hunting Club Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${activeSection === item.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                    ${item.requiresAuth && !user ? 'opacity-60' : ''}
                  `}
                >
                  <item.icon size={16} className="mr-2" />
                  {item.label}
                  {item.requiresAuth && !user && <Lock size={12} className="ml-1" />}
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <User size={16} />
                    <span className="hidden sm:block">{user.email}</span>
                    <ChevronDown size={16} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
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
                  className="flex items-center px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors text-sm font-medium"
                >
                  <LogIn size={16} className="mr-2" />
                  <span className="hidden sm:block">Sign In</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${activeSection === item.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                    ${item.requiresAuth && !user ? 'opacity-60' : ''}
                  `}
                >
                  <item.icon size={16} className="mr-3" />
                  {item.label}
                  {item.requiresAuth && !user && <Lock size={12} className="ml-auto" />}
                </button>
              ))}
            </div>
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
