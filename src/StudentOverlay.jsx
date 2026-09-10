import { useEffect, useMemo, useState } from 'react'
import { addStudentRecord, checkStudentRecordIntegrity, deleteStudentRecord } from './studentRecords'

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const read = (key, fallback = []) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const dateKey = () => {
  const d = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
const fullName = student => `${student.firstName} ${student.lastName}`.trim()

export default function StudentOverlay() {
  const [student, setStudent] = useState(null)
  const [dataVersion, setDataVersion] = useState(0)
  const [recordType, setRecordType] = useState('note')
  const [text, setText] = useState('')
  const [date, setDate] = useState(dateKey())
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState({})

  useEffect(() => {
    const onClick = event => {
      const row = event.target.closest?.('.student-row')
      if (!row || event.target.closest('button,a,input,select,textarea')) return
      const name = row.querySelector('b')?.textContent?.trim()
      if (!name) return
      const content = row.closest('.content')
      const className = content?.querySelector('.detail-head h1')?.textContent?.trim()
      const classes = read('ot-classes')
      const candidates = classes
        .filter(cls => !className || cls.name === className)
        .flatMap(cls => (cls.students || []).map(s => ({ ...s, className: cls.name })))
        .filter(s => fullName(s) === name)
      const found = candidates.length === 1 ? candidates[0] : candidates.find(s => s.className === className)
      if (found) {
        setStudent(found)
        setRecordType('note')
        setText('')
        setDate(dateKey())
        setError('')
        setEditing(false)
        setEdit({ ...found })
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (!student) return undefined
    const syncRecords = () => {
      const classes = read('ot-classes')
      const records = read('ot-student-records')
      const result = checkStudentRecordIntegrity(classes, records)
      if (!result.ok) write('ot-student-records', result.records)
      if (!classes.some(cls => (cls.students || []).some(item => item.id === student.id))) setStudent(null)
      setDataVersion(v => v + 1)
    }
    syncRecords()
    const timer = setInterval(syncRecords, 1000)
    return () => clearInterval(timer)
  }, [student])

  const records = useMemo(() => read('ot-student-records').filter(item => item.studentId === student?.id).sort((a, b) => `${b.date || ''}${b.createdAt || ''}`.localeCompare(`${a.date || ''}${a.createdAt || ''}`)), [student, dataVersion])
  const documents = useMemo(() => read('ot-documents').filter(item => item.targetType === 'student' && item.targetId === student?.id), [student, dataVersion])

  if (!student) return null

  const addRecord = () => {
    try {
      const record = { studentId: student.id, type: recordType, text: text.trim(), date, createdAt: new Date().toISOString() }
      const next = addStudentRecord(read('ot-student-records'), record, uid())
      write('ot-student-records', next)
      setText('')
      setError('')
      setDataVersion(v => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt eklenemedi.')
    }
  }

  const addAttendance = status => {
    try {
      const record = { studentId: student.id, type: 'attendance', text: status, status, date, createdAt: new Date().toISOString() }
      const next = addStudentRecord(read('ot-student-records'), record, uid())
      write('ot-student-records', next)
      setError('')
      setDataVersion(v => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yoklama kaydedilemedi.')
    }
  }

  const removeRecord = id => {
    if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return
    write('ot-student-records', deleteStudentRecord(read('ot-student-records'), id))
    setDataVersion(v => v + 1)
  }

  return <div style={styles.backdrop} onMouseDown={() => setStudent(null)}>
    <div style={styles.panel} onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${student.firstName} ${student.lastName} öğrenci detayları`}>
      <div style={styles.head}>
        <div style={styles.identity}>
          <span style={styles.avatar}>{student.firstName?.[0]}{student.lastName?.[0] || ''}</span>
          <div><small style={styles.eyebrow}>Öğrenci · {student.className}</small><h2 style={styles.title}>{student.firstName} {student.lastName}</h2></div>
        </div>
        <button className="icon-btn" onClick={() => setStudent(null)} aria-label="Kapat">×</button>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

      <section className="card" style={styles.card}>
        <div className="section-head"><div className="section-title">Öğrenci Bilgileri</div><button className="secondary small" onClick={()=>{setEditing(v=>!v);setEdit({...student})}}>{editing?'Vazgeç':'Düzenle'}</button></div>
        {editing ? <div className="form-grid" style={{marginTop:12}}>
          <label className="field"><span>Ad</span><input value={edit.firstName||''} onChange={e=>setEdit(v=>({...v,firstName:e.target.value}))}/></label>
          <label className="field"><span>Soyad</span><input value={edit.lastName||''} onChange={e=>setEdit(v=>({...v,lastName:e.target.value}))}/></label>
          <label className="field"><span>Doğum tarihi</span><input type="date" value={edit.birthDate||''} onChange={e=>setEdit(v=>({...v,birthDate:e.target.value}))}/></label>
          <label className="field"><span>Cinsiyet</span><select value={edit.gender||''} onChange={e=>setEdit(v=>({...v,gender:e.target.value}))}><option value="">Belirtilmedi</option><option>Kız</option><option>Erkek</option></select></label>
          <label className="field"><span>Veli adı soyadı</span><input value={edit.parentName||''} onChange={e=>setEdit(v=>({...v,parentName:e.target.value}))}/></label>
          <label className="field"><span>Veli telefonu</span><input type="tel" value={edit.parentPhone||''} onChange={e=>setEdit(v=>({...v,parentPhone:e.target.value}))}/></label>
          <label className="field"><span>İkinci veli adı soyadı</span><input value={edit.secondParentName||''} onChange={e=>setEdit(v=>({...v,secondParentName:e.target.value}))}/></label>
          <label className="field"><span>İkinci veli telefonu</span><input type="tel" value={edit.secondParentPhone||''} onChange={e=>setEdit(v=>({...v,secondParentPhone:e.target.value}))}/></label>
          <label className="field" style={{gridColumn:'1 / -1'}}><span>Adres</span><textarea value={edit.address||''} onChange={e=>setEdit(v=>({...v,address:e.target.value}))}/></label>
          <button className="primary" onClick={()=>{if(!edit.firstName?.trim()){setError('Öğrenci adı boş bırakılamaz.');return}const classes=read('ot-classes');const next=classes.map(c=>({...c,students:(c.students||[]).map(x=>x.id===student.id?{...x,...edit,firstName:edit.firstName.trim(),lastName:(edit.lastName||'').trim()}:x)}));write('ot-classes',next);location.reload()}}>Bilgileri Kaydet</button>
        </div> : <div style={styles.infoGrid}>
          <div><small>Doğum tarihi</small><b>{student.birthDate ? dateLabel(student.birthDate) : 'Belirtilmedi'}</b></div>
          <div><small>Cinsiyet</small><b>{student.gender || 'Belirtilmedi'}</b></div>
          <div><small>Veli</small><b>{student.parentName || 'Belirtilmedi'}</b></div>
          <div><small>Veli telefonu</small><b>{student.parentPhone || 'Belirtilmedi'}</b></div>
          <div><small>İkinci veli</small><b>{student.secondParentName || 'Belirtilmedi'}</b></div>
          <div><small>İkinci veli telefonu</small><b>{student.secondParentPhone || 'Belirtilmedi'}</b></div>
          <div style={{gridColumn:'1 / -1'}}><small>Adres</small><b>{student.address || 'Belirtilmedi'}</b></div>
        </div>}
      </section>

      <div style={styles.grid}>
        <section className="card" style={styles.card}>
          <div className="section-title">Bugünkü Yoklama</div>
          <p className="muted">{dateLabel(date)}</p>
          <div style={styles.attendance}>
            {['Geldi', 'Gelmedi', 'İzinli'].map(status => <button key={status} className="secondary" onClick={() => addAttendance(status)}>{status}</button>)}
          </div>
          <div style={styles.dateWrap}><label className="field"><span>Tarih</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>
        </section>

        <section className="card" style={styles.card}>
          <div className="section-title">Yeni Kayıt</div>
          <div style={styles.typeRow}>
            <button className={recordType === 'note' ? 'primary small' : 'secondary'} onClick={() => setRecordType('note')}>Not</button>
            <button className={recordType === 'event' ? 'primary small' : 'secondary'} onClick={() => setRecordType('event')}>Olay</button>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={recordType === 'note' ? 'Öğrenci hakkında kısa not…' : 'Gerçekleşen olay / görüşme…'} style={styles.textarea} />
          <button className="primary" onClick={addRecord}>Kaydet</button>
        </section>
      </div>

      <section className="card" style={styles.card}>
        <div className="section-head"><div><div className="section-title">Öğrenci Geçmişi</div><p className="muted">Notlar, olaylar ve yoklama kayıtları</p></div><span className="hint">{records.length} kayıt</span></div>
        <div style={styles.history}>
          {records.map(record => <div key={record.id} style={styles.record}>
            <div style={styles.recordTop}><b>{record.type === 'attendance' ? 'Yoklama' : record.type === 'event' ? 'Olay' : 'Not'}</b><small>{record.date ? dateLabel(record.date) : 'Tarihsiz'}</small></div>
            <div style={styles.recordBody}>{record.text || record.status || '—'}</div>
            <button className="icon-btn danger" onClick={() => removeRecord(record.id)} aria-label="Kaydı sil">×</button>
          </div>)}
          {!records.length && <div className="empty">Bu öğrenci için henüz kayıt yok.</div>}
        </div>
      </section>

      {documents.length > 0 && <section className="card" style={styles.card}>
        <div className="section-title">Öğrenci Belgeleri</div>
        <div style={styles.docs}>{documents.map(doc => <a key={doc.id} href={doc.downloadUrl || doc.data} target="_blank" rel="noreferrer" style={styles.doc}>{doc.name}<span>{doc.type || 'Belge'}</span></a>)}</div>
      </section>}
    </div>
  </div>
}

const styles = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(12,20,34,.46)', display: 'grid', placeItems: 'center', padding: 16 },
  panel: { width: 'min(820px,100%)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', background: '#f5f7fb', borderRadius: 20, padding: 18, boxShadow: '0 24px 80px rgba(10,20,40,.28)' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 14 },
  identity: { display: 'flex', alignItems: 'center', gap: 11 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: '#e7ebf1', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#536076' },
  eyebrow: { display: 'block', color: '#7a8497', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 },
  title: { margin: 0, fontSize: 24, letterSpacing: '-.03em', color: '#172033' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 12 },
  card: { marginBottom: 10 },
  attendance: { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 },
  dateWrap: { marginTop: 12 },
  typeRow: { display: 'flex', gap: 7, margin: '12px 0 9px' },
  textarea: { width: '100%', minHeight: 84, resize: 'vertical', border: '1px solid #dfe4eb', borderRadius: 9, padding: 10, outline: 0, font: 'inherit', color: '#253047', marginBottom: 9 },
  history: { display: 'grid', gap: 7 },
  record: { position: 'relative', border: '1px solid #edf0f4', borderRadius: 11, padding: 11, paddingRight: 48, background: '#fafbfc' },
  recordTop: { display: 'flex', gap: 10, alignItems: 'center' },
  recordBody: { marginTop: 5, color: '#4f5b6e', fontSize: 12, whiteSpace: 'pre-wrap' },
  docs: { display: 'grid', gap: 7, marginTop: 12 },
  doc: { display: 'flex', justifyContent: 'space-between', gap: 10, border: '1px solid #edf0f4', borderRadius: 10, padding: 10, color: '#415a7a', textDecoration: 'none', fontSize: 12 },
}
