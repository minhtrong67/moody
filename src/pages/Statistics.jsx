import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { ChevronLeft, ChevronRight, FileDown, Smile, CalendarCheck2, Flame, Heart } from 'lucide-react'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { useIsDark } from '../hooks/useIsDark'
import { useMoods } from '../hooks/useMoods'
import { calcStreak } from '../lib/dateUtils'
import { latestByDate, periodLabel, buildTimeSeries, moodDistribution, getBuckets } from '../lib/statsUtils'
import { exportStatsPdf } from '../lib/reportGenerator'
import { StatsBodySkeleton } from '../components/PageSkeleton'

const PERIODS = [
  { key: 'day', label: 'Ngày', word: 'ngày' },
  { key: 'week', label: 'Tuần', word: 'tuần' },
  { key: 'month', label: 'Tháng', word: 'tháng' },
  { key: 'year', label: 'Năm', word: 'năm' }
]

// Màu literal (không dùng CSS var) để đảm bảo hiển thị đúng trong SVG của Recharts ở cả 2 theme.
const THEME = {
  light: { ink: '#23231F', muted: '#6B6A63', line: '#DEDCD2', surface: '#FFFFFF', accent: '#0F766E' },
  dark: { ink: '#F0EFEB', muted: '#B4B2AC', line: '#48474E', surface: '#2C2C32', accent: '#5EEAD4' }
}

