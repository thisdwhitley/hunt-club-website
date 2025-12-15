import React from 'react'
import { LucideIcon } from 'lucide-react'

interface ActionButton {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary'
  mobileLabel?: string // Optional shorter label for mobile
}

interface ManagementPageLayoutProps {
  title: string
  description: string
  icon: LucideIcon
  actions?: ActionButton[]
  children: React.ReactNode
}

/**
 * ManagementPageLayout - Consistent layout for all management pages
 *
 * Features:
 * - Green header bar with title, description, and icon
 * - Action buttons (Export, Add, etc.) in header
 * - Responsive max-width content area
 * - Consistent styling across all management pages
 */
export default function ManagementPageLayout({
  title,
  description,
  icon: Icon,
  actions = [],
  children
}: ManagementPageLayoutProps) {
  return (
    <div className="min-h-screen bg-morning-mist">
      {/* ==================== HEADER BAR (Green) ==================== */}
      <div className="bg-olive-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Title Section */}
              <div className="flex items-center gap-3 mb-4 sm:mb-0">
                <Icon size={28} className="text-white" />
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  <p className="text-green-100 opacity-90">{description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {actions.length > 0 && (
                <div className="flex items-center gap-3">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="bg-burnt-orange hover:bg-clay-earth text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                      title={action.label}
                    >
                      <action.icon size={20} />
                      <span className="hidden sm:inline">
                        {action.mobileLabel && <span className="sm:hidden">{action.mobileLabel}</span>}
                        <span className={action.mobileLabel ? 'hidden sm:inline' : ''}>
                          {action.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  )
}
