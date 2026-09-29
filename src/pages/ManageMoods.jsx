import { useState } from 'react'
import { Pencil, Check, X, RotateCcw, Loader2 } from 'lucide-react'
import { useMoods } from '../hooks/useMoods'
import Dialog from '../components/Dialog'
import ConfirmDialog from '../components/ConfirmDialog'
import { ManageListSkeleton } from '../components/PageSkeleton'

export default function ManageMoods() {
  const { moods, loading, updateMood, resetMood, hasOverride } = useMoods()
  const [editingKey, setEditingKey] = useState(null)
  const [emoji, setEmoji] = useState('')
  const [label, setLabel] = useState('')
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false)
  const [pendingReset, setPendingReset] = useState(null)

  function openEdit(m) {
    setEditingKey(m.key)
    setEmoji(m.emoji)
    setLabel(m.label)
  }

  function closeForm() {
    setEditingKey(null)
  }

  function handleSubmit() {
    if (!label.trim()) return
    setConfirmUpdateOpen(true)
  }

  async function performUpdate() {
    await updateMood(editingKey, { emoji: emoji.trim() || '🙂', label: label.trim() })
    setConfirmUpdateOpen(false)
    closeForm()
  }

  async function confirmReset() {
    if (!pendingReset) return
    await resetMood(pendingReset)
    setPendingReset(null)
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto page-enter">
      <ConfirmDialog
        open={confirmUpdateOpen}
        title="Cập nhật tâm trạng này?"
        description="Emoji và tên hiển thị sẽ được thay đổi."
        confirmLabel="Cập nhật"
        onConfirm={performUpdate}
        onCancel={() => setConfirmUpdateOpen(false)}
      />
      <ConfirmDialog
        open={!!pendingReset}
        title="Khôi phục về mặc định?"
        description="Emoji và tên hiển thị sẽ trở lại giá trị gốc."
        confirmLabel="Khôi phục"
        danger
        onConfirm={confirmReset}
        onCancel={() => setPendingReset(null)}
      />

      <h1 className="font-display text-2xl mb-1">Quản lý tâm trạng</h1>
      <p className="text-inkmuted text-sm mb-6">
        Đổi emoji và tên hiển thị cho 5 mức tâm trạng. Thang điểm (1–5) và màu sắc dùng cho thống kê được giữ nguyên.
      </p>

      <Dialog open={!!editingKey} title="Sửa tâm trạng" onClose={closeForm}>
        <div className="flex gap-2 mb-4">
          <div className="w-16 shrink-0">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">Emoji</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(-2))}
              className="w-full h-11 text-center text-xl border border-line rounded-lg bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-inkmuted mb-1 px-1">Tên hiển thị</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              className="w-full h-11 border border-line rounded-lg px-4 text-sm bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={closeForm}
            className="flex items-center justify-center gap-1.5 bg-line/30 text-inkmuted rounded-full py-2.5 text-sm active:scale-95 transition-transform"
          >
            <X size={15} strokeWidth={2.4} /> Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="flex items-center justify-center gap-1.5 bg-primary text-oncolor rounded-full py-2.5 text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            <Check size={15} strokeWidth={2.4} /> Cập nhật
          </button>
        </div>
      </Dialog>

      {loading ? (
        <ManageListSkeleton count={5} />
      ) : (
      <div className="space-y-2">
        {moods.map((m) => (
          <div
            key={m.key}
            className="flex items-center gap-3 border rounded-card p-3 transition-transform active:scale-[0.99]"
            style={{ background: m.color + '14', borderColor: m.color + '40' }}
          >
            <span className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: m.color + '30' }}>
              {m.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.label}</p>
              <p className="text-[11px] text-inkmuted">Điểm số: {m.score}/5</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasOverride(m.key) && (
                <button
                  onClick={() => setPendingReset(m.key)}
                  aria-label="Khôi phục mặc định"
                  title="Khôi phục mặc định"
                  className="w-10 h-10 rounded-full bg-line/30 text-inkmuted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <RotateCcw size={13} strokeWidth={2} />
                </button>
              )}
              <button
                onClick={() => openEdit(m)}
                aria-label="Sửa"
                className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center active:scale-90 transition-transform"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
