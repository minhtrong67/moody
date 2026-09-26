import { Check, X } from 'lucide-react'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Xác nhận', danger, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs bg-surface rounded-card p-5 pop-in">
        <p className="text-sm font-medium mb-1">{title}</p>
        {description && <p className="text-xs text-inkmuted mb-4">{description}</p>}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-1.5 bg-line/30 text-inkmuted rounded-full py-2.5 text-sm"
          >
            <X size={14} strokeWidth={2.4} /> Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm text-oncolor ${danger ? 'bg-mood-angry' : 'bg-primary'}`}
          >
            <Check size={14} strokeWidth={2.4} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
