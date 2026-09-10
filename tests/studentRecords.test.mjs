import test from 'node:test'
import assert from 'node:assert/strict'
import { addStudentRecord, checkStudentRecordIntegrity, deleteStudentRecord, removeStudentRecords } from '../src/studentRecords.js'

test('öğrenci notu eklenir ve silinir', () => {
  const record = { studentId: 's1', type: 'note', text: 'Veli ile görüşüldü.' }
  let records = addStudentRecord([], record, 'r1')
  assert.equal(records[0].text, record.text)
  records = deleteStudentRecord(records, 'r1')
  assert.equal(records.length, 0)
})

test('yoklama ve olay kayıtları kabul edilir', () => {
  const records = addStudentRecord([], { studentId: 's1', type: 'attendance', text: 'Geldi', status: 'Geldi', date: '2026-09-10' }, 'r1')
  const next = addStudentRecord(records, { studentId: 's1', type: 'event', text: 'Veli görüşmesi', date: '2026-09-10' }, 'r2')
  assert.deepEqual(next.map(item => item.type), ['attendance', 'event'])
  assert.equal(next[0].status, 'Geldi')
})

test('geçersiz yoklama durumu reddedilir', () => {
  assert.throws(
    () => addStudentRecord([], { studentId: 's1', type: 'attendance', text: 'Bilinmiyor', status: 'Bilinmiyor' }, 'r1'),
    /Geçersiz yoklama durumu/,
  )
})

test('öğrenci kayıtları doğrulanır', () => {
  const classes = [{ id: 'c1', students: [{ id: 's1', firstName: 'Ada', lastName: 'Kaya' }] }]
  const records = [
    { id: 'r1', studentId: 's1', type: 'note', text: 'Not' },
    { id: 'r2', studentId: 'deleted', type: 'note', text: 'Yetim' },
    { id: 'r3', studentId: 's1', type: 'unknown', text: 'Geçersiz' },
  ]
  const result = checkStudentRecordIntegrity(classes, records)
  assert.equal(result.ok, false)
  assert.deepEqual(result.records.map(item => item.id), ['r1'])
})

test('öğrenci silinince kayıtları temizlenebilir', () => {
  const records = [
    { id: 'r1', studentId: 's1', type: 'note', text: 'Not' },
    { id: 'r2', studentId: 's2', type: 'note', text: 'Not' },
  ]
  assert.deepEqual(removeStudentRecords(records, 's1').map(x => x.id), ['r2'])
})
