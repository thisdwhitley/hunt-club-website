// src/components/cameras/DeploymentImportModal.tsx
// Import modal for batch camera seasonal redeployment

'use client'

import React, { useState, useRef } from 'react'
import { getIcon } from '@/lib/shared/icons'
import { BATTERY_TYPES } from '@/lib/cameras/types'
import type { BatteryType } from '@/lib/cameras/types'
import {
  getCameraHardwareByDeviceId,
  importDeployments,
} from '@/lib/cameras/database'
import type { DeploymentImportRow, DeploymentImportResult } from '@/lib/cameras/database'

// ============================================================================
// TYPES
// ============================================================================

interface ParsedRow {
  lineNumber: number;
  raw: string;
  device_id: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  season_year: number | null;
  battery_type: BatteryType | null;
  solar_panel_id: string | null;
  has_solar_panel: boolean;
  // Resolved after hardware lookup
  hardware_id: string | null;
  parseError: string | null;
}

interface PreviewRow extends ParsedRow {
  importResult?: DeploymentImportResult;
}

interface DeploymentImportModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

// ============================================================================
// PURE PARSING FUNCTIONS
// ============================================================================

function parseBatteryType(raw: string): BatteryType | null {
  const trimmed = raw.trim();
  // Check for parenthetical override: "AA (converted to D)" → "D"
  const override = trimmed.match(/\(converted to ([A-Za-z]+)\)/i);
  const candidate = override ? override[1] : trimmed.split(/\s+/)[0];
  const upper = candidate.toUpperCase();
  // Match case-insensitively against known types
  const match = BATTERY_TYPES.find(t => t.toUpperCase() === upper);
  return match ?? null;
}

function parseSolarField(raw: string): { solar_panel_id: string | null; has_solar_panel: boolean } {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none' || trimmed === '-') {
    return { solar_panel_id: null, has_solar_panel: false };
  }
  if (trimmed.toLowerCase().startsWith('solar')) {
    return { solar_panel_id: trimmed, has_solar_panel: true };
  }
  return { solar_panel_id: null, has_solar_panel: false };
}

