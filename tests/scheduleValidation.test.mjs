import assert from 'node:assert/strict'
import test from 'node:test'
import { addLesson, checkIntegrity } from '../src/domain.js'

test('schedule validation keeps valid weekdays and removes invalid persisted entries', () => {
  const classes = [{ id:'c1', name:'5-A', students:[] }]
  const schedule = [
    { id:'monday', classId:'c1', day:0, start:'08:30', end:'09:30', lesson:'Ders' },
    { id:'invalid-day', classId:'c1', day:7, start:'08:30', end:'09:30', lesson:'Hatalı' }
  ]
  assert.deepEqual(checkIntegrity(classes, [], schedule, []).schedule.map(item => item.id), ['monday'])
})

test('schedule creation rejects non-integer weekday values', () => {
  assert.throws(() => addLesson([], { classId:'c1', day:1.5, start:'08:30', end:'09:30', lesson:'Ders' }), /geçersiz/)
})
