import { loadUserData, saveUserCollection } from './firestoreData'
import { createSerializedQueue } from './serializedQueue'
import { sortClasses, sortStudents } from './domain'

const KEY_TO_COLLECTION = {'ot-classes':'classes','ot-groups':'groups','ot-schedule':'schedule','ot-documents':'documents','ot-student-records':'studentRecords','ot-trash':'trash'}
const EMPTY = {classes:[],groups:[],schedule:[],documents:[],studentRecords:[],trash:[]}
const OWNER_KEY='ot-sync-owner'
const normalizeData = (data) => ({
  ...EMPTY,
  ...data,
  classes: sortClasses(data?.classes).map(c => ({ ...c, students: sortStudents(c.students) })),
})
const readLocal=()=>Object.fromEntries(Object.entries(KEY_TO_COLLECTION).map(([key,name])=>{try{const value=JSON.parse(window.localStorage.getItem(key)||'[]');return[name,Array.isArray(value)?value:[]]}catch{return[name,[]]}}))
const writeLocal=(data,setItem)=>{const normalized=normalizeData(data);Object.entries(KEY_TO_COLLECTION).forEach(([key,name])=>setItem(key,JSON.stringify(Array.isArray(normalized?.[name])?normalized[name]:EMPTY[name])))}
export async function startFirestoreSync(uid){if(!uid||typeof window==='undefined')return()=>{};const originalSetItem=window.localStorage.setItem.bind(window.localStorage),originalRemoveItem=window.localStorage.removeItem.bind(window.localStorage);let stopped=false;const enqueue=createSerializedQueue(async(name,items)=>{if(!stopped)await saveUserCollection(uid,name,items)});try{const remote=normalizeData(await loadUserData(uid)),remoteHasData=Object.values(remote).some(items=>Array.isArray(items)&&items.length>0),localOwner=window.localStorage.getItem(OWNER_KEY);if(remoteHasData)writeLocal(remote,originalSetItem);else if(localOwner===uid){const local=normalizeData(readLocal());writeLocal(local,originalSetItem);await Promise.all(Object.entries(local).map(([name,items])=>saveUserCollection(uid,name,items)))}else writeLocal(EMPTY,originalSetItem);originalSetItem(OWNER_KEY,uid)}catch(error){console.error('Firestore ilk veri senkronizasyonu başarısız:',error);throw error}
 window.localStorage.setItem=(key,value)=>{originalSetItem(key,value);const name=KEY_TO_COLLECTION[key];if(!name||stopped)return;try{const items=JSON.parse(value);if(Array.isArray(items))enqueue(name,items).catch(error=>console.error(`Firestore ${name} senkronizasyonu başarısız:`,error))}catch(error){console.error('Firestore senkronizasyonu başarısız:',error)}}
 window.localStorage.removeItem=key=>{originalRemoveItem(key);const name=KEY_TO_COLLECTION[key];if(!name||stopped)return;enqueue(name,[]).catch(error=>console.error(`Firestore ${name} senkronizasyonu başarısız:`,error))}
 return()=>{stopped=true;window.localStorage.setItem=originalSetItem;window.localStorage.removeItem=originalRemoveItem}
}