function parseCoordinates(raw: string): { latitude: number; longitude: number } | null {
  const parts = raw.trim().split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

function parseImportLine(line: string, lineNumber: number): ParsedRow {
  const base: ParsedRow = {
    lineNumber,
    raw: line,
    device_id: '',
    location_name: '',
    latitude: null,
    longitude: null,
    season_year: null,
    battery_type: null,
    solar_panel_id: null,
    has_solar_panel: false,
    hardware_id: null,
    parseError: null,
  };

  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 6) {
    return { ...base, parseError: `Expected 6 pipe-delimited fields, got ${parts.length}` };
  }

  const [timestampRaw, deviceId, batteryRaw, solarRaw, coordsRaw, locationName] = parts;

  // Timestamp → season year
  const ts = new Date(timestampRaw);
  const season_year = isNaN(ts.getTime()) ? null : ts.getFullYear();
  if (!season_year) {
    return { ...base, device_id: deviceId || '', parseError: 'Invalid timestamp' };
  }

  // Coordinates
  const coords = parseCoordinates(coordsRaw);
  if (!coords) {
    return { ...base, device_id: deviceId || '', season_year, parseError: `Invalid coordinates: "${coordsRaw}"` };
  }

  // Battery + solar
  const battery_type = parseBatteryType(batteryRaw);
  const { solar_panel_id, has_solar_panel } = parseSolarField(solarRaw);

  return {
    ...base,
    device_id: deviceId,
    location_name: locationName || '',
    latitude: coords.latitude,
    longitude: coords.longitude,
    season_year,
    battery_type,
    solar_panel_id,
    has_solar_panel,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeploymentImportModal({ onClose, onImportComplete }: DeploymentImportModalProps) {
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [text, setText] = useState('')
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const CloseIcon = getIcon('close')
  const UploadIcon = getIcon('upload')
  const FileIcon = getIcon('file')
  const CheckIcon = getIcon('checkCircle')
  const AlertIcon = getIcon('alert')
  const XIcon = getIcon('x')

  // ── Parse + resolve hardware ──────────────────────────────────────────────

  async function handleParse() {
    const lines = text.split('\n').filter(l => l.trim().length > 0)
    if (lines.length === 0) return

    setParsing(true)
    const parsed = lines.map((line, i) => parseImportLine(line, i + 1))

    // Resolve hardware IDs in parallel
    const resolved = await Promise.all(
      parsed.map(async (row): Promise<PreviewRow> => {
        if (row.parseError) return row
        const result = await getCameraHardwareByDeviceId(row.device_id)
        if (result.success && result.data) {
          return { ...row, hardware_id: result.data.id }
        }
        return { ...row, hardware_id: null }
      })
    )

    setRows(resolved)
    setStep('preview')
    setParsing(false)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setText(ev.target?.result as string ?? '')
    }
    reader.readAsText(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  // ── Import ────────────────────────────────────────────────────────────────

  async function handleImport() {
    const readyRows = rows.filter(r => !r.parseError && r.hardware_id !== null)
    if (readyRows.length === 0) return

    setImporting(true)

    const importRows: DeploymentImportRow[] = readyRows.map(r => ({
      hardware_id: r.hardware_id!,
      device_id: r.device_id,
      battery_type: r.battery_type,
      solar_panel_id: r.solar_panel_id,
      has_solar_panel: r.has_solar_panel,
      latitude: r.latitude!,
      longitude: r.longitude!,
      location_name: r.location_name,
      season_year: r.season_year!,
    }))

    const result = await importDeployments(importRows)

    if (result.success && result.data) {
      const resultMap = new Map(result.data.map(r => [r.device_id, r]))
      setRows(prev => prev.map(row => ({
        ...row,
        importResult: resultMap.get(row.device_id),
      })))
    }

    setImporting(false)
    onImportComplete()
  }

  // ── Derived counts ────────────────────────────────────────────────────────

  const readyCount = rows.filter(r => !r.parseError && r.hardware_id !== null).length
  const skippedCount = rows.length - readyCount
  const importedCount = rows.filter(r => r.importResult?.success).length
  const hasImportResults = rows.some(r => r.importResult !== undefined)

  // ── Row status cell ───────────────────────────────────────────────────────

  function RowStatus({ row }: { row: PreviewRow }) {
    if (row.importResult) {
      if (row.importResult.success) {
        return <span className="flex items-center gap-1 text-green-700"><CheckIcon size={14} /> Imported</span>
      }
      return <span className="flex items-center gap-1 text-red-700"><XIcon size={14} /> {row.importResult.error}</span>
    }
    if (row.parseError) {
      return <span className="flex items-center gap-1 text-yellow-700"><AlertIcon size={14} /> {row.parseError}</span>
    }
    if (row.hardware_id === null) {
      return <span className="flex items-center gap-1 text-red-700"><XIcon size={14} /> Device not found</span>
    }
    return <span className="flex items-center gap-1 text-green-700"><CheckIcon size={14} /> Ready</span>
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-olive-green text-white px-6 py-4 rounded-t-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <UploadIcon size={20} />
            <h2 className="text-lg font-semibold">Import Camera Deployments</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {step === 'input' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Paste pipe-delimited deployment records below, or upload a text file. One record per line:
              </p>
              <pre className="text-xs bg-morning-mist rounded-lg p-3 text-forest-shadow/70 overflow-x-auto">
                {`timestamp | device_id | battery_type | solar_panel_label | lat,lng | location_name\n2026-03-28T10:18:27-04:00 | 011 | AA (converted to D) | Solar 001 | 36.425,-79.514 | Lower field`}
              </pre>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
                placeholder="Paste records here…"
                className="w-full border border-gray-200 rounded-lg p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-olive-green/40"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileIcon size={16} />
                  Upload .txt file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-xs text-gray-400">
                  {text.split('\n').filter(l => l.trim()).length} line(s)
                </span>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {hasImportResults
                  ? `Import complete: ${importedCount} imported, ${rows.filter(r => r.importResult && !r.importResult.success).length} failed.`
                  : `${readyCount} camera${readyCount !== 1 ? 's' : ''} ready to import, ${skippedCount} will be skipped.`}
              </p>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-morning-mist text-forest-shadow font-medium">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Device ID</th>
                      <th className="px-3 py-2 text-left">Location</th>
                      <th className="px-3 py-2 text-left">Coords</th>
                      <th className="px-3 py-2 text-left">Season</th>
                      <th className="px-3 py-2 text-left">Battery</th>
                      <th className="px-3 py-2 text-left">Solar Panel ID</th>
                      <th className="px-3 py-2 text-left">Solar?</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(row => (
                      <tr key={row.lineNumber} className={row.parseError || row.hardware_id === null ? 'bg-red-50/40' : ''}>
                        <td className="px-3 py-2 text-gray-400">{row.lineNumber}</td>
                        <td className="px-3 py-2 font-mono font-medium">{row.device_id || '—'}</td>
                        <td className="px-3 py-2">{row.location_name || '—'}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">
                          {row.latitude !== null && row.longitude !== null
                            ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">{row.season_year ?? '—'}</td>
                        <td className="px-3 py-2">{row.battery_type ?? '—'}</td>
                        <td className="px-3 py-2">{row.solar_panel_id ?? '—'}</td>
                        <td className="px-3 py-2">{row.has_solar_panel ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2 whitespace-nowrap"><RowStatus row={row} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          {step === 'input' ? (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={parsing || text.trim().length === 0}
                className="px-5 py-2 bg-olive-green text-white text-sm font-medium rounded-lg hover:bg-pine-needle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing ? 'Parsing…' : 'Parse Lines'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('input'); setRows([]) }}
                disabled={importing}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Close
                </button>
                {!hasImportResults && (
                  <button
                    onClick={handleImport}
                    disabled={importing || readyCount === 0}
                    className="px-5 py-2 bg-burnt-orange text-white text-sm font-medium rounded-lg hover:bg-clay-earth transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Importing…' : `Import ${readyCount} Camera${readyCount !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
