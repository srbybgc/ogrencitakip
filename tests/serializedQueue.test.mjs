import test from 'node:test'
import assert from 'node:assert/strict'
import { createSerializedQueue } from '../src/serializedQueue.js'

test('aynı koleksiyon için hızlı yazmaları tek son yazmada birleştirir', async () => {
  const calls = []
  let release
  const gate = new Promise(resolve => { release = resolve })
  const queue = createSerializedQueue(async (key, value) => {
    calls.push([key, value])
    if (calls.length === 1) await gate
  })

  const first = queue('classes', [{ id: '1' }])
  const second = queue('classes', [{ id: '2' }])
  const third = queue('classes', [{ id: '3' }])
  release()
  await Promise.all([first, second, third])

  assert.deepEqual(calls, [
    ['classes', [{ id: '1' }]],
    ['classes', [{ id: '3' }]],
  ])
})

test('farklı koleksiyonlar birbirini bloklamaz', async () => {
  const calls = []
  const queue = createSerializedQueue(async (key, value) => {
    calls.push([key, value])
  })

  await Promise.all([
    queue('classes', ['c']),
    queue('groups', ['g']),
  ])

  assert.equal(calls.length, 2)
  assert.deepEqual(calls.sort(), [['classes', ['c']], ['groups', ['g']]])
})
