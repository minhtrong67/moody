import { useEffect } from 'react'
import { X } from 'lucide-react'

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/45 backdrop-blur-[2px] animate-[fadeInUp_0.18s_ease_both]"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-2xl p-5 pop-in shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-medium">{title}</p>
          <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full bg-line/30 text-inkmuted flex items-center justify-center active:scale-90 transition-transform">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
