import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import ArchivePage from './ArchivePage'
import TrashPage from './TrashPage'
import ClassSchedulePage from './ClassSchedulePage'
import ReferenceDashboard from './ReferenceDashboard'
import ReportsPage from './ReportsPage'
import SettingsPage from './SettingsPage'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Archive, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileSpreadsheet, FileText, FileText as FileTextIcon, FolderOpen, Home as HomeIcon, LayoutGrid, Menu, Plus, Search, Settings, Trash2, Upload, UserRound, Users, X } from 'lucide-react'
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

const repairImportedClasses = (value) => {
  if (!Array.isArray(value)) return value
  const phoneRe = /(?:\+?90[\s-]?)?(?:0?5\d{2})[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g
  return value.map(cls => ({...cls, students:(cls.students||[]).map(st => {
    const first=String(st.firstName||'').trim(), last=String(st.lastName||'').trim()
    const combined=`${first} ${last}`.replace(/\s+/g,' ').trim(), phones=combined.match(phoneRe)||[]
    if(!phones.length)return st
    const cleaned=combined.replace(phoneRe,' ').replace(/\s+/g,' ').trim(), parts=cleaned.split(' ').filter(Boolean), next={...st}
    if(parts.length>=2){next.firstName=parts.slice(0,-1).join(' ');next.lastName=parts.at(-1)}else if(parts.length===1){next.firstName=parts[0];next.lastName=''}
    if(!next.parentPhone)next.parentPhone=phones[0].trim()
    return next
  })}))
}

const initialClasses = []
const academicYearOptions = (() => { const y = new Date().getFullYear(); return [y-1, y, y+1].map(x => `${x}-${x+1}`) })()
const initialSchedule = []

function Modal({ title, onClose, children, wide = false }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal ${wide ? 'modal-wide' : ''}`} onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>{children}</div></div> }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function Notice({ message }) { return message ? <div className="auth-error" role="alert">{message}</div> : null }

export default function App() {
  const [view, setView] = useState('home')
  const [classes, setClasses] = useState(() => repairImportedClasses(load('ot-classes', initialClasses)))
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

  const teacherSchedule = useMemo(() => schedule.filter(x => x.scope !== 'classProgram'), [schedule]); const dayLessons = useMemo(() => teacherSchedule.filter(x => x.day === activeDay).sort((a, b) => mins(a.start) - mins(b.start)), [teacherSchedule, activeDay])
  const currentLesson = dayLessons.find(isNow)
  const activeClasses = classes.filter(c => !c.archivedAt)
  const visibleClasses = activeClasses.filter(c => c.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')))

  const goClass = (id) => { setError(''); setSelectedClass(id); window.__otSelectedClass=id; setView('class') }
  const addClass = (name, academicYear) => {
    try { const id = uid(); const next = addClassDomain(classes, name, id).map(c => c.id === id ? {...c, academicYear} : c); setClasses(next); setModal(null); goClass(id) } catch (e) { setError(errorText(e)) }
  }
  const addStudent = (firstName, lastName, details = {}) => {
    if (selectedClass == null) return
    try { const next = addStudentDomain(classes, selectedClass, firstName, lastName, uid(), details); setClasses(next); setModal(null); setError('') } catch (e) { setError(errorText(e)) }
  }
  const importStudents = (rows) => {
    if (selectedClass == null) return
    let next = classes, added = 0, skipped = 0
    rows.forEach(row => { try { next = addStudentDomain(next, selectedClass, row.firstName, row.lastName, uid(), { studentNumber: row.studentNumber, birthDate: row.birthDate, parentPhone: row.parentPhone, secondParentPhone: row.fatherPhone }); added += 1 } catch { skipped += 1 } })
    setClasses(next); setModal(null); setError(skipped ? added + ' öğrenci aktarıldı, ' + skipped + ' satır atlandı (boş/tekrar).' : added + ' öğrenci aktarıldı.')
  }
  const deleteStudent = (sid) => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz? Öğrenciye bağlı kayıt ve belgeler de kaldırılacaktır.')) return
    setClasses(v => deleteStudentDomain(v, selectedClass, sid))
    setDocuments(v => removeStudentReferences(v, sid))
    setError('')
  }
  const deleteClass = () => {
    if (!selectedClass) return
    if (!window.confirm('Bu sınıfı silmek istediğinizden emin misiniz? Sınıfa bağlı öğrenciler, dersler ve belgeler de kaldırılacaktır.')) return
    const result = removeClassReferences(classes, groups, schedule, documents, selectedClass)
    setClasses(result.classes); setGroups(result.groups); setSchedule(result.schedule); setDocuments(result.documents)
    setSelectedClass(null); setView('classes'); setError('')
  }

  return <div className="app-shell">
    <aside className="topbar sidebar"><button className="brand" onClick={() => { setError(''); setView('home') }}><span className="brand-mark">Ö</span><span><b>Öğrenci Takip</b><small>Daha güzel yarınlar için</small></span></button><nav className="desktop-nav"><button className={view==='home'?'nav-active':''} onClick={()=>setView('home')}><HomeIcon size={22}/><span>Ana Sayfa</span></button><button className={view==='classes'?'nav-active':''} onClick={()=>setView('classes')}><UserRound size={22}/><span>Öğrenciler</span></button><button className={view==='classes'?'nav-active':''} onClick={()=>setView('classes')}><BookOpen size={22}/><span>Sınıflar</span></button><button className={view==='schedule'?'nav-active':''} onClick={()=>setView('schedule')}><CalendarDays size={22}/><span>Ders Programı</span></button><button className={view==='documents'?'nav-active':''} onClick={()=>setView('documents')}><FileTextIcon size={22}/><span>Belgeler</span></button><button className={view==='reports'?'nav-active':''} onClick={()=>setView('reports')}><FileSpreadsheet size={22}/><span>Raporlar</span></button></nav><div className="sidebar-divider"/><nav className="desktop-nav sidebar-lower"><button className={view==='archive'?'nav-active':''} onClick={()=>setView('archive')}><Archive size={22}/><span>Arşiv</span></button><button className={view==='trash'?'nav-active':''} onClick={()=>setView('trash')}><Trash2 size={22}/><span>Çöp Kutusu</span></button><button className={view==='settings'?'nav-active':''} onClick={()=>setView('settings')}><Settings size={22}/><span>Ayarlar</span></button></nav><div className="sidebar-quote"><span>“</span><p>Küçük adımlar<br/>büyük değişimler<br/>yaratır.</p><i/></div><button className="icon-btn mobile-menu" onClick={()=>setModal('menu')}><Menu size={20}/></button></aside>
    <div className="main-area">
    {error && <div className="content"><Notice message={error} /></div>}
    {view === 'home' && <ReferenceDashboard classes={activeClasses} schedule={schedule} documents={documents} search={search} setSearch={setSearch} onClass={goClass} onClasses={() => setView('classes')} onSchedule={() => setView('schedule')} onAddClass={() => { setError(''); setModal('class') }} onNewStudent={() => setView('classes')} onDocument={() => setView('documents')} />}
    {view === 'classes' && <Classes classes={visibleClasses} search={search} setSearch={setSearch} onClass={goClass} onAdd={() => setModal('class')} />}
    {view === 'class-schedule' && <ClassSchedulePage cls={classes.find(c => c.id === selectedClass)} schedule={schedule} setSchedule={setSchedule} setError={setError} onBack={() => setView('class')} />}
    {view === 'class' && <ClassDetail cls={classes.find(c => c.id === selectedClass)} schedule={schedule} setSchedule={setSchedule} setError={setError} onBack={() => setView('classes')} onAddStudent={() => setModal('student')} onDeleteStudent={deleteStudent} onDeleteClass={deleteClass} setClasses={setClasses} onArchive={() => { if (selectedClass == null) return; const y = new Date().getFullYear(); setClasses(v => v.map(c => c.id === selectedClass ? { ...c, archivedAt: new Date().toISOString(), academicYear: c.academicYear || `${y}-${y+1}` } : c)); setView('archive') }} documents={documents} onDocument={() => setView('documents')} onImportStudents={() => setModal('import-students')} onProgram={() => setView('class-schedule')} />}
    {view === 'groups' && <Groups classes={activeClasses} groups={groups} setGroups={setGroups} setError={setError} />}
    {view === 'schedule' && <Schedule classes={activeClasses} schedule={schedule} setSchedule={setSchedule} setError={setError} />}
    {view === 'documents' && <Documents classes={activeClasses} groups={groups} documents={documents} setDocuments={setDocuments} />}
    {view === 'reports' && <ReportsPage classes={activeClasses} />}
    {view === 'settings' && <SettingsPage />}
    {view === 'archive' && <ArchivePage />}
    {view === 'trash' && <TrashPage />}
    {modal === 'class' && <ClassModal onClose={() => setModal(null)} onSave={addClass} />}
    {modal === 'student' && <StudentModal onClose={() => setModal(null)} onSave={addStudent} />}
    {modal === 'import-students' && <StudentImportModal onClose={() => setModal(null)} onImport={importStudents} />}
    {modal === 'new' && <QuickModal onClose={() => setModal(null)} onClass={() => setModal('class')} onSchedule={() => { setModal(null); setView('schedule') }} onDocument={() => { setModal(null); setView('documents') }} />}
    {modal === 'menu' && <Modal title="Menü" onClose={() => setModal(null)}><div className="menu-list">{[['home','Ana Sayfa'],['classes','Sınıflar'],['groups','Gruplar'],['schedule','Ders Programı'],['documents','Belgeler']].map(([id,label]) => <button key={id} onClick={() => { setView(id); setModal(null) }}>{label}<ChevronRight size={17} /></button>)}</div></Modal>}
  </div></div>
}

function Home({ classes, groups, dayLessons, currentLesson, activeDay, setActiveDay, onClass, onSchedule, onAdd, onAddClass, search, setSearch }) {
  const filteredClasses = classes.filter(c=>{const q=search.toLocaleLowerCase('tr').trim();return !q||c.name.toLocaleLowerCase('tr').includes(q)||(c.students||[]).some(st=>`${st.firstName} ${st.lastName}`.toLocaleLowerCase('tr').includes(q))}); const orderedClasses = currentLesson ? [...filteredClasses].sort((a,b) => Number(b.id === currentLesson.classId) - Number(a.id === currentLesson.classId)) : filteredClasses
  const todayLabel = new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})
  return <main className="content">
    <div className="welcome"><div><h1 className="home-day-title">{todayLabel}</h1></div><button className="primary" onClick={onAdd}><Plus size={18}/> Yeni</button></div><div className="search home-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sınıf veya öğrenci ara…"/></div>
    <div className="day-strip">{DAYS.map((d,i)=><button key={d} className={activeDay===i?'day-chip active':'day-chip'} onClick={()=>setActiveDay(i)}><span>{d.slice(0,3)}</span><b>{dayDate(i).getDate()}</b><small>{fmtDate(dayDate(i))}</small></button>)}</div>
    <section className="card schedule-card"><div className="section-head"><div><div className="section-title"><Clock3 size={18}/> Ders Programı</div><p className="muted">{activeDay===todayIndex()?'Bugünkü dersler':DAYS[activeDay]+' dersleri'}</p></div><button className="link-btn" onClick={onSchedule}>Düzenle <ChevronRight size={15}/></button></div>
      {currentLesson && activeDay===todayIndex() && <div className="current-lesson"><span className="live-dot"/><div><small>ŞU ANDA</small><b>{currentLesson.lesson} · {classes.find(c=>c.id===currentLesson.classId)?.name}</b></div><strong>{currentLesson.start}–{currentLesson.end}</strong></div>}
      <div className="schedule-list">{dayLessons.length ? dayLessons.map(x=><button className={`schedule-row ${isNow(x)?'now':''}`} key={x.id} onClick={()=>onClass(x.classId)}><span className="schedule-time">{x.start}<small>{x.end}</small></span><span className="schedule-class"><b>{classes.find(c=>c.id===x.classId)?.name || 'Silinmiş sınıf'}</b><small>{x.lesson}</small></span><ChevronRight size={17}/></button>) : <div className="empty">Bu gün için henüz ders programı yok.</div>}</div>
    </section>
    <section className="card"><div className="section-head"><div><div className="section-title"><LayoutGrid size={18}/> Sınıflar</div><p className="muted">{classes.length} sınıf · {classes.reduce((a,c)=>a+c.students.length,0)} öğrenci</p></div><button className="icon-btn" onClick={onAddClass}><Plus size={18}/></button></div>
      <div className="class-grid">{orderedClasses.map(c=><button className={currentLesson?.classId===c.id?'class-card priority':'class-card'} key={c.id} onClick={()=>onClass(c.id)}><span className="class-icon"><Users size={19}/></span><span><b>{c.name}</b><small>{c.students.length} öğrenci</small></span><ChevronRight size={17}/></button>)}{!classes.length&&<div className="empty">Henüz sınıf oluşturulmadı.</div>}</div>
    </section>
    {groups.length>0 && <p className="home-note">{groups.length} grup oluşturuldu. Gruplar ana sayfada sınıf kalabalığını artırmadan ayrı tutulur.</p>}
  </main>
}

function Classes({ classes, search, setSearch, onClass, onAdd }) { return <main className="content"><div className="page-head"><div><p className="eyebrow">Yönetim</p><h1>Sınıflar</h1><p className="muted">Sınıflarını ve öğrencilerini yönet.</p></div><button className="primary" onClick={onAdd}><Plus size={18}/> Sınıf Ekle</button></div><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Sınıf ara…"/></div><div className="large-grid">{classes.map(c=><button className="class-panel" key={c.id} onClick={()=>onClass(c.id)}><div className="panel-icon"><Users size={21}/></div><div><b>{c.name}</b><span>{c.students.length} öğrenci</span></div><ChevronRight size={18}/></button>)}{!classes.length&&<div className="empty">Henüz sınıf oluşturulmadı.</div>}</div></main> }

function ClassDetail({ cls, schedule, documents, onBack, onAddStudent, onDeleteStudent, onDeleteClass, onDocument, onImportStudents, onArchive, onProgram, setClasses }) {
  const [editingTeacher, setEditingTeacher] = useState(false)
  const [teacher, setTeacher] = useState({ name: '', branch: '', phone: '', email: '' })
  if(!cls) return null
  const lessons=schedule.filter(x=>x.classId===cls.id).sort((a,b)=>a.day-b.day||mins(a.start)-mins(b.start))
  const studentDocs=documents.filter(d=>d.targetType==='student'&&cls.students.some(s=>s.id===d.targetId))
  const classDocs=documents.filter(d=>d.targetType==='class'&&d.targetId===cls.id)
  const days=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma']
  const saveTeacher=()=>{setClasses(v=>v.map(c=>c.id===cls.id?{...c,teacher:{...teacher}}:c));setEditingTeacher(false)}
  const existingTeacher=cls.teacher || (cls.teacherName ? {name:cls.teacherName,branch:cls.teacherBranch||'',phone:cls.teacherPhone||'',email:cls.teacherEmail||''} : {})
  const beginTeacherEdit=()=>{setTeacher({name:existingTeacher.name||'',branch:existingTeacher.branch||'',phone:existingTeacher.phone||'',email:existingTeacher.email||''});setEditingTeacher(true)}
  return <main className="content class-detail-page">
    <div className="welcome class-detail-top"><div><p className="eyebrow">Sınıf Detayı</p><h1>{cls.name}</h1><p className="muted">{cls.academicYear || 'Eğitim öğretim yılı belirtilmemiş'} · {cls.students.length} öğrenci</p></div><div className="class-detail-actions"><button className="secondary" onClick={onBack}><ChevronLeft size={17}/> Geri</button><button className="secondary" onClick={()=>window.print()}>Yazdır</button><button className="secondary" onClick={onProgram}><CalendarDays size={17}/> Ders Programı</button><button className="primary" onClick={onAddStudent}><Plus size={17}/> Öğrenci Ekle</button></div></div>
    <div className="class-info-grid">
      <section className="card class-detail-card teacher-card"><div className="section-head"><div><h2>Sınıf Öğretmeni</h2><p className="muted">Öğretmen bilgisi aramada da “Öğretmen” olarak bulunur.</p></div><button className="secondary" onClick={beginTeacherEdit}>{existingTeacher.name?'Düzenle':'Bilgi Gir'}</button></div>{editingTeacher?<div className="teacher-form"><label className="field"><span>Ad Soyad *</span><input value={teacher.name} onChange={e=>setTeacher({...teacher,name:e.target.value})} placeholder="Öğretmen adı soyadı"/></label><label className="field"><span>Branş</span><input value={teacher.branch} onChange={e=>setTeacher({...teacher,branch:e.target.value})} placeholder="Sınıf öğretmeni / Branş"/></label><label className="field"><span>Telefon</span><input value={teacher.phone} onChange={e=>setTeacher({...teacher,phone:e.target.value})} placeholder="05xx xxx xx xx"/></label><label className="field"><span>E-posta</span><input type="email" value={teacher.email} onChange={e=>setTeacher({...teacher,email:e.target.value})} placeholder="ogretmen@okul.com"/></label><div className="teacher-actions"><button className="secondary" onClick={()=>setEditingTeacher(false)}>Vazgeç</button><button className="primary" disabled={!teacher.name.trim()} onClick={saveTeacher}>Kaydet</button></div></div>:<div className="teacher-summary"><div><small>Ad Soyad</small><b>{existingTeacher.name||'Henüz girilmedi'}</b></div><div><small>Branş</small><b>{existingTeacher.branch||'—'}</b></div><div><small>Telefon</small><b>{existingTeacher.phone||'—'}</b></div><div><small>E-posta</small><b>{existingTeacher.email||'—'}</b></div></div>}</section>
      <section className="card class-detail-card"><h2>Sınıf Bilgileri</h2><p className="muted">Sınıfın temel bilgileri</p><div className="teacher-summary"><div><small>Eğitim öğretim yılı</small><b>{cls.academicYear||'Belirtilmedi'}</b></div><div><small>Öğrenci sayısı</small><b>{cls.students.length}</b></div><div><small>Bağlı belge</small><b>{classDocs.length+studentDocs.length}</b></div><div><small>Ders sayısı</small><b>{lessons.length}</b></div></div></section>
    </div>
    <section className="card class-detail-card"><div className="section-head"><div><h2>Öğrenciler</h2><p className="muted">Öğrenci satırına dokunarak detayını açabilirsin.</p></div><div className="class-detail-actions"><button className="secondary" onClick={onImportStudents}>Toplu Aktar</button><button className="secondary" onClick={onAddStudent}><Plus size={16}/> Öğrenci Ekle</button></div></div><div style={{overflowX:'auto'}}><table className="class-student-table"><thead><tr><th>No</th><th>Öğrenci No</th><th>Ad Soyad</th><th>Veli</th><th>Telefon</th><th></th></tr></thead><tbody>{cls.students.map((s,i)=><tr className="student-row" key={s.id}><td>{i+1}</td><td>{s.studentNumber||'—'}</td><td><b>{`${s.firstName} ${s.lastName}`.trim()}</b></td><td>{s.parentName||s.secondParentName||'—'}</td><td>{s.parentPhone||s.secondParentPhone||'—'}</td><td><button className="icon-btn danger student-actions" onClick={e=>{e.stopPropagation();onDeleteStudent(s.id)}}>×</button></td></tr>)}</tbody></table>{!cls.students.length&&<div className="empty">Henüz öğrenci eklenmedi.</div>}</div></section>
    <div className="class-info-grid">
      <section className="card class-detail-card"><div className="section-head"><div><h2>Haftalık Dersler</h2><p className="muted">Bu sınıfa ait program</p></div><button className="secondary" onClick={onProgram}>Düzenle</button></div><div className="class-lesson-list">{lessons.map(x=><div className="class-lesson" key={x.id}><span><b>{days[x.day]||'Gün' } · {x.start}–{x.end}</b><small>{x.lesson}{x.isMyLesson?' · Benim dersim':''}</small></span></div>)}{!lessons.length&&<div className="empty">Henüz ders eklenmedi.</div>}</div></section>
      <section className="card class-detail-card"><div className="section-head"><div><h2>Belgeler</h2><p className="muted">Sınıf ve öğrencileriyle ilişkili belgeler</p></div><button className="secondary" onClick={onDocument}>Belgeleri Aç</button></div><div className="class-doc-summary"><b>{classDocs.length+studentDocs.length} belge</b><span className="muted">Sınıf: {classDocs.length} · Öğrenci: {studentDocs.length}</span></div></section>
    </div>
    <section className="card class-detail-card"><div className="section-head"><div><h2>Sınıf İşlemleri</h2><p className="muted">Arşivleme ve silme işlemleri burada.</p></div><div className="class-detail-actions"><button className="secondary" onClick={onArchive}>Arşivle</button><button className="secondary" onClick={onDeleteClass}>Sınıfı Sil</button></div></div></section>
  </main>
}

function Groups({ classes, groups, setGroups, setError }) { const [name,setName]=useState(''); const [selected,setSelected]=useState([]); const add=()=>{try{setGroups(v=>createGroupDomain(v,name,selected,uid()));setName('');setSelected([]);setError('')}catch(e){setError(errorText(e))}}; const remove=(id)=>{if(!window.confirm('Bu grubu silmek istediğinizden emin misiniz?'))return;setGroups(v=>deleteGroupDomain(v,id));setError('')}; return <main className="content"><div className="page-head"><div><p className="eyebrow">Organizasyon</p><h1>Gruplar</h1><p className="muted">İstersen sınıfları üst gruplar altında toplayabilirsin.</p></div></div><section className="card form-card"><div className="section-title"><FolderOpen size={18}/> Yeni Grup</div><div className="inline-form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Örn. Sabah Grubu"/><button className="primary" onClick={add}><Plus size={17}/> Oluştur</button></div><div className="check-grid">{classes.map(c=><label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}<small>{c.students.length} öğrenci</small></label>)}</div></section><div className="group-grid">{groups.map(g=><div className="group-card" key={g.id}><div className="panel-icon"><FolderOpen size={20}/></div><div><b>{g.name}</b><span>{(g.classIds||[]).map(id=>classes.find(c=>c.id===id)?.name).filter(Boolean).join(', ')||'Sınıf atanmadı'}</span></div><button className="icon-btn danger" onClick={()=>remove(g.id)}><Trash2 size={16}/></button></div>)}</div></main> }

function Schedule({ classes, schedule }) { const [day,setDay]=useState(todayIndex()); const items=schedule.filter(x=>x.scope!=='classProgram'&&x.day===day).sort((a,b)=>mins(a.start)-mins(b.start)); return <main className="content"><div className="page-head"><div><p className="eyebrow">Haftalık plan</p><h1>Ders Programı</h1><p className="muted">Burada yalnızca senin gireceğin dersler görünür. Bir sınıfın tam programı sınıf sayfasından yönetilir.</p></div></div><div className="day-strip">{DAYS.map((d,i)=><button key={d} className={day===i?'day-chip active':'day-chip'} onClick={()=>setDay(i)}><span>{d.slice(0,3)}</span><b>{dayDate(i).getDate()}</b></button>)}</div><section className="card"><div className="section-head"><div><div className="section-title"><Clock3 size={18}/> {DAYS[day]}</div><p className="muted">{items.length} ders</p></div></div><div className="schedule-manage">{items.map(x=><div key={x.id}><span><b>{x.start}–{x.end}</b><small>{x.lesson} · {classes.find(c=>c.id===x.classId)?.name || 'Silinmiş sınıf'}</small></span></div>)}{!items.length&&<div className="empty">Bu güne henüz sana ait ders eklenmemiş. Sınıfın tam programından kendi dersini işaretleyebilirsin.</div>}</div></section></main> }

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
  const remove=async d=>{if(!window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?'))return;try{if(d.storagePath)await deleteObject(ref(storage,d.storagePath))}catch(err){if(err.code!=='storage/object-not-found')console.error(err)}setDocuments(v=>deleteDocumentDomain(v,d.id))}
  const labelFor=d=>{if(d.targetType==='class')return classes.find(c=>c.id===d.targetId)?.name||'Kayıt silinmiş';if(d.targetType==='group')return groups.find(g=>g.id===d.targetId)?.name||'Kayıt silinmiş';const s=allStudents.find(x=>x.id===d.targetId);return s?`${s.firstName} ${s.lastName} · ${s.className}`:'Öğrenci silinmiş'}
  return <main className="content"><div className="page-head"><div><p className="eyebrow">Dosyalar</p><h1>Belgeler</h1><p className="muted">Dosyayı yüklemeden önce ilişkili kayıt türünü seç.</p></div><label className={`primary upload ${busy?'disabled':''}`}><Upload size={17}/>{busy?'Yükleniyor…':'Dosya Seç'}<input type="file" onChange={upload} disabled={busy}/></label></div>{error&&<Notice message={error}/>}<section className="card form-card"><div className="section-title"><FileText size={18}/> İlişkilendirme</div><div className="form-grid"><Field label="Kayıt türü"><select value={targetType} onChange={e=>{setTargetType(e.target.value);setTargetId('')}}><option value="class">Sınıf</option><option value="student">Öğrenci</option><option value="group">Grup</option></select></Field><Field label="Kayıt"><select value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Seçin</option>{targetOptions.map(x=><option key={x.id} value={x.id}>{targetType==='student'?`${x.firstName} ${x.lastName} · ${x.className}`:x.name}</option>)}</select></Field></div><p className="hint">Belgeler Firebase Storage'da kullanıcı hesabınıza özel klasörde saklanır ve yalnızca seçtiğiniz kayıtla ilişkilendirilir.</p></section><section className="card"><div className="section-title"><FolderOpen size={18}/> Yüklenenler</div><div className="doc-list">{documents.map(d=><div className="doc-row" key={d.id}><span className="doc-icon"><FileText size={18}/></span><span><b>{d.name}</b><small>{d.targetType==='class'?'Sınıf':d.targetType==='group'?'Grup':'Öğrenci'} · {labelFor(d)} · {(d.size/1024).toFixed(0)} KB</small></span>{d.downloadUrl?<a className="download" href={d.downloadUrl} target="_blank" rel="noreferrer">Aç</a>:d.data?<a className="download" href={d.data} download={d.name}>Aç</a>:<span className="hint">Dosya yok</span>}<button className="icon-btn danger" onClick={()=>remove(d)}><Trash2 size={16}/></button></div>)}{!documents.length&&<div className="empty">Henüz belge yüklenmedi.</div>}</div></section></main>
}

function ClassModal({onClose,onSave}){const [name,setName]=useState('');const [academicYear,setAcademicYear]=useState(academicYearOptions[1]);return <Modal title="Yeni Sınıf" onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(name,academicYear)}}><Field label="Eğitim öğretim yılı"><select value={academicYear} onChange={e=>setAcademicYear(e.target.value)}>{academicYearOptions.map(y=><option key={y} value={y}>{y}</option>)}</select></Field><Field label="Sınıf adı"><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Örn. 3-A"/></Field><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button className="primary">Oluştur</button></div></form></Modal>}
function StudentImportModal({onClose,onImport}) {
  const [file,setFile]=useState(null),[rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(false)
  const norm=x=>String(x??'').replace(/^\ufeff/,'').trim().toLocaleLowerCase('tr')
  const clean=x=>String(x??'').trim()
  const map={no:['öğrenci no','ogrenci no','öğrenci numarası','ogrenci numarasi','student number','studentnumber'],ad:['ad','adı','isim','first name','firstname'],soyad:['soyad','soyadı','last name','lastname'],anne:['anne','anne telefonu','anne numarası','anne numarasi','mother phone'],baba:['baba','baba telefonu','baba numarası','baba numarasi','father phone']}
  const parse=raw=>{if(!raw.length)return [];const h=raw[0].map(norm),known=Object.values(map).flat(),has=h.some(x=>known.includes(x)),data=has?raw.slice(1):raw;const pick=(r,names)=>{for(const n of names){const i=h.indexOf(n);if(i>=0)return r[i]??''}return ''};return data.map(r=>has?{studentNumber:pick(r,map.no),firstName:pick(r,map.ad),lastName:pick(r,map.soyad),parentPhone:clean(pick(r,map.anne)),fatherPhone:clean(pick(r,map.baba))}:{studentNumber:r[1]??'',firstName:r[2]??'',lastName:r[3]??'',parentPhone:clean(r[7]),fatherPhone:clean(r[8])}).map(x=>({...x,studentNumber:clean(x.studentNumber),firstName:clean(x.firstName),lastName:clean(x.lastName)})).filter(x=>x.firstName||x.lastName)}
  const readFile=async f=>{setFile(f);setRows([]);setError('');setLoading(true);try{const wb=XLSX.read(await f.arrayBuffer(),{type:'array',raw:true,cellText:false,cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}),parsed=parse(raw);if(!parsed.length)throw new Error('Dosyada öğrenci adı bulunamadı.');setRows(parsed)}catch(e){setError(e instanceof Error?e.message:'Dosya okunamadı.')}finally{setLoading(false)}}
  return <Modal title="Toplu Öğrenci Aktar" onClose={onClose} wide><p className="muted">Orijinal listedeki B=Öğrenci No, C=Ad, D=Soyad, H=Anne telefonu, I=Baba telefonu alınır. G ve cinsiyet alınmaz.</p><label className="file-picker"><Upload size={18}/><span>{file?file.name:'Dosya seç'}</span><input type="file" accept=".xlsx,.xls,.csv,.txt,text/plain,text/csv" onChange={e=>e.target.files?.[0]&&readFile(e.target.files[0])}/></label>{loading&&<div className="empty">Dosya okunuyor…</div>}{error&&<Notice message={error}/>} {!loading&&!error&&rows.length>0&&<div className="import-preview"><b>{rows.length} öğrenci bulundu</b>{rows.slice(0,12).map((r,i)=><div key={i}><b>{r.studentNumber||'—'}</b> · {r.firstName} {r.lastName}{r.parentPhone?' · Anne: '+r.parentPhone:''}{r.fatherPhone?' · Baba: '+r.fatherPhone:''}</div>)}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button type="button" className="primary" disabled={!rows.length||loading} onClick={()=>onImport(rows)}>Aktar</button></div></Modal>
}
function StudentModal({onClose,onSave}){const [studentNumber,setStudentNumber]=useState(''),[first,setFirst]=useState(''),[last,setLast]=useState(''),[birthDate,setBirthDate]=useState(''),[gender,setGender]=useState(''),[parentName,setParentName]=useState(''),[parentPhone,setParentPhone]=useState(''),[secondParentName,setSecondParentName]=useState(''),[secondParentPhone,setSecondParentPhone]=useState(''),[address,setAddress]=useState('');return <Modal title="Öğrenci Ekle" onClose={onClose} wide><form onSubmit={e=>{e.preventDefault();onSave(first,last,{studentNumber,birthDate,gender,parentName,parentPhone,secondParentName,secondParentPhone,address})}}><div className="form-grid"><Field label="Öğrenci numarası"><input autoFocus value={studentNumber} onChange={e=>setStudentNumber(e.target.value)} placeholder="Örn. 2035" inputMode="numeric" /></Field><Field label="Ad"><input value={first} onChange={e=>setFirst(e.target.value)} /></Field><Field label="Soyad"><input value={last} onChange={e=>setLast(e.target.value)} /></Field><Field label="Doğum tarihi"><input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></Field><Field label="Cinsiyet"><select value={gender} onChange={e=>setGender(e.target.value)}><option value="">Belirtilmedi</option><option value="Kız">Kız</option><option value="Erkek">Erkek</option></select></Field><Field label="Veli adı soyadı"><input value={parentName} onChange={e=>setParentName(e.target.value)} /></Field><Field label="Veli telefonu"><input type="tel" value={parentPhone} onChange={e=>setParentPhone(e.target.value)} /></Field><Field label="İkinci veli adı soyadı"><input value={secondParentName} onChange={e=>setSecondParentName(e.target.value)} /></Field><Field label="İkinci veli telefonu"><input type="tel" value={secondParentPhone} onChange={e=>setSecondParentPhone(e.target.value)} /></Field><Field label="Adres"><textarea value={address} onChange={e=>setAddress(e.target.value)} /></Field></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button className="primary">Ekle</button></div></form></Modal>}
function QuickModal({onClose,onClass,onSchedule,onDocument}){return <Modal title="Yeni kayıt" onClose={onClose}><div className="quick-menu"><button onClick={onClass}><Users size={19}/> Sınıf oluştur<ChevronRight size={17}/></button><button onClick={onDocument}><FileText size={19}/> Belge yükle<ChevronRight size={17}/></button></div></Modal>}
