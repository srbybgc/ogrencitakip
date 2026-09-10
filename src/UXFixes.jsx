import { useEffect } from 'react'
import * as XLSX from 'xlsx'

const toIso=v=>{const s=String(v??'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);return m?`${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`:''}
const clean=v=>String(v??'').replace(/\s+/g,' ').trim()
const phoneRe=/(?:\+?90[\s-]?)?(?:0?5\d{2})[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g
const nameKey=(a,b)=>`${clean(a)} ${clean(b)}`.toLocaleLowerCase('tr-TR')

function normalizeStudents(){
 try{
  const classes=JSON.parse(localStorage.getItem('ot-classes')||'[]')
  if(!Array.isArray(classes))return
  let changed=false
  const next=classes.map(c=>({...c,students:(c.students||[]).map(st=>{
   const raw=clean(`${st.firstName||''} ${st.lastName||''}`)
   const phones=raw.match(phoneRe)||[]
   let text=clean(raw.replace(phoneRe,' '))
   text=text.replace(/^\d{4}\s+/, '').replace(/^[0-9]+[A-Za-zÇĞİÖŞÜçğıöşü]\s+/i,'').trim()
   const parts=text.split(' ').filter(Boolean)
   const out={...st}
   if(parts.length>=2){out.firstName=parts.slice(0,-1).join(' ');out.lastName=parts.at(-1)}
   if(!out.parentPhone&&phones[0])out.parentPhone=phones[0].trim()
   if(!out.secondParentPhone&&phones[1])out.secondParentPhone=phones[1].trim()
   if(out.firstName!==st.firstName||out.lastName!==st.lastName||out.parentPhone!==st.parentPhone||out.secondParentPhone!==st.secondParentPhone){changed=true;return out}
   return out
  })}))
  if(changed)localStorage.setItem('ot-classes',JSON.stringify(next))
 }catch{}
}

export default function UXFixes(){
 useEffect(()=>{
  normalizeStudents()
  const fixBirthInputs=()=>document.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('span')?.textContent?.trim();const input=field.querySelector('input[type="date"]');if(label==='Doğum tarihi'&&input){input.type='text';input.inputMode='numeric';input.placeholder='GG.AA.YYYY';input.removeAttribute('min');input.removeAttribute('max')}})
  const fixStudentRows=()=>{
   document.querySelectorAll('.student-row').forEach(row=>{const b=row.querySelector('b');if(!b)return;const raw=clean(b.textContent);const parts=raw.split('·');if(parts.length>1){const name=clean(parts.slice(1).join('·'));if(name&&b.textContent!==name)b.textContent=name}})
   document.querySelectorAll('.student-row').forEach(row=>{const parent=row.parentElement;if(!parent)return;const rows=[...parent.children].filter(x=>x.classList?.contains('student-row'));if(rows.length<2)return;const sorted=[...rows].sort((a,b)=>clean(a.querySelector('b')?.textContent).localeCompare(clean(b.querySelector('b')?.textContent),'tr-TR',{sensitivity:'base'}));if(sorted.some((x,i)=>x!==rows[i]))sorted.forEach(x=>parent.appendChild(x))})
  }
  const fix=()=>{fixBirthInputs();fixStudentRows()};fix();const observer=new MutationObserver(fix);observer.observe(document.body,{childList:true,subtree:true})
  const onBlur=e=>{const input=e.target;if(!(input instanceof HTMLInputElement)||input.placeholder!=='GG.AA.YYYY')return;const iso=toIso(input.value);if(iso&&input.value!==iso){const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;setter?.call(input,iso);input.dispatchEvent(new Event('input',{bubbles:true}))}}
  const onFile=async e=>{const input=e.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.[0])return;try{const wb=XLSX.read(await input.files[0].arrayBuffer(),{type:'array',raw:false,cellText:true,cellDates:false});const ws=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});const byNumber={},byName={};for(const r of raw){const number=clean(r?.[1]),first=clean(r?.[2]),last=clean(r?.[3]),birth=toIso(r?.[5]);if(!birth)continue;if(number)byNumber[number]=birth;if(first||last)byName[nameKey(first,last)]=birth}window.__otImportBirthDates={byNumber,byName}}catch{window.__otImportBirthDates={byNumber:{},byName:{}}}}
  document.addEventListener('blur',onBlur,true);document.addEventListener('change',onFile,true)
  const timer=setInterval(()=>{const map=window.__otImportBirthDates;if(!map||(!Object.keys(map.byNumber||{}).length&&!Object.keys(map.byName||{}).length)||window.__otBirthReloaded)return;try{const classes=JSON.parse(localStorage.getItem('ot-classes')||'[]');let changed=false;const next=classes.map(c=>({...c,students:(c.students||[]).map(s=>{const birth=map.byNumber?.[clean(s.studentNumber)]||map.byName?.[nameKey(s.firstName,s.lastName)];if(birth&&s.birthDate!==birth){changed=true;return {...s,birthDate:birth}}return s})}));if(changed){localStorage.setItem('ot-classes',JSON.stringify(next));window.__otBirthReloaded=true;setTimeout(()=>location.reload(),80);return}delete window.__otImportBirthDates}catch{}},700)
  return()=>{observer.disconnect();document.removeEventListener('blur',onBlur,true);document.removeEventListener('change',onFile,true);clearInterval(timer)}
 },[])
 return null
}
