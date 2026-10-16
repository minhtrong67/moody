// Xuất / nhập dữ liệu (Lịch sử check-in, Hoạt động, Tâm trạng) dưới dạng CSV, XLSX, JSON.
// Thư viện xlsx chỉ được nạp lười khi người dùng thật sự xuất/nhập file .xlsx.

export const FORMATS = ['csv', 'xlsx', 'json']

export const DATASETS = {
  entries: { headers: ['id', 'date', 'time', 'mood', 'score', 'note', 'activities', 'activity_labels'] },
  activities: { headers: ['id', 'emoji', 'label', 'custom'] },
  moods: { headers: ['key', 'emoji', 'label', 'score', 'color'] },
}

const LIST_SEP = ';'

// ---------- Chuyển dữ liệu app → các dòng phẳng ----------

export function entriesToRows(entries, activityById) {
  return entries.map((e) => {
    const ids = e.activities || []
    return {
      id: e.id,
      date: e.date,
      time: e.time || '',
      mood: e.mood,
      score: e.score,
      note: e.note || '',
      activities: ids.join(LIST_SEP),
      activity_labels: ids.map((id) => activityById[id]?.label || id).join(LIST_SEP),
    }
  })
}

export function activitiesToRows(activities) {
  return activities.map((a) => ({ id: a.id, emoji: a.emoji || '', label: a.label || '', custom: !!a.custom }))
}

export function moodsToRows(moods) {
  return moods.map((m) => ({ key: m.key, emoji: m.emoji, label: m.label, score: m.score, color: m.color }))
}

// ---------- Chống "CSV/Excel injection": ô bắt đầu bằng = + - @ bị Excel hiểu là công thức ----------

