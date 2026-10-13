import { useEffect, useRef, useState } from 'react'
import { Plus, GripVertical, ArrowUp, ArrowDown, Loader2 } from '../components/icons'
import { useActivities } from '../hooks/useActivities'
import { useToast } from '../context/ToastContext'
import SwipeableRow from '../components/SwipeableRow'
import Dialog, { DialogActions } from '../components/Dialog'
import TextField from '../components/TextField'
import { useI18n } from '../i18n'
import ConfirmDialog from '../components/ConfirmDialog'
import { ManageListSkeleton } from '../components/PageSkeleton'

export default function ManageActivities() {
  const { activities, loading, addActivity, updateActivity, removeActivity, reorderActivities } = useActivities()
  const { showToast } = useToast()
  const { t } = useI18n()
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [emoji, setEmoji] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  // Danh sách hiển thị cục bộ để kéo-thả mượt (không ghi liên tục khi đang kéo,
  // chỉ lưu 1 lần khi thả tay ra).
  const [order, setOrder] = useState(activities)
  const orderRef = useRef(activities)
  const draggingIndex = useRef(null)
  const rowRefs = useRef([])
  const [dragActiveIndex, setDragActiveIndex] = useState(null)

  useEffect(() => {
    if (draggingIndex.current === null) {
      setOrder(activities)
      orderRef.current = activities
    }
  }, [activities])

  function openAdd() {
    setEditingId(null)
    setEmoji('')
    setLabel('')
    setFormOpen(true)
  }

  function openEdit(a) {
    setEditingId(a.id)
    setEmoji(a.emoji)
    setLabel(a.label)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  async function performUpdate() {
    await updateActivity(editingId, { emoji: emoji.trim() || '✨', label: label.trim() })
    showToast(t('manageActs.updated'))
    setConfirmUpdateOpen(false)
    closeForm()
  }

  async function handleSubmit() {
    if (!label.trim()) return
    if (editingId) {
      setConfirmUpdateOpen(true)
      return
    }
    setSaving(true)
    try {
      await addActivity({ emoji: emoji.trim() || '✨', label: label.trim() })
      showToast(t('manageActs.added'))
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await removeActivity(pendingDelete.id)
    showToast(t('manageActs.deleted'))
    setPendingDelete(null)
  }

  function move(index, dir) {
    const target = index + dir
    if (target < 0 || target >= order.length) return
    const ids = order.map((a) => a.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderActivities(ids)
  }

  // --- Kéo-thả bằng Pointer Events (hoạt động cả chuột và chạm/touch) ---
  function handleGripPointerDown(e, index) {
    e.stopPropagation() // không để SwipeableRow bắt sự kiện vuốt ngang
    e.preventDefault()
    draggingIndex.current = index
    setDragActiveIndex(index)

    const onMove = (ev) => {
      const from = draggingIndex.current
      if (from === null) return
      let to = from
      for (let i = 0; i < rowRefs.current.length; i++) {
        const el = rowRefs.current[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
          to = i
          break
        }
      }
      if (to !== from) {
        const next = [...orderRef.current]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        orderRef.current = next
        setOrder(next)
        draggingIndex.current = to
        setDragActiveIndex(to)
      }
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      draggingIndex.current = null
      setDragActiveIndex(null)
      const ids = orderRef.current.map((a) => a.id)
      const changed = ids.some((id, i) => id !== activities[i]?.id)
      if (changed) reorderActivities(ids)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <div className="page page-narrow page-enter pt-2 pb-8">
      <ConfirmDialog
        open={confirmUpdateOpen}
        title={t('manageActs.updateTitle')}
        description={t('manage.updateText')}
        confirmLabel={t('common.update')}
        onConfirm={performUpdate}
        onCancel={() => setConfirmUpdateOpen(false)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title={t('manageActs.deleteTitle')}
        description={t('common.irreversible')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <h1 className="t-headline-medium mb-1">{t('nav.activities')}</h1>
      <p className="t-body-medium text-on-surface-variant mb-6">
        {t('manageActs.intro')}
      </p>

      <button onClick={openAdd} className="btn btn-filled btn-lg btn-block state mb-6">
        <Plus size={18} /> {t('manageActs.add')}
      </button>

      <Dialog open={formOpen} title={editingId ? t('manageActs.edit') : t('manageActs.new')} onClose={closeForm}>
        <div className="flex gap-3">
          <TextField
            label={t('manage.emoji')}
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(-2))}
            placeholder="😀"
            className="w-24 shrink-0 [&_input]:text-center [&_input]:text-xl [&_input]:px-2"
          />
          <TextField
            label={t('manageActs.name')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('manageActs.example')}
            autoFocus
            className="flex-1"
          />
        </div>
        <DialogActions>
          <button onClick={closeForm} disabled={saving} className="btn btn-text state">{t('common.cancel')}</button>
          <button onClick={handleSubmit} disabled={!label.trim() || saving} className="btn btn-text state">
            {saving && <Loader2 size={16} />}
            {editingId ? t('common.update') : t('common.save')}
          </button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <ManageListSkeleton />
      ) : (
      <ul className="space-y-2">
        {order.map((a, i) => (
          <li
            key={a.id}
            ref={(el) => (rowRefs.current[i] = el)}
            className={`transition-transform ${dragActiveIndex === i ? 'scale-[1.02]' : ''}`}
            style={{ zIndex: dragActiveIndex === i ? 10 : 'auto' }}
          >
            <SwipeableRow onEdit={() => openEdit(a)} onDelete={() => setPendingDelete(a)}>
              <div className={`flex items-center gap-2 rounded-m3-md px-2 py-2 transition-shadow ${dragActiveIndex === i ? 'shadow-elev-3 bg-surface-container-high' : 'bg-surface-container-highest'}`}>
                <span
                  onPointerDown={(e) => handleGripPointerDown(e, i)}
                  className="text-on-surface-variant cursor-grab active:cursor-grabbing shrink-0 touch-none p-1"
                  aria-label={t('manageActs.drag')}
                >
                  <GripVertical size={24} />
                </span>
                <span className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-xl shrink-0">{a.emoji}</span>
                <div className="flex-1 min-w-0 pl-1">
                  <p className="t-body-large truncate">{a.label}</p>
                  <p className="t-body-small text-on-surface-variant">{a.custom ? t('manageActs.custom') : t('manageActs.default')}</p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={t('manageActs.up')}
                    className="icon-btn state"
                  >
                    <ArrowUp size={24} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label={t('manageActs.down')}
                    className="icon-btn state"
                  >
                    <ArrowDown size={24} />
                  </button>
                </div>
              </div>
            </SwipeableRow>
          </li>
        ))}
      </ul>
      )}
    </div>
  )
}
