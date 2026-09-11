import assert from 'node:assert/strict'
import test from 'node:test'
import { addClass, addLesson, addStudent, attachDocument, checkIntegrity, createGroup, deleteDocument, deleteGroup, deleteLesson, deleteStudent, documentsForStudentRemoval, overlap, removeClassReferences, removeStudentReferences } from '../src/domain.js'

test('overlap detects partial and full overlaps', () => {
  assert.equal(overlap('09:00', '10:00', '09:30', '09:45'), true)
  assert.equal(overlap('09:30', '09:45', '09:00', '10:00'), true)
  assert.equal(overlap('09:00', '10:00', '10:00', '11:00'), false)
})

test('classes are unique and sorted', () => {
  const classes = addClass(addClass([], '10-A', 'b'), '9-A', 'a')
  assert.deepEqual(classes.map(c => c.name), ['9-A', '10-A'])
  assert.throws(() => addClass(classes, ' 9-a '), /zaten mevcut/)
})

test('students are unique within a class and sorted', () => {
  let classes = addClass([], '5-A', 'c')
  classes = addStudent(classes, 'c', 'Zeynep', 'A', 's2')
  classes = addStudent(classes, 'c', 'Ali', 'B', 's1')
  assert.deepEqual(classes[0].students.map(s => s.id), ['s1', 's2'])
  assert.throws(() => addStudent(classes, 'c', 'ali', 'b'), /zaten mevcut/)
  classes = deleteStudent(classes, 'c', 's1')
  assert.equal(classes[0].students.length, 1)
})

test('student details preserve birth date and contact fields', () => {
  const classes = addStudent(addClass([], '6-A', 'c'), 'c', 'Ayşe', 'Yılmaz', 's1', { studentNumber: '12', birthDate: '2014-05-06', parentName: 'Anne', parentPhone: '555', secondParentName: 'Baba', secondParentPhone: '556', address: 'Adres' })
  assert.deepEqual(classes[0].students[0], { id:'s1', firstName:'Ayşe', lastName:'Yılmaz', studentNumber:'12', birthDate:'2014-05-06', gender:'', parentName:'Anne', parentPhone:'555', secondParentName:'Baba', secondParentPhone:'556', address:'Adres' })
})

test('groups are unique and deletable', () => {
  const groups = createGroup([], 'A Grubu', ['c1'], 'g1')
  assert.deepEqual(createGroup(groups, 'B Grubu', ['c2'], 'g2').map(g => g.id), ['g1', 'g2'])
  assert.throws(() => createGroup(groups, 'a grubu', ['c1']), /zaten mevcut/)
  assert.deepEqual(deleteGroup(groups, 'g1'), [])
})

test('lessons reject same-class overlaps but allow different classes', () => {
  const first = { classId:'c1', day:1, start:'09:00', end:'10:00', lesson:'Matematik' }
  const schedule = addLesson([], first, 'l1')
  assert.throws(() => addLesson(schedule, { ...first, start:'09:30', end:'10:30' }), /başka bir dersi/)
  assert.deepEqual(addLesson(schedule, { ...first, classId:'c2' }, 'l2').map(x => x.id), ['l1', 'l2'])
})

test('lessons reject invalid time formats, ranges, and days', () => {
  const base = { classId:'c1', day:1, start:'09:00', end:'10:00', lesson:'Türkçe' }
  assert.throws(() => addLesson([], { ...base, start:'9:00' }), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start:'09:60' }), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start:'24:00' }), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, start:'11:00', end:'10:00' }), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, day:-1 }), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, day:5 }), /geçersiz/)
  assert.throws(() => addLesson([], { ...base, day:'1' }), /geçersiz/)
})

test('documents require a valid target type', () => {
  assert.throws(() => attachDocument([], { name:'', targetType:'class', targetId:'c1' }), /zorunlu/)
  assert.throws(() => attachDocument([], { name:'Belge', targetType:'other', targetId:'c1' }), /geçersiz/)
  assert.deepEqual(attachDocument([], { name:' Belge ', targetType:'class', targetId:'c1' }, 'd1')[0].name, 'Belge')
})

test('deleting a class removes linked references', () => {
  const classes = [{ id:'c1', name:'5-A', students:[{ id:'s1', firstName:'Ali', lastName:'A' }] }, { id:'c2', name:'6-A', students:[] }]
  const groups = [{ id:'g1', name:'G', classIds:['c1','c2'] }, { id:'g2', name:'Only', classIds:['c1'] }]
  const schedule = [{ id:'l1', classId:'c1', day:1, start:'09:00', end:'10:00', lesson:'Mat' }, { id:'l2', classId:'c2', day:1, start:'09:00', end:'10:00', lesson:'Fen' }]
  const documents = [{ id:'d1', name:'Sınıf', targetType:'class', targetId:'c1' }, { id:'d2', name:'Öğrenci', targetType:'student', targetId:'s1' }, { id:'d3', name:'Kalacak', targetType:'class', targetId:'c2' }]
  const result = removeClassReferences(classes, groups, schedule, documents, 'c1')
  assert.deepEqual(result.classes.map(c => c.id), ['c2'])
  assert.deepEqual(result.groups.map(g => g.classIds), [['c2']])
  assert.deepEqual(result.schedule.map(s => s.id), ['l2'])
  assert.deepEqual(result.removedDocuments.map(d => d.id), ['d1', 'd2'])
})

test('student document references can be removed and listed', () => {
  const documents = [{ id:'d1', targetType:'student', targetId:'s1' }, { id:'d2', targetType:'class', targetId:'c1' }]
  assert.deepEqual(documentsForStudentRemoval(documents, 's1').map(d => d.id), ['d1'])
  assert.deepEqual(removeStudentReferences(documents, 's1').map(d => d.id), ['d2'])
  assert.deepEqual(deleteDocument(documents, 'd2').map(d => d.id), ['d1'])
  assert.deepEqual(deleteLesson([{ id:'l1' }, { id:'l2' }], 'l1').map(x => x.id), ['l2'])
})

test('integrity removes malformed schedule entries', () => {
  const classes = [{ id:'c1', name:'5-A', students:[] }]
  const schedule = [
    { id:'ok', classId:'c1', day:1, start:'09:00', end:'10:00', lesson:'Mat' },
    { id:'bad-time', classId:'c1', day:1, start:'9:00', end:'10:00', lesson:'Fen' },
    { id:'bad-range', classId:'c1', day:1, start:'11:00', end:'10:00', lesson:'Sosyal' },
    { id:'bad-day', classId:'c1', day:5, start:'12:00', end:'13:00', lesson:'İngilizce' }
  ]
  const result = checkIntegrity(classes, [], schedule, [])
  assert.deepEqual(result.schedule.map(s => s.id), ['ok'])
  assert.equal(result.ok, false)
})