const FORMULA_START = /^[=+\-@\t\r]/
const escapeCell = (v) => (typeof v === 'string' && FORMULA_START.test(v) ? `'${v}` : v)
const unescapeCell = (v) => (typeof v === 'string' && /^'[=+\-@\t\r]/.test(v) ? v.slice(1) : v)

// ---------- CSV ----------

function toCsv(headers, rows) {
  const q = (v) => {
    const s = v === null || v === undefined ? '' : String(escapeCell(v))
    return /[",\r\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => q(r[h])).join(','))]
  return '﻿' + lines.join('\r\n') // BOM để Excel đọc đúng tiếng Việt / emoji
}

function parseCsv(text) {
  const src = text.replace(/^﻿/, '')
  const firstLine = src.split(/\r?\n/, 1)[0] || ''
  const delim = !firstLine.includes(',') && firstLine.includes(';') ? ';' : ','
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += c
    } else if (c === '"') inQuotes = true
    else if (c === delim) {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

// Mảng các dòng (dòng đầu là tiêu đề) → mảng object, khóa tiêu đề viết thường.
function tableToObjects(table) {
  const nonEmpty = table.filter((r) => r.some((c) => c !== null && c !== undefined && String(c).trim() !== ''))
  if (nonEmpty.length < 2) return []
  const headers = nonEmpty[0].map((h) => String(h ?? '').trim().toLowerCase())
  return nonEmpty.slice(1).map((r) => {
    const o = {}
    headers.forEach((h, i) => {
      if (h) o[h] = r[i] === null || r[i] === undefined ? '' : unescapeCell(r[i])
    })
    return o
  })
}

// ---------- Xuất ----------

async function sheetsToBlob(sheets) {
  const { default: writeExcelFile } = await import('write-excel-file/universal')
  return writeExcelFile(
    sheets.map(({ name, headers, rows }) => ({
      sheet: name,
      data: [
        headers.map((h) => ({ value: h, fontWeight: 'bold' })),
        ...rows.map((r) =>
          headers.map((h) => {
            const v = r[h]
            if (typeof v === 'number') return { value: v, type: Number }
            if (typeof v === 'boolean') return { value: v, type: Boolean }
            return { value: String(escapeCell(v ?? '')), type: String }
          })
        ),
      ],
    }))
  ).toBlob()
}

// Xuất toàn bộ (Lịch sử check-in + Hoạt động + Tâm trạng) trong MỘT file:
// json → 1 file; xlsx → 1 workbook 3 sheet; csv → 1 file .zip chứa 3 file .csv.
// all = { entries, activities, moods } (mỗi mục là mảng dòng phẳng). Trả { blob, ext }.
export async function buildExportAllBlob(format, all) {
  const names = Object.keys(DATASETS)
  if (format === 'json') {
    const payload = { app: 'moody', dataset: 'all', version: 1, exportedAt: new Date().toISOString(), data: all }
    return { blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), ext: 'json' }
  }
  if (format === 'xlsx') {
    const blob = await sheetsToBlob(names.map((name) => ({ name, headers: DATASETS[name].headers, rows: all[name] || [] })))
    return { blob, ext: 'xlsx' }
  }
  const { zipSync, strToU8 } = await import('fflate')
  const files = {}
  for (const name of names) files[`${name}.csv`] = strToU8(toCsv(DATASETS[name].headers, all[name] || []))
  return { blob: new Blob([zipSync(files)], { type: 'application/zip' }), ext: 'zip' }
}

export async function buildExportBlob(format, dataset, rows) {
  const headers = DATASETS[dataset].headers
  if (format === 'json') {
    const payload = { app: 'moody', dataset, version: 1, exportedAt: new Date().toISOString(), data: rows }
    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  }
  if (format === 'csv') {
    return new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' })
  }
  return sheetsToBlob([{ name: dataset, headers, rows }])
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- Nhập ----------

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024

export const IMPORT_EXTS = ['csv', 'xlsx', 'json', 'zip']

export function formatOfFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  return IMPORT_EXTS.includes(ext) ? ext : null
}

const ALL_NAMES = Object.keys(DATASETS)

// Đọc file → { entries?, activities?, moods? } (mảng object thô, chưa kiểm tra nội dung).
// Hỗ trợ file của từng mục lẫn file "xuất toàn bộ" (json / xlsx nhiều sheet / zip gồm các csv).
// `only` (tùy chọn): chỉ lấy một mục; file của mục khác → lỗi 'mismatch'.
export async function parseImportFile(file, only = null) {
  const format = formatOfFile(file)
  if (!format) throw new Error('format')
  if (file.size > MAX_IMPORT_BYTES) throw new Error('size')
  const out = {}
  try {
    if (format === 'json') {
      const json = JSON.parse(await file.text())
      const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x)
      const clean = (l) => (Array.isArray(l) ? l.filter(isObj) : null)
      if (Array.isArray(json)) out[only || 'entries'] = clean(json)
      else if (json?.dataset === 'all' && isObj(json.data)) {
        for (const n of ALL_NAMES) if (clean(json.data[n])) out[n] = clean(json.data[n])
      } else if (ALL_NAMES.includes(json?.dataset)) out[json.dataset] = clean(json.data)
      else if (Array.isArray(json?.data)) out[only || 'entries'] = clean(json.data)
    } else if (format === 'csv') {
      if (!only) throw new Error('format') // CSV đơn lẻ không nói rõ là mục nào → chỉ nhập theo từng mục
      out[only] = tableToObjects(parseCsv(await file.text()))
    } else if (format === 'xlsx') {
      const { default: readExcelFile } = await import('read-excel-file/universal')
      const sheets = await readExcelFile(file)
      const named = sheets.filter((sh) => ALL_NAMES.includes(String(sh.sheet).toLowerCase()))
      if (named.length) for (const sh of named) out[String(sh.sheet).toLowerCase()] = tableToObjects(sh.data)
      else if (sheets[0]) out[only || 'entries'] = tableToObjects(sheets[0].data)
    } else {
      const { unzipSync, strFromU8 } = await import('fflate')
      const files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (f) => f.size < MAX_IMPORT_BYTES })
      for (const [name, bytes] of Object.entries(files)) {
        const base = name.split('/').pop().replace(/\.csv$/i, '').toLowerCase()
        if (ALL_NAMES.includes(base) && /\.csv$/i.test(name)) out[base] = tableToObjects(parseCsv(strFromU8(bytes)))
      }
    }
  } catch (err) {
    throw new Error(err?.message === 'format' ? 'format' : 'read')
  }
  const found = ALL_NAMES.filter((n) => Array.isArray(out[n]))
  if (found.length === 0) throw new Error('invalid')
  // CSV / mảng trần không nói rõ là mục nào: nhận theo `only`. File có nhãn mục thì phải khớp.
  if (only) {
    if (!Array.isArray(out[only])) throw new Error('mismatch')
    return { [only]: out[only] }
  }
  return Object.fromEntries(found.map((n) => [n, out[n]]))
}

