import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const ToastContext = createContext(null)

// Toast nhẹ, tự ẩn — chỉ dùng cho các thông báo không mang tính phá hủy
// (vd: "Đã thêm hoạt động mới"). Các thao tác sửa/xóa dùng ConfirmDialog
// (hỏi xác nhận TRƯỚC khi thực hiện), không dùng toast này.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, options = {}) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, ...options })
    timerRef.current = setTimeout(() => setToast(null), options.duration || 2600)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        style={{ bottom: 'calc(var(--safe-bottom) + 6.75rem)' }}
      >
        {toast && (
          <div className="flex items-center gap-2 bg-ink text-paper text-sm px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap">
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Check size={12} strokeWidth={2.6} className="text-oncolor" />
            </span>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
