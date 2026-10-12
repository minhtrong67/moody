import { useState } from 'react'
import {
  Sun, Moon, Monitor, Smartphone, Bell, LineChart, CalendarRange,
  Download, Trash2, LogOut, Heart, Send, Loader2
} from '../components/icons'
import ConfirmDialog from '../components/ConfirmDialog'
import Switch from '../components/Switch'
import SegmentedButton from '../components/SegmentedButton'
import TextField from '../components/TextField'
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
    <div className="px-4 pt-2 pb-4 max-w-lg mx-auto page-enter">
      <ConfirmDialog
        open={confirmClear}
        title="Xóa toàn bộ dữ liệu?"
        description={`${entries.length} bản ghi sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tất cả"
        danger
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
      <h1 className="t-headline-medium mb-6">Cài đặt</h1>

      {user && (
        <div className="flex items-center gap-4 mb-6 card-filled p-4">
          <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="t-title-medium truncate">{user.displayName}</p>
            <p className="t-body-medium text-on-surface-variant truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="btn btn-text-error state shrink-0">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      )}

      {canInstall && !installed && (
        <div className="mb-8 bg-primary-container text-on-primary-container rounded-m3-xl p-5 flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-surface/60 flex items-center justify-center shrink-0">
            <Smartphone size={24} />
          </span>
          <div className="flex-1">
            <p className="t-title-medium">Cài đặt ứng dụng</p>
            <p className="t-body-medium opacity-80">Thêm vào màn hình chính để dùng như app, mở nhanh hơn.</p>
          </div>
          <button onClick={promptInstall} className="btn btn-filled state shrink-0">
            Cài đặt
          </button>
        </div>
      )}

      <SettingGroup title="Giao diện">
        <SegmentedButton options={THEMES} value={theme} onChange={handleTheme} />
      </SettingGroup>

      <SettingGroup title="Cỡ chữ">
        <SegmentedButton options={FONT_SIZES} value={fontScale} onChange={handleFontScale} />
      </SettingGroup>

      <SettingGroup title="Thông báo">
        <div className="card-filled overflow-hidden">
          <ToggleRow
            icon={Bell}
            label="Nhắc check-in hằng ngày"
            active={notif.dailyEnabled}
            onToggle={() => toggleNotif('dailyEnabled', 'dailyEnabled')}
          >
            {notif.dailyEnabled && (
              <TextField
                label="Giờ nhắc"
                type="time"
                alwaysFloat
                fieldBg="var(--md-surface-container-highest)"
                value={notif.dailyTime}
                onChange={(e) => handleDailyTime(e.target.value)}
                className="mt-3 w-44"
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
          <p className="t-body-small text-error mt-3 px-1">
            Thông báo đang bị chặn ở trình duyệt. Vào cài đặt trình duyệt để cho phép thông báo cho trang này.
          </p>
        )}

        <button
          onClick={handleTestNotification}
          disabled={testSending}
          className="btn btn-tonal btn-block state mt-4"
        >
          {testSending ? <Loader2 size={18} /> : <Send size={18} />}
          {testSending ? 'Đang gửi…' : testSent ? 'Đã gửi — kiểm tra thông báo trên máy' : 'Gửi thử thông báo ngay'}
        </button>

        <p className="t-body-small text-on-surface-variant mt-3 px-1">
          Thông báo hoạt động khi Moody đang mở trong trình duyệt/PWA (kể cả chạy nền một lúc). Để nhắc nhở kể cả khi đã tắt hẳn app cần thêm máy chủ đẩy thông báo (push server).
        </p>
      </SettingGroup>

      <SettingGroup title="Dữ liệu">
        <div className="space-y-2">
          <button onClick={exportData} className="btn btn-outlined btn-block state justify-start">
            <Download size={18} />
            Xuất dữ liệu (.json)
          </button>
          <p className="t-body-small text-on-surface-variant px-1">Import: chọn file .json đã xuất trước đó để khôi phục (sẽ bổ sung ở bản sau).</p>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={entries.length === 0}
            className="btn btn-error-tonal btn-block state justify-start"
          >
            <Trash2 size={18} />
            Xóa toàn bộ dữ liệu
          </button>
        </div>
      </SettingGroup>

      <div className="card-outlined p-4 flex items-center gap-4">
        <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
          <Heart size={20} />
        </span>
        <div className="t-body-medium text-on-surface-variant">
          <p className="t-title-small text-on-surface mb-0.5">Moody</p>
          <p>Được phát triển bởi <span className="font-medium text-on-surface">minhtrong67</span>, với sự hỗ trợ của Claude.</p>
        </div>
      </div>
    </div>
  )
}

function SettingGroup({ title, children }) {
  return (
    <div className="mb-8">
      <p className="t-title-small text-primary mb-3 px-1">{title}</p>
      {children}
    </div>
  )
}

// List item của M3: icon dẫn đầu + nhãn + Switch phía cuối.
function ToggleRow({ icon: Icon, label, active, onToggle, children }) {
  return (
    <div className="px-4 py-3 border-b border-outline-variant/60 last:border-b-0">
      <div className="flex items-center gap-4 min-h-[40px]">
        <Icon size={24} className="text-on-surface-variant shrink-0" />
        <span className="flex-1 t-body-large">{label}</span>
        <Switch checked={active} onChange={onToggle} label={label} />
      </div>
      {children}
    </div>
  )
}
