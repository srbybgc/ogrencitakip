import test from 'node:test'
import assert from 'node:assert/strict'
import { addClass, addStudent, addLesson, attachDocument, createGroup, deleteDocument, deleteGroup, deleteLesson, deleteStudent, removeClassReferences, removeStudentReferences, checkIntegrity } from '../src/domain.js'

test('sınıf silinince sınıfa bağlı öğrencilerin belgeleri de temizlenir', () => {
  const classes = [
    { id: 'c1', name: '1-A', students: [{ id: 's1', firstName: 'Ada', lastName: 'Kaya' }] },
    { id: 'c2', name: '2-A', students: [{ id: 's2', firstName: 'Can', lastName: 'Demir' }] },
  ]
  const groups = [{ id: 'g1', name: 'Grup', classIds: ['c1', 'c2'] }]
  const schedule = [
    { id: 'l1', classId: 'c1', day: 1, lesson: 'Matematik', start: '09:00', end: '10:00' },
    { id: 'l2', classId: 'c2', day: 1, lesson: 'Türkçe', start: '10:00', end: '11:00' },
  ]
  const documents = [
    { id: 'd1', name: 'Sınıf', targetType: 'class', targetId: 'c1' },
    { id: 'd2', name: 'Öğrenci', targetType: 'student', targetId: 's1' },
    { id: 'd3', name: 'Diğer öğrenci', targetType: 'student', targetId: 's2' },
    { id: 'd4', name: 'Diğer sınıf', targetType: 'class', targetId: 'c2' },
  ]
  const result = removeClassReferences(classes, groups, schedule, documents, 'c1')
  assert.deepEqual(result.classes.map(item => item.id), ['c2'])
  assert.deepEqual(result.groups[0].classIds, ['c2'])
  assert.deepEqual(result.schedule.map(item => item.id), ['l2'])
  assert.deepEqual(result.documents.map(item => item.id), ['d3', 'd4'])
  assert.deepEqual(result.removedDocuments.map(item => item.id), ['d1', 'd2'])
})

test('farklı sınıflar aynı saatte ders yapabilir, aynı sınıf yapamaz', () => {
  const first = { id: 'l1', classId: 'c1', day: 0, lesson: 'Matematik', start: '09:00', end: '10:00' }
  const second = { id: 'l2', classId: 'c2', day: 0, lesson: 'Türkçe', start: '09:00', end: '10:00' }
  const schedule = addLesson([first], second, 'l2')
  assert.equal(schedule.length, 2)
  assert.throws(() => addLesson(schedule, { ...second, lesson: 'Fen' }, 'l3'), /başka bir dersi/)
})

test('ders saatleri geçersizse veya kısmen çakışıyorsa ekleme reddedilir', () => {
  const base = { id: 'l1', classId: 'c1', day: 0, lesson: 'Matematik', start: '09:00', end: '10:00' }
  assert.throws(() => addLesson([], { ...base, start: '10:00', end: '09:00' }, 'bad-1'), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start: '09:00', end: '09:00' }, 'bad-2'), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start: '9:00', end: '10:00' }, 'bad-5'), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start: '09:60', end: '10:00' }, 'bad-6'), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start: '24:00', end: '25:00' }, 'bad-7'), /geçersiz/)
  assert.throws(() => addLesson([base], { ...base, start: '09:30', end: '10:30', id: undefined }, 'bad-3'), /başka bir dersi/)
  assert.throws(() => addLesson([base], { ...base, start: '08:30', end: '09:15', id: undefined }, 'bad-4'), /başka bir dersi/)
  assert.doesNotThrow(() => addLesson([base], { ...base, start: '10:00', end: '11:00', id: undefined }, 'ok-1'))
})

test('sınıf ve öğrenci ekleme tekrarları engeller, öğrenci silme çalışır', () => {
  let classes = addClass([], '  1-A  ', 'c1')
  assert.equal(classes[0].name, '1-A')
  assert.throws(() => addClass(classes, '1-a', 'c2'), /zaten mevcut/)
  classes = addStudent(classes, 'c1', ' Ada ', ' Kaya ', 's1', { studentNumber: '7', birthDate: '2019-04-12', parentPhone: '555' })
  assert.equal(classes[0].students[0].studentNumber, '7')
  assert.equal(classes[0].students[0].birthDate, '2019-04-12')
  assert.throws(() => addStudent(classes, 'c1', 'ada', 'kaya', 's2'), /zaten mevcut/)
  classes = deleteStudent(classes, 'c1', 's1')
  assert.equal(classes[0].students.length, 0)
})

test('grup ve belge ilişkilendirme CRUD doğrulamaları çalışır', () => {
  const groups = createGroup([], '  A Grubu ', ['c1', 'c1'], 'g1')
  assert.deepEqual(groups[0].classIds, ['c1'])
  assert.throws(() => createGroup(groups, 'a grubu', ['c2'], 'g2'), /zaten mevcut/)
  assert.deepEqual(deleteGroup(groups, 'g1'), [])

  const docs = attachDocument([], { name: ' Karne ', targetType: 'student', targetId: 's1', filePath: 'x' }, 'd1')
  assert.equal(docs[0].name, 'Karne')
  assert.deepEqual(deleteDocument(docs, 'd1'), [])
  assert.throws(() => attachDocument([], { name: 'Belge', targetType: 'student' }, 'd2'), /ilişkilendirileceği/)
})

test('ders ve belge silme yalnızca hedef kaydı kaldırır', () => {
  const schedule = [
    { id: 'l1', classId: 'c1', day: 0, lesson: 'Matematik', start: '09:00', end: '10:00' },
    { id: 'l2', classId: 'c2', day: 0, lesson: 'Türkçe', start: '09:00', end: '10:00' },
  ]
  assert.deepEqual(deleteLesson(schedule, 'l1').map(x => x.id), ['l2'])
  const docs = [{ id: 'd1' }, { id: 'd2' }]
  assert.deepEqual(deleteDocument(docs, 'd1').map(x => x.id), ['d2'])
})

test('öğrenci silinince yalnızca o öğrenciye bağlı belgeler kaldırılır', () => {
  const docs = [
    { id: 'd1', targetType: 'student', targetId: 's1' },
    { id: 'd2', targetType: 'student', targetId: 's2' },
    { id: 'd3', targetType: 'class', targetId: 'c1' },
  ]
  assert.deepEqual(removeStudentReferences(docs, 's1').map(x => x.id), ['d2', 'd3'])
})

test('yetim ders ve belgeler bütünlük kontrolünde temizlenir', () => {
  const result = checkIntegrity(
    [{ id: 'c1', name: '3-A', students: [{ id: 's1', firstName: 'Ada', lastName: 'Kaya' }] }],
    [{ id: 'g1', name: 'Grup', classIds: ['c1'] }],
    [
      { id: 'valid', day: 0, start: '09:00', end: '09:40', classId: 'c1', lesson: 'Türkçe' },
      { id: 'orphan', day: 0, start: '10:00', end: '10:40', classId: 'deleted', lesson: 'Fen' },
    ],
    [
      { id: 'student', name: 'Karne', targetType: 'student', targetId: 's1' },
      { id: 'orphan-doc', name: 'Eski', targetType: 'student', targetId: 'deleted' },
    ],
  )
  assert.equal(result.ok, false)
  assert.deepEqual(result.schedule.map(x => x.id), ['valid'])
  assert.deepEqual(result.documents.map(x => x.id), ['student'])
})
