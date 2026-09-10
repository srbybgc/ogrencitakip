export const studentRecordKey = (studentId) => `ot-student-records:${studentId}`

export const sortStudentRecords = (records) => [...records].sort((a, b) => {
  const ad = new Date(a.date || a.createdAt || 0).getTime()
  const bd = new Date(b.date || b.createdAt || 0).getTime()
  return bd - ad
})
