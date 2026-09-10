import { useEffect } from 'react'
import * as XLSX from 'xlsx'

const clean=v=>String(v??'').replace(/\uFEFF/g,'').replace(/\s+/g,' ').trim()
const nameKey=(a,b)=>`${clean(a)} ${clean(b)}`.toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim()
const phoneRe=/(?:\+?90[\s-]?)?(?:0?5\d{2})[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g

const toIso=v=>{
  if(v instanceof Date&&!Number.isNaN(v.getTime()))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`
  const s=clean(v)
  if(!s)return ''
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s
  let m=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`
  m=s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`
  const n=Number(s)
  if(Number.isFinite(n)&&n>20000&&n<60000){const d=XLSX.SSF.parse_date_code(n);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`}
  return ''
}

function normalizeStudents(){
 try{
  const classes=JSON.parse(localStorage.getItem('ot-classes')||'[]')
  if(!Array.isArray(classes))return
  let changed=false
  const next=classes.map(c=>({...c,students:(c.students||[]).map(st=>{
   const raw=clean(`${st.firstName||''} ${st.lastName||''}`)
   const phones=raw.match(phoneRe)||[]
   let text=clean(raw.replace(phoneRe,' ')).replace(/^\d{4}\s+/,'').replace(/^[0-9]+[A-Za-zÇĞİÖŞÜçğıöşü]\s+/i,'').trim()
   const parts=text.split(' ').filter(Boolean),out={...st}
   if(parts.length>=2){out.firstName=parts.slice(0,-1).join(' ');out.lastName=parts.at(-1)}
   if(!out.parentPhone&&phones[0])out.parentPhone=phones[0].trim()
   if(!out.secondParentPhone&&phones[1])out.secondParentPhone=phones[1].trim()
   if(out.firstName!==st.firstName||out.lastName!==st.lastName||out.parentPhone!==st.parentPhone||out.secondParentPhone!==st.secondParentPhone){changed=true;return out}
   return out
  })}))
  if(changed)localStorage.setItem('ot-classes',JSON.stringify(next))
 }catch{}
}

function buildBirthMap(raw){
 const rows=Array.isArray(raw)?raw:[];const header=(rows[0]||[]).map(clean).map(x=>x.toLocaleLowerCase('tr-TR'))
 const find=(names, fallback)=>{for(const n of names){const i=header.indexOf(n);if(i>=0)return i}return fallback}
 const noI=find(['öğrenci no','ogrenci no','öğrenci numarası','ogrenci numarasi','student number','studentnumber'],1)
 const firstI=find(['ad','adı','isim','first name','firstname'],2)
 const lastI=find(['soyad','soyadı','last name','lastname'],3)
 const birthI=find(['doğum tarihi','doğum tarihi','dogum tarihi','birth date','birthdate'],5)
 const map={byNumber:{},byName:{}}
 rows.slice(1).forEach(r=>{
  const number=clean(r?.[noI]),first=clean(r?.[firstI]),last=clean(r?.[lastI]),birth=toIso(r?.[birthI]);if(!birth)return
  if(number)map.byNumber[number]=birth
  if(first||last)map.byName[nameKey(first,last)]=birth
 })
 return map
}

function applyBirthMap(map){
 try{
  const classes=JSON.parse(localStorage.getItem('ot-classes')||'[]');if(!Array.isArray(classes))return false
  let changed=false
  const next=classes.map(c=>({...c,students:(c.students||[]).map(s=>{
   const number=clean(s.studentNumber),name=nameKey(s.firstName,s.lastName)
   const birth=map.byNumber?.[number]||map.byName?.[name]
   if(birth&&s.birthDate!==birth){changed=true;return {...s,birthDate:birth}}
   return s
  })}))
  if(changed)localStorage.setItem('ot-classes',JSON.stringify(next))
  return changed
 }catch{return false}
}

export default function UXFixes(){
 useEffect(()=>{
  normalizeStudents()
  const fixBirthInputs=()=>document.querySelectorAll('.field').forEach(field=>{const label=clean(field.querySelector('span')?.textContent);const input=field.querySelector('input[type="date"],input[placeholder="GG.AA.YYYY"]');if(label==='Doğum tarihi'&&input){input.type='text';input.inputMode='numeric';input.placeholder='GG.AA.YYYY';input.removeAttribute('min');input.removeAttribute('max')}})
  const fixStudentRows=()=>document.querySelectorAll('.student-row').forEach(row=>{const b=row.querySelector('b');if(!b)return;const raw=clean(b.textContent);const parts=raw.split('·');if(parts.length>1){const name=clean(parts.slice(1).join('·'));if(name)b.textContent=name}})
  const fix=()=>{fixBirthInputs();fixStudentRows()};fix();const observer=new MutationObserver(fix);observer.observe(document.body,{childList:true,subtree:true})
  const onBlur=e=>{const input=e.target;if(!(input instanceof HTMLInputElement)||input.placeholder!=='GG.AA.YYYY')return;const s=clean(input.value),iso=toIso(s);if(iso&&s!==iso){const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;setter?.call(input,iso);input.dispatchEvent(new Event('input',{bubbles:true}))}}
  const onFile=async e=>{
   const input=e.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.[0])return
   window.__otBirthReloaded=false
   try{
    const wb=XLSX.read(await input.files[0].arrayBuffer(),{type:'array',raw:false,cellText:true,cellDates:false})
    const ws=wb.Sheets[wb.SheetNames[0]]
    const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false})
    window.__otImportBirthDates=buildBirthMap(raw)
   }catch{window.__otImportBirthDates={byNumber:{},byName:{}}}
  }
  document.addEventListener('blur',onBlur,true);document.addEventListener('change',onFile,true)
  const timer=setInterval(()=>{
   const map=window.__otImportBirthDates;if(!map||window.__otBirthReloaded)return
   const hasMap=Object.keys(map.byNumber||{}).length||Object.keys(map.byName||{}).length;if(!hasMap)return
   if(applyBirthMap(map)){window.__otBirthReloaded=true;delete window.__otImportBirthDates;setTimeout(()=>location.reload(),100)}else{window.__otBirthReloaded=true;delete window.__otImportBirthDates}
  },400)
  return()=>{observer.disconnect();document.removeEventListener('blur',onBlur,true);document.removeEventListener('change',onFile,true);clearInterval(timer)}
 },[])
 return null
}
