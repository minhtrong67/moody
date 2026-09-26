import { useCallback, useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_ACTIVITIES } from '../lib/moodConfig'

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

// Danh sách hoạt động = (mặc định, đã áp override + trừ hidden) + tùy chỉnh, sắp xếp theo `order`.
// Cả hoạt động mặc định lẫn tự tạo đều sửa/xóa/sắp xếp tự do được.
export function useActivities() {
  const { user } = useAuth()
  const [state, setState] = useState(loadLocalState())

  useEffect(() => {
    if (!user) {
      setState(loadLocalState())
      return
    }
    const ref = doc(db, 'users', user.uid, 'meta', 'activities')
    const unsub = onSnapshot(
      ref,
      (snap) => setState(snap.exists() ? { ...EMPTY_STATE, ...snap.data() } : EMPTY_STATE),
      () => setState(loadLocalState())
    )
    return unsub
  }, [user])

  const merged = useMemo(() => {
    const defaults = DEFAULT_ACTIVITIES
      .filter((a) => !state.hidden.includes(a.id))
      .map((a) => ({ ...a, ...(state.overrides[a.id] || {}) }))
    return [...defaults, ...state.items]
  }, [state])

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

  return { activities, addActivity, removeActivity, updateActivity, reorderActivities }
}
