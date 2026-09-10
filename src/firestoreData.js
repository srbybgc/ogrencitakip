import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

const COLLECTIONS = ['classes', 'groups', 'schedule', 'documents']

const userCollection = (uid, name) => collection(db, 'users', uid, name)

export async function loadUserData(uid) {
  const entries = await Promise.all(
    COLLECTIONS.map(async (name) => {
      const snapshot = await getDocs(userCollection(uid, name))
      return [name, snapshot.docs.map(item => ({ id: item.id, ...item.data() }))]
    }),
  )
  return Object.fromEntries(entries)
}

export async function saveUserCollection(uid, name, items) {
  if (!uid || !COLLECTIONS.includes(name)) throw new Error(`Geçersiz Firestore koleksiyonu: ${name}`)

  const target = userCollection(uid, name)
  const existing = await getDocs(target)
  const nextIds = new Set(items.map(item => item.id))
  const batch = writeBatch(db)

  existing.docs.forEach(item => {
    if (!nextIds.has(item.id)) batch.delete(item.ref)
  })

  items.forEach(item => {
    if (!item?.id) return
    batch.set(doc(target, item.id), item)
  })

  await batch.commit()
}

export async function clearUserData(uid) {
  for (const name of COLLECTIONS) {
    const snapshot = await getDocs(userCollection(uid, name))
    if (snapshot.empty) continue
    const batch = writeBatch(db)
    snapshot.docs.forEach(item => batch.delete(item.ref))
    await batch.commit()
  }
}

export { COLLECTIONS }
