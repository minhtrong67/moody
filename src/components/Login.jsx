import { useState } from 'react'
import { Loader2 } from './icons'
import { useAuth } from '../context/AuthContext'
import { useI18n, LANGUAGES } from '../i18n'
import SegmentedButton from './SegmentedButton'

const MOOD_EMOJIS = ['😄', '🙂', '😐', '😔', '😠']

export default function Login() {
  const { loginWithGoogle, authError } = useAuth()
  const { t, lang, setLang } = useI18n()
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
    <div
      className="min-h-[100dvh] md:grid md:grid-cols-2 bg-surface page-enter"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      {/* Panel giới thiệu — chỉ hiện trên màn hình ≥ 768px */}
      <div className="hidden md:flex flex-col items-center justify-center bg-primary-container text-on-primary-container p-12 text-center">
        <img src="/icons/icon-512.png" alt="" width="128" height="128" className="w-32 h-32 rounded-m3-xl shadow-elev-2 mb-8" />
        <h2 className="t-headline-medium mb-3">{t('login.heroTitle')}</h2>
        <p className="t-body-large opacity-80 max-w-sm mb-10">{t('login.heroText')}</p>
        <div className="flex gap-3">
          {MOOD_EMOJIS.map((e) => (
            <span key={e} className="w-14 h-14 rounded-full bg-surface/60 flex items-center justify-center text-3xl">{e}</span>
          ))}
        </div>
      </div>

      <div className="min-h-[100dvh] md:min-h-0 flex flex-col items-center justify-center px-8 text-center">
        <img src="/icons/icon-512.png" alt="Moody" width="96" height="96" className="md:hidden w-24 h-24 rounded-m3-xl shadow-elev-2 mb-8" />
        <h1 className="t-headline-medium mb-2">Moody</h1>
        <p className="t-body-large text-on-surface-variant mb-10 max-w-xs">{t('login.tagline')}</p>
        <button onClick={handleLogin} disabled={loggingIn} className="btn btn-filled btn-lg state gap-3">
          {loggingIn ? <Loader2 size={18} /> : <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/><path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"/><path fill="#fff" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"/><path fill="#fff" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>}
          {loggingIn ? t('login.signingIn') : t('login.google')}
        </button>
        {authError && (
          <p className="mt-6 t-body-medium text-error max-w-xs" role="alert">{t('login.firebaseError')}</p>
        )}
        <button onClick={() => window.dispatchEvent(new CustomEvent('guest-mode'))} className="btn btn-text state mt-4">
          {t('login.guest')}
        </button>
        <div className="w-56 mt-8">
          <SegmentedButton options={LANGUAGES} value={lang} onChange={setLang} />
        </div>
      </div>
    </div>
  )
}
