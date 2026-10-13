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

  // Nhập hàng loạt (gộp, không xóa gì): hoạt động mặc định → ghi đè emoji/tên và hiện lại nếu đang ẩn;
  // hoạt động tùy chỉnh → cập nhật theo id hoặc thêm mới. Thứ tự các dòng trong file được giữ làm thứ tự hiển thị.
  // items: [{ id|null, isDefault, emoji, label }]. Trả về { added, updated }.
  const importActivities = useCallback(
    async (items) => {
      const overrides = { ...state.overrides }
      const custom = [...state.items]
      let hidden = [...state.hidden]
      const order = []
      let added = 0
      let updated = 0
      for (const it of items) {
        if (it.isDefault) {
          overrides[it.id] = { ...(overrides[it.id] || {}), emoji: it.emoji, label: it.label }
          hidden = hidden.filter((h) => h !== it.id)
          order.push(it.id)
          updated++
          continue
        }
        const idx = it.id ? custom.findIndex((a) => a.id === it.id) : -1
        if (idx >= 0) {
          custom[idx] = { ...custom[idx], emoji: it.emoji, label: it.label }
          order.push(it.id)
          updated++
        } else {
          const id = it.id || crypto.randomUUID()
          custom.push({ id, custom: true, emoji: it.emoji, label: it.label })
          order.push(id)
          added++
        }
      }
      const rest = state.order.filter((id) => !order.includes(id))
      await persist({ overrides, items: custom, hidden, order: [...order, ...rest] })
      return { added, updated }
    },
    [state, persist]
  )

  const value = useMemo(
    () => ({ activities, loading, addActivity, removeActivity, updateActivity, reorderActivities, importActivities }),
    [activities, loading, addActivity, removeActivity, updateActivity, reorderActivities, importActivities]
  )

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities() {
  return useContext(ActivitiesContext)
}
