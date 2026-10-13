import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { I18nProvider } from './i18n'
import { ToastProvider } from './context/ToastContext'
import { MoodEntriesProvider } from './context/MoodEntriesContext'
import { ActivitiesProvider } from './context/ActivitiesContext'
import { MoodsProvider } from './context/MoodsContext'
import AppShell from './components/AppShell'
import Login from './components/Login'
import PageSkeleton from './components/PageSkeleton'
import { getStartPage } from './lib/startPage'

const loaders = {
  Dashboard: () => import('./pages/Dashboard'),
  CheckIn: () => import('./pages/CheckIn'),
  History: () => import('./pages/History'),
  Statistics: () => import('./pages/Statistics'),
  Settings: () => import('./pages/Settings'),
  ManageActivities: () => import('./pages/ManageActivities'),
  ManageMoods: () => import('./pages/ManageMoods')
}

const Dashboard = lazy(loaders.Dashboard)
const CheckIn = lazy(loaders.CheckIn)
const History = lazy(loaders.History)
const Statistics = lazy(loaders.Statistics)
const Settings = lazy(loaders.Settings)
const ManageActivities = lazy(loaders.ManageActivities)
const ManageMoods = lazy(loaders.ManageMoods)

// Tải sẵn các trang khi trình duyệt rảnh để chuyển trang gần như tức thì.
function prefetchPages() {
  const run = () => Object.values(loaders).forEach((load) => load())
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1500)
}

// Giữ giống hệt màn hình khởi động tĩnh trong index.html để chuyển tiếp liền mạch (không nháy).
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-[18px] bg-surface">
      <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-m3-lg animate-pulse" />
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  )
}

// Mỗi route có Suspense riêng: khi trang đang tải chỉ vùng nội dung hiện skeleton,
// header + bottom bar (AppShell) vẫn giữ nguyên.
function page(Component, variant) {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <Component />
    </Suspense>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  const [guest, setGuest] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const startHandled = useRef(false)
  const ready = !loading && (!!user || guest)

  // Mở app → chuyển tới trang mặc định người dùng đã chọn (chỉ một lần mỗi lần mở app,
  // và chỉ khi đang ở trang chủ để không đè lên liên kết sâu).
  useLayoutEffect(() => {
    if (!ready || startHandled.current) return
    startHandled.current = true
    const target = getStartPage()
    if (target !== '/' && location.pathname === '/') navigate(target, { replace: true })
  }, [ready, location.pathname, navigate])

  useEffect(() => {
    if (user || guest) prefetchPages()
  }, [user, guest])

  useEffect(() => {
    const onGuest = () => setGuest(true)
    window.addEventListener('guest-mode', onGuest)
    return () => window.removeEventListener('guest-mode', onGuest)
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user && !guest) return <Login />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={page(Dashboard, 'dashboard')} />
        <Route path="/history" element={page(History, 'history')} />
        <Route path="/stats" element={page(Statistics, 'stats')} />
        <Route path="/settings" element={page(Settings, 'settings')} />
        <Route path="/manage/activities" element={page(ManageActivities, 'manage')} />
        <Route path="/manage/moods" element={page(ManageMoods, 'manage')} />
      </Route>
      <Route path="/checkin" element={page(CheckIn, 'form')} />
      <Route path="/checkin/:id" element={page(CheckIn, 'form')} />
    </Routes>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MoodEntriesProvider>
          <ActivitiesProvider>
            <MoodsProvider>
              <ToastProvider>
                <HashRouter>
                  <Gate />
                </HashRouter>
              </ToastProvider>
            </MoodsProvider>
          </ActivitiesProvider>
        </MoodEntriesProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
