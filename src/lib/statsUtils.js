import { MOODS } from './moodConfig'
import { daysInMonth, daysOfWeek } from './dateUtils'

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTH_LABELS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12']

// dailyEntries: mảng bản ghi, mỗi ngày lấy bản ghi mới nhất (map theo date -> entry)
export function latestByDate(entries) {
  const map = {}
  for (const e of entries) if (!map[e.date] || e.time > map[e.date].time) map[e.date] = e
  return map
}

export function periodLabel(period, cursor) {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  if (period === 'day') return cursor.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  if (period === 'week') {
    const week = daysOfWeek(cursor)
    return `${week[0]} → ${week[6]}`
  }
  if (period === 'month') return `Tháng ${m + 1}/${y}`
  if (period === 'year') return `Năm ${y}`
  return ''
}

// Trả về { buckets: [{key,label}], entriesInRange: [entry...] }
export function getBuckets(period, cursor, byDate) {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()

  if (period === 'day') {
    const iso = cursor.toISOString().slice(0, 10)
    return { buckets: [{ key: iso, label: 'Hôm nay' }], entries: byDate[iso] ? [byDate[iso]] : [] }
  }

  if (period === 'week') {
    const week = daysOfWeek(cursor)
    const buckets = week.map((iso, i) => ({ key: iso, label: WEEKDAY_LABELS[i] }))
    const entries = week.map((iso) => byDate[iso]).filter(Boolean)
    return { buckets, entries }
  }

  if (period === 'month') {
    const total = daysInMonth(y, m)
    const buckets = []
    const entries = []
    for (let d = 1; d <= total; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      buckets.push({ key: iso, label: String(d) })
      if (byDate[iso]) entries.push(byDate[iso])
    }
    return { buckets, entries }
  }

  if (period === 'year') {
    const buckets = MONTH_LABELS.map((label, i) => ({ key: `${y}-${i}`, label }))
    const entries = Object.values(byDate).filter((e) => new Date(e.date).getFullYear() === y)
    return { buckets, entries }
  }

  return { buckets: [], entries: [] }
}

// Dữ liệu cho bar chart theo thời gian: mood trung bình mỗi bucket
export function buildTimeSeries(period, cursor, byDate) {
  const { buckets, entries } = getBuckets(period, cursor, byDate)

  if (period === 'year') {
    const y = cursor.getFullYear()
    return buckets.map((b, i) => {
      const monthEntries = entries.filter((e) => new Date(e.date).getMonth() === i)
      const avg = monthEntries.length ? monthEntries.reduce((a, e) => a + e.score, 0) / monthEntries.length : null
      return { label: b.label, avg: avg ? Number(avg.toFixed(2)) : null, count: monthEntries.length }
    })
  }

  return buckets.map((b) => {
    const e = byDate[b.key]
    return { label: b.label, avg: e ? e.score : null, count: e ? 1 : 0 }
  })
}

export function moodDistribution(entries, moods = MOODS) {
  const counts = Object.fromEntries(moods.map((m) => [m.key, 0]))
  for (const e of entries) counts[e.mood] = (counts[e.mood] || 0) + 1
  return moods.map((m) => ({ key: m.key, label: m.label, emoji: m.emoji, color: m.color, count: counts[m.key] }))
}
