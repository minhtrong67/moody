import { useMemo, useState } from 'react'
import { useSessionState, reviveDate } from '../hooks/useSessionState'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { ChevronLeft, ChevronRight, FileDown, Image as ImageIcon, Loader2, Smile, CalendarCheck2, Flame, Heart } from '../components/icons'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { useThemeColors, useIsDark } from '../hooks/useIsDark'
import { CATEGORY_COLORS, OTHER_COLOR, REPORT_CATEGORY_COLORS } from '../lib/chartColors'
import { useMoods } from '../hooks/useMoods'
import { useI18n } from '../i18n'
import { calcStreak } from '../lib/dateUtils'
import { latestByDate, periodLabel, buildTimeSeries, moodDistribution, getBuckets } from '../lib/statsUtils'
import { exportStatsPdf, exportStatsImage } from '../lib/reportGenerator'
import { StatsBodySkeleton } from '../components/PageSkeleton'
import SegmentedButton from '../components/SegmentedButton'

const PERIODS = ['day', 'week', 'month', 'year']

export default function Statistics() {
  const { entries, loading: entriesLoading } = useMoodEntries()
  const { activities, loading: activitiesLoading } = useActivities()
  const { moods, moodByKey, loading: moodsLoading } = useMoods()
  const i18n = useI18n()
  const { t } = i18n
  const loading = entriesLoading || activitiesLoading || moodsLoading
  const [period, setPeriod] = useSessionState('stats.period', 'month')
  const [cursor, setCursor] = useSessionState('stats.cursor', () => new Date(), { revive: reviveDate })
  const [exporting, setExporting] = useState(null)
  // Màu literal (không dùng CSS var) để SVG của Recharts hiển thị đúng ở mọi theme / màu chủ đề.
  const c = useThemeColors()
  const isDark = useIsDark()

  const byDate = useMemo(() => latestByDate(entries), [entries])
  const activityById = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a])), [activities])

  const timeSeries = useMemo(() => buildTimeSeries(period, cursor, byDate, i18n), [period, cursor, byDate, i18n])
  const periodEntries = useMemo(() => getBuckets(period, cursor, byDate, i18n).entries, [period, cursor, byDate, i18n])
  const distribution = useMemo(() => moodDistribution(periodEntries, moods), [periodEntries, moods])

  // Toàn bộ hoạt động trong kỳ, sắp theo số lần giảm dần.
  const activityAll = useMemo(() => {
    const counts = {}
    for (const e of periodEntries) for (const id of e.activities || []) counts[id] = (counts[id] || 0) + 1
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, label: activityById[id]?.label || '—', emoji: activityById[id]?.emoji || '❔' }))
      .sort((a, b) => b.count - a.count)
  }, [periodEntries, activityById])

  const activityStats = useMemo(() => activityAll.slice(0, 8), [activityAll])

  // Biểu đồ tròn hoạt động: 8 hoạt động nhiều nhất (màu cố định theo thứ tự), phần còn lại gộp thành "Khác".
  const buildActivityPie = (palette) => {
    const top = activityAll.slice(0, 8).map((a, i) => ({ ...a, color: palette[i] }))
    const rest = activityAll.slice(8).reduce((sum, a) => sum + a.count, 0)
    return rest > 0 ? [...top, { id: 'other', label: t('stats.other'), emoji: '…', count: rest, color: OTHER_COLOR }] : top
  }
  const activityPie = useMemo(() => buildActivityPie(CATEGORY_COLORS(isDark)), [activityAll, isDark, t]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const list = periodEntries
    const avg = list.length ? list.reduce((a, e) => a + e.score, 0) / list.length : null
    const counts = {}
    for (const e of list) counts[e.mood] = (counts[e.mood] || 0) + 1
    const topKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { avg, checkinDays: list.length, streak: calcStreak(byDate), topMood: topKey ? moodByKey(topKey) : null }
  }, [periodEntries, byDate, moodByKey])

  const label = periodLabel(period, cursor, i18n)
  const periodOptions = PERIODS.map((k) => ({ key: k, label: t(`stats.period.${k}`) }))

  function shiftCursor(dir) {
    const d = new Date(cursor)
    if (period === 'day') d.setDate(d.getDate() + dir)
    if (period === 'week') d.setDate(d.getDate() + dir * 7)
    if (period === 'month') d.setMonth(d.getMonth() + dir)
    if (period === 'year') d.setFullYear(d.getFullYear() + dir)
    setCursor(d)
  }

  async function runExport(kind) {
    setExporting(kind)
    try {
      const args = { periodLabel: label, stats, distribution, timeSeries, activityStats, activityPie: buildActivityPie(REPORT_CATEGORY_COLORS), i18n }
      await (kind === 'pdf' ? exportStatsPdf(args) : exportStatsImage(args))
    } finally {
      setExporting(null)
    }
  }

  const hasData = timeSeries.some((p) => p.count > 0)
  const tickStyle = { fontSize: 10, fill: c.muted }
  const tooltipStyle = { fontSize: 12, borderRadius: 4, border: 'none', boxShadow: '0 1px 3px rgb(0 0 0 / .3)', background: c.surface, color: c.ink }
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

  const tooltipProps = { contentStyle: tooltipStyle, labelStyle: { color: c.ink }, itemStyle: { color: c.ink } }

  return (
    <div className="page page-enter pb-4">
      <h1 className="t-headline-medium mb-5 pt-2">{t('stats.title')}</h1>

      <div className="md:flex md:items-center md:justify-between md:gap-6 mb-2">
        <SegmentedButton className="mb-4 md:mb-0 md:max-w-md" options={periodOptions} value={period} onChange={setPeriod} />

        <div className="flex items-center justify-between md:justify-center md:gap-4 mb-5 md:mb-0 md:min-w-[18rem]">
          <button onClick={() => shiftCursor(-1)} aria-label={t('stats.prev')} className="icon-btn state"><ChevronLeft size={24} /></button>
          <p className="t-title-medium text-center capitalize">{label}</p>
          <button onClick={() => shiftCursor(1)} aria-label={t('stats.next')} className="icon-btn state"><ChevronRight size={24} /></button>
        </div>
      </div>

      <div className="md:flex md:items-center md:gap-4 mb-8 md:mt-4">
        <p className="t-body-small text-on-surface-variant mb-2 md:mb-0 px-1">{t('stats.export', { period: t(`stats.word.${period}`) })}</p>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <button onClick={() => runExport('pdf')} disabled={!!exporting || !hasData} className="btn btn-filled state">
            {exporting === 'pdf' ? <Loader2 size={18} /> : <FileDown size={18} />}
            {exporting === 'pdf' ? t('stats.creating') : 'PDF'}
          </button>
          <button onClick={() => runExport('image')} disabled={!!exporting || !hasData} className="btn btn-tonal state">
            {exporting === 'image' ? <Loader2 size={18} /> : <ImageIcon size={18} />}
            {exporting === 'image' ? t('stats.creating') : t('stats.png')}
          </button>
        </div>
      </div>

      {loading ? (
        <StatsBodySkeleton />
      ) : (
        <>
          <div className="space-y-2 mb-8 md:space-y-0 md:grid md:grid-cols-2 2xl:grid-cols-4 md:gap-3">
            <StatRow icon={Smile} label={t('stats.avgMood')} value={stats.avg != null ? `${stats.avg.toFixed(1)}/5` : '—'} color="#8FBF7F" />
            <StatRow icon={CalendarCheck2} label={t('stats.checkinDays')} value={stats.checkinDays} color="#9FB8C8" />
            <StatRow icon={Flame} label={t('stats.streak')} value={stats.streak} color="#F0A34E" />
            <StatRow icon={Heart} label={t('stats.topMood')} value={stats.topMood?.label || '—'} emoji={stats.topMood?.emoji} color={stats.topMood?.color || '#7D8CB0'} />
          </div>

          {!hasData ? (
            <p className="t-body-medium text-on-surface-variant text-center py-10">{t('stats.noData')}</p>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
              <ChartCard title={`${t('stats.trend')} (${label})`} wide>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
                    <XAxis dataKey="label" tick={tickStyle} interval={period === 'month' ? 2 : 0} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={tickStyle} width={30} />
                    <Tooltip formatter={(v) => [v != null ? `${v}/5` : t('stats.none'), 'Mood']} {...tooltipProps} />
                    <Legend wrapperStyle={legendStyle} />
                    <Bar dataKey="avg" name={t('stats.avgMood')} radius={[4, 4, 0, 0]} fill={c.accent} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('stats.distribution')} footer={<LegendList items={distribution} />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
                    <XAxis dataKey="emoji" tick={EmojiAxisTick} interval={0} tickLine={false} height={40} />
                    <YAxis allowDecimals={false} tick={tickStyle} width={30} />
                    <Tooltip {...tooltipProps} formatter={(v) => [t('stats.times', { n: v }), t('stats.count')]} />
                    <Bar dataKey="count" name={t('stats.count')} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {distribution.map((d) => (<Cell key={d.key} fill={d.color} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('stats.share')}>
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
                      isAnimationActive={false}
                    >
                      {distribution.filter((d) => d.count > 0).map((d) => (<Cell key={d.key} fill={d.color} />))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={32} wrapperStyle={legendStyle} />
                    <Tooltip {...tooltipProps} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {activityStats.length > 0 && (
                <ChartCard title={`${t('stats.activities')} (${label})`} footer={<LegendList items={activityStats} color={c.secondary} />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityStats} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
                      <XAxis dataKey="emoji" tick={EmojiAxisTick} interval={0} tickLine={false} height={40} />
                      <YAxis allowDecimals={false} tick={tickStyle} width={30} />
                      <Tooltip {...tooltipProps} formatter={(v) => [t('stats.times', { n: v }), t('stats.count')]} />
                      <Bar dataKey="count" name={t('stats.count')} radius={[4, 4, 0, 0]} fill={c.secondary} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {activityPie.length > 0 && (
                <ChartCard title={`${t('stats.activitiesShare')} (${label})`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityPie}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="44%"
                        outerRadius="65%"
                        label={pieLabel}
                        labelLine={{ stroke: c.line }}
                        style={{ fontSize: 11 }}
                        stroke={c.surface}
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {activityPie.map((d) => (<Cell key={d.id} fill={d.color} />))}
                      </Pie>
                      <Legend verticalAlign="bottom" wrapperStyle={legendStyle} />
                      <Tooltip {...tooltipProps} formatter={(v, name) => [t('stats.times', { n: v }), name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Mọi thẻ biểu đồ cùng chiều cao (h-72) để lưới trên màn hình lớn luôn cân đối; thẻ `wide` chiếm cả hai cột.
function ChartCard({ title, children, footer, wide }) {
  return (
    <section className={`mb-8 lg:mb-0 min-w-0 ${wide ? 'lg:col-span-2' : ''}`}>
      <p className="t-title-medium mb-2 px-1">{title}</p>
      <div className={`w-full h-64 md:h-72 ${wide ? 'lg:h-80' : ''} card-filled p-2`}>{children}</div>
      {footer}
    </section>
  )
}

function LegendList({ items, color }) {
  const total = items.reduce((a, i) => a + i.count, 0) || 1
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((it) => (
        <span key={it.key || it.id} className="chip chip-static !h-8 !px-3 !gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: it.color || color }} />
          {it.emoji} {it.label}
          <span className="text-on-surface-variant">· {it.count} ({Math.round((it.count / total) * 100)}%)</span>
        </span>
      ))}
    </div>
  )
}

function StatRow({ icon: Icon, label, value, emoji, color }) {
  return (
    <div className="card-filled px-4 py-3 flex items-center gap-4 min-w-0">
      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl" style={{ background: color + '40', color }}>
        {emoji || <Icon size={24} />}
      </span>
      <p className="t-body-large text-on-surface-variant flex-1 min-w-0 truncate">{label}</p>
      <p className="t-title-large leading-none shrink-0">{value}</p>
    </div>
  )
}
