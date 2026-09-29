import { useEffect, useRef, useState } from 'react'
import { Plus, Check, X, GripVertical, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { useActivities } from '../hooks/useActivities'
import { useToast } from '../context/ToastContext'
import SwipeableRow from '../components/SwipeableRow'
import Dialog from '../components/Dialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { ManageListSkeleton } from '../components/PageSkeleton'

export default function ManageActivities() {
  const { activities, loading, addActivity, updateActivity, removeActivity, reorderActivities } = useActivities()
  const { showToast } = useToast()
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
    showToast('Đã cập nhật hoạt động')
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
      showToast('Đã thêm hoạt động mới')
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await removeActivity(pendingDelete.id)
    showToast('Đã xóa hoạt động')
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
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto page-enter">
      <ConfirmDialog
        open={confirmUpdateOpen}
        title="Cập nhật hoạt động này?"
        description="Emoji và tên hiển thị sẽ được thay đổi."
        confirmLabel="Cập nhật"
        onConfirm={performUpdate}
        onCancel={() => setConfirmUpdateOpen(false)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Xóa hoạt động này?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <h1 className="font-display text-2xl mb-1">Quản lý hoạt động</h1>
      <p className="text-inkmuted text-sm mb-6">
        Kéo biểu tượng <GripVertical size={12} className="inline -mt-0.5" /> hoặc dùng mũi tên để sắp xếp. Vuốt phải để sửa, vuốt trái để xóa.
      </p>

      <button
        onClick={openAdd}
        className="w-full flex items-center justify-center gap-2 bg-primary text-oncolor rounded-lg py-3 mb-6 font-medium active:scale-[0.98] transition-transform"
      >
        <Plus size={17} strokeWidth={2.2} /> Thêm hoạt động mới
      </button>

      <Dialog open={formOpen} title={editingId ? 'Sửa hoạt động' : 'Hoạt động mới'} onClose={closeForm}>
        <div className="flex gap-2 mb-4">
          <div className="w-16 shrink-0">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">Emoji</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(-2))}
              placeholder="😀"
              className="w-full h-12 text-center text-xl border border-line rounded-lg bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">Tên hoạt động</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="vd: Đọc sách"
              autoFocus
              className="w-full h-12 border border-line rounded-lg px-4 text-sm bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={closeForm}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 bg-line/30 text-inkmuted rounded-full py-3 text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            <X size={15} strokeWidth={2.4} /> Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!label.trim() || saving}
            className="flex items-center justify-center gap-1.5 bg-primary text-oncolor rounded-full py-3 text-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.4} />}
            {editingId ? 'Cập nhật' : 'Lưu'}
          </button>
        </div>
      </Dialog>

      {loading ? (
        <ManageListSkeleton />
      ) : (
      <ul className="space-y-2.5">
        {order.map((a, i) => (
          <li
            key={a.id}
            ref={(el) => (rowRefs.current[i] = el)}
            className={`transition-transform ${dragActiveIndex === i ? 'scale-[1.02]' : ''}`}
            style={{ zIndex: dragActiveIndex === i ? 10 : 'auto' }}
          >
            <SwipeableRow onEdit={() => openEdit(a)} onDelete={() => setPendingDelete(a)}>
              <div className={`flex items-center gap-3 border rounded-lg p-3 bg-surface transition-shadow ${dragActiveIndex === i ? 'shadow-lg border-accent' : 'border-line'}`}>
                <span
                  onPointerDown={(e) => handleGripPointerDown(e, i)}
                  className="text-inkmuted cursor-grab active:cursor-grabbing shrink-0 touch-none p-1"
                  aria-label="Kéo để sắp xếp"
                >
                  <GripVertical size={16} strokeWidth={2} />
                </span>
                <span className="w-10 h-10 rounded-full bg-line/25 flex items-center justify-center text-lg shrink-0">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.label}</p>
                  <p className="text-[11px] text-inkmuted">{a.custom ? 'Tự tạo' : 'Mặc định'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Di chuyển lên"
                    className="w-9 h-9 rounded-full bg-line/25 text-inkmuted flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <ArrowUp size={16} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label="Di chuyển xuống"
                    className="w-9 h-9 rounded-full bg-line/25 text-inkmuted flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                  >
                    <ArrowDown size={16} strokeWidth={2.2} />
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
