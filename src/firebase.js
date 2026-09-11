import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyA2euqIsoCHzAg3GXJu22wt7OQhJxwvOcY',
  authDomain: 'elifokul.firebaseapp.com',
  projectId: 'elifokul',
  storageBucket: 'elifokul.firebasestorage.app',
  messagingSenderId: '392930794143',
  appId: '1:392930794143:web:88c1d3c07b92ebd827e0aa',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
