import test from 'node:test'
import assert from 'node:assert/strict'
import { addClass, addLesson, addStudent, attachDocument, checkIntegrity, createGroup, deleteDocument, deleteGroup, deleteLesson, deleteStudent, removeClassReferences, removeStudentReferences } from '../src/domain.js'
import { addStudentRecord, checkStudentRecordIntegrity, removeClassStudentRecords, removeStudentRecords } from '../src/studentRecords.js'

const ids = { classId: 'c1', studentId: 's1', groupId: 'g1', lessonId: 'l1', docId: 'd1' }
const today = '2026-09-10'

test('sınıf ve öğrenci veri girişi', () => {
  let classes = addClass([], '3-A', ids.classId)
  classes = addStudent(classes, ids.classId, 'Zeynep', 'Kaya', ids.studentId)
  assert.equal(classes[0].name, '3-A')
  assert.equal(classes[0].students.length, 1)
  assert.throws(() => addClass(classes, '3-A', 'c2'), /zaten mevcut/)
  assert.throws(() => addStudent(classes, ids.classId, 'Zeynep', 'Kaya', 's2'), /zaten mevcut/)
  assert.throws(() => addStudent(classes, 'missing', 'Ali'), /Sınıf bulunamadı/)
})

test('grup ilişkilendirme ve silme', () => {
  const groups = createGroup([], 'Sabah Grubu', [ids.classId], ids.groupId)
  assert.deepEqual(groups[0].classIds, [ids.classId])
  assert.throws(() => createGroup(groups, 'sabah grubu', [], 'g2'), /zaten mevcut/)
  assert.deepEqual(deleteGroup(groups, ids.groupId), [])
})

test('ders ekleme, çakışma kontrolü ve silme', () => {
  let schedule = addLesson([], { day: 0, start: '09:00', end: '09:40', classId: ids.classId, lesson: 'Türkçe' }, ids.lessonId)
  assert.throws(() => addLesson(schedule, { day: 0, start: '09:20', end: '10:00', classId: 'c2', lesson: 'Matematik' }), /başka bir ders/)
  assert.throws(() => addLesson(schedule, { day: 0, start: '10:00', end: '09:50', classId: 'c2', lesson: 'Matematik' }), /geçersiz/)
  schedule = deleteLesson(schedule, ids.lessonId)
  assert.equal(schedule.length, 0)
})

test('belge ilişkilendirme ve silme', () => {
  const doc = { name: 'Veli Toplantısı.pdf', targetType: 'class', targetId: ids.classId, size: 1200, type: 'application/pdf' }
  let docs = attachDocument([], doc, ids.docId)
  assert.equal(docs[0].targetId, ids.classId)
  assert.throws(() => attachDocument([], { name: 'x.pdf', targetType: 'bad', targetId: 'x' }), /geçersiz/)
  docs = deleteDocument(docs, ids.docId)
  assert.equal(docs.length, 0)
})

test('öğrenci silme ve öğrenci belgelerini temizleme', () => {
  const classes = [{ id: ids.classId, name: '3-A', students: [{ id: ids.studentId, firstName: 'Zeynep', lastName: 'Kaya' }] }]
  assert.equal(deleteStudent(classes, ids.classId, ids.studentId)[0].students.length, 0)
  const docs = [{ id: 'student-doc', targetType: 'student', targetId: ids.studentId }, { id: 'class-doc', targetType: 'class', targetId: ids.classId }]
  assert.deepEqual(removeStudentReferences(docs, ids.studentId).map(d => d.id), ['class-doc'])
})

test('öğrenci takip kaydı ve bütünlük kontrolü', () => {
  const classes = [{ id: ids.classId, name: '3-A', students: [{ id: ids.studentId, firstName: 'Zeynep', lastName: 'Kaya' }] }]
  let records = addStudentRecord([], { studentId: ids.studentId, type: 'note', text: 'Veli ile görüşüldü.', date: today }, 'r1')
  assert.throws(() => addStudentRecord(records, { studentId: ids.studentId, type: 'note', text: 'Tekrar', date: today }, 'r1'), /zaten mevcut/)
  records = [...records, { id: 'orphan', studentId: 'deleted', type: 'note', text: 'Yetim', date: today }]
  const checked = checkStudentRecordIntegrity(classes, records)
  assert.equal(checked.ok, false)
  assert.deepEqual(checked.records.map(x => x.id), ['r1'])
  assert.deepEqual(removeStudentRecords(records, ids.studentId).map(x => x.id), ['orphan'])
  assert.equal(removeClassStudentRecords(records, [ids.studentId]).length, 1)
})

test('sınıf silinince ilişkili kayıtlar temizleniyor', () => {
  const classes = [{ id: ids.classId, name: '3-A', students: [{ id: ids.studentId, firstName: 'Zeynep', lastName: 'Kaya' }] }]
  const groups = [{ id: ids.groupId, name: 'Sabah', classIds: [ids.classId] }]
  const schedule = [{ id: ids.lessonId, day: 0, start: '09:00', end: '09:40', classId: ids.classId, lesson: 'Türkçe' }]
  const documents = [{ id: ids.docId, name: 'Belge.pdf', targetType: 'class', targetId: ids.classId }]
  const result = removeClassReferences(classes, groups, schedule, documents, ids.classId)
  assert.equal(result.classes.length, 0)
  assert.equal(result.schedule.length, 0)
  assert.equal(result.documents.length, 0)
  assert.equal(result.groups.length, 0)
})

test('yetim ilişki kontrolü', () => {
  const result = checkIntegrity(
    [{ id: ids.classId, name: '3-A', students: [] }],
    [],
    [{ id: 'orphan', day: 0, start: '09:00', end: '09:40', classId: 'deleted', lesson: 'Türkçe' }],
    [{ id: 'doc', name: 'x.pdf', targetType: 'class', targetId: 'deleted' }],
  )
  assert.equal(result.ok, false)
  assert.equal(result.schedule.length, 0)
  assert.equal(result.documents.length, 0)
})
