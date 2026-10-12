import { useState } from 'react'
import { Loader2 } from './icons'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { loginWithGoogle, authError } = useAuth()
  const [loggingIn, setLoggingIn] = useState(false)

  async function handleLogin() {
    setLoggingIn(true)
    try {
      await loginWithGoogle()
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center page-enter bg-surface"
         style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <img src="/icons/icon-512.png" alt="Moody" className="w-24 h-24 rounded-m3-xl shadow-elev-2 mb-8" />
      <h1 className="t-headline-medium mb-2">Moody</h1>
      <p className="t-body-large text-on-surface-variant mb-10 max-w-xs">
        Mỗi ngày một nhịp tâm trạng. Ghi lại, nhìn lại, hiểu mình hơn.
      </p>
      <button onClick={handleLogin} disabled={loggingIn} className="btn btn-filled btn-lg state gap-3">
        {loggingIn ? <Loader2 size={18} /> : <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/><path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"/><path fill="#fff" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"/><path fill="#fff" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>}
        {loggingIn ? 'Đang đăng nhập…' : 'Đăng nhập với Google'}
      </button>
      {authError && (
        <p className="mt-6 t-body-medium text-error max-w-xs">
          Chưa kết nối được Firebase — kiểm tra các biến VITE_FIREBASE_* trong file .env. Bạn vẫn có thể dùng thử ở chế độ khách bên dưới.
        </p>
      )}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('guest-mode'))}
        className="btn btn-text state mt-4"
      >
        Dùng thử không cần đăng nhập
      </button>
    </div>
  )
}
