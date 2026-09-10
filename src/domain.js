export const overlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd

export function addClass(classes, name, id = crypto.randomUUID()) {
  const clean = name.trim()
  if (!clean) throw new Error('Sınıf adı boş bırakılamaz.')
  if (classes.some(c => c.name.trim().toLocaleLowerCase('tr') === clean.toLocaleLowerCase('tr'))) throw new Error('Bu sınıf zaten mevcut.')
  return [...classes, { id, name: clean, students: [] }]
}

export function addStudent(classes, classId, firstName, lastName = '', id = crypto.randomUUID()) {
  const first = firstName.trim()
  const last = lastName.trim()
  if (!first) throw new Error('Öğrenci adı boş bırakılamaz.')
  let found = false
  const result = classes.map(c => {
    if (c.id !== classId) return c
    found = true
    const duplicate = c.students.some(s => `${s.firstName} ${s.lastName}`.trim().toLocaleLowerCase('tr') === `${first} ${last}`.trim().toLocaleLowerCase('tr'))
    if (duplicate) throw new Error('Bu öğrenci bu sınıfta zaten mevcut.')
    return { ...c, students: [...c.students, { id, firstName: first, lastName: last }] }
  })
  if (!found) throw new Error('Sınıf bulunamadı.')
  return result
}

export function deleteStudent(classes, classId, studentId) {
  return classes.map(c => c.id === classId ? { ...c, students: c.students.filter(s => s.id !== studentId) } : c)
}

export function createGroup(groups, name, classIds, id = crypto.randomUUID()) {
  const clean = name.trim()
  if (!clean) throw new Error('Grup adı boş bırakılamaz.')
  if (groups.some(g => g.name.trim().toLocaleLowerCase('tr') === clean.toLocaleLowerCase('tr'))) throw new Error('Bu grup zaten mevcut.')
  return [...groups, { id, name: clean, classIds: [...new Set(classIds)] }]
}

export function deleteGroup(groups, groupId) {
  return groups.filter(g => g.id !== groupId)
}

export function addLesson(schedule, lesson, id = crypto.randomUUID()) {
  if (!lesson.classId || !lesson.lesson?.trim()) throw new Error('Sınıf ve ders adı zorunludur.')
  if (!lesson.start || !lesson.end || lesson.start >= lesson.end) throw new Error('Ders başlangıç ve bitiş saatleri geçersiz.')
  const clash = schedule.some(s => s.day === lesson.day && overlap(s.start, s.end, lesson.start, lesson.end))
  if (clash) throw new Error('Bu saat aralığında başka bir ders bulunuyor.')
  return [...schedule, { ...lesson, id, lesson: lesson.lesson.trim() }]
}

export function deleteLesson(schedule, lessonId) {
  return schedule.filter(s => s.id !== lessonId)
}

export function attachDocument(documents, document, id = crypto.randomUUID()) {
  if (!document.name?.trim()) throw new Error('Belge adı zorunludur.')
  if (!document.targetType || !document.targetId) throw new Error('Belgenin ilişkilendirileceği kayıt seçilmelidir.')
  if (!['class', 'student', 'group'].includes(document.targetType)) throw new Error('Belge ilişkilendirme türü geçersiz.')
  return [...documents, { ...document, id, name: document.name.trim() }]
}

export function deleteDocument(documents, documentId) {
  return documents.filter(d => d.id !== documentId)
}

export function removeClassReferences(classes, groups, schedule, documents, classId) {
  const targetClass = classes.find(c => c.id === classId)
  const studentIds = new Set((targetClass?.students || []).map(student => student.id))
  return {
    classes: classes.filter(c => c.id !== classId),
    groups: groups.map(g => ({ ...g, classIds: (g.classIds || []).filter(id => id !== classId) })).filter(g => g.classIds.length > 0),
    schedule: schedule.filter(s => s.classId !== classId),
    documents: documents.filter(d => !(
      (d.targetType === 'class' && d.targetId === classId) ||
      (d.targetType === 'student' && studentIds.has(d.targetId))
    )),
  }
}

export function removeStudentReferences(documents, studentId) {
  return documents.filter(d => !(d.targetType === 'student' && d.targetId === studentId))
}

export function checkIntegrity(classes, groups, schedule, documents) {
  const classIds = new Set(classes.map(c => c.id))
  const studentIds = new Set(classes.flatMap(c => c.students.map(s => s.id)))
  const groupIds = new Set(groups.map(g => g.id))
  const validSchedule = schedule.filter(s => classIds.has(s.classId))
  const validDocuments = documents.filter(d => {
    if (d.targetType === 'class') return classIds.has(d.targetId)
    if (d.targetType === 'student') return studentIds.has(d.targetId)
    if (d.targetType === 'group') return groupIds.has(d.targetId)
    return false
  })
  return { schedule: validSchedule, documents: validDocuments, ok: validSchedule.length === schedule.length && validDocuments.length === documents.length }
}
