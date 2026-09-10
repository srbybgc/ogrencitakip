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

test('öğrenci kayıtları doğrulanır', () => {
  const classes = [{ id: 'c1', students: [{ id: 's1', firstName: 'Ada', lastName: 'Kaya' }] }]
  const records = [
    { id: 'r1', studentId: 's1', type: 'note', text: 'Not' },
    { id: 'r2', studentId: 'deleted', type: 'note', text: 'Yetim' },
  ]
  const result = checkStudentRecordIntegrity(classes, records)
  assert.equal(result.ok, false)
  assert.equal(result.records.length, 1)
})

test('öğrenci silinince kayıtları temizlenebilir', () => {
  const records = [
    { id: 'r1', studentId: 's1', type: 'note', text: 'Not' },
    { id: 'r2', studentId: 's2', type: 'note', text: 'Not' },
  ]
  assert.deepEqual(removeStudentRecords(records, 's1').map(x => x.id), ['r2'])
})
