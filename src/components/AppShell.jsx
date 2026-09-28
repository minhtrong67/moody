import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, ListChecks, BarChart3, Settings as SettingsIcon, Plus, ArrowUp, Menu, Sun, Moon, Monitor } from 'lucide-react'
import Sidebar from './Sidebar'
import { getStoredTheme, setTheme } from '../lib/theme'

const THEME_CYCLE = ['light', 'dark', 'system']
const THEME_META = {
  light: { icon: Sun, label: 'Giao diện sáng' },
  dark: { icon: Moon, label: 'Giao diện tối' },
  system: { icon: Monitor, label: 'Theo hệ thống' }
}

function ThemeToggle() {
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

  const { icon: Icon, label } = THEME_META[theme]
  return (
    <button
      onClick={cycle}
      aria-label={label}
      title={label}
      className="w-9 h-9 rounded-full bg-line/25 text-ink flex items-center justify-center shrink-0 active:scale-90 transition-transform"
    >
      <Icon key={theme} size={17} strokeWidth={2} className="pop-in" />
    </button>
  )
}

const LEFT_TABS = [
  { to: '/', label: 'Hôm nay', icon: Home, end: true },
  { to: '/history', label: 'Lịch sử', icon: ListChecks }
]
const RIGHT_TABS = [
  { to: '/stats', label: 'Thống kê', icon: BarChart3 },
  { to: '/settings', label: 'Cài đặt', icon: SettingsIcon }
]

export default function AppShell() {
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    function onScroll() {
      setShowScrollTop(el.scrollTop > 400)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink" style={{ paddingTop: 'var(--safe-top)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-paper/95 backdrop-blur border-b border-line">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Mở menu"
          className="w-9 h-9 rounded-full bg-line/25 text-ink flex items-center justify-center shrink-0 active:scale-90 transition-transform"
        >
          <Menu size={18} strokeWidth={2} />
        </button>
        <img src="/icons/icon-192.png" alt="" className="w-7 h-7 rounded-lg" />
        <span className="font-display text-base flex-1">Moody</span>
        <ThemeToggle />
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-28 relative">
        <Outlet />
      </main>

      <button
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
        className={`fixed right-4 z-20 w-10 h-10 rounded-full bg-surface border border-line shadow-md flex items-center justify-center active:scale-95 transition-all ${
          showScrollTop ? 'opacity-100 translate-y-0 pop-in' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ bottom: 'calc(var(--safe-bottom) + 6.5rem)' }}
      >
        <ArrowUp size={18} className="text-ink" strokeWidth={2.2} />
      </button>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur border-t border-line grid items-center z-20"
        style={{
          paddingBottom: 'calc(var(--safe-bottom) + 0.5rem)',
          paddingTop: '0.5rem',
          gridTemplateColumns: '1fr 1fr 4.25rem 1fr 1fr'
        }}
      >
        {LEFT_TABS.map((tab) => (
          <NavTab key={tab.to} {...tab} />
        ))}
        <div aria-hidden="true" />
        {RIGHT_TABS.map((tab) => (
          <NavTab key={tab.to} {...tab} />
        ))}
      </nav>

      <button
        onClick={() => navigate('/checkin')}
        aria-label="Check-in mới"
        className="fixed left-1/2 -translate-x-1/2 z-30 w-16 h-16 rounded-full bg-primary text-oncolor flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:scale-105"
        style={{ bottom: 'calc(var(--safe-bottom) + 1.6rem)' }}
      >
        <Plus size={28} strokeWidth={2.2} />
      </button>
    </div>
  )
}

function NavTab({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end} className="flex flex-col items-center justify-center py-1">
      {({ isActive }) => (
        <span
          className={`flex flex-col items-center justify-center gap-1 w-full px-1 py-1.5 rounded-2xl text-[10px] leading-none whitespace-nowrap transition-colors ${
            isActive ? 'text-accent font-medium bg-accent/10' : 'text-inkmuted'
          }`}
        >
          <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
          <span>{label}</span>
        </span>
      )}
    </NavLink>
  )
}
