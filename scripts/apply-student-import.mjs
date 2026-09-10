import fs from 'node:fs'

const appPath = 'src/App.jsx'
let s = fs.readFileSync(appPath, 'utf8')

if (!s.includes("import * as XLSX from 'xlsx'")) {
  s = s.replace("import { useEffect, useMemo, useState } from 'react'", "import { useEffect, useMemo, useState } from 'react'\nimport * as XLSX from 'xlsx'")
}

const start = s.indexOf('  const addClass = (name) => {')
const end = s.indexOf('  const deleteStudent = (sid) => {')
if (start >= 0 && end > start && !s.includes('const importStudents = (rows) =>')) {
  const handlers = `  const addClass = (name) => {\n    try { const id = uid(); const next = addClassDomain(classes, name, id); setClasses(next); setModal(null); goClass(id) } catch (e) { setError(errorText(e)) }\n  }\n  const addStudent = (firstName, lastName) => {\n    if (selectedClass == null) return\n    try { const next = addStudentDomain(classes, selectedClass, firstName, lastName, uid()); setClasses(next); setModal(null); setError('') } catch (e) { setError(errorText(e)) }\n  }\n  const importStudents = (rows) => {\n    if (selectedClass == null) return\n    let next = classes, added = 0, skipped = 0\n    rows.forEach(row => { try { next = addStudentDomain(next, selectedClass, row.firstName, row.lastName, uid()); added += 1 } catch { skipped += 1 } })\n    setClasses(next); setModal(null); setError(skipped ? added + ' öğrenci aktarıldı, ' + skipped + ' satır atlandı (boş/tekrar).' : added + ' öğrenci aktarıldı.')\n  }\n`
  s = s.slice(0, start) + handlers + s.slice(end)
}

s = s.replace(
  'documents={documents} onDocument={() => setView(\'documents\')} />}',
  "documents={documents} onDocument={() => setView('documents')} onImportStudents={() => setModal('import-students')} />}",
)
s = s.replace(
  "{modal === 'student' && <StudentModal onClose={() => setModal(null)} onSave={addStudent} />}",
  "{modal === 'student' && <StudentModal onClose={() => setModal(null)} onSave={addStudent} />}\n    {modal === 'import-students' && <StudentImportModal onClose={() => setModal(null)} onImport={importStudents} />}",
)
s = s.replace(
  'function ClassDetail({ cls, schedule, documents, onBack, onAddStudent, onDeleteStudent, onDeleteClass, onDocument })',
  'function ClassDetail({ cls, schedule, documents, onBack, onAddStudent, onDeleteStudent, onDeleteClass, onDocument, onImportStudents })',
)
s = s.replace(
  '<button className="primary small" onClick={onAddStudent}><Plus size={16}/> Öğrenci Ekle</button>',
  '<div className="detail-actions"><button className="secondary small" onClick={onImportStudents}><Upload size={16}/> Toplu Aktar</button><button className="primary small" onClick={onAddStudent}><Plus size={16}/> Öğrenci Ekle</button></div>',
)

if (!s.includes('function StudentImportModal')) {
  const marker = 'function StudentModal({onClose,onSave})'
  const component = `function StudentImportModal({onClose,onImport}) {
  const [file,setFile]=useState(null),[rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(false)
  const parseText=text=>text.replace(/\\r/g,'').split('\\n').map(x=>x.trim()).filter(Boolean).map(line=>{const p=line.includes(';')?line.split(';'):line.includes('\\t')?line.split('\\t'):line.split(',');const v=p.map(x=>x.trim()).filter(Boolean);return {firstName:v[0]||'',lastName:v.slice(1).join(' ')}}).filter(x=>x.firstName)
  const readFile=async f=>{setFile(f);setRows([]);setError('');setLoading(true);try{const n=f.name.toLocaleLowerCase('tr');if(n.endsWith('.txt')||n.endsWith('.csv')){setRows(parseText(await f.text()));return}const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),raw=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}),norm=x=>String(x??'').trim().toLocaleLowerCase('tr'),out=[];for(const item of raw){const e=Object.entries(item).map(([k,v])=>[norm(k),String(v??'').trim()]),pick=names=>e.find(([k])=>names.includes(k))?.[1]||'';let first=pick(['ad','adı','isim','first name','firstname']),last=pick(['soyad','soyadı','last name','lastname']);if(!first){const full=pick(['ad soyad','adı soyadı','isim soyisim','öğrenci','ogrenci']);if(full){const p=full.split(' ').filter(Boolean);first=p.shift()||'';last=p.join(' ')}}if(first)out.push({firstName:first,lastName:last})}if(!out.length)throw new Error('Dosyada öğrenci adı bulunamadı.');setRows(out)}catch(e){setError(e instanceof Error?e.message:'Dosya okunamadı.')}finally{setLoading(false)}}
  return <Modal title="Toplu Öğrenci Aktar" onClose={onClose} wide><p className="muted">XLS/XLSX, CSV veya TXT seç. Excel/CSV için Ad-Soyad sütunları veya tam ad; TXT için her satıra bir öğrenci.</p><label className="file-picker"><Upload size={18}/><span>{file?file.name:'Dosya seç'}</span><input type="file" accept=".xlsx,.xls,.csv,.txt,text/plain,text/csv" onChange={e=>e.target.files?.[0]&&readFile(e.target.files[0])}/></label>{loading&&<div className="empty">Dosya okunuyor…</div>}{error&&<Notice message={error}/>} {!loading&&!error&&rows.length>0&&<div className="import-preview"><b>{rows.length} öğrenci bulundu</b>{rows.slice(0,10).map((r,i)=><div key={i}>{r.firstName} {r.lastName}</div>)}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Vazgeç</button><button type="button" className="primary" disabled={!rows.length||loading} onClick={()=>onImport(rows)}>Aktar</button></div></Modal>
}

`
  s = s.replace(marker, component + marker)
}
fs.writeFileSync(appPath, s)

const cssPath = 'src/index.css'
let css = fs.readFileSync(cssPath, 'utf8')
if (!css.includes('.detail-actions{')) {
  css += '\n.detail-actions{display:flex;gap:8px;align-items:center}.secondary{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:10px 13px;font-weight:700;cursor:pointer}.secondary.small{padding:8px 11px;font-size:13px}.file-picker{display:flex;align-items:center;gap:10px;border:1px dashed var(--border);border-radius:12px;padding:16px;cursor:pointer}.file-picker input{display:none}.import-preview{margin-top:14px;border:1px solid var(--border);border-radius:10px;padding:12px;display:grid;gap:5px}.import-preview small{color:var(--muted)}\n'
  fs.writeFileSync(cssPath, css)
}
