import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Printer, UsersRound } from 'lucide-react'
import * as XLSX from 'xlsx'
import './reportsSettings.css'

const rowsFor = (classes, mode) => {
  const rows = []
  classes.forEach(cls => (cls.students || []).forEach((s, i) => rows.push({
    No: i + 1,
    Sınıf: cls.name,
    Öğrenci: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
    ÖğrenciNo: s.studentNumber || '',
    DoğumTarihi: s.birthDate || '',
    Veli: s.parentName || '',
    VeliTelefon: s.parentPhone || '',
    İkinciVeli: s.secondParentName || '',
    İkinciVeliTelefon: s.secondParentPhone || '',
    Adres: s.address || '',
  }))
  return mode === 'parents' ? rows.filter(r => r.Veli || r.VeliTelefon || r.İkinciVeli || r.İkinciVeliTelefon) : rows
}

export default function ReportsPage({ classes = [] }) {
  const [mode, setMode] = useState('students')
  const [classId, setClassId] = useState('all')
  const filteredClasses = classId === 'all' ? classes : classes.filter(c => c.id === classId)
  const rows = useMemo(() => rowsFor(filteredClasses, mode), [filteredClasses, mode])
  const totalStudents = classes.reduce((n, c) => n + (c.students || []).length, 0)

  const print = () => window.print()
  const excel = () => {
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, mode === 'parents' ? 'Veli Listesi' : 'Öğrenci Listesi')
    XLSX.writeFile(book, mode === 'parents' ? 'veli-listesi.xlsx' : 'ogrenci-listesi.xlsx')
  }

  return <main className="content reports-page">
    <div className="welcome reports-toolbar">
      <div><p className="eyebrow">Raporlama</p><h1>Çıktılar ve Raporlar</h1><p className="muted">Sınıf, öğrenci ve veli listelerini yazdırabilir veya Excel olarak dışa aktarabilirsin.</p></div>
      <div className="report-actions"><button className="secondary" onClick={excel}><FileSpreadsheet size={18}/> Excel</button><button className="primary" onClick={print}><Printer size={18}/> Yazdır / PDF</button></div>
    </div>
    <section className="report-summary"><div><UsersRound size={20}/><b>{classes.length}</b><span>Aktif sınıf</span></div><div><UsersRound size={20}/><b>{totalStudents}</b><span>Toplam öğrenci</span></div><div><UsersRound size={20}/><b>{rows.length}</b><span>Rapor satırı</span></div></section>
    <section className="card report-card">
      <div className="report-filters"><label className="field"><span>Rapor türü</span><select value={mode} onChange={e => setMode(e.target.value)}><option value="students">Öğrenci Listesi</option><option value="parents">Veli İletişim Listesi</option></select></label><label className="field"><span>Sınıf</span><select value={classId} onChange={e => setClassId(e.target.value)}><option value="all">Tüm sınıflar</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      <div className="report-print-head"><h2>{mode === 'parents' ? 'Veli İletişim Listesi' : 'Öğrenci Listesi'}</h2><span>{classId === 'all' ? 'Tüm sınıflar' : filteredClasses[0]?.name}</span></div>
      <div className="report-table-wrap"><table className="report-table"><thead><tr>{mode === 'parents' ? <><th>Sınıf</th><th>Öğrenci</th><th>Veli</th><th>Telefon</th><th>İkinci Veli</th><th>Telefon</th></> : <><th>Sınıf</th><th>Öğrenci</th><th>Öğrenci No</th><th>Doğum Tarihi</th><th>Veli</th><th>Veli Telefon</th></>}</tr></thead><tbody>{rows.map((r, i) => mode === 'parents' ? <tr key={i}><td>{r.Sınıf}</td><td>{r.Öğrenci}</td><td>{r.Veli || '—'}</td><td>{r.VeliTelefon || '—'}</td><td>{r.İkinciVeli || '—'}</td><td>{r.İkinciVeliTelefon || '—'}</td></tr> : <tr key={i}><td>{r.Sınıf}</td><td>{r.Öğrenci}</td><td>{r.ÖğrenciNo || '—'}</td><td>{r.DoğumTarihi || '—'}</td><td>{r.Veli || '—'}</td><td>{r.VeliTelefon || '—'}</td></tr>)}</tbody></table>{!rows.length && <div className="empty">Bu rapor için henüz veri bulunmuyor.</div>}</div>
    </section>
    <div className="print-note"><Download size={16}/> Yazdır ekranında hedef olarak “PDF olarak kaydet” seçeneğini kullanabilirsin.</div>
  </main>
}
