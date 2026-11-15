'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getIcon } from '@/lib/shared/icons'
import type { ReportFilters, SeasonOption } from '@/lib/reports/types'
import { INCOMPLETE_SEASONS } from '@/lib/reports/data-quality'
import { SEASON_TYPE_LABELS, SEASON_TYPE_ORDER } from './format'

interface Option { value: string; label: string }

interface ReportFiltersBarProps {
  filters: ReportFilters
  seasons: SeasonOption[]
  hunters: Option[]
  stands: Option[]
  onChange: (next: Partial<ReportFilters>) => void
  onReset: () => void
  isDefault: boolean
}

const selectClass =
  'text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-olive-green focus:border-olive-green min-w-0'

export function ReportFiltersBar({ filters, seasons, hunters, stands, onChange, onReset, isDefault }: ReportFiltersBarProps) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const rulesRef = useRef<HTMLDivElement>(null)
  const TitleIcon = getIcon('analytics')
  const RulesIcon = getIcon('settings')
  const ResetIcon = getIcon('refresh')

  useEffect(() => {
    if (!rulesOpen) return
    const close = (e: MouseEvent) => {
      if (rulesRef.current && !rulesRef.current.contains(e.target as Node)) setRulesOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [rulesOpen])

  const seasonValue = filters.seasons === 'all' ? 'all' : String(filters.seasons[0] ?? 'all')
  const rulesChanged = filters.includeIncompleteSeasons || filters.calendarOnlyInRates || filters.includeInactiveStands

  return (
    <div className="sticky top-[68px] z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-forest-shadow mr-1">
              <TitleIcon size={18} className="text-olive-green" />
              <h1 className="text-base font-semibold">Reports</h1>
            </div>

            <select aria-label="Season" className={selectClass} value={seasonValue}
              onChange={e => onChange({ seasons: e.target.value === 'all' ? 'all' : [Number(e.target.value)] })}>
              <option value="all">All seasons</option>
              {seasons.map(s => (
                <option key={s.season} value={s.season}>
                  {s.season} season ({s.sits}){INCOMPLETE_SEASONS[s.season] ? ' - incomplete' : ''}
                </option>
              ))}
            </select>

            <select aria-label="Season type" className={selectClass} value={filters.seasonType ?? ''}
              onChange={e => onChange({ seasonType: e.target.value || null })}>
              <option value="">All season types</option>
              {SEASON_TYPE_ORDER.map(t => <option key={t} value={t}>{SEASON_TYPE_LABELS[t]}</option>)}
            </select>

            <select aria-label="Hunter" className={selectClass} value={filters.hunterKey ?? ''}
              onChange={e => onChange({ hunterKey: e.target.value || null })}>
              <option value="">All hunters</option>
              {hunters.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>

            <select aria-label="Stand" className={selectClass} value={filters.standId ?? ''}
              onChange={e => onChange({ standId: e.target.value || null })}>
              <option value="">All stands</option>
              {stands.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            <div className="relative" ref={rulesRef}>
              <button onClick={() => setRulesOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  rulesOpen ? 'bg-olive-green text-white border-olive-green' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                <RulesIcon size={14} />
                Data rules
                {rulesChanged && <span className={`w-2 h-2 rounded-full ${rulesOpen ? 'bg-white' : 'bg-burnt-orange'}`} />}
              </button>
              {rulesOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 space-y-3 text-sm">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-olive-green" checked={filters.includeIncompleteSeasons}
                      onChange={e => onChange({ includeIncompleteSeasons: e.target.checked })} />
                    <span>
                      <span className="font-medium text-forest-shadow">Include incomplete seasons</span>
                      <span className="block text-xs text-weathered-wood">In &quot;All seasons&quot;, also count {Object.keys(INCOMPLETE_SEASONS).join(', ')} (barely logged).</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-olive-green" checked={filters.calendarOnlyInRates}
                      onChange={e => onChange({ calendarOnlyInRates: e.target.checked })} />
                    <span>
                      <span className="font-medium text-forest-shadow">Count calendar-only harvests in rates</span>
                      <span className="block text-xs text-weathered-wood">Two old harvests have no record of the sit. Counting them inflates harvest rates.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-olive-green" checked={filters.includeInactiveStands}
                      onChange={e => onChange({ includeInactiveStands: e.target.checked })} />
                    <span>
                      <span className="font-medium text-forest-shadow">Show inactive stands</span>
                      <span className="block text-xs text-weathered-wood">List stands that no longer exist in the stand table. Their sits always count in the totals.</span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {!isDefault && (
              <button onClick={onReset} className="flex items-center gap-1 px-2 py-2 text-sm text-weathered-wood hover:text-olive-green">
                <ResetIcon size={14} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
