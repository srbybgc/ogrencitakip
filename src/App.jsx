import { useEffect, useMemo, useState } from 'react'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, FolderOpen, LayoutGrid, Menu, Plus, Search, Trash2, Upload, Users, X } from 'lucide-react'
import { auth, storage } from './firebase'
import { addClass as addClassDomain, addLesson as addLessonDomain, addStudent as addStudentDomain, attachDocument as attachDocumentDomain, createGroup as createGroupDomain, deleteDocument as deleteDocumentDomain, deleteGroup as deleteGroupDomain, deleteLesson as deleteLessonDomain, deleteStudent as deleteStudentDomain, removeClassReferences, removeStudentReferences } from './domain'

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const load = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback } catch { return fallback } }
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const todayIndex = () => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d - 1 : 0 }
const dayDate = (offset) => { const d = new Date(); const monday = new Date(d); const diff = (d.getDay() + 6) % 7; monday.setDate(d.getDate() - diff + offset); return monday }
const fmtDate = (d) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const isNow = (item) => { const n = new Date(); return item.day === todayIndex() && mins(n.toTimeString().slice(0, 5)) >= mins(item.start) && mins(n.toTimeString().slice(0, 5)) < mins(item.end) }
const errorText = (error) => error instanceof Error ? error.message : 'İşlem sırasında bir hata oluştu.'

const initialClasses = []
const initialSchedule = []

