/**
 * Export Utilities - CSV and JSON export functions
 *
 * Features:
 * - Export data to CSV with custom headers
 * - Export data to JSON
 * - Automatic file download in browser
 * - Date formatting for filenames
 */

/**
 * Download a file in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
function generateFilename(prefix: string, extension: string): string {
  const date = new Date()
  const timestamp = date.toISOString().split('T')[0] // YYYY-MM-DD
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Export data to CSV format
 *
 * @param data - Array of objects to export
 * @param columns - Column configuration { key: data key, label: header label }
 * @param filename - Optional custom filename (without extension)
 * @returns Promise that resolves when download starts
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string }>,
  filename?: string
): void {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Build CSV header row
  const headers = columns.map((col) => escapeCsvValue(col.label)).join(',')

  // Build CSV data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key]
        return escapeCsvValue(value)
      })
      .join(',')
  })

  // Combine header and rows
  const csv = [headers, ...rows].join('\n')

  // Download
  const finalFilename = filename || generateFilename('export', 'csv')
  downloadFile(csv, finalFilename, 'text/csv;charset=utf-8;')
}

/**
 * Export data to JSON format
 *
 * @param data - Array of objects to export
 * @param filename - Optional custom filename (without extension)
 * @param pretty - Whether to format JSON with indentation (default: true)
 * @returns Promise that resolves when download starts
 */
export function exportToJson<T>(
  data: T[],
  filename?: string,
  pretty: boolean = true
): void {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Convert to JSON
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)

  // Download
  const finalFilename = filename || generateFilename('export', 'json')
  downloadFile(json, finalFilename, 'application/json')
}

/**
 * Export selected or all items with confirmation
 *
 * @param allItems - All available items
 * @param selectedIds - Set of selected item IDs
 * @param columns - Column configuration for CSV
 * @param itemName - Name of items (e.g., "hunts", "stands")
 * @param format - Export format ('csv' or 'json')
 * @param filename - Optional custom filename
 */
export function exportData<T extends { id: string }>(
  allItems: T[],
  selectedIds: Set<string>,
  columns: Array<{ key: keyof T; label: string }>,
  itemName: string,
  format: 'csv' | 'json' = 'csv',
  filename?: string
): void {
  // Determine what to export
  const itemsToExport =
    selectedIds.size > 0
      ? allItems.filter((item) => selectedIds.has(item.id))
      : allItems

  if (itemsToExport.length === 0) {
    alert('No items to export')
    return
  }

  // Confirm export
  const count = itemsToExport.length
  const message =
    selectedIds.size > 0
      ? `Export ${count} selected ${itemName}?`
      : `Export all ${count} ${itemName}?`

  if (!confirm(message)) {
    return
  }

  // Export based on format
  if (format === 'csv') {
    exportToCsv(itemsToExport, columns, filename)
  } else {
    exportToJson(itemsToExport, filename)
  }
}
