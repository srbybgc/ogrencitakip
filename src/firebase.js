import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAsEhRXzLlGgOzMfvzwOMtqLGxU9uxv_AM',
  authDomain: 'ogrenci-b647e.firebaseapp.com',
  projectId: 'ogrenci-b647e',
  storageBucket: 'ogrenci-b647e.firebasestorage.app',
  messagingSenderId: '866993390820',
  appId: '1:866993390820:web:b78e6be210eab9e68258f1',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
