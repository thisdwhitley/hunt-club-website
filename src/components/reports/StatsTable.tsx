'use client'

import React, { useMemo, useState } from 'react'
import { getIcon } from '@/lib/shared/icons'
import type { SitStats } from '@/lib/reports/types'
import { pct, perSit, tdClass, thClass } from './format'

export type StatColumn = 'sits' | 'sawDeer' | 'deerPerSit' | 'bucksPerSit' | 'doesPerSit' | 'harvests' | 'harvestRate'

export interface StatsRow {
  key: string
  label: string
  sublabel?: string
  stats: SitStats
  /** Indented sub-row (e.g. AM/PM under a season type) */
  indent?: boolean
  /** Bold summary row */
  emphasis?: boolean
  note?: string
  extra?: Record<string, React.ReactNode>
}

export interface ExtraColumn {
  key: string
  label: string
  /** Inserted after this stat column; default: at the end */
  after?: StatColumn
}

interface StatsTableProps {
  rows: StatsRow[]
  firstColumn: string
  columns?: StatColumn[]
  extraColumns?: ExtraColumn[]
  /** Columns that can be sorted by clicking their header */
  sortable?: StatColumn[]
  defaultSort?: { column: StatColumn; desc: boolean }
  emptyMessage?: string
}

const COLUMN_LABELS: Record<StatColumn, string> = {
  sits: 'Sits',
  sawDeer: 'Saw deer',
  deerPerSit: 'Deer / sit',
  bucksPerSit: 'Bucks / sit',
  doesPerSit: 'Does / sit',
  harvests: 'Harvests',
  harvestRate: 'Harvest rate',
}

const COLUMN_HELP: Partial<Record<StatColumn, string>> = {
  sawDeer: 'Share of sits where at least one deer was seen',
  deerPerSit: 'Deer seen divided by sits',
  harvestRate: 'Share of sits that ended in a harvest',
}

function cellValue(stats: SitStats, column: StatColumn): React.ReactNode {
  switch (column) {
    case 'sits': return stats.sits
    case 'sawDeer': return (
      <span title={`${stats.sitsSawDeer} of ${stats.sits} sits`}>
        {pct(stats.sawDeerRate)}
        <span className="text-xs text-weathered-wood/80 ml-1">({stats.sitsSawDeer})</span>
      </span>
    )
    case 'deerPerSit': return perSit(stats.deerPerSit)
    case 'bucksPerSit': return perSit(stats.bucksPerSit)
    case 'doesPerSit': return perSit(stats.doesPerSit)
    case 'harvests': return stats.harvests
    case 'harvestRate': return pct(stats.harvestRate)
  }
}

function sortValue(stats: SitStats, column: StatColumn): number {
  switch (column) {
    case 'sits': return stats.sits
    case 'sawDeer': return stats.sawDeerRate ?? -1
    case 'deerPerSit': return stats.deerPerSit ?? -1
    case 'bucksPerSit': return stats.bucksPerSit ?? -1
    case 'doesPerSit': return stats.doesPerSit ?? -1
    case 'harvests': return stats.harvests
    case 'harvestRate': return stats.harvestRate ?? -1
  }
}

function SmallSampleBadge() {
  return (
    <span className="ml-1.5 text-[10px] uppercase tracking-wide text-weathered-wood bg-morning-mist rounded px-1 py-px" title="Fewer than 10 sits - treat these numbers with caution">
      small sample
    </span>
  )
}

