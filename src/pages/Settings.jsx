import { useState } from 'react'
import {
  Sun, Moon, Monitor, Smartphone, Bell, LineChart, CalendarRange,
  Download, Trash2, LogOut, Heart, Send, Loader2
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { todayISO } from '../lib/dateUtils'
import { useAuth } from '../context/AuthContext'
import { useMoodEntries } from '../hooks/useMoodEntries'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { getStoredTheme, getStoredFontScale, setTheme, setFontScale } from '../lib/theme'
import { getNotificationSettings, setNotificationSetting, requestNotificationPermission, sendTestNotification } from '../lib/notifications'

const THEMES = [
  { key: 'light', label: 'Sáng', icon: Sun },
  { key: 'dark', label: 'Tối', icon: Moon },
  { key: 'system', label: 'Hệ thống', icon: Monitor }
]

const FONT_SIZES = [
  { key: '0.9', label: 'Nhỏ', size: '13px' },
  { key: '1', label: 'Vừa', size: '15px' },
  { key: '1.15', label: 'Lớn', size: '18px' }
]

export default function Settings() {
  const { user, logout } = useAuth()
  const { entries, deleteEntry } = useMoodEntries()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const [theme, setThemeState] = useState(getStoredTheme())
  const [fontScale, setFontScaleState] = useState(getStoredFontScale())
  const [notif, setNotif] = useState(getNotificationSettings())
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const [confirmClear, setConfirmClear] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [testSent, setTestSent] = useState(false)

  function handleTheme(value) {
    setThemeState(value)
    setTheme(value)
  }

  function handleFontScale(value) {
    setFontScaleState(value)
    setFontScale(value)
  }

  async function ensurePermission() {
    if (permission === 'granted') return true
    const result = await requestNotificationPermission()
    setPermission(result)
    return result === 'granted'
  }

  async function toggleNotif(key, storageKey) {
    const next = !notif[key]
    if (next) {
      const granted = await ensurePermission()
      if (!granted) return
    }
    setNotificationSetting(storageKey, next ? '1' : '0')
    setNotif((s) => ({ ...s, [key]: next }))
  }

  async function handleTestNotification() {
    setTestSending(true)
    setTestSent(false)
    const granted = await ensurePermission()
    if (granted) {
      await sendTestNotification()
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    }
    setTestSending(false)
  }

  function handleDailyTime(value) {
    setNotificationSetting('dailyTime', value)
    setNotif((s) => ({ ...s, dailyTime: value }))
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moody-data-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function clearAll() {
    await Promise.all(entries.map((e) => deleteEntry(e.id)))
    setConfirmClear(false)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto page-enter">
      <ConfirmDialog
        open={confirmClear}
        title="Xóa toàn bộ dữ liệu?"
        description={`${entries.length} bản ghi sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tất cả"
        danger
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
      <h1 className="font-display text-2xl mb-6">Cài đặt</h1>

      {user && (
        <div className="flex items-center gap-3 mb-6 border border-line rounded-card p-4 bg-surface">
          <img src={user.photoURL} alt="" className="w-11 h-11 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.displayName}</p>
            <p className="text-xs text-inkmuted truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-mood-angry bg-mood-angry/10 rounded-full px-3 py-2 shrink-0">
            <LogOut size={14} strokeWidth={2} /> Đăng xuất
          </button>
        </div>
      )}

      {canInstall && !installed && (
        <div className="mb-8 border border-line rounded-card p-4 flex items-center gap-4 bg-accent/5">
          <span className="w-12 h-12 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Smartphone size={22} />
          </span>
          <div className="flex-1">
            <p className="font-medium">Cài đặt ứng dụng</p>
            <p className="text-xs text-inkmuted">Thêm vào màn hình chính để dùng như app, mở nhanh hơn.</p>
          </div>
          <button onClick={promptInstall} className="bg-primary text-oncolor text-sm px-4 py-2 rounded-full shrink-0">
            Cài đặt
          </button>
        </div>
      )}

      <SettingGroup title="Giao diện">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTheme(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border text-sm transition-colors ${
                theme === t.key ? 'border-primary bg-primary text-oncolor' : 'border-line bg-line/25'
              }`}
            >
              <t.icon size={15} strokeWidth={2} />{t.label}
            </button>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Cỡ chữ">
        <div className="flex gap-2">
          {FONT_SIZES.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFontScale(f.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border transition-colors ${
                fontScale === f.key ? 'border-primary bg-primary text-oncolor' : 'border-line bg-line/25'
              }`}
            >
              <span className="font-semibold" style={{ fontSize: f.size }}>A</span>
              <span className="text-[11px]">{f.label}</span>
            </button>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Thông báo">
        <div className="space-y-3">
          <ToggleRow
            icon={Bell}
            label="Nhắc check-in hằng ngày"
            active={notif.dailyEnabled}
            onToggle={() => toggleNotif('dailyEnabled', 'dailyEnabled')}
          >
            {notif.dailyEnabled && (
              <input
                type="time"
                value={notif.dailyTime}
                onChange={(e) => handleDailyTime(e.target.value)}
                className="mt-2 border border-line rounded-full px-3 py-1.5 text-sm bg-surface"
              />
            )}
          </ToggleRow>

          <ToggleRow
            icon={LineChart}
            label="Báo cáo hàng tuần (Thứ 2)"
            active={notif.weeklyEnabled}
            onToggle={() => toggleNotif('weeklyEnabled', 'weeklyEnabled')}
          />

          <ToggleRow
            icon={CalendarRange}
            label="Báo cáo hàng tháng"
            active={notif.monthlyEnabled}
            onToggle={() => toggleNotif('monthlyEnabled', 'monthlyEnabled')}
          />
        </div>

        {permission === 'denied' && (
          <p className="text-xs text-mood-angry mt-3">
            Thông báo đang bị chặn ở trình duyệt. Vào cài đặt trình duyệt để cho phép thông báo cho trang này.
          </p>
        )}

        <button
          onClick={handleTestNotification}
          disabled={testSending}
          className="w-full flex items-center justify-center gap-2 mt-3 bg-line/30 text-ink rounded-full py-2.5 text-sm font-medium disabled:opacity-60 active:scale-95 transition-transform"
        >
          {testSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2} />}
          {testSending ? 'Đang gửi…' : testSent ? 'Đã gửi — kiểm tra thông báo trên máy' : 'Gửi thử thông báo ngay'}
        </button>

        <p className="text-xs text-inkmuted mt-3">
          Thông báo hoạt động khi Moody đang mở trong trình duyệt/PWA (kể cả chạy nền một lúc). Để nhắc nhở kể cả khi đã tắt hẳn app cần thêm máy chủ đẩy thông báo (push server).
        </p>
      </SettingGroup>

      <SettingGroup title="Dữ liệu">
        <div className="space-y-2">
          <button onClick={exportData} className="w-full flex items-center gap-3 text-left px-4 py-3 border border-line rounded-card bg-line/25">
            <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Download size={15} strokeWidth={2} />
            </span>
            Xuất dữ liệu (.json)
          </button>
          <p className="text-xs text-inkmuted px-1">Import: chọn file .json đã xuất trước đó để khôi phục (sẽ bổ sung ở bản sau).</p>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={entries.length === 0}
            className="w-full flex items-center gap-3 text-left px-4 py-3 border border-mood-angry text-mood-angry rounded-card bg-mood-angry/10 active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            <span className="w-8 h-8 rounded-full bg-mood-angry/15 flex items-center justify-center shrink-0">
              <Trash2 size={15} strokeWidth={2} />
            </span>
            Xóa toàn bộ dữ liệu
          </button>
        </div>
      </SettingGroup>

      <div className="border border-line rounded-card p-4 flex items-center gap-3 bg-line/15">
        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Heart size={16} strokeWidth={2} />
        </span>
        <div className="text-xs text-inkmuted leading-relaxed">
          <p className="text-sm text-ink font-medium mb-0.5">Moody</p>
          <p>Được phát triển bởi <span className="font-medium text-ink">minhtrong67</span>, với sự hỗ trợ của Claude.</p>
        </div>
      </div>
    </div>
  )
}

function SettingGroup({ title, children }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium mb-3">{title}</p>
      {children}
    </div>
  )
}

function ToggleRow({ icon: Icon, label, active, onToggle, children }) {
  return (
    <div className="border border-line rounded-card p-3.5 bg-line/25">
      <button onClick={onToggle} className="w-full flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Icon size={16} strokeWidth={2} />
        </span>
        <span className="flex-1 text-left text-sm">{label}</span>
        <span
          className="w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors"
          style={{ background: active ? 'rgb(var(--c-accent))' : 'rgb(var(--c-line))' }}
        >
          <span
            className="w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: active ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </span>
      </button>
      {children}
    </div>
  )
}
