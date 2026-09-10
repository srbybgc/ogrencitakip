import { loadUserData, saveUserCollection } from './firestoreData'

const KEY_TO_COLLECTION = {
  'ot-classes': 'classes',
  'ot-groups': 'groups',
  'ot-schedule': 'schedule',
  'ot-documents': 'documents',
}

const EMPTY = {
  classes: [],
  groups: [],
  schedule: [],
  documents: [],
}

export async function startFirestoreSync(uid) {
  if (!uid || typeof window === 'undefined') return () => {}

  const remote = await loadUserData(uid)
  const originalSetItem = window.localStorage.setItem.bind(window.localStorage)
  const originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage)

  const remoteHasData = Object.values(remote).some(items => items.length > 0)

  if (remoteHasData) {
    Object.entries(KEY_TO_COLLECTION).forEach(([key, name]) => {
      originalSetItem(key, JSON.stringify(remote[name] || EMPTY[name]))
    })
  } else {
    const local = {}
    Object.entries(KEY_TO_COLLECTION).forEach(([key, name]) => {
      try {
        local[name] = JSON.parse(window.localStorage.getItem(key) || '[]')
      } catch {
        local[name] = []
      }
    })
    await Promise.all(Object.entries(local).map(([name, items]) => saveUserCollection(uid, name, Array.isArray(items) ? items : [])))
  }

  let stopped = false
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
