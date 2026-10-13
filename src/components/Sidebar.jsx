import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, HistoryIcon, BarChart3, Settings, ListPlus, Smile, Plus } from './icons'
import { useI18n } from '../i18n'

export const NAV_MAIN = [
  { to: '/', key: 'nav.today', icon: Home, end: true },
  { to: '/history', key: 'nav.history', icon: HistoryIcon },
  { to: '/stats', key: 'nav.stats', icon: BarChart3 },
  { to: '/settings', key: 'nav.settings', icon: Settings }
]

export const NAV_MANAGE = [
  { to: '/manage/activities', key: 'nav.activities', shortKey: 'nav.activitiesShort', icon: ListPlus },
  { to: '/manage/moods', key: 'nav.moods', shortKey: 'nav.moodsShort', icon: Smile }
]

function DrawerBody({ onNavigate }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <>
      <div className="flex items-center gap-3 px-7 h-[4.5rem] shrink-0">
        <span className="t-title-large">Moody</span>
      </div>

      {/* Extended FAB — chỉ hiện ở drawer cố định (màn hình lớn) */}
      <div className="px-4 pb-4 hidden lg:block">
        <button
          onClick={() => navigate('/checkin')}
          className="state h-14 px-5 rounded-m3-lg bg-primary-container text-on-primary-container shadow-elev-1 hover:shadow-elev-2 flex items-center gap-3 t-label-large transition-shadow"
        >
          <Plus size={24} />
          {t('nav.newCheckin')}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={t('nav.label')}>
        {NAV_MAIN.map((l) => (
          <DrawerLink key={l.to} {...l} label={t(l.key)} onClick={onNavigate} />
        ))}
        <div className="h-px bg-outline-variant mx-4 my-3" />
        <p className="t-title-small text-on-surface-variant px-4 h-12 flex items-center">{t('nav.manage')}</p>
        {NAV_MANAGE.map((l) => (
          <DrawerLink key={l.to} {...l} label={t(l.key)} onClick={onNavigate} />
        ))}
      </nav>

      <div className="px-7 py-4 t-label-medium text-on-surface-variant shrink-0">{t('nav.tagline')}</div>
    </>
  )
}

function DrawerLink({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `state flex items-center gap-3 h-14 pl-4 pr-6 rounded-full t-label-large ${
          isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
        }`
      }
    >
      <Icon size={24} />
      {label}
    </NavLink>
  )
}

// Modal navigation drawer (điện thoại) — mở bằng nút menu trên app bar.
export function ModalDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className="md:hidden">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 scrim z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        aria-hidden={!open}
        inert={!open ? '' : undefined}
        className={`fixed top-0 left-0 z-50 h-full w-[22.5rem] max-w-[85vw] bg-surface-container-low rounded-r-m3-xl flex flex-col transition-transform duration-300 ease-emphasized will-change-transform ${
          open ? 'translate-x-0 shadow-elev-3' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <DrawerBody onNavigate={onClose} />
      </aside>
    </div>
  )
}

// Standard navigation drawer cố định (laptop / PC, ≥ 1024px).
export function PermanentDrawer() {
  return (
    <aside className="hidden lg:flex flex-col w-[17.5rem] shrink-0 sticky top-0 h-[100dvh] bg-surface-container-low border-r border-outline-variant/40">
      <DrawerBody />
    </aside>
  )
}

// Navigation rail (tablet / laptop nhỏ, 768–1023px): FAB + các đích đến chính + mục quản lý.
export function NavRail() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const items = [...NAV_MAIN, ...NAV_MANAGE]
  return (
    <aside className="hidden md:flex lg:hidden flex-col items-center w-20 shrink-0 sticky top-0 h-[100dvh] bg-surface py-4 gap-1 overflow-y-auto no-scrollbar border-r border-outline-variant/40">
      <button
        onClick={() => navigate('/checkin')}
        aria-label={t('nav.newCheckin')}
        className="state w-14 h-14 mb-4 rounded-m3-lg bg-primary-container text-on-primary-container shadow-elev-1 hover:shadow-elev-2 flex items-center justify-center shrink-0 transition-shadow"
      >
        <Plus size={24} />
      </button>
      {items.map((l, i) => (
        <div key={l.to} className="w-full">
          {i === NAV_MAIN.length && <div className="h-px bg-outline-variant mx-4 my-2" />}
          <NavLink to={l.to} end={l.end} className="flex flex-col items-center gap-1 py-1.5 group" title={t(l.key)}>
            {({ isActive }) => (
              <>
                <span
                  className={`state flex items-center justify-center w-14 h-8 rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
                  }`}
                >
                  <l.icon size={24} />
                </span>
                <span className={`t-label-medium text-center px-1 ${isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                  {t(l.shortKey || l.key)}
                </span>
              </>
            )}
          </NavLink>
        </div>
      ))}
    </aside>
  )
}
