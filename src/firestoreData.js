import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

const COLLECTIONS = ['classes', 'groups', 'schedule', 'documents']
const BATCH_LIMIT = 450

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

async function commitInChunks(operations) {
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    operations.slice(i, i + BATCH_LIMIT).forEach(operation => operation(batch))
    await batch.commit()
  }
}

export async function saveUserCollection(uid, name, items) {
  if (!uid || !COLLECTIONS.includes(name)) throw new Error(`Geçersiz Firestore koleksiyonu: ${name}`)

  const target = userCollection(uid, name)
  const existing = await getDocs(target)
  const nextIds = new Set(items.map(item => item.id))
  const operations = []

  existing.docs.forEach(item => {
    if (!nextIds.has(item.id)) operations.push(batch => batch.delete(item.ref))
  })

  items.forEach(item => {
    if (!item?.id) return
    operations.push(batch => batch.set(doc(target, item.id), item))
  })

  await commitInChunks(operations)
}

export async function clearUserData(uid) {
  for (const name of COLLECTIONS) {
    const snapshot = await getDocs(userCollection(uid, name))
    if (snapshot.empty) continue
    await commitInChunks(snapshot.docs.map(item => batch => batch.delete(item.ref)))
  }
}

export { COLLECTIONS }
