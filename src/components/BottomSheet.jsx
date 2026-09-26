import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface rounded-t-2xl px-5 pt-4 animate-[sheetUp_0.28s_cubic-bezier(0.22,1,0.36,1)_both]"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)' }}
      >
        <div className="w-10 h-1.5 rounded-full bg-line mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium">{title}</p>
          <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full bg-line/30 text-inkmuted flex items-center justify-center">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
