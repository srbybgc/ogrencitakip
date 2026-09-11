import { useEffect } from 'react'
import * as XLSX from 'xlsx'

const clean=v=>String(v??'').replace(/\uFEFF/g,'').replace(/\s+/g,' ').trim()
const key=(a,b)=>`${clean(a)} ${clean(b)}`.toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim()
const iso=v=>{
  if(v instanceof Date&&!Number.isNaN(v.getTime())) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`
  const s=clean(v);if(!s)return ''
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s
  let m=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`
  m=s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`
  const n=Number(s);if(Number.isFinite(n)&&n>20000&&n<60000){const d=XLSX.SSF.parse_date_code(n);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`}
  const d=new Date(s);if(!Number.isNaN(d.getTime())&&/^\d{4}/.test(s))return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return ''
}
const headerScore=h=>{const x=h.map(v=>clean(v).toLocaleLowerCase('tr-TR'));return x.reduce((n,v)=>n+(/öğrenci.*(no|numara)|ogrenci.*(no|numara)/.test(v)?2:0)+(/^(ad|adı|isim)$/.test(v)?1:0)+(/^(soyad|soyadı)$/.test(v)?1:0)+(/doğum|dogum/.test(v)?2:0),0)}
const birthMap=raw=>{
  let headerRow=0,best=0
  raw.slice(0,8).forEach((row,i)=>{const score=headerScore(row||[]);if(score>best){best=score;headerRow=i}})
  const h=(raw[headerRow]||[]).map(clean).map(x=>x.toLocaleLowerCase('tr-TR'))
  const find=(names,fallback)=>{const exact=names.map(x=>h.indexOf(x)).find(i=>i>=0);if(exact!=null)return exact;return h.findIndex(x=>names.some(n=>x.includes(n)))}
  const ni=find(['öğrenci no','ogrenci no','öğrenci numarası','ogrenci numarasi','student number','studentnumber'],1)
  const fi=find(['ad','adı','isim','first name','firstname'],2)
  const li=find(['soyad','soyadı','last name','lastname'],3)
  const bi=find(['doğum tarihi','dogum tarihi','doğum','dogum','birth date','birthdate'],4)
  const ai=find(['anne telefonu','anne tel','anne numarası','anne numarasi','mother phone'],7)
  const m={n:{},s:{},count:0}
  raw.slice(headerRow+1).forEach(r=>{
    const b=iso(r?.[bi]),n=clean(r?.[ni]),f=clean(r?.[fi]),l=clean(r?.[li]);if(!b)return
    if(n)m.n[n]=b;if(f||l)m.s[key(f,l)]=b;m.count++
  })
  return m
}
const apply=(m)=>{try{const cs=JSON.parse(localStorage.getItem('ot-classes')||'[]');if(!Array.isArray(cs))return 0;let changed=0;const next=cs.map(c=>({...c,students:(c.students||[]).map(s=>{const b=m.n[clean(s.studentNumber)]||m.s[key(s.firstName,s.lastName)];if(b&&s.birthDate!==b){changed++;return {...s,birthDate:b}}return s})}));if(changed)localStorage.setItem('ot-classes',JSON.stringify(next));return changed}catch{return 0}}
const addSearchClear=()=>{document.querySelectorAll('.search').forEach(box=>{const input=box.querySelector('input');if(!input||box.querySelector('.search-clear'))return;const button=document.createElement('button');button.type='button';button.className='search-clear';button.setAttribute('aria-label','Aramayı temizle');button.textContent='×';button.addEventListener('click',()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;setter?.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()});box.appendChild(button)});document.querySelectorAll('.search').forEach(box=>{const input=box.querySelector('input'),button=box.querySelector('.search-clear');if(input&&button)button.hidden=!input.value})}
export default function UXFixes(){useEffect(()=>{const inputFix=()=>{document.querySelectorAll('.field').forEach(f=>{const label=clean(f.querySelector('span')?.textContent),i=f.querySelector('input[type="date"],input[placeholder="GG.AA.YYYY"]');if(label==='Doğum tarihi'&&i){i.type='text';i.inputMode='numeric';i.placeholder='GG.AA.YYYY'}});addSearchClear()};inputFix();const obs=new MutationObserver(inputFix);obs.observe(document.body,{childList:true,subtree:true});const onBlur=e=>{const i=e.target;if(i instanceof HTMLInputElement&&i.placeholder==='GG.AA.YYYY'){const b=iso(i.value);if(b){const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;setter?.call(i,b);i.dispatchEvent(new Event('input',{bubbles:true}))}}};const onFile=async e=>{const i=e.target;if(!(i instanceof HTMLInputElement)||i.type!=='file'||!i.files?.[0])return;try{const wb=XLSX.read(await i.files[0].arrayBuffer(),{type:'array',raw:false,cellFormula:false,cellHTML:false,cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});window.__otImportBirthDates=birthMap(raw);window.__otBirthAttempts=0}catch{window.__otImportBirthDates=null}};const onInput=e=>{const i=e.target;if(i instanceof HTMLInputElement&&i.closest('.search')){const b=i.closest('.search').querySelector('.search-clear');if(b)b.hidden=!i.value}};document.addEventListener('blur',onBlur,true);document.addEventListener('change',onFile,true);document.addEventListener('input',onInput,true);const timer=setInterval(()=>{const m=window.__otImportBirthDates;if(!m?.count)return;window.__otBirthAttempts=(window.__otBirthAttempts||0)+1;const changed=apply(m);if(changed||window.__otBirthAttempts>60){delete window.__otImportBirthDates;delete window.__otBirthAttempts}},250);return()=>{obs.disconnect();document.removeEventListener('blur',onBlur,true);document.removeEventListener('change',onFile,true);document.removeEventListener('input',onInput,true);clearInterval(timer)}},[]);return null}
