'use client'

import React from 'react'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons/types'

export interface TabConfig {
  key: string
  label: string
  icon: IconName
}

interface ManagementHubToolbarProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (key: string) => void
  title: string
  icon: IconName
  actions?: React.ReactNode
  fab?: React.ReactNode
  children?: React.ReactNode
}

export function ManagementHubToolbar({
  tabs,
  activeTab,
  onTabChange,
  title,
  icon,
  actions,
  fab,
  children,
}: ManagementHubToolbarProps) {
  const TitleIcon = getIcon(icon)

  return (
    <>
      <div className="sticky top-[68px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">

            {/* Mobile: tab bar */}
            <div className="flex sm:hidden items-center gap-1">
              {tabs.map((tab) => {
                const TabIcon = getIcon(tab.icon)
                return (
                  <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-olive-green text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <TabIcon size={14} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Desktop: title + tab bar + actions */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-forest-shadow">
                  <TitleIcon size={18} className="text-olive-green" />
                  <h1 className="text-base font-semibold">{title}</h1>
                </div>
                <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                  {tabs.map((tab) => {
                    const TabIcon = getIcon(tab.icon)
                    return (
                      <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? 'bg-olive-green text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <TabIcon size={14} />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            {/* Divider + toolbar row — only when children provided */}
            {children && (
              <>
                <div className="border-t border-gray-100 my-3" />
                {children}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAB — fixed position, must render outside sticky wrapper */}
      {fab}
    </>
  )
}
