import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc
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

  return (
    <MoodEntriesContext.Provider value={{ entries, loading, addEntry, updateEntry, deleteEntry }}>
      {children}
    </MoodEntriesContext.Provider>
  )
}

export function useMoodEntries() {
  return useContext(MoodEntriesContext)
}
