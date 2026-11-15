'use client'

import React, { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getIcon } from '@/lib/shared/icons'
import type { IconName } from '@/lib/shared/icons/types'
import type { ReportFilters, ReportSit, SeasonOption, SitStats } from '@/lib/reports/types'
import { groupStats, SMALL_SAMPLE, standLean, summarize } from '@/lib/reports/metrics'
import { applyFilters, DATA_NOTES, DEFAULT_QUALITY, INCOMPLETE_SEASONS, KNOWN_ISSUES, notesForSeasons, SEASON_NOTES } from '@/lib/reports/data-quality'
import { ReportFiltersBar } from './ReportFiltersBar'
import { StatsTable, type StatsRow } from './StatsTable'
import { pct, perSit, plural, SEASON_TYPE_LABELS, SEASON_TYPE_ORDER } from './format'

interface ReportsViewProps {
  sits: ReportSit[]
  seasons: SeasonOption[]
  defaultSeason: number | null
}

const HUNT_TYPES = ['AM', 'PM', 'All Day'] as const
const HUNT_TYPE_LABELS: Record<string, string> = { AM: 'Morning (AM)', PM: 'Evening (PM)', 'All Day': 'All day' }

// ---------- URL <-> filters ----------
function filtersFromParams(params: URLSearchParams, defaultSeason: number | null): ReportFilters {
  const season = params.get('season')
  const seasons: ReportFilters['seasons'] = season === 'all' ? 'all'
    : season ? season.split(',').map(Number).filter(Number.isFinite)
    : defaultSeason !== null ? [defaultSeason] : 'all'
  return {
    seasons: Array.isArray(seasons) && !seasons.length ? 'all' : seasons,
    seasonType: params.get('type'),
    hunterKey: params.get('hunter'),
    standId: params.get('stand'),
    includeInactiveStands: params.get('inactive') === '1',
    includeIncompleteSeasons: params.get('incomplete') === '1' || DEFAULT_QUALITY.includeIncompleteSeasons,
    calendarOnlyInRates: params.get('calrates') === '1' || DEFAULT_QUALITY.calendarOnlyInRates,
  }
}

function paramsFromFilters(f: ReportFilters, defaultSeason: number | null): URLSearchParams {
  const p = new URLSearchParams()
  const isDefaultSeason = Array.isArray(f.seasons) && f.seasons.length === 1 && f.seasons[0] === defaultSeason
  if (!isDefaultSeason) p.set('season', f.seasons === 'all' ? 'all' : f.seasons.join(','))
  if (f.seasonType) p.set('type', f.seasonType)
  if (f.hunterKey) p.set('hunter', f.hunterKey)
  if (f.standId) p.set('stand', f.standId)
  if (f.includeInactiveStands) p.set('inactive', '1')
  if (f.includeIncompleteSeasons) p.set('incomplete', '1')
  if (f.calendarOnlyInRates) p.set('calrates', '1')
  return p
}

