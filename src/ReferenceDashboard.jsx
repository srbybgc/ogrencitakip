import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, MoreHorizontal, Plus, Search, Star, UserRound, UsersRound, Zap } from 'lucide-react'
import { useAuthUser } from './AuthGate'
import { loadProfile } from './profileData'
import './referenceDashboard.css'
import './reportsSettings.css'
import './dashboardOverrides.css'

const trDate = (d) => d.toLocaleDateString('tr-TR', { day:'numeric', month:'long' })
const trMonth = (d) => d.toLocaleDateString('tr-TR', { month:'long', year:'numeric' })

export default function ReferenceDashboard({ classes=[], schedule=[], documents=[], search='', setSearch=()=>{}, onClass=()=>{}, onClasses=()=>{}, onSchedule=()=>{}, onAddClass=()=>{}, onNewStudent=()=>{}, onDocument=()=>{} }) {
  const now = new Date(), user = useAuthUser()
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [profile, setProfile] = useState(() => { try { return JSON.parse(localStorage.getItem('ot-profile') || '{}') } catch { return {} } })
  const [searchOpen, setSearchOpen] = useState(false)
  const lessons = useMemo(() => schedule.filter(x => x.scope !== 'classProgram' && x.day === ((now.getDay()+6)%7)).sort((a,b)=>String(a.start).localeCompare(String(b.start))).slice(0,3), [schedule])
  const visible = classes.filter(c => c.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))).slice(0,4)
  const first = new Date(month.getFullYear(), month.getMonth(), 1), days = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate(), lead = (first.getDay()+6)%7
  const cells = Array.from({length:lead+days}, (_,i) => i<lead ? null : i-lead+1)
  let recentDocs=[]; try { recentDocs = JSON.parse(localStorage.getItem('ot-documents')||'[]').slice(0,3) } catch {}
  const notes = classes.flatMap(c => (c.students||[]).map(s => ({name:`${s.firstName} ${s.lastName}`.trim(), cls:c.name, text:s.note||s.notes||''}))).filter(x=>x.text).slice(0,3)
  const q = search.trim().toLocaleLowerCase('tr')
  const searchResults = useMemo(() => {
    if (!q) return []
    const out=[]
    classes.forEach(cls => {
      if (cls.name.toLocaleLowerCase('tr').includes(q)) out.push({type:'Sınıf',title:cls.name,detail:`${(cls.students||[]).length} öğrenci`,classId:cls.id})
      const teacher=cls.teacher || (cls.teacherName ? {name:cls.teacherName,branch:cls.teacherBranch||''} : null)
      if (teacher?.name && teacher.name.toLocaleLowerCase('tr').includes(q)) out.push({type:'Öğretmen',title:teacher.name,detail:`${cls.name}${teacher.branch?` · ${teacher.branch}`:''}`,classId:cls.id})
      ;(cls.students||[]).forEach(student => {
        const studentName=`${student.firstName||''} ${student.lastName||''}`.trim(), parentText=`${student.parentName||''} ${student.parentPhone||''} ${student.secondParentName||''} ${student.secondParentPhone||''}`.toLocaleLowerCase('tr')
        if(studentName.toLocaleLowerCase('tr').includes(q)) out.push({type:'Öğrenci',title:studentName,detail:cls.name,classId:cls.id,studentId:student.id})
        if(parentText.includes(q)) out.push({type:'Veli',title:student.parentName||student.secondParentName||'Veli',detail:`${studentName} · ${cls.name}`,classId:cls.id,studentId:student.id})
      })
    })
    return out.slice(0,12)
  }, [classes,q])
  const displayName=profile.displayName || user?.email || 'Profilini tamamla', initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'—'
  useEffect(() => { let active=true; loadProfile(user?.uid).then(data=>{if(active&&Object.keys(data).length){setProfile(data);localStorage.setItem('ot-profile',JSON.stringify(data))}}).catch(()=>{}); const sync=()=>{try{setProfile(JSON.parse(localStorage.getItem('ot-profile')||'{}'))}catch{}}; window.addEventListener('ot-profile-changed',sync); return()=>{active=false;window.removeEventListener('ot-profile-changed',sync)} },[user?.uid])

  return <main className="reference-dashboard">
    <header className="reference-topbar"><div className="reference-search-wrap"><form className="reference-search" onSubmit={e=>{e.preventDefault();setSearchOpen(true)}}><Search size={20}/><input value={search} onFocus={()=>setSearchOpen(true)} onChange={e=>{setSearch(e.target.value);setSearchOpen(true)}} placeholder="Sınıf, öğrenci, veli veya öğretmen ara…"/><button type="submit" aria-label="Ara"><Search size={17}/></button></form>{searchOpen&&search&&<div className="reference-search-results">{searchResults.length?searchResults.map((r,i)=><button key={`${r.type}-${r.classId}-${r.studentId||i}`} className="reference-search-result" onClick={()=>{onClass(r.classId);setSearchOpen(false)}}><span className="reference-search-result-icon"><UserRound size={17}/></span><span><b>{r.title}</b><small><strong className="reference-search-label">{r.type}</strong> · {r.detail}</small></span><ChevronRight size={16}/></button>):<div className="reference-search-empty">Öğrenci, veli, öğretmen veya sınıf bulunamadı.</div>}</div>}</div><div className="reference-user"><button className="reference-bell"><Bell size={23}/><i/></button><span className="reference-avatar">{initials}</span><b>{displayName}</b><ChevronDown size={17}/></div></header>
    <section className="reference-hero"><div><p>İyi bir gün olsun <span>🌿</span></p><h1>{trDate(now)}</h1></div><div className="reference-leaves"><i/><i/><i/><i/><i/></div></section>
    <div className="reference-grid"><div className="reference-main">
      <div className="reference-top-cards"><section className="ref-card lessons"><div className="ref-head"><h2><CalendarDays size={21}/> Bugünün Dersleri</h2><button onClick={onSchedule}>Tümünü Gör <ChevronRight size={16}/></button></div>{lessons.length?lessons.map((x,i)=><button className="ref-lesson" key={x.id} onClick={()=>onClass(x.classId)}><span className="ref-time"><i/>{x.start} – {x.end}</span><span className="ref-lesson-class"><span className="ref-blue-icon"><UsersRound size={22}/></span><span><b>{classes.find(c=>c.id===x.classId)?.name||'—'}</b><small>{x.lesson}</small></span></span><em>{i===0?'Şimdi':i===1?'Yaklaşıyor':''}</em></button>):<div className="ref-empty">Bugün için ders bulunmuyor.</div>}</section><section className="ref-card quick"><div className="ref-head"><h2><Zap size={21}/> Hızlı İşlemler</h2></div><div className="ref-quick-grid"><button onClick={onNewStudent}><UserRound/><span>Yeni Öğrenci</span></button><button onClick={onAddClass}><UsersRound/><span>Sınıf Ekle</span></button><button onClick={onDocument}><FileText/><span>Belge Ekle</span></button><button onClick={onSchedule}><CalendarDays/><span>Ders Programı</span></button></div></section></div>
      <section className="ref-card ref-classes"><div className="ref-head"><h2><UsersRound size={21}/> Sınıflarım</h2><div><button onClick={onClasses}>Tümünü Gör <ChevronRight size={16}/></button><button className="ref-plus" onClick={onAddClass}><Plus size={21}/></button></div></div><div className="ref-class-grid">{visible.map((c,i)=><button key={c.id} className={`ref-class c${i}`} onClick={()=>onClass(c.id)}><span><UsersRound size={22}/></span><b>{c.name}<small>{c.students.length} öğrenci</small></b></button>)}{!visible.length&&<div className="ref-empty">Henüz sınıf oluşturulmadı.</div>}</div></section>
      <div className="ref-bottom"><section className="ref-card"><div className="ref-head"><h2><FileText size={21}/> Son Eklenen Belgeler</h2><button onClick={onDocument}>Tümünü Gör <ChevronRight size={16}/></button></div>{recentDocs.length?recentDocs.map((d,i)=><div className="ref-doc" key={d.id}><span className={`ref-file f${i}`}>{String(d.type||'').includes('pdf')?'PDF':String(d.name||'').split('.').pop()?.toUpperCase()||'DOC'}</span><span><b>{d.name}</b><small>{d.targetType==='group'?'Genel':d.targetType==='student'?'Öğrenci':d.targetType==='class'?'Sınıf':'Genel'} · {d.createdAt?new Date(d.createdAt).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}):'Bugün'} · {d.size?((d.size/1024/1024).toFixed(1)+' MB'):''}</small></span><MoreHorizontal size={18}/></div>):<div className="ref-empty">Henüz belge yüklenmedi.</div>}</section><section className="ref-card ref-notes ref-notes-bottom"><div className="ref-head"><h2><FileText size={21}/> Son Notlar</h2><span className="notes-count">{notes.length}</span></div>{notes.length?notes.map(n=><div className="ref-note" key={n.name}><span><UserRound size={21}/></span><div><b>{n.name}</b><small>{n.cls} · Bugün</small><p><Star size={13}/>{n.text}</p></div></div>):<div className="ref-empty">Henüz not yok.</div>}</section></div>
    </div><aside className="reference-side"><section className="ref-card ref-calendar"><div className="ref-head"><h2><CalendarDays size={21}/> Takvim</h2><button className="ref-today" onClick={()=>setMonth(new Date(now.getFullYear(),now.getMonth(),1))}>Bugün</button><button className="ref-arrow" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={17}/></button><button className="ref-arrow" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={17}/></button></div><h3>{trMonth(month)}</h3><div className="ref-week">{['Pzt','Sal','Çar','Per','Cum','Cts','Paz'].map(x=><span key={x}>{x}</span>)}</div><div className="ref-days">{cells.map((d,i)=><span key={i} className={d===now.getDate()&&month.getMonth()===now.getMonth()&&month.getFullYear()===now.getFullYear()?'selected':''}>{d||''}</span>)}</div></section><section className="ref-quote"><span>“</span><p>Her çocuk özeldir.</p><i/></section></aside></div>
  </main>
}
