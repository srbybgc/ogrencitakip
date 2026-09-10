from pathlib import Path
import re

p=Path('src/App.jsx')
s=p.read_text()

# Imports
s=s.replace("import ReferenceDashboard from './ReferenceDashboard'", "import ReferenceDashboard from './ReferenceDashboard'\nimport ReportsPage from './ReportsPage'\nimport SettingsPage from './SettingsPage'")
s=s.replace("Clock3, FileText, FileText as FileTextIcon", "Clock3, FileSpreadsheet, FileText, FileText as FileTextIcon")

# Sidebar: reports and working settings button
needle='<button className={view===\'documents\'?\'nav-active\':\'\'} onClick={()=>setView(\'documents\')}><FileTextIcon size={22}/><span>Belgeler</span></button></nav>'
replacement=needle[:-6] + "<button className={view==='reports'?'nav-active':''} onClick={()=>setView('reports')}><FileSpreadsheet size={22}/><span>Raporlar</span></button></nav>"
if needle not in s:
    raise SystemExit('sidebar insertion point not found')
s=s.replace(needle,replacement,1)
s=s.replace("<button><Settings size={22}/><span>Ayarlar</span></button>", "<button className={view==='settings'?'nav-active':''} onClick={()=>setView('settings')}><Settings size={22}/><span>Ayarlar</span></button>",1)

# Route components
needle="{view === 'documents' && <Documents classes={activeClasses} groups={groups} documents={documents} setDocuments={setDocuments} />}"
replacement=needle+"\n    {view === 'reports' && <ReportsPage classes={activeClasses} />}\n    {view === 'settings' && <SettingsPage />}"
if needle not in s: raise SystemExit('route insertion point not found')
s=s.replace(needle,replacement,1)

# Give class detail access to class setter for teacher info.
s=s.replace("onDeleteStudent={deleteStudent} onDeleteClass={deleteClass} onArchive", "onDeleteStudent={deleteStudent} onDeleteClass={deleteClass} setClasses={setClasses} onArchive",1)

# Replace ClassDetail with a clean direct module. Keep student-row hooks for the existing student detail panel.
start=s.index('function ClassDetail(')
end=s.index('function Groups(', start)
new=r'''function ClassDetail({ cls, schedule, documents, onBack, onAddStudent, onDeleteStudent, onDeleteClass, onDocument, onImportStudents, onArchive, onProgram, setClasses }) {
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

'''
s=s[:start]+new+s[end:]

p.write_text(s)
print('updated App.jsx')
