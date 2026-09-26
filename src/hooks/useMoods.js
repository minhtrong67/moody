import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { MOODS } from '../lib/moodConfig'

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

// Cho phép người dùng đổi emoji + tên hiển thị của 5 mức mood cố định.
// `key`, `score`, `color` không đổi được — chúng quyết định logic thống kê/biểu đồ.
export function useMoods() {
  const { user } = useAuth()
  const [overrides, setOverrides] = useState(loadLocalOverrides())

  useEffect(() => {
    if (!user) {
      setOverrides(loadLocalOverrides())
      return
    }
    const ref = doc(db, 'users', user.uid, 'meta', 'moods')
    const unsub = onSnapshot(
      ref,
      (snap) => setOverrides(snap.exists() ? snap.data().overrides || {} : {}),
      () => setOverrides(loadLocalOverrides())
    )
    return unsub
  }, [user])

  const moods = useMemo(
    () => MOODS.map((m) => ({ ...m, ...(overrides[m.key] || {}) })),
    [overrides]
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

  return { moods, moodByKey, updateMood, resetMood, hasOverride: (key) => !!overrides[key] }
}
