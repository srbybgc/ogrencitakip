export const overlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd

const compareTr = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'tr', { sensitivity: 'base', numeric: true })

export function sortStudents(students) {
  return [...(Array.isArray(students) ? students : [])].sort((a, b) => {
    const first = compareTr(a.firstName, b.firstName)
    return first || compareTr(a.lastName, b.lastName)
  })
}

export function sortClasses(classes) {
  return [...(Array.isArray(classes) ? classes : [])].sort((a, b) => compareTr(a.name, b.name))
}

export function addClass(classes, name, id = crypto.randomUUID()) {
  const clean = name.trim()
  if (!clean) throw new Error('Sınıf adı boş bırakılamaz.')
  if (classes.some(c => c.name.trim().toLocaleLowerCase('tr') === clean.toLocaleLowerCase('tr'))) throw new Error('Bu sınıf zaten mevcut.')
  return sortClasses([...classes, { id, name: clean, students: [] }])
}

export function addStudent(classes, classId, firstName, lastName = '', id = crypto.randomUUID(), details = {}) {
  const first = firstName.trim()
  const last = lastName.trim()
  if (!first) throw new Error('Öğrenci adı boş bırakılamaz.')
  let found = false
  const result = classes.map(c => {
    if (c.id !== classId) return c
    found = true
    const students = Array.isArray(c.students) ? c.students : []
    const duplicate = students.some(s => `${s.firstName} ${s.lastName}`.trim().toLocaleLowerCase('tr') === `${first} ${last}`.trim().toLocaleLowerCase('tr'))
    if (duplicate) throw new Error('Bu öğrenci bu sınıfta zaten mevcut.')
    return { ...c, students: sortStudents([...students, { id, firstName: first, lastName: last, birthDate: details.birthDate || '', gender: details.gender || '', parentName: details.parentName || '', parentPhone: details.parentPhone || '', secondParentName: details.secondParentName || '', secondParentPhone: details.secondParentPhone || '', address: details.address || '' }]) }
  })
  if (!found) throw new Error('Sınıf bulunamadı.')
  return sortClasses(result)
}

export function deleteStudent(classes, classId, studentId) {
  return classes.map(c => c.id === classId ? { ...c, students: sortStudents((Array.isArray(c.students) ? c.students : []).filter(s => s.id !== studentId)) } : c)
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
  const clash = schedule.some(s => s.classId === lesson.classId && s.day === lesson.day && overlap(s.start, s.end, lesson.start, lesson.end))
  if (clash) throw new Error('Bu sınıfın bu saat aralığında başka bir dersi bulunuyor.')
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
  const studentIds = new Set((Array.isArray(targetClass?.students) ? targetClass.students : []).map(student => student.id))
  const removedDocuments = documents.filter(d => (
    (d.targetType === 'class' && d.targetId === classId) ||
    (d.targetType === 'student' && studentIds.has(d.targetId))
  ))
  return {
    classes: classes.filter(c => c.id !== classId),
    groups: groups.map(g => ({ ...g, classIds: (g.classIds || []).filter(id => id !== classId) })).filter(g => g.classIds.length > 0),
    schedule: schedule.filter(s => s.classId !== classId),
    documents: documents.filter(d => !removedDocuments.some(removed => removed.id === d.id)),
    removedDocuments,
  }
}

export function removeStudentReferences(documents, studentId) {
  return documents.filter(d => !(d.targetType === 'student' && d.targetId === studentId))
}

export function documentsForStudentRemoval(documents, studentId) {
  return documents.filter(d => d.targetType === 'student' && d.targetId === studentId)
}

export function checkIntegrity(classes, groups, schedule, documents) {
  const safeClasses = Array.isArray(classes) ? classes : []
  const safeGroups = Array.isArray(groups) ? groups : []
  const safeSchedule = Array.isArray(schedule) ? schedule : []
  const safeDocuments = Array.isArray(documents) ? documents : []
  const sortedClasses = sortClasses(safeClasses).map(c => ({ ...c, students: sortStudents(c.students) }))
  const classIds = new Set(sortedClasses.map(c => c.id))
  const studentIds = new Set(sortedClasses.flatMap(c => (Array.isArray(c.students) ? c.students : []).map(s => s.id)))
  const groupIds = new Set(safeGroups.map(g => g.id))
  const validSchedule = safeSchedule.filter(s => classIds.has(s.classId))
  const validDocuments = safeDocuments.filter(d => {
    if (d.targetType === 'class') return classIds.has(d.targetId)
    if (d.targetType === 'student') return studentIds.has(d.targetId)
    if (d.targetType === 'group') return groupIds.has(d.targetId)
    return false
  })
  return { classes: sortedClasses, schedule: validSchedule, documents: validDocuments, ok: validSchedule.length === safeSchedule.length && validDocuments.length === safeDocuments.length }
}
