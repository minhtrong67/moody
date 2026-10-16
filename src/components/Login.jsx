import { useState } from 'react'
import { Loader2, Check, BarChart3, Download, NotebookPen } from './icons'
import { useAuth } from '../context/AuthContext'
import { useI18n, LANGUAGES } from '../i18n'
import SegmentedButton from './SegmentedButton'

const MOOD_EMOJIS = ['😄', '🙂', '😐', '😔', '😠']
const MOOD_COLORS = ['#F0A34E', '#8FBF7F', '#9FB8C8', '#7D8CB0', '#C4676B']
const PREVIEW_WEEK = [1, 0, 1, 2, 0, 3, 0] // chỉ số trong MOOD_EMOJIS, dùng minh họa

const FEATURES = [
  { icon: NotebookPen, key: 'f1' },
  { icon: BarChart3, key: 'f2' },
  { icon: Download, key: 'f3' },
]

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  )
}

export default function Login() {
  const { loginWithGoogle, authError } = useAuth()
  const { t, langPref, setLang } = useI18n()
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
      className="min-h-[100dvh] bg-surface text-on-surface page-enter lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      {/* ===== Panel thương hiệu (laptop / PC) ===== */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary-container text-on-primary-container p-12 xl:p-16">
        {/* Họa tiết nền mềm */}
        <span aria-hidden="true" className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <span aria-hidden="true" className="absolute -bottom-40 -left-24 w-[26rem] h-[26rem] rounded-full bg-tertiary/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" width="44" height="44" className="w-11 h-11 rounded-m3-md shadow-elev-1" />
          <span className="t-title-large font-medium">Moody</span>
        </div>

        <div className="relative max-w-xl">
          <h2 className="text-[2.5rem] xl:text-5xl leading-[1.15] font-medium tracking-tight mb-5">{t('login.heroTitle')}</h2>
          <p className="t-body-large opacity-80 max-w-lg mb-10">{t('login.heroText')}</p>

          <ul className="space-y-5 mb-12">
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-m3-md bg-surface/60 flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </span>
                <div>
                  <p className="t-title-medium">{t(`login.${key}.title`)}</p>
                  <p className="t-body-medium opacity-75">{t(`login.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Thẻ minh họa một tuần tâm trạng */}
          <div className="rounded-m3-xl bg-surface/70 backdrop-blur p-5 shadow-elev-2 max-w-md" aria-hidden="true">
            <div className="flex justify-between">
              {PREVIEW_WEEK.map((i, d) => (
                <div key={d} className="flex flex-col items-center gap-2">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: MOOD_COLORS[i] + '55' }}>
                    {MOOD_EMOJIS[i]}
                  </span>
                  <span className="t-label-small text-on-surface-variant">{t('weekdays.short')[d]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative t-label-medium opacity-70">{t('login.footer')}</p>
      </aside>

      {/* ===== Khung đăng nhập ===== */}
      <main className="relative min-h-[100dvh] lg:min-h-0 flex flex-col items-center justify-center px-6 py-10 sm:px-10 overflow-hidden">
        {/* Nền gradient nhẹ trên điện thoại / tablet */}
        <span aria-hidden="true" className="lg:hidden absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary-container/70 to-transparent" />

        <div className="relative w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <img src="/icons/icon-512.png" alt="Moody" width="88" height="88" className="w-[5.5rem] h-[5.5rem] rounded-m3-xl shadow-elev-2 mb-5" />
            <div className="flex gap-1.5" aria-hidden="true">
              {MOOD_EMOJIS.map((e) => (
                <span key={e} className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-lg">{e}</span>
              ))}
            </div>
          </div>

          <div className="sm:bg-surface-container-low sm:rounded-m3-xl sm:shadow-elev-1 sm:border sm:border-outline-variant/40 sm:p-10">
            <h1 className="t-headline-medium mb-2 text-center lg:text-left">{t('login.welcome')}</h1>
            <p className="t-body-large text-on-surface-variant mb-8 text-center lg:text-left">{t('login.welcomeSub')}</p>

            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className="btn btn-outlined btn-lg btn-block state gap-3 justify-center !bg-surface hover:!bg-surface-container"
            >
              {loggingIn ? <Loader2 size={20} /> : <GoogleMark />}
              {loggingIn ? t('login.signingIn') : t('login.google')}
            </button>

            {authError && (
              <p className="mt-5 t-body-medium text-error rounded-m3-md bg-error-container/40 px-4 py-3" role="alert">
                {t('login.firebaseError')}
              </p>
            )}

            <div className="flex items-center gap-4 my-6" aria-hidden="true">
              <span className="flex-1 h-px bg-outline-variant" />
              <span className="t-label-medium text-on-surface-variant">{t('login.or')}</span>
              <span className="flex-1 h-px bg-outline-variant" />
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('guest-mode'))}
              className="btn btn-tonal btn-lg btn-block state justify-center"
            >
              {t('login.guest')}
            </button>
            <p className="mt-3 t-body-small text-on-surface-variant text-center flex items-center justify-center gap-1.5">
              <Check size={14} className="shrink-0" />
              {t('login.guestHint')}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-[16rem]">
              <SegmentedButton
                options={[{ key: 'auto', label: t('settings.langAuto') }, ...LANGUAGES]}
                value={langPref}
                onChange={setLang}
              />
            </div>
            <p className="t-label-small text-on-surface-variant lg:hidden">{t('login.footer')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