const str = (v) => (v === null || v === undefined ? '' : String(v).trim())

function splitList(v) {
  if (Array.isArray(v)) return v.map(str).filter(Boolean)
  return str(v)
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function toIsoDate(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const p = (n) => String(n).padStart(2, '0')
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`
  }
  const s = str(v)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`)
  return Number.isNaN(d.getTime()) || d.getMonth() + 1 !== Number(m[2]) ? null : `${m[1]}-${m[2]}-${m[3]}`
}

function toIsoTime(v, date) {
  const raw = v instanceof Date ? v : str(v)
  const d = raw ? new Date(raw) : null
  if (d && !Number.isNaN(d.getTime())) return d.toISOString()
  return new Date(`${date}T12:00:00`).toISOString()
}

// Kiểm tra + chuẩn hóa bản ghi check-in. Trả { items, skipped }.
export function normalizeEntries(raw, { moods, activities }) {
  const moodByKey = Object.fromEntries(moods.map((m) => [m.key, m]))
  const actById = Object.fromEntries(activities.map((a) => [a.id, a]))
  const actByLabel = Object.fromEntries(activities.map((a) => [a.label.toLowerCase(), a]))
  const items = []
  let skipped = 0
  for (const r of raw) {
    const mood = str(r.mood).toLowerCase()
    const date = toIsoDate(r.date) || toIsoDate(r.time)
    if (!moodByKey[mood] || !date) {
      skipped++
      continue
    }
    const refs = splitList(r.activities).length ? splitList(r.activities) : splitList(r.activity_labels)
    const ids = []
    for (const ref of refs) {
      const a = actById[ref] || actByLabel[ref.toLowerCase()]
      if (a && !ids.includes(a.id)) ids.push(a.id)
    }
    items.push({
      id: str(r.id) || null,
      entry: {
        date,
        time: toIsoTime(r.time, date),
        mood,
        score: moodByKey[mood].score,
        activities: ids,
        note: str(r.note).slice(0, 2000),
      },
    })
  }
  return { items, skipped }
}

export function normalizeActivities(raw, defaultIds) {
  const items = []
  let skipped = 0
  for (const r of raw) {
    const label = str(r.label)
    if (!label) {
      skipped++
      continue
    }
    const id = str(r.id)
    const isDefault = defaultIds.includes(id)
    items.push({
      id: id || null,
      isDefault,
      emoji: str(r.emoji) || '🙂',
      label: label.slice(0, 60),
    })
  }
  return { items, skipped }
}

export function normalizeMoods(raw, moodKeys) {
  const items = []
  let skipped = 0
  for (const r of raw) {
    const key = str(r.key).toLowerCase()
    const label = str(r.label)
    const emoji = str(r.emoji)
    if (!moodKeys.includes(key) || (!label && !emoji)) {
      skipped++
      continue
    }
    const patch = {}
    if (emoji) patch.emoji = emoji
    if (label) patch.label = label.slice(0, 60)
    items.push({ key, patch })
  }
  return { items, skipped }
}
