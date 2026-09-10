import { checkIntegrity } from './domain'

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function repairStoredData() {
  if (typeof window === 'undefined') return
  const classes = read('ot-classes', [])
  const groups = read('ot-groups', [])
  const schedule = read('ot-schedule', [])
  const documents = read('ot-documents', [])
  const result = checkIntegrity(classes, groups, schedule, documents)
  if (result.schedule.length !== schedule.length) localStorage.setItem('ot-schedule', JSON.stringify(result.schedule))
  if (result.documents.length !== documents.length) localStorage.setItem('ot-documents', JSON.stringify(result.documents))

  const classIds = new Set(classes.map(c => c.id))
  const cleanedGroups = groups
    .map(g => ({ ...g, classIds: Array.isArray(g.classIds) ? g.classIds.filter(id => classIds.has(id)) : [] }))
    .filter(g => g.classIds.length > 0)
  if (JSON.stringify(cleanedGroups) !== JSON.stringify(groups)) localStorage.setItem('ot-groups', JSON.stringify(cleanedGroups))
}
