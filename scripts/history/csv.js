// Minimal CSV helpers (RFC 4180) shared by the history scripts. No dependencies.
const fs = require('fs')
const path = require('path')

const HISTORY_DIR = path.resolve(__dirname, '../../data/history')

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Reads a CSV under data/history/ into objects keyed by header.
// rowNumber is the 1-based data row (header excluded) - used in source_ref.
function readCSV(rel) {
  const rows = parseCSV(fs.readFileSync(path.join(HISTORY_DIR, rel), 'utf8'))
  const header = rows[0].map(h => h.trim())
  // number rows before dropping blank ones so row numbers always match the file
  return rows.slice(1)
    .map((r, i) => ({ blank: !r.some(v => v.trim() !== ''), rowNumber: i + 1, cells: r }))
    .filter(r => !r.blank)
    .map(({ rowNumber, cells }) => ({ rowNumber, ...Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? '').trim()])) }))
}

function toCSV(rows, columns) {
  const esc = v => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.join(','), ...rows.map(r => columns.map(c => esc(r[c])).join(','))].join('\n') + '\n'
}

module.exports = { HISTORY_DIR, parseCSV, readCSV, toCSV }
