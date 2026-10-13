import { useState } from 'react'
import { Pencil, RotateCcw } from '../components/icons'
import { useMoods } from '../hooks/useMoods'
import Dialog, { DialogActions } from '../components/Dialog'
import TextField from '../components/TextField'
import { useI18n } from '../i18n'
import ConfirmDialog from '../components/ConfirmDialog'
import { ManageListSkeleton } from '../components/PageSkeleton'

export default function ManageMoods() {
  const { moods, loading, updateMood, resetMood, hasOverride } = useMoods()
  const { t } = useI18n()
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
    <div className="page page-narrow page-enter pt-2 pb-8">
      <ConfirmDialog
        open={confirmUpdateOpen}
        title={t('manageMoods.updateTitle')}
        description={t('manage.updateText')}
        confirmLabel={t('common.update')}
        onConfirm={performUpdate}
        onCancel={() => setConfirmUpdateOpen(false)}
      />
      <ConfirmDialog
        open={!!pendingReset}
        title={t('manageMoods.resetTitle')}
        description={t('manageMoods.resetText')}
        confirmLabel={t('manageMoods.reset')}
        danger
        onConfirm={confirmReset}
        onCancel={() => setPendingReset(null)}
      />

      <h1 className="t-headline-medium mb-1">{t('nav.moods')}</h1>
      <p className="t-body-medium text-on-surface-variant mb-6">
        {t('manageMoods.intro')}
      </p>

      <Dialog open={!!editingKey} title={t('manageMoods.edit')} onClose={closeForm}>
        <div className="flex gap-3">
          <TextField
            label={t('manage.emoji')}
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(-2))}
            className="w-24 shrink-0 [&_input]:text-center [&_input]:text-xl [&_input]:px-2"
          />
          <TextField
            label={t('manage.displayName')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            className="flex-1"
          />
        </div>
        <DialogActions>
          <button onClick={closeForm} className="btn btn-text state">{t('common.cancel')}</button>
          <button onClick={handleSubmit} disabled={!label.trim()} className="btn btn-text state">{t('common.update')}</button>
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
              <p className="t-body-medium text-on-surface-variant">{t('manageMoods.score', { n: m.score })}</p>
            </div>
            <div className="flex items-center shrink-0">
              {hasOverride(m.key) && (
                <button
                  onClick={() => setPendingReset(m.key)}
                  aria-label={t('manageMoods.reset')}
                  title={t('manageMoods.reset')}
                  className="icon-btn state"
                >
                  <RotateCcw size={24} />
                </button>
              )}
              <button onClick={() => openEdit(m)} aria-label={t('common.edit')} className="icon-btn icon-btn-primary state">
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
