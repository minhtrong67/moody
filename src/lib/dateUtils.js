// Luôn dùng giờ ĐỊA PHƯƠNG của thiết bị để tính "ngày hôm nay" — KHÔNG dùng
// Date.toISOString() (trả về theo UTC) vì sẽ khiến ngày chỉ đổi vào một giờ
// lệch múi giờ thay vì đúng 0h đêm (vd: UTC+7 sẽ đổi ngày lúc 7h sáng).
export function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO() {
  return toLocalISODate(new Date())
}

export function isoToDate(iso) {
  return new Date(iso + 'T00:00:00')
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysOfWeek(date = new Date()) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return toLocalISODate(d)
  })
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function calcStreak(entriesByDate) {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (true) {
    const iso = toLocalISODate(cursor)
    if (entriesByDate[iso]) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// "Hôm nay" / "Hôm qua" / "T3, 10/10" — `t` và `locale` lấy từ useI18n().
export function relativeDateLabel(iso, t, locale) {
  const diffDays = Math.round((isoToDate(todayISO()) - isoToDate(iso)) / 86400000)
  if (diffDays === 0) return t('common.today')
  if (diffDays === 1) return t('common.yesterday')
  return isoToDate(iso).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })
}
