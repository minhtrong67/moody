import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { DEFAULT_ACTIVITIES } from '../lib/moodConfig'
import { useI18n } from '../i18n'

const LOCAL_KEY = 'mood-tracker-activities-state'
const EMPTY_STATE = { items: [], order: [], overrides: {}, hidden: [] }

function loadLocalState() {
  try {
    return { ...EMPTY_STATE, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') }
  } catch {
    return EMPTY_STATE
  }
}

function saveLocalState(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
}

function applyOrder(list, order) {
  if (!order || order.length === 0) return list
  const byId = Object.fromEntries(list.map((a) => [a.id, a]))
  const ordered = order.map((id) => byId[id]).filter(Boolean)
  const remaining = list.filter((a) => !order.includes(a.id))
  return [...ordered, ...remaining]
}

const ActivitiesContext = createContext(null)

// Danh sách hoạt động = (mặc định, đã áp override + trừ hidden) + tùy chỉnh, sắp xếp theo `order`.
// Nạp một lần ở gốc app để chuyển trang không phải tải lại.
export function ActivitiesProvider({ children }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [state, setState] = useState(() => (user ? EMPTY_STATE : loadLocalState()))
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (!user) {
      setState(loadLocalState())
      setLoading(false)
      return
    }
    setLoading(true)
    const ref = doc(db, 'users', user.uid, 'meta', 'activities')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setState(snap.exists() ? { ...EMPTY_STATE, ...snap.data() } : EMPTY_STATE)
        setLoading(false)
      },
      () => {
        setState(loadLocalState())
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  const merged = useMemo(() => {
    const defaults = DEFAULT_ACTIVITIES
      .filter((a) => !state.hidden.includes(a.id))
      .map((a) => ({ ...a, label: t(`activity.${a.id}`), ...(state.overrides[a.id] || {}) }))
    return [...defaults, ...state.items]
  }, [state, t])

  const activities = useMemo(() => applyOrder(merged, state.order), [merged, state.order])

  const persist = useCallback(
    async (patch) => {
      const next = { ...state, ...patch }
      setState(next)
      if (!user) {
        saveLocalState(next)
        return
      }
      await setDoc(doc(db, 'users', user.uid, 'meta', 'activities'), next)
    },
    [state, user]
  )

  const addActivity = useCallback(
    async (activity) => {
      const item = { id: crypto.randomUUID(), custom: true, ...activity }
      await persist({ items: [...state.items, item] })
    },
    [state, persist]
  )

  const updateActivity = useCallback(
    async (id, patch) => {
      const isDefault = DEFAULT_ACTIVITIES.some((a) => a.id === id)
      if (isDefault) {
        await persist({ overrides: { ...state.overrides, [id]: { ...(state.overrides[id] || {}), ...patch } } })
      } else {
        await persist({ items: state.items.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
      }
    },
    [state, persist]
  )

  const removeActivity = useCallback(
    async (id) => {
      const isDefault = DEFAULT_ACTIVITIES.some((a) => a.id === id)
      const nextOrder = state.order.filter((oid) => oid !== id)
      if (isDefault) {
        await persist({ hidden: [...state.hidden, id], order: nextOrder })
      } else {
        await persist({ items: state.items.filter((a) => a.id !== id), order: nextOrder })
      }
    },
    [state, persist]
  )

  const reorderActivities = useCallback(
    async (idsInOrder) => {
      await persist({ order: idsInOrder })
    },
    [persist]
  )

  const value = useMemo(
    () => ({ activities, loading, addActivity, removeActivity, updateActivity, reorderActivities }),
    [activities, loading, addActivity, removeActivity, updateActivity, reorderActivities]
  )

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities() {
  return useContext(ActivitiesContext)
}
