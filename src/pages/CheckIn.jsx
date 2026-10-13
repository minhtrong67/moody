import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Check, Settings2, Clock3, ArrowUp, Loader2 } from '../components/icons'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { useMoods } from '../hooks/useMoods'
import { useToast } from '../context/ToastContext'
import { todayISO } from '../lib/dateUtils'
import ConfirmDialog from '../components/ConfirmDialog'
import PageSkeleton from '../components/PageSkeleton'
import TextField from '../components/TextField'
import { useI18n } from '../i18n'

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function CheckIn() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { entries, loading: entriesLoading, addEntry, updateEntry } = useMoodEntries()
  const { activities, loading: activitiesLoading } = useActivities()
  const { moods, moodByKey, loading: moodsLoading } = useMoods()
  const dataLoading = entriesLoading || activitiesLoading || moodsLoading
  const { showToast } = useToast()
  const { t } = useI18n()
  const noteRef = useRef(null)

  const today = todayISO()
  const dateFromQuery = searchParams.get('date')
  const existing = id ? entries.find((e) => e.id === id) : entries.find((e) => e.date === (dateFromQuery || today))

  const defaultDatetime = existing?.time
    ? toDatetimeLocalValue(new Date(existing.time))
    : dateFromQuery
      ? `${dateFromQuery}T${toDatetimeLocalValue(new Date()).slice(11)}`
      : toDatetimeLocalValue(new Date())

  const [mood, setMood] = useState(existing?.mood ?? null)
  const [selectedActivities, setSelectedActivities] = useState(existing?.activities ?? [])
  const [note, setNote] = useState(existing?.note ?? '')
  const [datetime, setDatetime] = useState(defaultDatetime)
  const [saving, setSaving] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)

  // Nếu vào thẳng link sửa (/checkin/:id) khi dữ liệu vẫn đang tải lần đầu,
  // đồng bộ lại form ngay khi bản ghi tương ứng xuất hiện.
  useEffect(() => {
    if (existing) {
      setMood(existing.mood)
      setSelectedActivities(existing.activities || [])
      setNote(existing.note || '')
      setDatetime(toDatetimeLocalValue(new Date(existing.time)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id])

  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = 'auto'
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`
    }
  }, [])

  function toggleActivity(activityId) {
    setSelectedActivities((cur) => (cur.includes(activityId) ? cur.filter((v) => v !== activityId) : [...cur, activityId]))
  }

  function autoResize(e) {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  async function performSave() {
    setSaving(true)
    const moodDef = moodByKey(mood)
    const combined = new Date(datetime)

    const payload = {
      date: toDatetimeLocalValue(combined).slice(0, 10),
      time: combined.toISOString(),
      mood,
      score: moodDef.score,
      activities: selectedActivities,
      note
    }
    if (existing) await updateEntry(existing.id, payload)
    else await addEntry(payload)
    setSaving(false)
    setConfirmSaveOpen(false)
    showToast(existing ? t('checkin.updated') : t('checkin.saved'))
    navigate(-1)
  }

  function handleSave() {
    if (!mood) return
    if (existing) setConfirmSaveOpen(true)
    else performSave()
  }

  if (dataLoading) return <PageSkeleton variant="form" />

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto page-enter pb-28 md:pb-12">
      <ConfirmDialog
        open={confirmSaveOpen}
        title={t('checkin.confirmTitle')}
        description={t('checkin.confirmText')}
        confirmLabel={t('common.update')}
        onConfirm={performSave}
        onCancel={() => setConfirmSaveOpen(false)}
      />

      {/* Top app bar: nút quay lại + tiêu đề */}
      <header className="sticky top-0 z-10 bg-surface flex items-center h-16 gap-1 px-1 md:px-4" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={() => navigate(-1)} aria-label={t('common.back')} className="icon-btn state text-on-surface">
          <ArrowLeft size={24} />
        </button>
        <h1 className="t-title-large ml-1">{existing ? t('checkin.editTitle') : t('checkin.title')}</h1>
      </header>

      <div className="px-4 md:px-8 pt-2">
        <p className="t-body-large text-on-surface-variant mb-6">{t('checkin.subtitle')}</p>

        <TextField
          label={t('checkin.datetime')}
          type="datetime-local"
          alwaysFloat
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="mb-8"
        />

        <div className="flex justify-between md:justify-center md:gap-8 mb-9" role="radiogroup" aria-label={t('checkin.subtitle')}>
          {moods.map((m) => {
            const selected = mood === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                role="radio"
                aria-checked={selected}
                className="flex flex-col items-center gap-2 group"
              >
                <span
                  className="state w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl transition-[transform,background-color,box-shadow] duration-200 ease-emphasized"
                  style={{
                    background: selected ? m.color + '66' : 'rgb(var(--md-surface-container-highest))',
                    boxShadow: selected ? `0 0 0 2px ${m.color}` : 'none',
                    transform: selected ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {m.emoji}
                </span>
                <span className={`t-label-medium ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{m.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="t-title-medium">{t('checkin.activities')}</p>
            <Link to="/manage/activities" className="btn btn-text state -mr-3">
              <Settings2 size={18} />
              {t('checkin.manage')}
            </Link>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {activities.map((a) => {
              const active = selectedActivities.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleActivity(a.id)}
                  aria-pressed={active}
                  className={`chip state ${active ? 'chip-selected' : ''}`}
                >
                  {active ? <Check size={18} className="-ml-1" /> : <span className="-ml-0.5">{a.emoji}</span>}
                  {a.label}
                </button>
              )
            })}

            <Link to="/manage/activities" className="chip state text-primary">
              <Plus size={18} className="-ml-1" />
              {t('checkin.addNew')}
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <TextField
            as="textarea"
            ref={noteRef}
            label={t('checkin.note')}
            value={note}
            onChange={(e) => { setNote(e.target.value); autoResize(e) }}
            placeholder={t('checkin.notePlaceholder')}
            rows={2}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!mood || saving}
          className="btn btn-filled btn-lg btn-block state"
        >
          {saving ? <Loader2 size={18} /> : <Check size={18} />}
          {saving ? t('common.saving') : existing ? t('common.update') : t('checkin.save')}
        </button>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('common.scrollTop')}
        className={`state fixed right-4 z-20 w-10 h-10 rounded-m3-md bg-surface-container-high text-primary shadow-elev-3 flex items-center justify-center transition-all duration-200 ${
          showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ bottom: 'calc(var(--safe-bottom) + 1.5rem)' }}
      >
        <ArrowUp size={24} />
      </button>
    </div>
  )
}
