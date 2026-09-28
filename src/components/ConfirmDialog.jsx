import { useState } from 'react'
import { Check, X, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react'

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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6 bg-black/45 backdrop-blur-[2px] animate-[fadeInUp_0.18s_ease_both]"
      onClick={handleCancel}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-2xl p-6 pop-in shadow-xl">
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: danger ? 'rgb(196 103 107 / 0.14)' : 'rgb(var(--c-accent) / 0.14)' }}
        >
          <Icon size={22} strokeWidth={2.2} className={danger ? 'text-mood-angry' : 'text-accent'} />
        </span>
        <p className="text-base font-medium text-center mb-1.5">{title}</p>
        {description && <p className="text-sm text-inkmuted text-center mb-5 leading-relaxed">{description}</p>}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 bg-line/30 text-inkmuted rounded-full py-3 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            <X size={15} strokeWidth={2.4} /> Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-medium text-oncolor active:scale-95 transition-transform disabled:opacity-70 ${danger ? 'bg-mood-angry' : 'bg-primary'}`}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.4} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
