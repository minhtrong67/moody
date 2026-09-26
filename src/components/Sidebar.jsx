import { NavLink } from 'react-router-dom'
import { X, Home, ListChecks, BarChart3, Settings as SettingsIcon, ListPlus, Smile } from 'lucide-react'

const MAIN_LINKS = [
  { to: '/', label: 'Hôm nay', icon: Home, end: true },
  { to: '/history', label: 'Lịch sử', icon: ListChecks },
  { to: '/stats', label: 'Thống kê', icon: BarChart3 },
  { to: '/settings', label: 'Cài đặt', icon: SettingsIcon }
]

const MANAGE_LINKS = [
  { to: '/manage/activities', label: 'Quản lý hoạt động', icon: ListPlus },
  { to: '/manage/moods', label: 'Quản lý tâm trạng', icon: Smile }
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-surface border-r border-line flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary text-oncolor flex items-center justify-center font-display text-sm">M</span>
            <span className="font-display text-lg">Moody</span>
          </div>
          <button onClick={onClose} aria-label="Đóng menu" className="w-9 h-9 rounded-full bg-line/30 text-inkmuted flex items-center justify-center">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {MAIN_LINKS.map((l) => (
            <SidebarLink key={l.to} {...l} onClick={onClose} />
          ))}

          <p className="text-[11px] uppercase tracking-wide text-inkmuted px-3 mt-5 mb-2">Quản lý</p>
          {MANAGE_LINKS.map((l) => (
            <SidebarLink key={l.to} {...l} onClick={onClose} />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-line text-[11px] text-inkmuted">
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
        `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm mb-1 transition-colors ${
          isActive ? 'bg-accent/10 text-accent font-medium' : 'text-ink hover:bg-line/25'
        }`
      }
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </NavLink>
  )
}
