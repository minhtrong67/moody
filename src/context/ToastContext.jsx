import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

// Toast nhẹ, tự ẩn — chỉ dùng cho các thông báo không mang tính phá hủy
// (vd: "Đã thêm hoạt động mới"). Các thao tác sửa/xóa dùng ConfirmDialog
// (hỏi xác nhận TRƯỚC khi thực hiện), không dùng toast này.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, options = {}) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, ...options });
    timerRef.current = setTimeout(
      () => setToast(null),
      options.duration || 2600,
    );
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Snackbar của Material Design 3: nền inverse-surface, bo 4dp, nằm phía trên navigation bar */}
      <div
        className={`fixed left-4 right-4 z-[60] flex justify-center transition-[opacity,transform] duration-300 ease-emphasized bottom-[calc(var(--safe-bottom)+6rem)] md:bottom-6 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div className="flex items-center min-h-12 w-full max-w-md bg-inverse-surface text-inverse-on-surface t-body-medium px-4 py-3 rounded-m3-xs shadow-elev-3">
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
