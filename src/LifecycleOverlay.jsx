import { useEffect, useRef, useState } from 'react'
import { Archive, ArchiveRestore, RotateCcw, Trash2, ChevronLeft, Home, LayoutGrid, Users, Clock3, FileText } from 'lucide-react'

const K={classes:'ot-classes',groups:'ot-groups',schedule:'ot-schedule',documents:'ot-documents',records:'ot-student-records'}
const read=k=>{try{const v=JSON.parse(localStorage.getItem(K[k]||k)||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
const write=(k,v)=>localStorage.setItem(K[k]||k,JSON.stringify(v))
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,8)}`
const snap=()=>({classes:read('classes'),groups:read('groups'),schedule:read('schedule'),documents:read('documents'),records:read('records')})
const label=x=>x.type==='class'?`Sınıf · ${x.data.name}`:x.type==='student'?`Öğrenci · ${x.data.firstName} ${x.data.lastName||''}`:x.type==='group'?`Grup · ${x.data.name}`:x.type==='lesson'?`Ders · ${x.data.lesson||''}`:`Belge · ${x.data.name||''}`

const goMainView=(label)=>{
 const button=[...document.querySelectorAll('.desktop-nav button')].find(b=>b.textContent?.trim()===label)
 if(button){button.click();return}
 window.dispatchEvent(new CustomEvent('ot-navigate',{detail:{label}}))
}

export default function LifecycleOverlay(){
 const [open,setOpen]=useState(null),[trash,setTrash]=useState(()=>read('ot-trash')),prev=useRef(snap()),busy=useRef(false)
 useEffect(()=>write('ot-trash',trash),[trash])
 useEffect(()=>{
  const a=()=>setOpen('a'),t=()=>setOpen('t')
  const ac=()=>{const c=read('classes').find(x=>x.id===window.__otSelectedClass);if(c)archive(c.id)}
  window.addEventListener('open-archive',a);window.addEventListener('open-trash',t);window.addEventListener('archive-selected-class',ac)
  return()=>{window.removeEventListener('open-archive',a);window.removeEventListener('open-trash',t);window.removeEventListener('archive-selected-class',ac)}
 },[])
 useEffect(()=>{const tick=()=>{if(busy.current)return;const n=snap(),p=prev.current,t=read('ot-trash'),seen=new Set(t.map(x=>`${x.type}:${x.data?.id}`)),add=[];const put=(type,data,extra={})=>{if(!data?.id||seen.has(`${type}:${data.id}`))return;seen.add(`${type}:${data.id}`);add.push({id:uid(),type,data,...extra,deletedAt:new Date().toISOString()})};const nc=new Set(n.classes.map(x=>x.id));for(const c of p.classes)if(!nc.has(c.id))put('class',c,{groups:p.groups.filter(g=>(g.classIds||[]).includes(c.id)),schedule:p.schedule.filter(s=>s.classId===c.id),documents:p.documents.filter(d=>(d.targetType==='class'&&d.targetId===c.id)||(d.targetType==='student'&&(c.students||[]).some(s=>s.id===d.targetId))),records:p.records.filter(r=>(c.students||[]).some(s=>s.id===r.studentId))});const ns=new Set(n.classes.flatMap(c=>(c.students||[]).map(s=>`${c.id}:${s.id}`)));for(const c of p.classes)for(const st of c.students||[])if(!ns.has(`${c.id}:${st.id}`)&&nc.has(c.id))put('student',st,{classId:c.id,documents:p.documents.filter(d=>d.targetType==='student'&&d.targetId===st.id),records:p.records.filter(r=>r.studentId===st.id)});const cmp=(type,a,b)=>{const ids=new Set(b.map(x=>x.id));for(const x of a)if(!ids.has(x.id))put(type,x)};cmp('group',p.groups,n.groups);cmp('lesson',p.schedule,n.schedule);cmp('document',p.documents,n.documents);if(add.length)setTrash(v=>[...v,...add]);prev.current=n};const timer=setInterval(tick,700);return()=>clearInterval(timer)},[])
 const archive=id=>{const y=new Date().getFullYear();write('classes',read('classes').map(c=>c.id===id?{...c,archivedAt:new Date().toISOString(),academicYear:c.academicYear||`${y}-${y+1}`}:c));location.reload()}
 const unarchive=id=>{write('classes',read('classes').map(c=>{if(c.id!==id)return c;const x={...c};delete x.archivedAt;return x}));location.reload()}
 const restore=x=>{busy.current=true;try{if(x.type==='class'){if(!read('classes').some(c=>c.id===x.data.id))write('classes',[...read('classes'),x.data]);for(const k of ['groups','schedule','documents','records'])if(Array.isArray(x[k])){const a=read(k),ids=new Set(a.map(v=>v.id));write(k,[...a,...x[k].filter(v=>!ids.has(v.id))])}}else if(x.type==='student'){write('classes',read('classes').map(c=>c.id===x.classId&&!(c.students||[]).some(s=>s.id===x.data.id)?{...c,students:[...(c.students||[]),x.data]}:c));for(const k of ['documents','records'])if(Array.isArray(x[k])){const a=read(k),ids=new Set(a.map(v=>v.id));write(k,[...a,...x[k].filter(v=>!ids.has(v.id))])}}else{const k=x.type==='group'?'groups':x.type==='lesson'?'schedule':'documents';const a=read(k);if(!a.some(v=>v.id===x.data.id))write(k,[...a,x.data])}setTrash(v=>v.filter(v=>v.id!==x.id));location.reload()}finally{busy.current=false}}
 const archived=read('classes').filter(c=>c.archivedAt),years=Object.entries(archived.reduce((a,c)=>{const y=c.academicYear||'Diğer';(a[y]??=[]).push(c);return a},{})).sort((a,b)=>b[0].localeCompare(a[0],'tr'))
 if(!open)return null
 const mainNav=[['Ana Sayfa',Home],['Sınıflar',LayoutGrid],['Gruplar',Users],['Ders Programı',Clock3],['Belgeler',FileText]]
 return <main className="content lifecycle-page" style={{position:'fixed',inset:0,zIndex:90,overflow:'auto',background:'#f5f7fb',paddingTop:28}}>
  <div style={{maxWidth:1180,margin:'0 auto',padding:'0 24px 40px'}}>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>{mainNav.map(([label,Icon])=><button key={label} className="secondary small" onClick={()=>{setOpen(null);setTimeout(()=>goMainView(label),0)}}><Icon size={15}/>{label}</button>)}<button className="secondary small" onClick={()=>setOpen('a')}><Archive size={15}/>Arşiv</button><button className="secondary small" onClick={()=>setOpen('t')}><Trash2 size={15}/>Çöp Kutusu</button></div>
   <button className="back-btn" onClick={()=>{setOpen(null);setTimeout(()=>goMainView('Ana Sayfa'),0)}}><ChevronLeft size={18}/> Ana Sayfa</button>
   <div className="page-head"><div><p className="eyebrow">Kayıt yönetimi</p><h1>{open==='a'?'Arşiv':'Çöp Kutusu'}</h1><p className="muted">{open==='a'?'Arşivlenen sınıfları eğitim öğretim yılına göre yönet.':'Silinen kayıtları incele, geri yükle veya kalıcı olarak kaldır.'}</p></div><div className="lifecycle-switch"><button className={open==='a'?'active':''} onClick={()=>setOpen('a')}><Archive size={16}/> Arşiv</button><button className={open==='t'?'active':''} onClick={()=>setOpen('t')}><Trash2 size={16}/> Çöp Kutusu{trash.length?` (${trash.length})`:''}</button></div></div>
   {open==='a'?<section className="card"><div className="section-head"><div><div className="section-title"><Archive size={18}/> Arşivlenen Sınıflar</div><p className="muted">Toplam {archived.length} sınıf</p></div></div><div className="lifecycle-list">{years.map(([year,items])=><div key={year} className="lifecycle-year"><h3>{year}</h3>{items.map(c=><div className="lifecycle-row" key={c.id}><span><b>{c.name}</b><small>{c.students?.length||0} öğrenci</small></span><button className="secondary" onClick={()=>unarchive(c.id)}><ArchiveRestore size={14}/> Geri Al</button></div>)}</div>)}{!archived.length&&<div className="empty">Arşiv boş.</div>}</div></section>:<section className="card"><div className="section-head"><div><div className="section-title"><Trash2 size={18}/> Silinen Kayıtlar</div><p className="muted">Toplam {trash.length} kayıt</p></div>{trash.length>0&&<button className="danger-outline" onClick={()=>{if(confirm('Çöp kutusundaki tüm kayıtları kalıcı olarak silmek istediğinizden emin misiniz?'))setTrash([])}}>Çöp Kutusunu Boşalt</button>}</div><div className="lifecycle-list">{trash.slice().reverse().map(x=><div className="lifecycle-row" key={x.id}><span><b>{label(x)}</b><small>{new Date(x.deletedAt).toLocaleString('tr-TR')}</small></span><div className="row-actions"><button className="secondary" onClick={()=>restore(x)}><RotateCcw size={14}/> Geri Yükle</button><button className="icon-btn danger" title="Kalıcı sil" onClick={()=>{if(confirm('Bu kaydı kalıcı olarak silmek istediğinizden emin misiniz?'))setTrash(v=>v.filter(y=>y.id!==x.id))}}><Trash2 size={14}/></button></div></div>)}{!trash.length&&<div className="empty">Çöp kutusu boş.</div>}</div></section>}
  </div>
 </main>
}
