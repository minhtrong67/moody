import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { MOODS } from '../lib/moodConfig'
import { useI18n } from '../i18n'

const LOCAL_KEY = 'mood-tracker-mood-overrides'

function loadLocalOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveLocalOverrides(overrides) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(overrides))
}

const MoodsContext = createContext(null)

// Cho phép người dùng đổi emoji + tên hiển thị của 5 mức mood cố định.
// `key`, `score`, `color` không đổi được. Nạp một lần ở gốc app.
export function MoodsProvider({ children }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [overrides, setOverrides] = useState(() => (user ? {} : loadLocalOverrides()))
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (!user) {
      setOverrides(loadLocalOverrides())
      setLoading(false)
      return
    }
    setLoading(true)
    const ref = doc(db, 'users', user.uid, 'meta', 'moods')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setOverrides(snap.exists() ? snap.data().overrides || {} : {})
        setLoading(false)
      },
      () => {
        setOverrides(loadLocalOverrides())
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  // Nhãn mặc định theo ngôn ngữ; nếu người dùng đã tự đổi tên thì giữ tên của họ.
  const moods = useMemo(
    () => MOODS.map((m) => ({ ...m, label: t(`mood.${m.key}`), ...(overrides[m.key] || {}) })),
    [overrides, t]
  )

  const updateMood = useCallback(
    async (key, patch) => {
      const next = { ...overrides, [key]: { ...(overrides[key] || {}), ...patch } }
      if (!user) {
        saveLocalOverrides(next)
        setOverrides(next)
        return
      }
      await setDoc(doc(db, 'users', user.uid, 'meta', 'moods'), { overrides: next })
    },
    [overrides, user]
  )

  const resetMood = useCallback(
    async (key) => {
      const next = { ...overrides }
      delete next[key]
      if (!user) {
        saveLocalOverrides(next)
        setOverrides(next)
        return
      }
      await setDoc(doc(db, 'users', user.uid, 'meta', 'moods'), { overrides: next })
    },
    [overrides, user]
  )

  const moodByKey = useCallback((key) => moods.find((m) => m.key === key), [moods])
  const hasOverride = useCallback((key) => !!overrides[key], [overrides])

  const value = useMemo(
    () => ({ moods, loading, moodByKey, updateMood, resetMood, hasOverride }),
    [moods, loading, moodByKey, updateMood, resetMood, hasOverride]
  )

  return <MoodsContext.Provider value={value}>{children}</MoodsContext.Provider>
}

export function useMoods() {
  return useContext(MoodsContext)
}
