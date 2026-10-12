import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, HelpCircle, Loader2 } from './icons'

// Dialog xác nhận (M3 basic dialog có icon): icon + tiêu đề canh giữa, nút văn bản căn phải.
export default function ConfirmDialog({ open, title, description, confirmLabel = 'Xác nhận', danger, onConfirm, onCancel }) {
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    if (submitting) return
    onCancel()
  }

  const Icon = danger ? AlertTriangle : HelpCircle

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6 scrim animate-[fadeIn_0.2s_ease_both]"
      onClick={handleCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-container-high rounded-m3-xl p-6 pop-in shadow-elev-3"
      >
        <Icon size={24} className={`mx-auto mb-4 ${danger ? 'text-error' : 'text-secondary-icon text-primary'}`} />
        <p className="t-headline-small text-center mb-4">{title}</p>
        {description && <p className="t-body-medium text-on-surface-variant mb-6">{description}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={handleCancel} disabled={submitting} className="btn btn-text state">
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`btn state ${danger ? 'btn-text-error' : 'btn-text'}`}
          >
            {submitting && <Loader2 size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
    , document.body)
}
