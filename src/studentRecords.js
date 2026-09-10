const RECORD_TYPES = ['note', 'attendance', 'event']
const ATTENDANCE_STATUSES = ['Geldi', 'Gelmedi', 'İzinli']

const normalize = value => String(value ?? '').trim()

export function addStudentRecord(records, record, id) {
  if (!id) throw new Error('Kayıt kimliği gerekli.')
  if (!record?.studentId) throw new Error('Öğrenci ilişkisi gerekli.')
  if (!RECORD_TYPES.includes(record.type)) throw new Error('Geçersiz kayıt türü.')
  if (record.type === 'attendance' && !ATTENDANCE_STATUSES.includes(normalize(record.status || record.text))) throw new Error('Geçersiz yoklama durumu.')
  if (!normalize(record.text) && record.type !== 'attendance') throw new Error('Kayıt içeriği gerekli.')
  if (records.some(item => item.id === id)) throw new Error('Bu kayıt zaten mevcut.')
  const text = normalize(record.text || record.status)
  return [...records, { ...record, id, text }]
}

export function deleteStudentRecord(records, id) {
  return records.filter(item => item.id !== id)
}

export function removeStudentRecords(records, studentId) {
  return records.filter(item => item.studentId !== studentId)
}

export function removeClassStudentRecords(records, studentIds) {
  const ids = new Set(studentIds)
  return records.filter(item => !ids.has(item.studentId))
}

export function checkStudentRecordIntegrity(classes, records) {
  const studentIds = new Set(classes.flatMap(cls => (cls.students || []).map(student => student.id)))
  const clean = records.filter(item => {
    if (!studentIds.has(item.studentId) || !RECORD_TYPES.includes(item.type)) return false
    if (item.type === 'attendance') return ATTENDANCE_STATUSES.includes(normalize(item.status || item.text))
    return Boolean(normalize(item.text))
  })
  return { ok: clean.length === records.length, records: clean }
}

export { RECORD_TYPES, ATTENDANCE_STATUSES }
