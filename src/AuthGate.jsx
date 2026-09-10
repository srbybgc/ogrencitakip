import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { startFirestoreSync } from './firestoreSync'

const AuthContext = createContext(null)

export function useAuthUser() {
  return useContext(AuthContext)
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined)
  const [dataReady, setDataReady] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    let active = true
    let cleanup = () => {}
    setDataReady(false)
    setSyncError('')
    if (!user) return () => { active = false }

    startFirestoreSync(user.uid)
      .then(stop => {
        if (!active) stop()
        else {
          cleanup = stop
          setDataReady(true)
        }
      })
      .catch(err => {
        console.error('Firestore veri bağlantısı kurulamadı:', err)
        if (active) setSyncError('Veritabanına bağlanılamadı. Firebase ayarlarını ve internet bağlantınızı kontrol edip tekrar deneyin.')
      })

    return () => {
      active = false
      cleanup()
    }
  }, [user?.uid])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || password.length < 6) {
      setError('Geçerli bir e-posta ve en az 6 karakterli şifre girin.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email.trim(), password)
      else await createUserWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'E-posta veya şifre hatalı.',
        'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.',
        'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
        'auth/invalid-email': 'E-posta adresini kontrol edin.',
      }
      setError(messages[err.code] || 'İşlem sırasında bir hata oluştu. Tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  if (user === undefined) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-mark">Ö</div><h1>Öğrenci Takip</h1><p>Yükleniyor…</p></div></div>

  if (!user) return <main className="auth-screen"><section className="auth-card"><div className="brand-mark auth-mark">Ö</div><p className="eyebrow">Güvenli giriş</p><h1>Öğrenci Takip</h1><p className="muted">Sınıflarına ve öğrenci kayıtlarına erişmek için giriş yap.</p><form onSubmit={submit} className="auth-form"><label className="field"><span>E-posta</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@mail.com" /></label><label className="field"><span>Şifre</span><input type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="En az 6 karakter" /></label>{error && <div className="auth-error">{error}</div>}<button className="primary auth-submit" disabled={busy}>{busy ? 'Bekleyin…' : mode==='login' ? 'Giriş Yap' : 'Hesap Oluştur'}</button></form><button className="auth-switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode==='login' ? 'İlk kez kullanıyorum — hesap oluştur' : 'Zaten hesabım var — giriş yap'}</button></section></main>

  if (syncError) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-mark">Ö</div><p className="eyebrow">Bağlantı sorunu</p><h1>Veriler hazırlanamadı</h1><p className="muted">{syncError}</p><button className="primary auth-submit" onClick={()=>{setUser({...auth.currentUser})}}>Tekrar Dene</button><button className="auth-switch" onClick={()=>signOut(auth)}>Çıkış Yap</button></div></div>

  if (!dataReady) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark auth-mark">Ö</div><h1>Öğrenci Takip</h1><p>Verilerin hazırlanıyor…</p></div></div>

  return <AuthContext.Provider value={user}><div className="app-with-auth"><div className="user-bar"><span>{user.email}</span><button onClick={()=>signOut(auth)}>Çıkış</button></div>{children}</div></AuthContext.Provider>
}
