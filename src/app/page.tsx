// src/app/page.tsx (updated with auth integration)
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
  ClipboardList
} from "lucide-react";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { CalendarView } from "@/components/CalendarView";

function MainApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showWipBanner, setShowWipBanner] = useState(true);
  const { user, signOut } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'hunts', label: 'Hunt Logs', icon: Target },
    { id: 'season', label: 'Season Prep', icon: ClipboardList },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'cameras', label: 'Trail Cams', icon: Camera },
    { id: 'property', label: 'Property Map', icon: MapPin },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Work in Progress Banner */}
      {showWipBanner && (
        <div className="bg-amber-700 text-white px-4 py-2.5 text-center text-sm relative z-60 fixed top-0 left-0 right-0">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">🚧 Site Under Development</span>
            <span className="hidden sm:inline">- Features are being actively built and may not be fully functional</span>
          </div>
          <button 
            onClick={() => setShowWipBanner(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-amber-200 font-bold text-lg leading-none"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <nav className={`bg-white shadow-sm border-b fixed left-0 right-0 z-50 transition-all duration-300`} style={{top: showWipBanner ? '44px' : '0'}}>
        {/* Top Row - Site Title and User Controls */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile: Site title on separate line */}
            <div className="md:hidden py-3 text-center border-b border-gray-100">
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 bg-green-800 rounded-lg flex items-center justify-center mr-3">
                  <Target size={16} className="text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">Caswell County Yacht Club</h1>
              </div>
            </div>
            
            {/* Desktop and mobile controls row */}
            <div className="flex justify-between h-12">
              {/* Logo and Brand - Desktop only */}
              <div className="hidden md:flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-6 h-6 bg-green-800 rounded-lg flex items-center justify-center mr-3">
                    <Target size={16} className="text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">Caswell County Yacht Club</h1>
                </div>
              </div>

              {/* Right side items */}
              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                {/* Notifications */}
                <button className="relative text-gray-600 hover:text-gray-900 p-1.5">
                  <Bell size={18} />
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-1.5 rounded-md"
                  >
                    <div className="w-6 h-6 bg-amber-700 rounded-full flex items-center justify-center">
                      <User size={14} className="text-white" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Club Manager'}
                    </span>
                    <ChevronDown size={14} />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Club Manager'}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-amber-600 font-medium mt-1">🚧 Beta Version</p>
                      </div>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings size={16} className="mr-2" />
                        Account Settings
                      </button>
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

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-gray-600 hover:text-gray-900 p-1.5"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Navigation Menu */}
        <div className="bg-stone-100 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex space-x-1 h-12">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 my-2 ${
                      activeSection === item.id
                        ? 'bg-amber-100 text-green-800 shadow-sm border border-amber-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      activeSection === item.id
                        ? 'bg-amber-100 text-green-800 border border-amber-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className={`${showWipBanner ? 'pt-40 md:pt-32' : 'pt-28 md:pt-24'} transition-all duration-300`}>
        {/* Page Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-900 capitalize">
              {activeSection === 'dashboard' ? 'Dashboard' : navigationItems.find(item => item.id === activeSection)?.label}
            </h2>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeSection === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {huntingStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Icon size={24} className="text-green-800" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-green-800 font-medium">{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">from last month</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Hunts */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Hunts</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentHunts.map((hunt, index) => (
                      <div key={index} className="flex items-center justify-between">
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
                  <button className="mt-4 text-green-800 hover:text-amber-700 text-sm font-medium flex items-center">
                    View all hunts <ChevronRight size={16} className="ml-1" />
                  </button>
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
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {task.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                          {task.status === 'in-progress' && <Clock size={16} className="text-yellow-500" />}
                          {task.status === 'pending' && <AlertTriangle size={16} className="text-red-500" />}
                          <div>
                            <p className="font-medium text-gray-900">{task.task}</p>
                            <p className="text-sm text-gray-600">{task.assignee}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 text-green-800 hover:text-amber-700 text-sm font-medium flex items-center">
                    View all tasks <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Season Countdown */}
            <div className="mt-8 bg-gradient-to-r from-green-800 to-amber-700 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">2024 Hunting Season</h3>
                  <p className="text-amber-100 mt-1">Opening day countdown</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">45</p>
                  <p className="text-amber-100">days remaining</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Content */}
        {activeSection === 'calendar' && (
          <CalendarView />
        )}

        {/* Placeholder content for other sections */}
        {activeSection !== 'dashboard' && activeSection !== 'calendar' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {navigationItems.find(item => item.id === activeSection) && 
                  (() => {
                    const Icon = navigationItems.find(item => item.id === activeSection)!.icon;
                    return <Icon size={32} className="text-green-800" />;
                  })()
                }
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {navigationItems.find(item => item.id === activeSection)?.label}
              </h3>
              <p className="text-gray-600 mb-6">
                This section is coming soon! We're building amazing features for your hunt club management.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Click outside handler for dropdowns */}
      {(userMenuOpen || mobileMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <MainApp />
    </AuthGuard>
  );
}
