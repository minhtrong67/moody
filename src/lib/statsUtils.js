import { MOODS } from './moodConfig'
import { daysInMonth, daysOfWeek, toLocalISODate } from './dateUtils'


// dailyEntries: mảng bản ghi, mỗi ngày lấy bản ghi mới nhất (map theo date -> entry)
export function latestByDate(entries) {
  const map = {}
  for (const e of entries) if (!map[e.date] || e.time > map[e.date].time) map[e.date] = e
  return map
}

// i18n = { t, locale } lấy từ useI18n()
export function periodLabel(period, cursor, { t, locale }) {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  if (period === 'day') return cursor.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  if (period === 'week') {
    const week = daysOfWeek(cursor)
    return `${week[0]} → ${week[6]}`
  }
  if (period === 'month') return t('stats.monthLabel', { m: m + 1, y })
  if (period === 'year') return t('stats.yearLabel', { y })
  return ''
}

// Trả về { buckets: [{key,label}], entriesInRange: [entry...] }
export function getBuckets(period, cursor, byDate, { t }) {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()

  if (period === 'day') {
    const iso = toLocalISODate(cursor)
    return { buckets: [{ key: iso, label: t('common.today') }], entries: byDate[iso] ? [byDate[iso]] : [] }
  }

  if (period === 'week') {
    const week = daysOfWeek(cursor)
    const buckets = week.map((iso, i) => ({ key: iso, label: t('weekdays.short')[i] }))
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
    const buckets = t('months.short').map((label, i) => ({ key: `${y}-${i}`, label }))
    const entries = Object.values(byDate).filter((e) => new Date(e.date).getFullYear() === y)
    return { buckets, entries }
  }

  return { buckets: [], entries: [] }
}

// Dữ liệu cho bar chart theo thời gian: mood trung bình mỗi bucket
export function buildTimeSeries(period, cursor, byDate, i18n) {
  const { buckets, entries } = getBuckets(period, cursor, byDate, i18n)

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
