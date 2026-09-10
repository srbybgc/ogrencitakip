import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const refFor = (uid) => doc(db, 'users', uid, 'profile', 'main')

export async function loadProfile(uid) {
  if (!uid) return {}
  const snap = await getDoc(refFor(uid))
  return snap.exists() ? snap.data() : {}
}

export async function saveProfile(uid, profile) {
  if (!uid) throw new Error('Kullanıcı bulunamadı.')
  const next = {
    displayName: String(profile.displayName || '').trim(),
    title: String(profile.title || '').trim(),
    school: String(profile.school || '').trim(),
    phone: String(profile.phone || '').trim(),
    updatedAt: new Date().toISOString(),
  }
  await setDoc(refFor(uid), next, { merge: true })
  return next
}
