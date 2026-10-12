import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home, HomeFilled, HistoryIcon, HistoryFilled, BarChart3, BarChartFilled, Settings, Plus, ArrowUp,
  Menu, Sun, Moon, Monitor
} from './icons'
import { MdSettings } from 'react-icons/md'
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
    <button onClick={cycle} aria-label={label} title={label} className="icon-btn state text-on-surface-variant">
      <Icon key={theme} size={24} className="pop-in" />
    </button>
  )
}

// Navigation bar: tối đa 5 đích đến; icon đặc khi đang chọn.
const TABS = [
  { to: '/', label: 'Hôm nay', icon: Home, activeIcon: HomeFilled, end: true },
  { to: '/history', label: 'Lịch sử', icon: HistoryIcon, activeIcon: HistoryFilled },
  { to: '/stats', label: 'Thống kê', icon: BarChart3, activeIcon: BarChartFilled },
  { to: '/settings', label: 'Cài đặt', icon: Settings, activeIcon: MdSettings }
]

export default function AppShell() {
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    function onScroll() {
      setShowScrollTop(el.scrollTop > 400)
      setScrolled(el.scrollTop > 2)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface" style={{ paddingTop: 'var(--safe-top)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top app bar (small) — đổi sang surface-container + elevation khi nội dung cuộn dưới nó */}
      <header
        className={`sticky top-0 z-10 flex items-center h-16 gap-1 px-1 transition-[background-color,box-shadow] duration-200 ${
          scrolled ? 'bg-surface-container shadow-elev-2' : 'bg-surface'
        }`}
        style={{ top: 'var(--safe-top)' }}
      >
        <button onClick={() => setSidebarOpen(true)} aria-label="Mở menu" className="icon-btn state text-on-surface">
          <Menu size={24} />
        </button>
        <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-m3-sm ml-1" />
        <span className="t-title-large flex-1 ml-2">Moody</span>
        <ThemeToggle />
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto relative" style={{ paddingBottom: 'calc(var(--safe-bottom) + 6rem)' }}>
        <Outlet />
      </main>

      {/* FAB nhỏ: lên đầu trang, xếp ngay trên FAB chính */}
      <button
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
        className={`state fixed right-4 z-20 w-10 h-10 rounded-m3-md bg-surface-container-high text-primary shadow-elev-3 flex items-center justify-center transition-all duration-200 ${
          showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        style={{ bottom: 'calc(var(--safe-bottom) + 10.5rem)' }}
      >
        <ArrowUp size={24} />
      </button>

      {/* FAB chính (container primary-container, bo 16dp) */}
      <button
        onClick={() => navigate('/checkin')}
        aria-label="Check-in mới"
        className="state fixed right-4 z-30 w-14 h-14 rounded-m3-lg bg-primary-container text-on-primary-container shadow-elev-3 hover:shadow-elev-4 flex items-center justify-center transition-shadow"
        style={{ bottom: 'calc(var(--safe-bottom) + 6rem)' }}
      >
        <Plus size={24} />
      </button>

      {/* Navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 bg-surface-container grid grid-cols-4"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {TABS.map((tab) => (
          <NavTab key={tab.to} {...tab} />
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
              className={`state relative flex items-center justify-center h-8 rounded-full transition-all duration-300 ease-emphasized ${
                isActive
                  ? 'w-16 bg-secondary-container text-on-secondary-container'
                  : 'w-16 bg-transparent text-on-surface-variant group-hover:bg-on-surface/[0.08]'
              }`}
            >
              <I size={24} />
            </span>
            <span className={`t-label-medium ${isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
              {label}
            </span>
          </>
        )
      }}
    </NavLink>
  )
}
