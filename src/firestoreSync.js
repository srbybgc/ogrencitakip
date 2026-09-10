import { loadUserData, saveUserCollection } from './firestoreData'

const KEY_TO_COLLECTION = {
  'ot-classes': 'classes',
  'ot-groups': 'groups',
  'ot-schedule': 'schedule',
  'ot-documents': 'documents',
  'ot-student-records': 'studentRecords',
}

const EMPTY = {
  classes: [],
  groups: [],
  schedule: [],
  documents: [],
  studentRecords: [],
}

const readLocal = () => Object.fromEntries(
  Object.entries(KEY_TO_COLLECTION).map(([key, name]) => {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || '[]')
      return [name, Array.isArray(value) ? value : []]
    } catch {
      return [name, []]
    }
  }),
)

const writeLocal = (data, setItem) => {
  Object.entries(KEY_TO_COLLECTION).forEach(([key, name]) => {
    setItem(key, JSON.stringify(Array.isArray(data?.[name]) ? data[name] : EMPTY[name]))
  })
}

export async function startFirestoreSync(uid) {
  if (!uid || typeof window === 'undefined') return () => {}

  const originalSetItem = window.localStorage.setItem.bind(window.localStorage)
  const originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage)
  let stopped = false

  try {
    const remote = await loadUserData(uid)
    const remoteHasData = Object.values(remote).some(items => Array.isArray(items) && items.length > 0)

    if (remoteHasData) {
      writeLocal(remote, originalSetItem)
    } else {
      const local = readLocal()
      await Promise.all(
        Object.entries(local).map(([name, items]) => saveUserCollection(uid, name, items)),
      )
    }
  } catch (error) {
    console.error('Firestore ilk veri senkronizasyonu başarısız:', error)
    throw error
  }

  window.localStorage.setItem = (key, value) => {
    originalSetItem(key, value)
    const name = KEY_TO_COLLECTION[key]
    if (!name || stopped) return
    try {
      const items = JSON.parse(value)
      if (Array.isArray(items)) saveUserCollection(uid, name, items).catch(console.error)
    } catch (error) {
      console.error('Firestore senkronizasyonu başarısız:', error)
    }
  }

  window.localStorage.removeItem = (key) => {
    originalRemoveItem(key)
    const name = KEY_TO_COLLECTION[key]
    if (!name || stopped) return
    saveUserCollection(uid, name, []).catch(console.error)
  }

  return () => {
    stopped = true
    window.localStorage.setItem = originalSetItem
    window.localStorage.removeItem = originalRemoveItem
  }
}
