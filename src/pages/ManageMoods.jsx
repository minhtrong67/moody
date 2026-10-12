import { useState } from 'react'
import { Pencil, RotateCcw } from '../components/icons'
import { useMoods } from '../hooks/useMoods'
import Dialog, { DialogActions } from '../components/Dialog'
import TextField from '../components/TextField'
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

      <h1 className="t-headline-medium mb-1">Quản lý tâm trạng</h1>
      <p className="t-body-medium text-on-surface-variant mb-6">
        Đổi emoji và tên hiển thị cho 5 mức tâm trạng. Thang điểm (1–5) và màu sắc dùng cho thống kê được giữ nguyên.
      </p>

      <Dialog open={!!editingKey} title="Sửa tâm trạng" onClose={closeForm}>
        <div className="flex gap-3">
          <TextField
            label="Emoji"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(-2))}
            className="w-24 shrink-0 [&_input]:text-center [&_input]:text-xl [&_input]:px-2"
          />
          <TextField
            label="Tên hiển thị"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            className="flex-1"
          />
        </div>
        <DialogActions>
          <button onClick={closeForm} className="btn btn-text state">Hủy</button>
          <button onClick={handleSubmit} disabled={!label.trim()} className="btn btn-text state">Cập nhật</button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <ManageListSkeleton count={5} />
      ) : (
      <div className="space-y-2">
        {moods.map((m) => (
          <div key={m.key} className="flex items-center gap-4 card-filled px-4 py-3">
            <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: m.color + '40' }}>
              {m.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="t-body-large truncate">{m.label}</p>
              <p className="t-body-medium text-on-surface-variant">Điểm số: {m.score}/5</p>
            </div>
            <div className="flex items-center shrink-0">
              {hasOverride(m.key) && (
                <button
                  onClick={() => setPendingReset(m.key)}
                  aria-label="Khôi phục mặc định"
                  title="Khôi phục mặc định"
                  className="icon-btn state"
                >
                  <RotateCcw size={24} />
                </button>
              )}
              <button onClick={() => openEdit(m)} aria-label="Sửa" className="icon-btn icon-btn-primary state">
                <Pencil size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
