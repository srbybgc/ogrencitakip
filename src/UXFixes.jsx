import { useEffect } from 'react'
import * as XLSX from 'xlsx'

const toIso=v=>{const s=String(v??'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);return m?`${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`:''}

export default function UXFixes(){
 useEffect(()=>{
  const fix=()=>document.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('span')?.textContent?.trim();const input=field.querySelector('input[type="date"]');if(label==='Doğum tarihi'&&input){input.type='text';input.inputMode='numeric';input.placeholder='GG.AA.YYYY';input.removeAttribute('min');input.removeAttribute('max')}})
  fix();const observer=new MutationObserver(fix);observer.observe(document.body,{childList:true,subtree:true})
  const onBlur=e=>{const input=e.target;if(!(input instanceof HTMLInputElement)||input.placeholder!=='GG.AA.YYYY')return;const iso=toIso(input.value);if(iso&&input.value!==iso){const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;setter?.call(input,iso);input.dispatchEvent(new Event('input',{bubbles:true}))}}
  const onFile=async e=>{const input=e.target;if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.[0])return;try{const wb=XLSX.read(await input.files[0].arrayBuffer(),{type:'array',raw:false,cellText:true,cellDates:false});const ws=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});const map={};for(const r of raw){const no=String(r?.[1]??'').trim();const birth=toIso(r?.[5]);if(no&&birth)map[no]=birth}window.__otImportBirthDates=map}catch{window.__otImportBirthDates={}}}
  document.addEventListener('blur',onBlur,true);document.addEventListener('change',onFile,true)
  const timer=setInterval(()=>{const map=window.__otImportBirthDates;if(!map||!Object.keys(map).length||window.__otBirthReloaded)return;try{const classes=JSON.parse(localStorage.getItem('ot-classes')||'[]');let changed=false;const next=classes.map(c=>({...c,students:(c.students||[]).map(s=>{const birth=map[String(s.studentNumber||'').trim()];if(birth&&s.birthDate!==birth){changed=true;return {...s,birthDate:birth}}return s})}));if(changed){localStorage.setItem('ot-classes',JSON.stringify(next));window.__otBirthReloaded=true;setTimeout(()=>location.reload(),80);return}const matched=next.flatMap(c=>c.students||[]).filter(s=>map[String(s.studentNumber||'').trim()]);if(matched.length>=Object.keys(map).length)delete window.__otImportBirthDates}catch{}}
  ,700)
  return()=>{observer.disconnect();document.removeEventListener('blur',onBlur,true);document.removeEventListener('change',onFile,true);clearInterval(timer)}
 },[])
 return null
}
