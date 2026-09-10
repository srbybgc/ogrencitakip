import { addStudentRecord } from './studentRecords.js'
export const smokeStudentRecord = () => addStudentRecord([], { studentId: 's1', type: 'note', text: 'ok' }, 'r1')
