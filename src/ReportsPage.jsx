import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Printer, UsersRound, UserRound, Phone, Check, RotateCcw } from 'lucide-react'
import * as XLSX from 'xlsx'
import './reportsSettings.css'

const FIELDS=[
  ['class','Sınıf'],['studentNumber','Öğrenci No'],['firstName','Öğrenci Adı'],['lastName','Öğrenci Soyadı'],['birthDate','Doğum Tarihi'],
  ['parentName','Anne Adı'],['parentPhone','Anne Telefonu'],['secondParentName','Baba Adı'],['secondParentPhone','Baba Telefonu'],['address','Adres']
]
const PRESETS={
  full:FIELDS.map(x=>x[0]), student:['class','studentNumber','firstName','lastName','birthDate'],
  parents:['class','firstName','lastName','parentName','parentPhone','secondParentName','secondParentPhone'],
  contact:['firstName','lastName','parentPhone','secondParentPhone']
}
const value=(s,cls,key)=>({class:cls.name,studentNumber:s.studentNumber,firstName:s.firstName,lastName:s.lastName,birthDate:s.birthDate,parentName:s.parentName,parentPhone:s.parentPhone,secondParentName:s.secondParentName,secondParentPhone:s.secondParentPhone,address:s.address}[key]||'')
const rowsFor=(classes,fields)=>classes.flatMap(cls=>(cls.students||[]).map(s=>Object.fromEntries(fields.map(k=>[FIELDS.find(x=>x[0]===k)?.[1]||k,value(s,cls,k)]))))

export default function ReportsPage({classes=[]}){
  const [classId,setClassId]=useState('all')
  const [selected,setSelected]=useState(PRESETS.student)
  const filtered=classId==='all'?classes:classes.filter(c=>c.id===classId)
  const rows=useMemo(()=>rowsFor(filtered,selected),[filtered,selected])
  const totalStudents=classes.reduce((n,c)=>n+(c.students||[]).length,0)
  const parentCount=classes.reduce((n,c)=>n+(c.students||[]).filter(s=>s.parentName||s.secondParentName).length,0)
  const reportTitle=classId==='all'?'Öğrenci Bilgi Raporu':`${filtered[0]?.name||'Sınıf'} Öğrenci Raporu`
  const generatedAt=new Intl.DateTimeFormat('tr-TR',{dateStyle:'long',timeStyle:'short'}).format(new Date())
  const toggle=k=>setSelected(v=>v.includes(k)?v.filter(x=>x!==k):[...v,k])
  const preset=p=>setSelected(PRESETS[p])
  const excel=()=>{const sheet=XLSX.utils.json_to_sheet(rows);const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,'Rapor');XLSX.writeFile(book,'ogrenci-raporu.xlsx')}
  const printReport=()=>{document.title=reportTitle;window.print()}
  return <main className="content reports-page">
    <div className="page-head reports-toolbar"><div><p className="eyebrow">Raporlama</p><h1>Çıktılar ve Raporlar</h1><p className="muted">İstediğin bilgileri seç, yalnızca onları Excel'e aktar veya düzenlenmiş rapor olarak yazdır.</p></div><div className="report-actions"><button className="secondary" onClick={excel} disabled={!selected.length}><FileSpreadsheet size={18}/> Excel</button><button className="primary" onClick={printReport} disabled={!selected.length}><Printer size={18}/> Raporu Yazdır / PDF</button></div></div>
    <section className="report-summary"><div><UsersRound size={20}/><b>{classes.length}</b><span>Aktif sınıf</span></div><div><UserRound size={20}/><b>{totalStudents}</b><span>Toplam öğrenci</span></div><div><Phone size={20}/><b>{parentCount}</b><span>Veli bilgisi olan</span></div><div><Check size={20}/><b>{selected.length}</b><span>Seçili alan</span></div></section>
    <section className="card report-card">
      <div className="report-builder-head"><div><h2>Rapor şablonu</h2><p className="muted">Sadece görmek istediğin sütunları işaretle.</p></div><div className="preset-actions"><button className="preset" onClick={()=>preset('student')}>Öğrenci Bilgileri</button><button className="preset" onClick={()=>preset('parents')}>Veli Bilgileri</button><button className="preset" onClick={()=>preset('full')}>Tümü</button><button className="preset" onClick={()=>preset('contact')}>Telefonlar</button><button className="preset reset" onClick={()=>setSelected([])}><RotateCcw size={14}/> Temizle</button></div></div>
      <div className="report-filters"><label className="field"><span>Sınıf</span><select value={classId} onChange={e=>setClassId(e.target.value)}><option value="all">Tüm sınıflar</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      <div className="report-fields">{FIELDS.map(([key,label])=><label key={key} className={selected.includes(key)?'report-field selected':'report-field'}><input type="checkbox" checked={selected.includes(key)} onChange={()=>toggle(key)}/><span>{label}</span>{selected.includes(key)&&<Check size={15}/>}</label>)}</div>
      <div className="report-print-head"><div><h2>{classId==='all'?'Tüm Sınıflar':filtered[0]?.name||'Rapor'}</h2><span>{rows.length} öğrenci · {selected.length} alan</span></div></div>
      <div className="print-report-header"><div><div className="print-report-brand">ELİF OKUL</div><h1>{reportTitle}</h1><p>{classId==='all'?'Tüm aktif sınıflar':filtered[0]?.name||'Sınıf'} · {rows.length} öğrenci</p></div><div className="print-report-meta"><b>Öğrenci Raporu</b><span>Oluşturulma: {generatedAt}</span><span>Seçili alan: {selected.length}</span></div></div>
      <div className="report-table-wrap">{selected.length?<table className="report-table"><thead><tr>{selected.map(k=><th key={k}>{FIELDS.find(x=>x[0]===k)?.[1]}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{selected.map(k=><td key={k}>{r[FIELDS.find(x=>x[0]===k)?.[1]]||'—'}</td>)}</tr>)}</tbody></table>:<div className="empty">Rapor oluşturmak için en az bir alan seç.</div>}{!rows.length&&selected.length>0&&<div className="empty">Bu seçim için henüz öğrenci bulunmuyor.</div>}</div>
      <div className="print-report-footer"><span>Elif Okul · Öğrenci Takip Sistemi</span><span>Toplam {rows.length} öğrenci</span></div>
    </section>
    <div className="print-note"><Download size={16}/> “Raporu Yazdır / PDF” ile yalnızca düzenlenmiş rapor sayfası yazdırılır.</div>
  </main>
}
