import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useNotificationScheduler } from './hooks/useNotificationScheduler'
import AppShell from './components/AppShell'
import Login from './components/Login'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import History from './pages/History'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import ManageActivities from './pages/ManageActivities'
import ManageMoods from './pages/ManageMoods'
import { useEffect, useState } from 'react'

function Gate() {
  const { user, loading } = useAuth()
  const [guest, setGuest] = useState(false)
  useNotificationScheduler()

  useEffect(() => {
    const onGuest = () => setGuest(true)
    window.addEventListener('guest-mode', onGuest)
    return () => window.removeEventListener('guest-mode', onGuest)
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-inkmuted">Đang tải…</div>
  }

  if (!user && !guest) return <Login />

  return (
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
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Gate />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
