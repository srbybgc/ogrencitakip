import { checkIntegrity } from './domain'
import { checkStudentRecordIntegrity } from './studentRecords'

const read = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim()
const phoneRe = /(?:\+?90[\s-]?)?(?:0?5\d{2})[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g

function normalizeStudentFields(classes) {
  let changed = false
  const next = classes.map(cls => ({ ...cls, students: (cls.students || []).map(student => {
    const originalFirst = clean(student.firstName), originalLast = clean(student.lastName), raw = clean(`${originalFirst} ${originalLast}`)
    const phones = raw.match(phoneRe) || []
    let name = clean(raw.replace(phoneRe, ' ')).replace(/^\d{4}\s+/, '').replace(/^[0-9]+[A-Za-zÇĞİÖŞÜçğıöşü]\s+/i, '').trim()
    const parts = name.split(' ').filter(Boolean), out = { ...student }
    if (parts.length >= 2) { out.firstName = parts.slice(0, -1).join(' '); out.lastName = parts.at(-1) }
    if (!out.parentPhone && phones[0]) out.parentPhone = phones[0].trim()
    if (!out.secondParentPhone && phones[1]) out.secondParentPhone = phones[1].trim()
    if (out.firstName !== student.firstName || out.lastName !== student.lastName || out.parentPhone !== student.parentPhone || out.secondParentPhone !== student.secondParentPhone) { changed = true; return out }
    return student
  }) }))
  return { next, changed }
}

export function repairStoredData() {
  if (typeof window === 'undefined') return
  const classes = read('ot-classes', []), groups = read('ot-groups', []), schedule = read('ot-schedule', []), documents = read('ot-documents', []), studentRecords = read('ot-student-records', [])
  const normalized = normalizeStudentFields(classes), sourceClasses = normalized.next, result = checkIntegrity(sourceClasses, groups, schedule, documents)
  if (normalized.changed || JSON.stringify(result.classes) !== JSON.stringify(sourceClasses)) localStorage.setItem('ot-classes', JSON.stringify(result.classes))
  if (result.schedule.length !== schedule.length) localStorage.setItem('ot-schedule', JSON.stringify(result.schedule))
  if (result.documents.length !== documents.length) localStorage.setItem('ot-documents', JSON.stringify(result.documents))
  const recordResult = checkStudentRecordIntegrity(result.classes, studentRecords)
  if (!recordResult.ok) localStorage.setItem('ot-student-records', JSON.stringify(recordResult.records))
  const classIds = new Set(result.classes.map(c => c.id))
  const cleanedGroups = groups.map(g => ({ ...g, classIds: Array.isArray(g.classIds) ? g.classIds.filter(id => classIds.has(id)) : [] })).filter(g => g.classIds.length > 0)
  if (JSON.stringify(cleanedGroups) !== JSON.stringify(groups)) localStorage.setItem('ot-groups', JSON.stringify(cleanedGroups))
}