export default function Statistics() {
  const { entries, loading: entriesLoading } = useMoodEntries()
  const { activities, loading: activitiesLoading } = useActivities()
  const { moods, moodByKey, loading: moodsLoading } = useMoods()
  const loading = entriesLoading || activitiesLoading || moodsLoading
  const [period, setPeriod] = useState('month')
  const [cursor, setCursor] = useState(new Date())
  const [exporting, setExporting] = useState(false)
  const isDark = useIsDark()
  const c = isDark ? THEME.dark : THEME.light

  const byDate = useMemo(() => latestByDate(entries), [entries])
  const activityById = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a])), [activities])

  const timeSeries = useMemo(() => buildTimeSeries(period, cursor, byDate), [period, cursor, byDate])
  const periodEntries = useMemo(() => getBuckets(period, cursor, byDate).entries, [period, cursor, byDate])
  const distribution = useMemo(() => moodDistribution(periodEntries, moods), [periodEntries, moods])

  const activityStats = useMemo(() => {
    const counts = {}
    for (const e of periodEntries) {
      for (const id of e.activities || []) counts[id] = (counts[id] || 0) + 1
    }
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, label: activityById[id]?.label || '—', emoji: activityById[id]?.emoji || '❔' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [periodEntries, activityById])

  const stats = useMemo(() => {
    const list = periodEntries
    const avg = list.length ? list.reduce((a, e) => a + e.score, 0) / list.length : null
    const counts = {}
    for (const e of list) counts[e.mood] = (counts[e.mood] || 0) + 1
    const topKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return {
      avg,
      checkinDays: list.length,
      streak: calcStreak(byDate),
      topMood: topKey ? moodByKey(topKey) : null
    }
  }, [periodEntries, byDate, moodByKey])

  const label = periodLabel(period, cursor)
  const periodMeta = PERIODS.find((p) => p.key === period)

  function shiftCursor(dir) {
    const d = new Date(cursor)
    if (period === 'day') d.setDate(d.getDate() + dir)
    if (period === 'week') d.setDate(d.getDate() + dir * 7)
    if (period === 'month') d.setMonth(d.getMonth() + dir)
    if (period === 'year') d.setFullYear(d.getFullYear() + dir)
    setCursor(d)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportStatsPdf({ periodLabel: label, stats, distribution, timeSeries })
    } finally {
      setExporting(false)
    }
  }

  const hasData = timeSeries.some((t) => t.count > 0)
  const tickStyle = { fontSize: 10, fill: c.muted }
  const tooltipStyle = { fontSize: 12, borderRadius: 8, border: `1px solid ${c.line}`, background: c.surface, color: c.ink }
  const legendStyle = { fontSize: 11, color: c.ink }

  function EmojiAxisTick({ x, y, payload }) {
    const item = distribution.find((d) => d.emoji === payload.value) || activityStats.find((a) => a.emoji === payload.value)
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fontSize={16} fill={c.ink}>{payload.value}</text>
        <text x={0} y={0} dy={30} textAnchor="middle" fontSize={9} fill={c.muted}>{item?.label || ''}</text>
      </g>
    )
  }

  function pieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (!percent) return null
    const RAD = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 1.28
    const x = cx + r * Math.cos(-midAngle * RAD)
    const y = cy + r * Math.sin(-midAngle * RAD)
    return (
      <text x={x} y={y} fill={c.ink} fontSize={11} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto page-enter">
      <h1 className="font-display text-2xl mb-5">Thống kê</h1>

      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-full border text-sm transition-colors ${period === p.key ? 'border-primary bg-primary text-oncolor' : 'border-line bg-line/15'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => shiftCursor(-1)}
          aria-label="Kỳ trước"
          className="w-9 h-9 rounded-full bg-line/25 text-inkmuted flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium">{label}</p>
        <button
          onClick={() => shiftCursor(1)}
          aria-label="Kỳ sau"
          className="w-9 h-9 rounded-full bg-line/25 text-inkmuted flex items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting || !hasData}
        className="w-full bg-primary text-oncolor rounded-card py-3.5 font-medium disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm mb-8"
      >
        <FileDown size={18} strokeWidth={2} />
        {exporting ? 'Đang tạo PDF…' : `Xuất báo cáo theo ${periodMeta.word}`}
      </button>

      {loading ? (
        <StatsBodySkeleton />
      ) : (
      <>
      <div className="space-y-3 mb-8">
        <StatRow icon={Smile} label="Mood trung bình" value={stats.avg != null ? `${stats.avg.toFixed(1)}/5` : '—'} color="#8FBF7F" />
        <StatRow icon={CalendarCheck2} label="Ngày đã check-in" value={stats.checkinDays} color="#9FB8C8" />
        <StatRow icon={Flame} label="Chuỗi hiện tại" value={stats.streak} color="#F0A34E" />
        <StatRow icon={Heart} label="Cảm xúc phổ biến" value={stats.topMood?.label || '—'} emoji={stats.topMood?.emoji} color={stats.topMood?.color || '#7D8CB0'} />
      </div>

      {!hasData ? (
        <p className="text-inkmuted text-sm text-center py-10">Chưa có dữ liệu trong khoảng thời gian này.</p>
      ) : (
        <>
          <p className="text-sm font-medium mb-2">Xu hướng mood ({label})</p>
          <div className="w-full aspect-[4/3] max-h-64 mb-8 border border-line rounded-card p-2 bg-surface">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
                <XAxis dataKey="label" tick={tickStyle} interval={period === 'month' ? 2 : 0} />
                <YAxis domain={[0, 5]} tick={tickStyle} width={28} />
                <Tooltip
                  formatter={(v) => [v != null ? `${v}/5` : 'Không có', 'Mood']}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: c.ink }}
                  itemStyle={{ color: c.ink }}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="avg" name="Mood trung bình" radius={[4, 4, 0, 0]} fill={c.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm font-medium mb-2">Phân bố cảm xúc</p>
          <div className="w-full aspect-[4/3] max-h-64 border border-line rounded-card p-2 bg-surface">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
                <XAxis dataKey="emoji" tick={EmojiAxisTick} interval={0} tickLine={false} height={40} />
                <YAxis allowDecimals={false} tick={tickStyle} width={28} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: c.ink }}
                  itemStyle={{ color: c.ink }}
                  formatter={(v) => [`${v} lần`, 'Số lần']}
                />
                <Bar dataKey="count" name="Số lần" radius={[4, 4, 0, 0]}>
                  {distribution.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <LegendList items={distribution} className="mb-8" />

          <p className="text-sm font-medium mb-2">Tỉ lệ cảm xúc</p>
          <div className="w-full aspect-square max-h-72 mb-8 border border-line rounded-card p-2 bg-surface">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution.filter((d) => d.count > 0)}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="44%"
                  outerRadius="65%"
                  label={pieLabel}
                  labelLine={{ stroke: c.line }}
                  style={{ fontSize: 11 }}
                >
                  {distribution.filter((d) => d.count > 0).map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={32} wrapperStyle={legendStyle} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.ink }} itemStyle={{ color: c.ink }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {activityStats.length > 0 && (
            <>
              <p className="text-sm font-medium mb-2">Hoạt động thường gặp ({label})</p>
              <div className="w-full aspect-[4/3] max-h-64 border border-line rounded-card p-2 bg-surface">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityStats} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
                    <XAxis dataKey="emoji" tick={EmojiAxisTick} interval={0} tickLine={false} height={40} />
                    <YAxis allowDecimals={false} tick={tickStyle} width={28} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: c.ink }}
                      itemStyle={{ color: c.ink }}
                      formatter={(v) => [`${v} lần`, 'Số lần']}
                    />
                    <Bar dataKey="count" name="Số lần" radius={[4, 4, 0, 0]} fill="#9FB8C8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <LegendList items={activityStats} color="#9FB8C8" />
            </>
          )}
        </>
      )}
      </>
      )}
    </div>
  )
}

function LegendList({ items, color, className = '' }) {
  const total = items.reduce((a, i) => a + i.count, 0) || 1
  return (
    <div className={`flex flex-wrap gap-2 mt-3 ${className}`}>
      {items.map((it) => (
        <span
          key={it.key || it.id}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-line/25"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: it.color || color }}
          />
          {it.emoji} {it.label}
          <span className="text-inkmuted">· {it.count} ({Math.round((it.count / total) * 100)}%)</span>
        </span>
      ))}
    </div>
  )
}

function StatRow({ icon: Icon, label, value, emoji, color }) {
  return (
    <div
      className="rounded-card px-4 py-3 flex items-center gap-3 border"
      style={{ background: color + '14', borderColor: color + '40' }}
    >
      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg" style={{ background: color + '30', color }}>
        {emoji || <Icon size={18} strokeWidth={2.2} />}
      </span>
      <p className="text-sm text-inkmuted flex-1">{label}</p>
      <p className="font-display text-lg leading-none shrink-0">{value}</p>
    </div>
  )
}
