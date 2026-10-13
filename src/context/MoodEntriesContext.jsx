import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const LOCAL_KEY = 'mood-tracker-entries-guest'

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocal(entries) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries))
}

const MoodEntriesContext = createContext(null)

// Nạp dữ liệu MỘT LẦN ở gốc app (không phải mỗi khi vào trang), nên chuyển
// trang không bị load lại / giật.
export function MoodEntriesProvider({ children }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState(() => (user ? [] : loadLocal()))
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (!user) {
      setEntries(loadLocal())
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(collection(db, 'users', user.uid, 'entries'), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => {
        setEntries(loadLocal())
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  const addEntry = useCallback(
    async (entry) => {
      if (!user) {
        const next = [{ id: crypto.randomUUID(), ...entry }, ...loadLocal()]
        saveLocal(next)
        setEntries(next)
        return
      }
      await addDoc(collection(db, 'users', user.uid, 'entries'), entry)
    },
    [user]
  )

  const updateEntry = useCallback(
    async (id, patch) => {
      if (!user) {
        const next = loadLocal().map((e) => (e.id === id ? { ...e, ...patch } : e))
        saveLocal(next)
        setEntries(next)
        return
      }
      await updateDoc(doc(db, 'users', user.uid, 'entries', id), patch)
    },
    [user]
  )

  const deleteEntry = useCallback(
    async (id) => {
      if (!user) {
        const next = loadLocal().filter((e) => e.id !== id)
        saveLocal(next)
        setEntries(next)
        return
      }
      await deleteDoc(doc(db, 'users', user.uid, 'entries', id))
    },
    [user]
  )

  // Nhập hàng loạt: ghi đè theo id; không có id thì trùng (date + time) sẽ cập nhật, còn lại thêm mới.
  // items: [{ id|null, entry }]. Trả về { added, updated }.
  const importEntries = useCallback(
    async (items) => {
      const current = user ? entries : loadLocal()
      const byId = new Map(current.map((e) => [e.id, e]))
      const byTime = new Map(current.map((e) => [`${e.date}|${e.time}`, e]))
      let added = 0
      let updated = 0
      const writes = new Map() // id → entry (bản ghi sau cùng thắng)
      for (const { id, entry } of items) {
        const match = (id && byId.get(id)) || byTime.get(`${entry.date}|${entry.time}`)
        const finalId = match?.id || id || crypto.randomUUID()
        if (!writes.has(finalId)) match ? updated++ : added++
        writes.set(finalId, entry)
      }
      if (!user) {
        const merged = current.map((e) => (writes.has(e.id) ? { ...e, ...writes.get(e.id) } : e))
        for (const [id, entry] of writes) if (!byId.has(id)) merged.unshift({ id, ...entry })
        saveLocal(merged)
        setEntries(merged)
        return { added, updated }
      }
      const list = [...writes]
      for (let i = 0; i < list.length; i += 400) {
        const batch = writeBatch(db)
        for (const [id, entry] of list.slice(i, i + 400)) {
          batch.set(doc(db, 'users', user.uid, 'entries', id), entry, { merge: true })
        }
        await batch.commit()
      }
      return { added, updated }
    },
    [user, entries]
  )

  const value = useMemo(
    () => ({ entries, loading, addEntry, updateEntry, deleteEntry, importEntries }),
    [entries, loading, addEntry, updateEntry, deleteEntry, importEntries]
  )

  return <MoodEntriesContext.Provider value={value}>{children}</MoodEntriesContext.Provider>
}

export function useMoodEntries() {
  return useContext(MoodEntriesContext)
}