// ---------- small presentational pieces ----------
function Section({ title, icon, subtitle, children }: { title: string; icon: IconName; subtitle?: string; children: React.ReactNode }) {
  const Icon = getIcon(icon)
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-olive-green" />
          <h2 className="text-sm font-semibold text-forest-shadow">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-weathered-wood mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Tile({ label, value, detail, icon, muted }: { label: string; value: string; detail: string; icon: IconName; muted?: boolean }) {
  const Icon = getIcon(icon)
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${muted ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-weathered-wood uppercase tracking-wide">
        <Icon size={14} className="text-olive-green" />
        {label}
      </div>
      <div className="text-2xl font-bold text-forest-shadow mt-1">{value}</div>
      <div className="text-xs text-weathered-wood mt-0.5">{detail}</div>
    </div>
  )
}

/** Plain-language AM vs PM takeaway, only when both sides have enough sits. */
function takeaway(am: SitStats | undefined, pm: SitStats | undefined): string | null {
  if (!am || !pm || am.sits < SMALL_SAMPLE || pm.sits < SMALL_SAMPLE || am.sawDeerRate === null || pm.sawDeerRate === null) return null
  const diff = pm.sawDeerRate - am.sawDeerRate
  if (Math.abs(diff) < 0.05) return `Mornings and evenings saw deer about equally often (${pct(am.sawDeerRate)} vs ${pct(pm.sawDeerRate)}).`
  const better = diff > 0 ? 'Evening' : 'Morning'
  const [hi, lo] = diff > 0 ? [pm, am] : [am, pm]
  return `${better} sits saw deer more often: ${pct(hi.sawDeerRate)} vs ${pct(lo.sawDeerRate)}, with ${perSit(hi.deerPerSit)} vs ${perSit(lo.deerPerSit)} deer per sit.`
}

// ---------- main view ----------
export default function ReportsView({ sits, seasons, defaultSeason }: ReportsViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(() => filtersFromParams(new URLSearchParams(searchParams.toString()), defaultSeason), [searchParams, defaultSeason])
  const setFilters = useCallback((next: Partial<ReportFilters>) => {
    const qs = paramsFromFilters({ ...filters, ...next }, defaultSeason).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [filters, defaultSeason, pathname, router])
  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router])
  const isDefault = searchParams.toString() === ''

  const opts = { calendarOnlyInRates: filters.calendarOnlyInRates }
  const view = useMemo(() => applyFilters(sits, filters), [sits, filters])

  // filter options come from all sits, not the filtered view
  const hunters = useMemo(() => {
    const m = new Map<string, string>()
    sits.forEach(s => m.set(s.hunterKey, s.hunterKey === 'guest'
      ? `Guests (${[...new Set(sits.filter(x => x.hunterKey === 'guest' && x.guestName).map(x => x.guestName))].join(', ')})`
      : s.hunterName))
    return [...m.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [sits])
  const standOptions = useMemo(() => {
    const m = new Map<string, { name: string; active: boolean }>()
    sits.forEach(s => { if (s.standId && s.standName) m.set(s.standId, { name: s.standName, active: s.standActive }) })
    return [...m.entries()]
      .sort((a, b) => Number(b[1].active) - Number(a[1].active) || a[1].name.localeCompare(b[1].name))
      .map(([value, s]) => ({ value, label: s.active ? s.name : `${s.name} (inactive)` }))
  }, [sits])

  const total = summarize(view, opts)
  const byType = groupStats(view, s => s.huntType, { ...opts, order: [...HUNT_TYPES] })
  const am = byType.find(g => g.key === 'AM')?.stats
  const pm = byType.find(g => g.key === 'PM')?.stats
  const seasonsInView = [...new Set(view.map(s => s.season).filter((s): s is number => s !== null))].sort((a, b) => b - a)
  const seasonNotes = notesForSeasons(seasonsInView)
  const calendarOnlyInView = view.filter(s => s.calendarOnly).length

  const scopeLabel = filters.seasons === 'all'
    ? `All seasons${filters.includeIncompleteSeasons ? '' : ` (excluding ${Object.keys(INCOMPLETE_SEASONS).join(', ')})`}`
    : `${filters.seasons.join(', ')} season${filters.seasons.length > 1 ? 's' : ''}`

  // AM vs PM rows
  const amPmRows: StatsRow[] = byType.map(g => ({ key: g.key, label: HUNT_TYPE_LABELS[g.key], stats: g.stats }))

  // season type x AM/PM rows
  const typeRows: StatsRow[] = []
  for (const t of SEASON_TYPE_ORDER) {
    const inType = view.filter(s => s.seasonType === t)
    if (!inType.length) continue
    typeRows.push({ key: t, label: SEASON_TYPE_LABELS[t], stats: summarize(inType, opts), emphasis: true })
    for (const g of groupStats(inType, s => s.huntType, { ...opts, order: [...HUNT_TYPES] })) {
      typeRows.push({ key: `${t}-${g.key}`, label: g.key === 'All Day' ? 'All day' : g.key, stats: g.stats, indent: true })
    }
  }
  const noType = view.filter(s => !s.seasonType).length

  // stand rows
  const standRows: StatsRow[] = []
  for (const { key, stats } of groupStats(view, s => s.standId, opts)) {
    const standSits = view.filter(s => s.standId === key)
    const first = standSits[0]
    if (!first.standActive && !filters.includeInactiveStands) continue
    const amS = summarize(standSits.filter(s => s.huntType === 'AM'), opts)
    const pmS = summarize(standSits.filter(s => s.huntType === 'PM'), opts)
    const lean = standLean(amS, pmS)
    standRows.push({
      key,
      label: first.standName ?? 'Unknown stand',
      sublabel: first.standActive ? undefined : '(inactive)',
      stats,
      extra: {
        amPm: `${amS.sits} / ${pmS.sits}`,
        lean: lean ? (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${lean === 'morning' ? 'bg-muted-gold/15 text-muted-gold' : 'bg-dark-teal/10 text-dark-teal'}`}>
            {lean === 'morning' ? 'Morning stand' : 'Evening stand'}
          </span>
        ) : '',
      },
    })
  }
  const hiddenInactive = new Set(view.filter(s => s.standId && !s.standActive).map(s => s.standId)).size
  const noStand = view.filter(s => !s.standId).length

  // season rows
  const seasonRows: StatsRow[] = groupStats(view, s => s.season, { ...opts, order: seasonsInView })
    .map(({ key, stats }) => ({ key: String(key), label: `${key}`, stats, note: INCOMPLETE_SEASONS[key] ?? SEASON_NOTES[key] }))

  const InfoIcon = getIcon('info')

  return (
    <div className="min-h-screen bg-morning-mist pb-12">
      <ReportFiltersBar filters={filters} seasons={seasons} hunters={hunters} stands={standOptions}
        onChange={setFilters} onReset={reset} isDefault={isDefault} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <p className="text-sm text-weathered-wood">
          {scopeLabel}: <span className="font-medium text-forest-shadow">{plural(total.sits, 'sit')}</span>
          {calendarOnlyInView > 0 && !filters.calendarOnlyInRates && ` (+${calendarOnlyInView} calendar-only harvest${calendarOnlyInView > 1 ? 's' : ''} not counted in rates)`}
        </p>

        {seasonNotes.length > 0 && (
          <div className="rounded-md p-3 text-xs space-y-1" style={{ background: '#F5F4F0', border: '1px solid #E8E6E0', color: '#2D3E1F' }}>
            {seasonNotes.map(n => (
              <p key={n.season} className="flex gap-1.5"><InfoIcon size={14} className="shrink-0 text-olive-green" /><span><strong>{n.season}:</strong> {n.note}</span></p>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile icon="hunts" label="Sits" value={String(total.sits)} detail={`${plural(seasonsInView.length, 'season')} in view`} />
          <Tile icon="eye" label="Saw deer" value={pct(total.sawDeerRate)} detail={`${total.sitsSawDeer} of ${plural(total.sits, 'sit')}`} muted={total.smallSample} />
          <Tile icon="binoculars" label="Deer per sit" value={perSit(total.deerPerSit)} detail={`${perSit(total.bucksPerSit)} bucks, ${perSit(total.doesPerSit)} does`} muted={total.smallSample} />
          <Tile icon="harvest" label="Harvests" value={String(total.harvests)} detail={`${pct(total.harvestRate)} of sits`} muted={total.smallSample} />
        </div>

        <Section title="Morning vs evening" icon="sun" subtitle={takeaway(am, pm) ?? 'Not enough sits on both sides for a comparison yet (10+ each).'}>
          <StatsTable firstColumn="Time of day" rows={amPmRows}
            columns={['sits', 'sawDeer', 'deerPerSit', 'bucksPerSit', 'doesPerSit', 'harvests', 'harvestRate']} />
        </Section>

        <Section title="By season type" icon="calendar" subtitle={noType ? `${plural(noType, 'sit')} outside any season dates not shown.` : undefined}>
          <StatsTable firstColumn="Season type" rows={typeRows} />
        </Section>

        <Section title="By stand" icon="stands"
          subtitle={[
            'AM / PM shows the number of sits.',
            'Morning/evening stand needs 10+ sits each and a 15-point difference in saw-deer rate.',
            hiddenInactive && !filters.includeInactiveStands ? `${plural(hiddenInactive, 'inactive stand')} hidden (see Data rules).` : '',
            noStand ? `${plural(noStand, 'sit')} with no stand recorded.` : '',
          ].filter(Boolean).join(' ')}>
          <StatsTable firstColumn="Stand" rows={standRows}
            columns={['sits', 'sawDeer', 'deerPerSit', 'harvests', 'harvestRate']}
            extraColumns={[{ key: 'amPm', label: 'AM / PM', after: 'sits' }, { key: 'lean', label: 'Leans' }]}
            sortable={['sits', 'sawDeer', 'deerPerSit', 'harvests', 'harvestRate']}
            defaultSort={{ column: 'sits', desc: true }} />
        </Section>

        <Section title="By season" icon="chartBar"
          subtitle={seasonRows.length < 2 ? 'Choose "All seasons" to compare seasons.' : 'Seasons marked * have a data note (hover for details).'}>
          <StatsTable firstColumn="Season" rows={seasonRows} />
        </Section>

        <div className="text-xs text-weathered-wood space-y-1.5 pt-2">
          <p><strong className="text-forest-shadow">How these are counted:</strong> a sit is one logged hunt. &quot;Saw deer&quot; means at least one deer was recorded. Rates under {SMALL_SAMPLE} sits are faded and marked small sample.</p>
          <p>{DATA_NOTES.calendarOnly}</p>
          <p>{DATA_NOTES.standMoves} {DATA_NOTES.guests} {DATA_NOTES.sightings}</p>
          <p>
            Known issues that can affect these numbers:{' '}
            {KNOWN_ISSUES.map((i, n) => (
              <span key={i.number}>
                <a className="underline hover:text-olive-green" href={`https://github.com/thisdwhitley/hunt-club-website/issues/${i.number}`} target="_blank" rel="noreferrer">#{i.number}</a>
                {' '}{i.title.toLowerCase()}{n < KNOWN_ISSUES.length - 1 ? '; ' : '.'}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  )
}
