import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, HistoryIcon, BarChart3, Settings, ListPlus, Smile } from './icons'

const MAIN_LINKS = [
  { to: '/', label: 'Hôm nay', icon: Home, end: true },
  { to: '/history', label: 'Lịch sử', icon: HistoryIcon },
  { to: '/stats', label: 'Thống kê', icon: BarChart3 },
  { to: '/settings', label: 'Cài đặt', icon: Settings }
]

const MANAGE_LINKS = [
  { to: '/manage/activities', label: 'Quản lý hoạt động', icon: ListPlus },
  { to: '/manage/moods', label: 'Quản lý tâm trạng', icon: Smile }
]

// Modal navigation drawer của Material Design 3.
export default function Sidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 scrim z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed top-0 left-0 z-50 h-full w-[22.5rem] max-w-[85vw] bg-surface-container-low rounded-r-m3-xl flex flex-col transition-transform duration-300 ease-emphasized ${
          open ? 'translate-x-0 shadow-elev-3' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="flex items-center gap-3 px-7 h-[4.5rem]">
          <img src="/icons/icon-192.png" alt="Moody" className="w-10 h-10 rounded-m3-md" />
          <span className="t-title-large">Moody</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {MAIN_LINKS.map((l) => (
            <SidebarLink key={l.to} {...l} onClick={onClose} />
          ))}

          <div className="h-px bg-outline-variant mx-4 my-3" />
          <p className="t-title-small text-on-surface-variant px-4 h-12 flex items-center">Quản lý</p>
          {MANAGE_LINKS.map((l) => (
            <SidebarLink key={l.to} {...l} onClick={onClose} />
          ))}
        </nav>

        <div className="px-7 py-4 t-label-medium text-on-surface-variant">
          Moody — theo dõi tâm trạng mỗi ngày
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ to, label, icon: Icon, end, onClick }) {
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
