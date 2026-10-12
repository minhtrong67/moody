import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { moodByKey } from '../lib/moodConfig'
import { daysInMonth } from '../lib/dateUtils'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

export default function CalendarPage() {
  const { entries } = useMoodEntries()
  const { activities } = useActivities()
  const activityById = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a])), [activities])
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(null)

  const byDate = useMemo(() => {
    const map = {}
    for (const e of entries) if (!map[e.date] || e.time > map[e.date].time) map[e.date] = e
    return map
  }, [entries])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const total = daysInMonth(year, month)
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7 // Monday=0

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)

  function isoFor(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const selectedEntry = selected ? byDate[selected] : null

  return (
    <div className="px-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 text-on-surface-variant">‹</button>
        <h1 className="t-title-large">{MONTHS_VI[month]} {year}</h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 text-on-surface-variant">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs text-on-surface-variant py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const iso = isoFor(d)
          const entry = byDate[iso]
          const m = entry ? moodByKey(entry.mood) : null
          return (
            <button
              key={i}
              onClick={() => setSelected(iso)}
              className="aspect-square rounded-full flex flex-col items-center justify-center text-xs gap-0.5"
              style={{
                background: m ? m.color + '33' : 'transparent',
                border: selected === iso ? '2px solid rgb(var(--md-primary))' : '1px solid transparent'
              }}
            >
              <span>{m ? m.emoji : d}</span>
              {m && <span className="text-[9px] text-on-surface-variant">{d}</span>}
            </button>
          )
        })}
      </div>

      {selectedEntry ? (
        <div className="mt-6 card-filled p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium">{moodByKey(selectedEntry.mood)?.emoji} {moodByKey(selectedEntry.mood)?.label} · {selected}</p>
            <Link to={`/checkin/${selectedEntry.id}`} className="text-xs text-primary shrink-0">Sửa</Link>
          </div>
          {selectedEntry.note && <p className="text-sm text-on-surface-variant mb-2">{selectedEntry.note}</p>}
          {(selectedEntry.activities?.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {selectedEntry.activities.map((id) => {
                const a = activityById[id]
                if (!a) return null
                return (
                  <span key={id} className="text-[11px] px-2 py-1 rounded-full bg-surface-container-low text-on-surface-variant flex items-center gap-1">
                    <span>{a.emoji}</span>{a.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      ) : selected ? (
        <p className="mt-6 text-sm text-on-surface-variant text-center">Không có check-in ngày {selected}.</p>
      ) : null}
    </div>
  )
}
