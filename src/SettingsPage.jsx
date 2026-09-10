import { useEffect, useState } from 'react'
import { LogOut, Save, ShieldCheck, UserRound } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useAuthUser } from './AuthGate'
import { auth } from './firebase'
import { loadProfile, saveProfile } from './profileData'
import './reportsSettings.css'

export default function SettingsPage() {
  const user = useAuthUser()
  const [profile, setProfile] = useState({ displayName: '', title: '', school: '', phone: '' })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { let active=true; loadProfile(user?.uid).then(data=>{if(active)setProfile(p=>({...p,...data}))}).catch(()=>{}); return()=>{active=false} },[user?.uid])
  const save=async e=>{e.preventDefault();setBusy(true);setStatus('');try{const next=await saveProfile(user.uid,profile);localStorage.setItem('ot-profile',JSON.stringify(next));setProfile(next);setStatus('Profil bilgilerin kaydedildi.');window.dispatchEvent(new Event('ot-profile-changed'))}catch(e){setStatus(e.message||'Profil kaydedilemedi.')}finally{setBusy(false)}}
  return <main className="content settings-page"><div className="welcome"><div><p className="eyebrow">Kişiselleştirme</p><h1>Ayarlar</h1><p className="muted">Adını ve görev bilgilerini gir; uygulama sağ üstte bunları kullanır.</p></div></div><div className="settings-grid"><section className="card settings-card"><div className="settings-title"><span className="settings-icon"><UserRound size={21}/></span><div><h2>Profil Bilgileri</h2><p>Sağ üstte gösterilecek isim ve öğretmen bilgileri.</p></div></div><form onSubmit={save} className="settings-form"><label className="field"><span>Ad Soyad *</span><input required value={profile.displayName} onChange={e=>setProfile({...profile,displayName:e.target.value})} placeholder="Ad Soyad"/></label><label className="field"><span>Görev / Ünvan</span><input value={profile.title} onChange={e=>setProfile({...profile,title:e.target.value})} placeholder="Öğretmen"/></label><label className="field"><span>Okul / Kurum</span><input value={profile.school} onChange={e=>setProfile({...profile,school:e.target.value})} placeholder="Okul adı"/></label><label className="field"><span>Telefon</span><input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label><div className="settings-email"><ShieldCheck size={18}/><div><b>Giriş hesabı</b><span>{user?.email||'—'}</span></div></div>{status&&<div className="auth-error">{status}</div>}<button className="primary" disabled={busy}><Save size={18}/>{busy?'Kaydediliyor…':'Bilgileri Kaydet'}</button></form></section><aside className="settings-side"><section className="card settings-card"><h2>Hesap</h2><p className="muted">Giriş hesabı ve çıkış işlemleri.</p><button className="secondary settings-logout" onClick={()=>signOut(auth)}><LogOut size={18}/> Çıkış Yap</button></section><section className="card settings-card"><h2>Veri ve güvenlik</h2><ul className="settings-list"><li>Öğrenci, sınıf, belge ve rapor verileri hesabına özel tutulur.</li><li>Profil bilgileri Firebase üzerinde hesabına özel saklanır.</li><li>Raporlar mevcut verilerden üretilir.</li></ul></section></aside></div></main>
}
