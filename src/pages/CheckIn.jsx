import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Check, X, Settings2, Clock3, ArrowUp } from 'lucide-react'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useActivities } from '../hooks/useActivities'
import { useMoods } from '../hooks/useMoods'
import { useToast } from '../context/ToastContext'
import { todayISO } from '../lib/dateUtils'
import BottomSheet from '../components/BottomSheet'
import ConfirmDialog from '../components/ConfirmDialog'

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function CheckIn() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { entries, addEntry, updateEntry } = useMoodEntries()
  const { activities, addActivity } = useActivities()
  const { moods, moodByKey } = useMoods()
  const { showToast } = useToast()
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
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)

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

  async function handleCreateActivity() {
    if (!newLabel.trim()) return
    await addActivity({ emoji: newEmoji.trim() || '✨', label: newLabel.trim() })
    setNewEmoji('')
    setNewLabel('')
    setShowAddActivity(false)
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
    showToast(existing ? 'Đã cập nhật check-in' : 'Đã lưu check-in')
    navigate(-1)
  }

  function handleSave() {
    if (!mood) return
    if (existing) setConfirmSaveOpen(true)
    else performSave()
  }

  return (
    <div className="px-4 pt-6 pb-28 max-w-lg mx-auto page-enter">
      <ConfirmDialog
        open={confirmSaveOpen}
        title="Cập nhật check-in này?"
        description="Các thay đổi sẽ được lưu lại."
        confirmLabel="Cập nhật"
        onConfirm={performSave}
        onCancel={() => setConfirmSaveOpen(false)}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-inkmuted bg-line/30 rounded-full pl-2.5 pr-3.5 py-1.5 mb-5"
      >
        <ArrowLeft size={15} strokeWidth={2.2} />
        Quay lại
      </button>

      <h1 className="font-display text-2xl mb-1">{existing ? 'Sửa check-in' : 'Check-in'}</h1>
      <p className="text-inkmuted text-sm mb-5">Chọn tâm trạng chính của bạn</p>

      <label className="flex items-center gap-2.5 border border-line rounded-lg px-3.5 py-2.5 mb-6">
        <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Clock3 size={14} strokeWidth={2} />
        </span>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
        />
      </label>

      <div className="flex justify-between mb-8">
        {moods.map((m) => (
          <button
            key={m.key}
            onClick={() => setMood(m.key)}
            className="flex flex-col items-center gap-2"
          >
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-transform"
              style={{
                borderColor: mood === m.key ? m.color : 'rgb(var(--c-line))',
                background: mood === m.key ? m.color + '33' : m.color + '14',
                transform: mood === m.key ? 'scale(1.08)' : 'scale(1)'
              }}
            >
              {m.emoji}
            </span>
            <span className="text-[11px] text-inkmuted">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Hoạt động trong ngày</p>
          <Link
            to="/manage/activities"
            className="flex items-center gap-1.5 text-xs bg-line/25 text-inkmuted rounded-full pl-2 pr-3 py-1.5"
          >
            <Settings2 size={12} strokeWidth={2.2} />
            Quản lý
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-x-2 gap-y-4">
          {activities.map((a) => {
            const active = selectedActivities.includes(a.id)
            return (
              <div key={a.id} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => toggleActivity(a.id)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl border transition-colors"
                  style={{
                    borderColor: active ? 'rgb(var(--c-accent))' : 'rgb(var(--c-line))',
                    background: active ? 'rgb(var(--c-accent) / 0.85)' : 'rgb(var(--c-line) / 0.25)'
                  }}
                >
                  {a.emoji}
                </button>
                <span className="text-[10px] text-inkmuted text-center leading-tight line-clamp-1">{a.label}</span>
              </div>
            )
          })}

          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setShowAddActivity(true)}
              aria-label="Thêm hoạt động"
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-accent/50 text-accent bg-accent/5"
            >
              <Plus size={18} strokeWidth={2.4} />
            </button>
            <span className="text-[10px] text-accent text-center leading-tight">Thêm mới</span>
          </div>
        </div>
      </div>

      <BottomSheet open={showAddActivity} title="Thêm hoạt động mới" onClose={() => setShowAddActivity(false)}>
        <p className="text-xs text-inkmuted mb-3">Nhập emoji và đặt tên cho hoạt động của riêng bạn</p>
        <div className="flex gap-2 mb-4">
          <div className="w-16 shrink-0">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">Emoji</label>
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value.slice(-2))}
              placeholder="😀"
              className="w-full h-12 text-center text-xl border border-line rounded-lg bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">Tên hoạt động</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="vd: Đọc sách"
              autoFocus
              className="w-full h-12 border border-line rounded-lg px-4 text-sm bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowAddActivity(false)}
            className="flex items-center justify-center gap-1.5 bg-line/30 text-inkmuted rounded-full py-3 text-sm"
          >
            <X size={15} strokeWidth={2.4} /> Hủy
          </button>
          <button
            onClick={handleCreateActivity}
            disabled={!newLabel.trim()}
            className="flex items-center justify-center gap-1.5 bg-primary text-oncolor rounded-full py-3 text-sm disabled:opacity-40"
          >
            <Check size={15} strokeWidth={2.4} /> Lưu
          </button>
        </div>
      </BottomSheet>

      <div className="mb-8">
        <p className="text-sm font-medium mb-3">Ghi chú nhanh</p>
        <textarea
          ref={noteRef}
          value={note}
          onChange={(e) => { setNote(e.target.value); autoResize(e) }}
          placeholder="Chuyện gì đã xảy ra hôm nay?"
          rows={2}
          className="w-full border border-line rounded-lg px-4 py-3 text-sm resize-none bg-transparent focus:outline-none focus:border-accent overflow-hidden"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!mood || saving}
        className="w-full bg-primary text-oncolor rounded-lg py-3.5 font-medium disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Check size={18} strokeWidth={2.2} />
        {saving ? 'Đang lưu…' : existing ? 'Cập nhật' : 'Lưu check-in'}
      </button>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
        className={`fixed right-4 z-20 w-10 h-10 rounded-full bg-surface border border-line shadow-md flex items-center justify-center active:scale-95 transition-all ${
          showScrollTop ? 'opacity-100 translate-y-0 pop-in' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ bottom: 'calc(var(--safe-bottom) + 1.5rem)' }}
      >
        <ArrowUp size={18} className="text-ink" strokeWidth={2.2} />
      </button>
    </div>
  )
}
