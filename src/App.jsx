import { HashRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { MoodEntriesProvider } from './context/MoodEntriesContext'
import { ActivitiesProvider } from './context/ActivitiesContext'
import { MoodsProvider } from './context/MoodsContext'
import { useNotificationScheduler } from './hooks/useNotificationScheduler'
import AppShell from './components/AppShell'
import Login from './components/Login'
import PageSkeleton from './components/PageSkeleton'

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

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper">
      <span className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
        <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
      </span>
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
      </div>
    </div>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  const [guest, setGuest] = useState(false)
  useNotificationScheduler()

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
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/manage/activities" element={<ManageActivities />} />
          <Route path="/manage/moods" element={<ManageMoods />} />
        </Route>
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/checkin/:id" element={<CheckIn />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
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
  )
}
