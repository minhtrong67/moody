import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Basic dialog của Material Design 3: bo 28dp, nền surface-container-high, tiêu đề headline-small.
// Nút hành động đặt trong `children` (dùng <DialogActions>).
export default function Dialog({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 scrim animate-[fadeIn_0.2s_ease_both]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-container-high rounded-m3-xl p-6 pop-in shadow-elev-3"
        style={{ '--field-bg': 'var(--md-surface-container-high)' }}
      >
        <p className="t-headline-small mb-4">{title}</p>
        {children}
      </div>
    </div>
    , document.body)
}

export function DialogActions({ children }) {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>
}
