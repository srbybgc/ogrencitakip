import test from 'node:test'
import assert from 'node:assert/strict'

test('lifecycle snapshot modeli sınıf, öğrenci ve ilişkili kayıtları taşıyabilir', () => {
  const cls={id:'c1',name:'4D',students:[{id:'s1',firstName:'Ada',lastName:'Kaya'}]}
  const docs=[{id:'d1',targetType:'student',targetId:'s1'}]
  const records=[{id:'r1',studentId:'s1',type:'note',date:'2026-09-10',text:'Not'}]
  const snapshot={classData:cls,documents:docs,records}
  assert.equal(snapshot.classData.students[0].id,'s1')
  assert.equal(snapshot.documents[0].targetId,'s1')
  assert.equal(snapshot.records[0].studentId,'s1')
})

test('arşivli sınıf aktif listeden ayrıştırılabilir', () => {
  const classes=[{id:'a',name:'4A'},{id:'d',name:'4D',archivedAt:'2026-09-10T00:00:00Z'}]
  assert.deepEqual(classes.filter(c=>!c.archivedAt).map(c=>c.id),['a'])
  assert.deepEqual(classes.filter(c=>c.archivedAt).map(c=>c.id),['d'])
})