function Modal({ title, onClose, children, wide = false }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal ${wide ? 'modal-wide' : ''}`} onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>{children}</div></div> }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function Notice({ message }) { return message ? <div className="auth-error" role="alert">{message}</div> : null }

export default function App() {
  const [view, setView] = useState('home')
  const [classes, setClasses] = useState(() => load('ot-classes', initialClasses))
  const [groups, setGroups] = useState(() => load('ot-groups', []))
  const [schedule, setSchedule] = useState(() => load('ot-schedule', initialSchedule))
  const [documents, setDocuments] = useState(() => load('ot-documents', []))
  const [activeDay, setActiveDay] = useState(todayIndex())
  const [selectedClass, setSelectedClass] = useState(null)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => save('ot-classes', classes), [classes])
  useEffect(() => save('ot-groups', groups), [groups])
  useEffect(() => save('ot-schedule', schedule), [schedule])
  useEffect(() => save('ot-documents', documents), [documents])

  const dayLessons = useMemo(() => schedule.filter(x => x.day === activeDay).sort((a, b) => mins(a.start) - mins(b.start)), [schedule, activeDay])
  const currentLesson = dayLessons.find(isNow)
  const visibleClasses = classes.filter(c => c.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')))

  const goClass = (id) => { setError(''); setSelectedClass(id); setView('class') }
  const addClass = (name) => {
    try { const id = uid(); setClasses(v => addClassDomain(v, name, id)); setModal(null); goClass(id) }
    catch (e) { setError(errorText(e)) }
  }
  const addStudent = (firstName, lastName) => {
    if (selectedClass == null) return
    try { setClasses(v => addStudentDomain(v, selectedClass, firstName, lastName, uid())); setModal(null); setError('') }
    catch (e) { setError(errorText(e)) }
  }
  const deleteStudent = (sid) => {
    setClasses(v => deleteStudentDomain(v, selectedClass, sid))
    setDocuments(v => removeStudentReferences(v, sid))
    setError('')
  }
  const deleteClass = () => {
    if (!selectedClass) return
    const result = removeClassReferences(classes, groups, schedule, documents, selectedClass)
    setClasses(result.classes); setGroups(result.groups); setSchedule(result.schedule); setDocuments(result.documents)
    setSelectedClass(null); setView('classes'); setError('')
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => { setError(''); setView('home') }}><span className="brand-mark">Ö</span><span><b>Öğrenci Takip</b><small>Günlük sınıf yönetimi</small></span></button>
      <nav className="desktop-nav">{[['home','Ana Sayfa'],['classes','Sınıflar'],['groups','Gruplar'],['schedule','Ders Programı'],['documents','Belgeler']].map(([id,label]) => <button key={id} className={view === id ? 'nav-active' : ''} onClick={() => { setError(''); setView(id) }}>{label}</button>)}</nav>
      <button className="icon-btn mobile-menu" onClick={() => setModal('menu')}><Menu size={20} /></button>
    </header>
    {error && <div className="content"><Notice message={error} /></div>}
    {view === 'home' && <Home classes={classes} groups={groups} dayLessons={dayLessons} currentLesson={currentLesson} activeDay={activeDay} setActiveDay={setActiveDay} onClass={goClass} onSchedule={() => setView('schedule')} onDocuments={() => setView('documents')} onAdd={() => { setError(''); setModal('new') }} />}
    {view === 'classes' && <Classes classes={visibleClasses} search={search} setSearch={setSearch} onClass={goClass} onAdd={() => setModal('class')} />}
    {view === 'class' && <ClassDetail cls={classes.find(c => c.id === selectedClass)} schedule={schedule} onBack={() => setView('classes')} onAddStudent={() => setModal('student')} onDeleteStudent={deleteStudent} onDeleteClass={deleteClass} documents={documents} onDocument={() => setView('documents')} />}
    {view === 'groups' && <Groups classes={classes} groups={groups} setGroups={setGroups} setError={setError} />}
    {view === 'schedule' && <Schedule classes={classes} schedule={schedule} setSchedule={setSchedule} setError={setError} />}
    {view === 'documents' && <Documents classes={classes} groups={groups} documents={documents} setDocuments={setDocuments} />}
    {modal === 'class' && <ClassModal onClose={() => setModal(null)} onSave={addClass} />}
    {modal === 'student' && <StudentModal onClose={() => setModal(null)} onSave={addStudent} />}
    {modal === 'new' && <QuickModal onClose={() => setModal(null)} onClass={() => setModal('class')} onSchedule={() => { setModal(null); setView('schedule') }} onDocument={() => { setModal(null); setView('documents') }} />}
    {modal === 'menu' && <Modal title="Menü" onClose={() => setModal(null)}><div className="menu-list">{[['home','Ana Sayfa'],['classes','Sınıflar'],['groups','Gruplar'],['schedule','Ders Programı'],['documents','Belgeler']].map(([id,label]) => <button key={id} onClick={() => { setView(id); setModal(null) }}>{label}<ChevronRight size={17} /></button>)}</div></Modal>}
  </div>
}

function Home({ classes, groups, dayLessons, currentLesson, activeDay, setActiveDay, onClass, onSchedule, onDocuments, onAdd }) {
  const orderedClasses = currentLesson ? [...classes].sort((a,b) => Number(b.id === currentLesson.classId) - Number(a.id === currentLesson.classId)) : classes
  return <main className="content">
    <div className="welcome"><div><p className="eyebrow">{new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}</p><h1>Bugün ne var?</h1><p className="muted">Ders programın ve sınıfların tek bakışta.</p></div><button className="primary" onClick={onAdd}><Plus size={18}/> Yeni</button></div>
    <div className="day-strip">{DAYS.map((d,i)=><button key={d} className={activeDay===i?'day-chip active':'day-chip'} onClick={()=>setActiveDay(i)}><span>{d.slice(0,3)}</span><b>{dayDate(i).getDate()}</b><small>{fmtDate(dayDate(i))}</small></button>)}</div>
    <section className="card schedule-card"><div className="section-head"><div><div className="section-title"><Clock3 size={18}/> Ders Programı</div><p className="muted">{activeDay===todayIndex()?'Bugünkü dersler':DAYS[activeDay]+' dersleri'}</p></div><button className="link-btn" onClick={onSchedule}>Düzenle <ChevronRight size={15}/></button></div>
      {currentLesson && activeDay===todayIndex() && <div className="current-lesson"><span className="live-dot"/><div><small>ŞU ANDA</small><b>{currentLesson.lesson} · {classes.find(c=>c.id===currentLesson.classId)?.name}</b></div><strong>{currentLesson.start}–{currentLesson.end}</strong></div>}
      <div className="schedule-list">{dayLessons.length ? dayLessons.map(x=><button className={`schedule-row ${isNow(x)?'now':''}`} key={x.id} onClick={()=>onClass(x.classId)}><span className="schedule-time">{x.start}<small>{x.end}</small></span><span className="schedule-class"><b>{classes.find(c=>c.id===x.classId)?.name || 'Silinmiş sınıf'}</b><small>{x.lesson}</small></span><ChevronRight size={17}/></button>) : <div className="empty">Bu gün için henüz ders programı yok.</div>}</div>
    </section>
    <section className="card"><div className="section-head"><div><div className="section-title"><LayoutGrid size={18}/> Sınıflar</div><p className="muted">{classes.length} sınıf · {classes.reduce((a,c)=>a+c.students.length,0)} öğrenci</p></div><button className="icon-btn" onClick={onAdd}><Plus size={18}/></button></div>
      <div className="class-grid">{orderedClasses.map(c=><button className={currentLesson?.classId===c.id?'class-card priority':'class-card'} key={c.id} onClick={()=>onClass(c.id)}><span className="class-icon"><Users size={19}/></span><span><b>{c.name}</b><small>{c.students.length} öğrenci</small></span><ChevronRight size={17}/></button>)}{!classes.length&&<div className="empty">Henüz sınıf oluşturulmadı.</div>}</div>
    </section>
    <div className="home-actions"><button onClick={onDocuments}><FileText size={20}/><span><b>Belge / Dosya Ekle</b><small>Öğrenci, sınıf veya grupla ilişkilendir</small></span><ChevronRight size={18}/></button><button onClick={onSchedule}><CalendarDays size={20}/><span><b>Ders Programını Yönet</b><small>Haftalık programını düzenle</small></span><ChevronRight size={18}/></button></div>
    {groups.length>0 && <p className="home-note">{groups.length} grup oluşturuldu. Gruplar ana sayfada sınıf kalabalığını artırmadan ayrı tutulur.</p>}
  </main>
}

function Classes({ classes, search, setSearch, onClass, onAdd }) { return <main className="content"><div className="page-head"><div><p className="eyebrow">Yönetim</p><h1>Sınıflar</h1><p className="muted">Sınıflarını ve öğrencilerini yönet.</p></div><button className="primary" onClick={onAdd}><Plus size={18}/> Sınıf Ekle</button></div><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sınıf ara…"/></div><div className="large-grid">{classes.map(c=><button className="class-panel" key={c.id} onClick={()=>onClass(c.id)}><div className="panel-icon"><Users size={21}/></div><div><b>{c.name}</b><span>{c.students.length} öğrenci</span></div><ChevronRight size={18}/></button>)}{!classes.length&&<div className="empty">Henüz sınıf oluşturulmadı.</div>}</div></main> }

function ClassDetail({ cls, schedule, documents, onBack, onAddStudent, onDeleteStudent, onDeleteClass, onDocument }) {
  if(!cls) return null
  const lessons=schedule.filter(x=>x.classId===cls.id)
  const studentDocs = documents.filter(d => d.targetType === 'student' && cls.students.some(s => s.id === d.targetId))
  const classDocs = documents.filter(d => d.targetType === 'class' && d.targetId === cls.id)
  return <main className="content"><button className="back-btn" onClick={onBack}><ChevronLeft size={18}/> Sınıflar</button><div className="detail-head"><div><p className="eyebrow">Sınıf</p><h1>{cls.name}</h1><p className="muted">{cls.students.length} öğrenci</p></div><button className="danger-outline" onClick={onDeleteClass}><Trash2 size={16}/> Sınıfı Sil</button></div><section className="card"><div className="section-head"><div><div className="section-title"><Users size={18}/> Öğrenciler</div><p className="muted">Öğrenci listesi</p></div><button className="primary small" onClick={onAddStudent}><Plus size={16}/> Öğrenci Ekle</button></div><div className="student-list">{cls.students.map((s,i)=><div className="student-row" key={s.id}><span className="avatar">{s.firstName[0]}{s.lastName?.[0]||''}</span><span><b>{s.firstName} {s.lastName}</b><small>Öğrenci {i+1}{documents.some(d=>d.targetType==='student'&&d.targetId===s.id)?' · Belgeli':''}</small></span><button className="icon-btn danger" onClick={()=>onDeleteStudent(s.id)}><Trash2 size={16}/></button></div>)}{!cls.students.length&&<div className="empty">Bu sınıfta henüz öğrenci yok.</div>}</div></section><section className="card"><div className="section-head"><div className="section-title"><FileText size={18}/> Belgeler</div><button className="link-btn" onClick={onDocument}>Belge Ekle <ChevronRight size={15}/></button></div><p className="muted">{classDocs.length + studentDocs.length} belge bu sınıfla veya öğrencileriyle ilişkili.</p></section><section className="card"><div className="section-title"><Clock3 size={18}/> Ders Programı</div><div className="mini-lessons">{lessons.map(x=><div key={x.id}><b>{DAYS[x.day]}</b><span>{x.start}–{x.end}</span><small>{x.lesson}</small></div>)}{!lessons.length&&<div className="empty">Bu sınıfa henüz ders eklenmemiş.</div>}</div></section></main>
}

function Groups({ classes, groups, setGroups, setError }) { const [name,setName]=useState(''); const [selected,setSelected]=useState([]); const add=()=>{try{setGroups(v=>createGroupDomain(v,name,selected,uid()));setName('');setSelected([]);setError('')}catch(e){setError(errorText(e))}}; const remove=(id)=>{setGroups(v=>deleteGroupDomain(v,id));setError('')}; return <main className="content"><div className="page-head"><div><p className="eyebrow">Organizasyon</p><h1>Gruplar</h1><p className="muted">İstersen sınıfları üst gruplar altında toplayabilirsin.</p></div></div><section className="card form-card"><div className="section-title"><FolderOpen size={18}/> Yeni Grup</div><div className="inline-form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Örn. Sabah Grubu"/><button className="primary" onClick={add}><Plus size={17}/> Oluştur</button></div><div className="check-grid">{classes.map(c=><label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}<small>{c.students.length} öğrenci</small></label>)}</div></section><div className="group-grid">{groups.map(g=><div className="group-card" key={g.id}><div className="panel-icon"><FolderOpen size={20}/></div><div><b>{g.name}</b><span>{(g.classIds||[]).map(id=>classes.find(c=>c.id===id)?.name).filter(Boolean).join(', ')||'Sınıf atanmadı'}</span></div><button className="icon-btn danger" onClick={()=>remove(g.id)}><Trash2 size={16}/></button></div>)}</div></main> }

function Schedule({ classes, schedule, setSchedule, setError }) { const [day,setDay]=useState(todayIndex()); const [form,setForm]=useState({start:'08:40',end:'09:20',classId:classes[0]?.id||'',lesson:''}); const add=()=>{try{setSchedule(v=>addLessonDomain(v,{day,start:form.start,end:form.end,classId:form.classId,lesson:form.lesson},uid()));setForm(v=>({...v,lesson:''}));setError('')}catch(e){setError(errorText(e))}}; const remove=(id)=>{setSchedule(v=>deleteLessonDomain(v,id));setError('')}; return <main className="content"><div className="page-head"><div><p className="eyebrow">Haftalık plan</p><h1>Ders Programı</h1><p className="muted">Bugünkü ders otomatik olarak ana sayfada öne çıkar.</p></div></div><div className="day-strip">{DAYS.map((d,i)=><button key={d} className={day===i?'day-chip active':'day-chip'} onClick={()=>setDay(i)}><span>{d.slice(0,3)}</span><b>{dayDate(i).getDate()}</b></button>)}</div><section className="card form-card"><div className="section-title"><Plus size={18}/> Ders Ekle</div><div className="form-grid"><Field label="Başlangıç"><input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></Field><Field label="Bitiş"><input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></Field><Field label="Sınıf"><select value={form.classId} onChange={e=>setForm({...form,classId:e.target.value})}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Ders"><input value={form.lesson} onChange={e=>setForm({...form,lesson:e.target.value})} placeholder="Örn. Türkçe"/></Field><button className="primary" onClick={add} disabled={!classes.length}>Ekle</button></div></section><section className="card"><div className="section-head"><div><div className="section-title"><Clock3 size={18}/> {DAYS[day]}</div><p className="muted">{schedule.filter(x=>x.day===day).length} ders</p></div></div><div className="schedule-manage">{schedule.filter(x=>x.day===day).sort((a,b)=>mins(a.start)-mins(b.start)).map(x=><div key={x.id}><span><b>{x.start}–{x.end}</b><small>{x.lesson} · {classes.find(c=>c.id===x.classId)?.name || 'Silinmiş sınıf'}</small></span><button className="icon-btn danger" onClick={()=>remove(x.id)}><Trash2 size={16}/></button></div>)}{!schedule.filter(x=>x.day===day).length&&<div className="empty">Bu güne henüz ders eklenmedi.</div>}</div></section></main> }

function Documents({ classes, groups, documents, setDocuments }) {
  const [targetType,setTargetType]=useState('class')
  const [targetId,setTargetId]=useState(classes[0]?.id||'')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const user=auth.currentUser
  const allStudents=classes.flatMap(c=>c.students.map(s=>({...s,className:c.name})))
  const targetOptions=targetType==='class'?classes:targetType==='group'?groups:allStudents
  const upload=async e=>{
    const file=e.target.files?.[0]; e.target.value=''
    if(!file)return
    if(!user){setError('Belge yüklemek için giriş yapmalısınız.');return}
    if(!targetId){setError('Önce belgenin ilişkilendirileceği kaydı seçin.');return}
    if(file.size>20*1024*1024){setError('Dosya boyutu 20 MB sınırını aşamaz.');return}
    setBusy(true);setError('')
    const id=uid(); const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`users/${user.uid}/documents/${id}-${safeName}`
    try{ await uploadBytes(ref(storage,path),file); const downloadUrl=await getDownloadURL(ref(storage,path)); const item={id,name:file.name,size:file.size,type:file.type,targetType,targetId,storagePath:path,downloadUrl,createdAt:new Date().toISOString()}; setDocuments(v=>attachDocumentDomain(v,item,id)) }
    catch(err){console.error(err);setError('Dosya yüklenemedi. Firebase Storage bağlantısını kontrol edin.')}finally{setBusy(false)}
  }
  const remove=async d=>{try{if(d.storagePath)await deleteObject(ref(storage,d.storagePath))}catch(err){if(err.code!=='storage/object-not-found')console.error(err)}setDocuments(v=>deleteDocumentDomain(v,d.id))}
  const labelFor=d=>{if(d.targetType==='class')return classes.find(c=>c.id===d.targetId)?.name||'Kayıt silinmiş';if(d.targetType==='group')return groups.find(g=>g.id===d.targetId)?.name||'Kayıt silinmiş';const s=allStudents.find(x=>x.id===d.targetId);return s?`${s.firstName} ${s.lastName} · ${s.className}`:'Öğrenci silinmiş'}
  return <main className="content"><div className="page-head"><div><p className="eyebrow">Dosyalar</p><h1>Belgeler</h1><p className="muted">Dosyayı yüklemeden önce ilişkili kayıt türünü seç.</p></div><label className={`primary upload ${busy?'disabled':''}`}><Upload size={17}/>{busy?'Yükleniyor…':'Dosya Seç'}<input type="file" onChange={upload} disabled={busy}/></label></div>{error&&<Notice message={error}/>}<section className="card form-card"><div className="section-title"><FileText size={18}/> İlişkilendirme</div><div className="form-grid"><Field label="Kayıt türü"><select value={targetType} onChange={e=>{setTargetType(e.target.value);setTargetId('')}}><option value="class">Sınıf</option><option value="student">Öğrenci</option><option value="group">Grup</option></select></Field><Field label="Kayıt"><select value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Seçin</option>{targetOptions.map(x=><option key={x.id} value={x.id}>{targetType==='student'?`${x.firstName} ${x.lastName} · ${x.className}`:x.name}</option>)}</select></Field></div><p className="hint">Belgeler Firebase Storage'da kullanıcı hesabınıza özel klasörde saklanır ve yalnızca seçtiğiniz kayıtla ilişkilendirilir.</p></section><section className="card"><div className="section-title"><FolderOpen size={18}/> Yüklenenler</div><div className="doc-list">{documents.map(d=><div className="doc-row" key={d.id}><span className="doc-icon"><FileText size={18}/></span><span><b>{d.name}</b><small>{d.targetType==='class'?'Sınıf':d.targetType==='group'?'Grup':'Öğrenci'} · {labelFor(d)} · {(d.size/1024).toFixed(0)} KB</small></span>{d.downloadUrl?<a className="download" href={d.downloadUrl} target="_blank" rel="noreferrer">Aç</a>:d.data?<a className="download" href={d.data} download={d.name}>Aç</a>:<span className="hint">Dosya yok</span>}<button className="icon-btn danger" onClick={()=>remove(d)}><Trash2 size={16}/></button></div>)}{!documents.length&&<div className="empty">Henüz belge yüklenmedi.</div>}</div></section></main>
}

function ClassModal({onClose,onSave}){const [name,setName]=useState('');return <Modal title="Yeni Sınıf" onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(name)}}><Field label="Sınıf adı"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Örn. 3-A"/></Field><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button className="primary">Oluştur</button></div></form></Modal>}
function StudentModal({onClose,onSave}){const [first,setFirst]=useState('');const [last,setLast]=useState('');return <Modal title="Öğrenci Ekle" onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(first,last)}}><Field label="Ad"><input autoFocus value={first} onChange={e=>setFirst(e.target.value)} /></Field><Field label="Soyad"><input value={last} onChange={e=>setLast(e.target.value)} /></Field><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button className="primary">Ekle</button></div></form></Modal>}
function QuickModal({onClose,onClass,onSchedule,onDocument}){return <Modal title="Yeni kayıt" onClose={onClose}><div className="quick-menu"><button onClick={onClass}><Users size={19}/> Sınıf oluştur<ChevronRight size={17}/></button><button onClick={onSchedule}><Clock3 size={19}/> Ders ekle<ChevronRight size={17}/></button><button onClick={onDocument}><FileText size={19}/> Belge yükle<ChevronRight size={17}/></button></div></Modal>}
