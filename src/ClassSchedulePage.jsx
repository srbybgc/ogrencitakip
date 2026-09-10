import { useMemo, useState } from 'react'
import { ChevronLeft, Clock3, Plus, Trash2 } from 'lucide-react'
import { addLesson as addLessonDomain, deleteLesson as deleteLessonDomain } from './domain'

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']
const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const mins = t => { const [h,m] = t.split(':').map(Number); return h * 60 + m }

export default function ClassSchedulePage({ cls, schedule, setSchedule, setError, onBack }) {
  const [day, setDay] = useState(new Date().getDay() >= 1 && new Date().getDay() <= 5 ? new Date().getDay() - 1 : 0)
  const [form, setForm] = useState({ start:'08:40', end:'09:20', lesson:'', isMyLesson:false })
  const lessons = useMemo(() => schedule.filter(x => x.classId === cls?.id && x.scope === 'classProgram' && x.day === day).sort((a,b) => mins(a.start) - mins(b.start)), [schedule, cls?.id, day])
  const total = schedule.filter(x => x.classId === cls?.id && x.scope === 'classProgram').length
  if (!cls) return null
  const add = () => { try { const next = addLessonDomain(schedule, { day, start:form.start, end:form.end, classId:cls.id, lesson:form.lesson, scope:'classProgram', isMyLesson:form.isMyLesson }, uid()); setSchedule(next); setForm(v => ({ ...v, lesson:'' })); setError('') } catch (e) { setError(e instanceof Error ? e.message : 'Ders eklenemedi.') } }
  const remove = id => { if (!window.confirm('Bu ders programı kaydını silmek istediğinizden emin misiniz?')) return; setSchedule(v => deleteLessonDomain(v, id)); setError('') }
  return <main className="content">
    <div className="page-head"><div><button className="back-btn" onClick={onBack}><ChevronLeft size={17}/> Sınıf</button><p className="eyebrow">Sınıf ders programı</p><h1>{cls.name}</h1><p className="muted">Haftalık programı burada düzenle. Yalnızca “Benim dersim” seçilen dersler öğretmenin ana programına aktarılır.</p></div></div>
    <div className="day-strip class-program-days">{DAYS.map((name, i) => <button key={name} className={day === i ? 'day-chip active' : 'day-chip'} onClick={() => setDay(i)}><span>{name.slice(0,3)}</span><b>{lessons.length && day === i ? lessons.length : ''}</b><small>{i === new Date().getDay() - 1 ? 'Bugün' : 'Haftalık program'}</small></button>)}</div>
    <section className="card class-program-editor"><div className="section-head"><div><div className="section-title"><Plus size={18}/> Ders Ekle</div><p className="muted">{DAYS[day]} gününe yeni ders ekle.</p></div></div><div className="form-grid class-program-form"><label className="field"><span>Başlangıç</span><select value={form.start} onChange={e => setForm({...form,start:e.target.value})}>{TIMES.map(t => <option key={t}>{t}</option>)}</select></label><label className="field"><span>Bitiş</span><select value={form.end} onChange={e => setForm({...form,end:e.target.value})}>{TIMES.map(t => <option key={t}>{t}</option>)}</select></label><label className="field"><span>Ders</span><input value={form.lesson} onChange={e => setForm({...form,lesson:e.target.value})} placeholder="Örn. Robotik Kodlama" /></label><button className="primary" onClick={add}><Plus size={16}/> Ekle</button></div><label className="my-lesson-toggle"><input type="checkbox" checked={form.isMyLesson} onChange={e => setForm({...form,isMyLesson:e.target.checked})}/><span><b>Benim dersim</b><small>İşaretlersen ana öğretmen programında da görünür.</small></span></label></section>
    <section className="card"><div className="section-head"><div><div className="section-title"><Clock3 size={18}/> {DAYS[day]} Programı</div><p className="muted">{lessons.length} ders · haftalık toplam {total}</p></div></div><div className="class-program-list">{lessons.map(x => <div className="class-program-row" key={x.id}><div className="program-time"><b>{x.start}</b><span>{x.end}</span></div><div className="program-main"><b>{x.lesson}</b><small>{x.isMyLesson ? 'Benim dersim · Öğretmen programında' : 'Sadece sınıf programında'}</small></div>{x.isMyLesson && <span className="program-badge">Benim dersim</span>}<button className="icon-btn danger" title="Dersi sil" onClick={() => remove(x.id)}><Trash2 size={16}/></button></div>)}{!lessons.length && <div className="empty">{DAYS[day]} günü için henüz ders eklenmedi.</div>}</div></section>
  </main>
}

// Dedicated page: class schedule is a normal App view, not an overlay.
// Final verification + deploy trigger.