export function StatsTable({
  rows,
  firstColumn,
  columns = ['sits', 'sawDeer', 'deerPerSit', 'harvests', 'harvestRate'],
  extraColumns = [],
  sortable = [],
  defaultSort,
  emptyMessage = 'No sits match these filters.',
}: StatsTableProps) {
  const [sort, setSort] = useState(defaultSort)
  const SortIcon = getIcon('sort')

  const sorted = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => {
      const d = sortValue(a.stats, sort.column) - sortValue(b.stats, sort.column)
      return sort.desc ? -d : d
    })
  }, [rows, sort])

  // final column order: stat columns with extras inserted after their anchor
  const order: ({ type: 'stat'; column: StatColumn } | { type: 'extra'; column: ExtraColumn })[] = []
  for (const c of columns) {
    order.push({ type: 'stat', column: c })
    for (const e of extraColumns.filter(e => e.after === c)) order.push({ type: 'extra', column: e })
  }
  for (const e of extraColumns.filter(e => !e.after)) order.push({ type: 'extra', column: e })

  if (!rows.length) {
    return <p className="text-sm text-weathered-wood px-4 py-6 text-center">{emptyMessage}</p>
  }

  const toggleSort = (column: StatColumn) =>
    setSort(s => (s?.column === column ? { column, desc: !s.desc } : { column, desc: true }))

  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass}>{firstColumn}</th>
              {order.map(o => {
                if (o.type === 'extra') return <th key={o.column.key} className={thClass}>{o.column.label}</th>
                const c = o.column
                const canSort = sortable.includes(c)
                return (
                  <th key={c} className={thClass} title={COLUMN_HELP[c]}>
                    {canSort ? (
                      <button onClick={() => toggleSort(c)} className="inline-flex items-center gap-1 uppercase hover:text-olive-green">
                        {COLUMN_LABELS[c]}
                        <SortIcon size={12} className={sort?.column === c ? 'text-olive-green' : 'opacity-40'} />
                      </button>
                    ) : COLUMN_LABELS[c]}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sorted.map(r => (
              <tr key={r.key} className={`${r.stats.smallSample ? 'opacity-60' : ''} ${r.emphasis ? 'bg-[#F5F4F0]' : ''}`}>
                <td className={`${tdClass} ${r.indent ? 'pl-8' : ''} ${r.emphasis ? 'font-semibold' : ''}`} title={r.note}>
                  {r.label}
                  {r.sublabel && <span className="ml-1 text-weathered-wood/80">{r.sublabel}</span>}
                  {r.note && <span className="ml-1 text-burnt-orange">*</span>}
                  {r.stats.smallSample && r.stats.sits > 0 && <SmallSampleBadge />}
                </td>
                {order.map(o => o.type === 'extra'
                  ? <td key={o.column.key} className={tdClass}>{r.extra?.[o.column.key] ?? ''}</td>
                  : <td key={o.column} className={`${tdClass} ${r.emphasis ? 'font-semibold' : ''}`}>{cellValue(r.stats, o.column)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: stacked cards */}
      <div className="sm:hidden divide-y divide-gray-100">
        {sorted.map(r => (
          <div key={r.key} className={`px-4 py-3 ${r.stats.smallSample ? 'opacity-60' : ''} ${r.indent ? 'pl-8' : ''} ${r.emphasis ? 'bg-[#F5F4F0]' : ''}`}>
            <div className={`text-sm text-forest-shadow mb-1.5 ${r.emphasis ? 'font-semibold' : 'font-medium'}`}>
              {r.label}
              {r.sublabel && <span className="ml-1 text-weathered-wood/80">{r.sublabel}</span>}
              {r.note && <span className="ml-1 text-burnt-orange" title={r.note}>*</span>}
              {r.stats.smallSample && r.stats.sits > 0 && <SmallSampleBadge />}
            </div>
            <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
              {order.map(o => {
                const key = o.type === 'extra' ? o.column.key : o.column
                const label = o.type === 'extra' ? o.column.label : COLUMN_LABELS[o.column]
                const value = o.type === 'extra' ? r.extra?.[o.column.key] : cellValue(r.stats, o.column)
                if (value === undefined || value === null || value === '') return null
                return (
                  <div key={key}>
                    <dt className="text-weathered-wood">{label}</dt>
                    <dd className="text-forest-shadow font-medium">{value}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        ))}
      </div>
    </>
  )
}
