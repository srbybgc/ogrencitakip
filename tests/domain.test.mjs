import test from 'node:test'
import assert from 'node:assert/strict'
import { addLesson, removeClassReferences } from '../src/domain.js'

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
