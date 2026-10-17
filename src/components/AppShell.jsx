import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, HomeFilled, HistoryIcon, HistoryFilled, BarChart3, BarChartFilled, Settings, Plus, ArrowUp,
  Menu, Sun, Moon, Monitor
} from './icons'
import { MdSettings } from 'react-icons/md'
import { ModalDrawer, PermanentDrawer, NavRail } from './Sidebar'
import { getStoredTheme, setTheme } from '../lib/theme'
import { useI18n } from '../i18n'

const THEME_CYCLE = ['light', 'dark', 'system']
const THEME_META = {
  light: { icon: Sun, key: 'theme.light' },
  dark: { icon: Moon, key: 'theme.dark' },
  system: { icon: Monitor, key: 'theme.system' }
}

function ThemeToggle() {
  const { t } = useI18n()
  const [theme, setThemeState] = useState(getStoredTheme())

  useEffect(() => {
    const sync = () => setThemeState(getStoredTheme())
    window.addEventListener('themechange', sync)
    return () => window.removeEventListener('themechange', sync)
  }, [])

  function cycle() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]
    setThemeState(next)
    setTheme(next)
  }

  const { icon: Icon, key } = THEME_META[theme]
  return (
    <button onClick={cycle} aria-label={t(key)} title={t(key)} className="icon-btn state text-on-surface-variant">
      <Icon key={theme} size={24} className="pop-in" />
    </button>
  )
}

function LangToggle() {
  const { lang, setLang, t } = useI18n()
  const next = lang === 'vi' ? 'en' : 'vi'
  return (
    <button
      onClick={() => setLang(next)}
      aria-label={t('settings.language')}
      title={t('settings.language')}
      className="state h-10 min-w-10 px-2 rounded-full t-label-large text-on-surface-variant"
    >
      {lang.toUpperCase()}
    </button>
  )
}

// Navigation bar (điện thoại): tối đa 5 đích đến; icon đặc khi đang chọn.
const TABS = [
  { to: '/', key: 'nav.today', icon: Home, activeIcon: HomeFilled, end: true },
  { to: '/history', key: 'nav.history', icon: HistoryIcon, activeIcon: HistoryFilled },
  { to: '/stats', key: 'nav.stats', icon: BarChart3, activeIcon: BarChartFilled },
  { to: '/settings', key: 'nav.settings', icon: Settings, activeIcon: MdSettings }
]

export default function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useI18n()
  // FAB "check-in mới" chỉ hiện ở các trang cần thêm nhanh (Hôm nay, Lịch sử);
  // các trang còn lại (Thống kê, Cài đặt, Quản lý…) không có hành động chính nên không hiện FAB.
  const showAddFab = pathname === '/' || pathname === '/history'
  const [scrolled, setScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Trang cuộn theo window (mượt hơn trên mobile — thanh địa chỉ tự thu gọn). Chỉ setState khi
  // trạng thái thật sự đổi để tránh render lại mỗi khung hình cuộn.
  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      setScrolled((v) => (v === y > 2 ? v : y > 2))
      setShowScrollTop((v) => (v === y > 400 ? v : y > 400))
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface md:flex">
      <ModalDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <NavRail />
      <PermanentDrawer />

      <div className="flex-1 min-w-0 flex flex-col min-h-[100dvh]">
        {/* Top app bar — đổi sang surface-container + elevation khi nội dung cuộn dưới nó */}
        <header
          className={`sticky top-0 z-10 flex items-center h-16 gap-1 px-1 md:px-4 transition-[background-color,box-shadow] duration-200 ${scrolled ? 'bg-surface-container shadow-elev-2' : 'bg-surface'
            }`}
          style={{ top: 'var(--safe-top)' }}
        >
          <button onClick={() => setDrawerOpen(true)} aria-label={t('nav.openMenu')} className="icon-btn state text-on-surface md:hidden">
            <Menu size={24} />
          </button>
          <span className="t-title-large flex-1 ml-2 md:ml-4 lg:hidden">Moody</span>
          <span className="hidden lg:block flex-1" />
          <LangToggle />
          <ThemeToggle />
        </header>

        <main className="flex-1 relative pb-[calc(var(--safe-bottom)+6rem)] md:pb-12">
          <Outlet />
        </main>
      </div>

      {/* FAB lên đầu trang */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('common.scrollTop')}
        className={`state fixed right-4 md:right-6 z-20 w-14 h-14 rounded-m3-lg bg-surface-container-high text-primary shadow-elev-3 flex items-center justify-center transition-[opacity,transform] duration-200 bottom-[calc(var(--safe-bottom)+11rem)] md:bottom-6 ${showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
      >
        <ArrowUp size={28} />
      </button>

      {/* FAB chính (điện thoại). Trên màn hình lớn FAB nằm trong rail / drawer. */}
      {showAddFab && <button
        onClick={() => navigate('/checkin')}
        aria-label={t('nav.newCheckin')}
        className="state md:hidden fixed right-4 z-30 w-14 h-14 rounded-m3-lg bg-primary-container text-on-primary-container shadow-elev-3 hover:shadow-elev-4 flex items-center justify-center transition-shadow bottom-[calc(var(--safe-bottom)+6rem)]"
      >
        <Plus size={24} />
      </button>}

      {/* Navigation bar (điện thoại) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface-container grid grid-cols-4"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
        aria-label={t('nav.label')}
      >
        {TABS.map((tab) => (
          <NavTab key={tab.to} {...tab} label={t(tab.key)} />
        ))}
      </nav>
    </div>
  )
}

function NavTab({ to, label, icon: Icon, activeIcon: ActiveIcon, end }) {
  return (
    <NavLink to={to} end={end} className="flex flex-col items-center pt-3 pb-4 gap-1 group">
      {({ isActive }) => {
        const I = isActive ? ActiveIcon : Icon
        return (
          <>
            <span
              className={`state relative flex items-center justify-center h-8 w-16 rounded-full transition-colors duration-300 ease-emphasized ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
                }`}
            >
              <I size={24} />
            </span>
            <span className={`t-label-medium ${isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>{label}</span>
          </>
        )
      }}
    </NavLink>
  )
}
