// src/app/test-nav/page.tsx
// Test page for navigation styling and behavior

'use client'

import React, { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { navigationItems, userMenuItems, brandConfig } from '@/lib/navigation/navigation-config'

export default function NavigationTestPage() {
  const [selectedTheme, setSelectedTheme] = useState('current')
  
  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-club p-6">
          <h1 className="text-2xl font-bold text-forest-shadow mb-6">
            Navigation Test & Configuration
          </h1>
          
          {/* Theme Selector */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-forest-shadow mb-4">
              Theme Preview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedTheme('current')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedTheme === 'current' 
                    ? 'border-olive-green bg-olive-green/10' 
                    : 'border-gray-200 hover:border-olive-green/50'
                }`}
              >
                <div className="bg-olive-green h-4 w-full mb-2 rounded"></div>
                <span className="text-sm font-medium">Current Theme</span>
              </button>
              
              <button
                onClick={() => setSelectedTheme('dark')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedTheme === 'dark' 
                    ? 'border-gray-800 bg-gray-800/10' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="bg-gray-800 h-4 w-full mb-2 rounded"></div>
                <span className="text-sm font-medium">Dark Theme</span>
              </button>
              
              <button
                onClick={() => setSelectedTheme('custom')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedTheme === 'custom' 
                    ? 'border-blue-600 bg-blue-600/10' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="bg-blue-600 h-4 w-full mb-2 rounded"></div>
                <span className="text-sm font-medium">Custom Theme</span>
              </button>
            </div>
          </div>

          {/* Navigation Configuration */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-forest-shadow mb-4">
              Navigation Configuration
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brand Config */}
              <div className="bg-morning-mist p-4 rounded-lg">
                <h3 className="font-medium text-forest-shadow mb-3">Brand Settings</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {brandConfig.name}</div>
                  <div><strong>Subtitle:</strong> {brandConfig.subtitle}</div>
                  <div><strong>Description:</strong> {brandConfig.description}</div>
                  <div><strong>Short Name:</strong> {brandConfig.shortName}</div>
                </div>
              </div>
              
              {/* Navigation Stats */}
              <div className="bg-morning-mist p-4 rounded-lg">
                <h3 className="font-medium text-forest-shadow mb-3">Navigation Stats</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Main Items:</strong> {navigationItems.length}</div>
                  <div><strong>User Items:</strong> {userMenuItems.length}</div>
                  <div><strong>Items with Badges:</strong> {navigationItems.filter(item => item.badge).length}</div>
                  <div><strong>Auth Required:</strong> {navigationItems.filter(item => item.requiresAuth).length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items Preview */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-forest-shadow mb-4">
              Navigation Items
            </h2>
            <div className="bg-morning-mist p-4 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.name} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <Icon size={16} className="text-olive-green" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-weathered-wood truncate">{item.description}</div>
                      </div>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Style Customization Guide */}
          <div>
            <h2 className="text-lg font-semibold text-forest-shadow mb-4">
              Style Customization Guide
            </h2>
            <div className="bg-morning-mist p-4 rounded-lg space-y-4 text-sm">
              <div>
                <strong>To modify colors:</strong> Edit the <code className="bg-white px-2 py-1 rounded">navigationTheme</code> object in <code className="bg-white px-2 py-1 rounded">navigation-config.ts</code>
              </div>
              <div>
                <strong>To add navigation items:</strong> Add to the <code className="bg-white px-2 py-1 rounded">navigationItems</code> array in <code className="bg-white px-2 py-1 rounded">navigation-config.ts</code>
              </div>
              <div>
                <strong>To modify branding:</strong> Update the <code className="bg-white px-2 py-1 rounded">brandConfig</code> object in <code className="bg-white px-2 py-1 rounded">navigation-config.ts</code>
              </div>
              <div>
                <strong>To test changes:</strong> Reload this page and check both mobile (resize window) and desktop views
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}