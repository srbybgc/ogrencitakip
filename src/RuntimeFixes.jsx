import { useEffect } from 'react'

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim()
const readClasses = () => { try { const value = JSON.parse(localStorage.getItem('ot-classes') || '[]'); return Array.isArray(value) ? value : [] } catch { return [] } }
const saveClasses = value => { localStorage.setItem('ot-classes', JSON.stringify(value)); window.dispatchEvent(new Event('ot-data-changed')) }

const installClassPersistence = () => {
  if (typeof window === 'undefined' || window.__otClassPersistenceInstalled) return
  window.__otClassPersistenceInstalled = true
  let current = sessionStorage.getItem('ot-last-class-id') || ''
  try {
    Object.defineProperty(window, '__otSelectedClass', {
      configurable: true,
      get: () => current,
      set: value => { current = value == null ? '' : String(value); if (current) sessionStorage.setItem('ot-last-class-id', current) },
    })
  } catch { window.__otSelectedClass = current }
}
installClassPersistence()

const installClassSaveGuard = () => {
  if (window.__otClassSaveGuardInstalled) return
  window.__otClassSaveGuardInstalled = true
  const originalSetItem = window.localStorage.setItem.bind(window.localStorage)
  window.localStorage.setItem = (key, value) => {
    if (key === 'ot-classes') {
      try {
        const incoming = JSON.parse(value)
        const existing = JSON.parse(window.localStorage.getItem('ot-classes') || '[]')
        const teacher2 = new Map((Array.isArray(existing) ? existing : []).filter(item => item?.teacher2).map(item => [String(item.id), item.teacher2]))
        if (Array.isArray(incoming)) value = JSON.stringify(incoming.map(item => teacher2.has(String(item.id)) && !item.teacher2 ? { ...item, teacher2: teacher2.get(String(item.id)) } : item))
      } catch {}
    }
    originalSetItem(key, value)
  }
}

const restoreClass = () => {
  const id = sessionStorage.getItem('ot-last-class-id')
  if (!id || document.querySelector('.class-detail-top')) return
  const cls = readClasses().find(item => String(item.id) === String(id))
  if (!cls) return
  const classGrid = document.querySelector('.class-grid')
  if (!classGrid) {
    const nav = [...document.querySelectorAll('.desktop-nav button')].find(button => clean(button.textContent) === 'Sınıflar')
    if (nav) { nav.click(); setTimeout(restoreClass, 180) }
    return
  }
  const card = [...document.querySelectorAll('.class-card, .ref-class')].find(button => clean(button.querySelector('b')?.textContent || button.textContent).startsWith(clean(cls.name)))
  if (card) card.click()
}

const teacherField = (label, name, value = '') => {
  const field = document.createElement('label')
  field.className = 'field'
  const span = document.createElement('span')
  span.textContent = label
  const input = document.createElement('input')
  input.name = name
  input.value = value
  input.placeholder = label
  field.append(span, input)
  return field
}

const addSecondTeacher = () => {
  const card = document.querySelector('.teacher-card')
  if (!card || card.querySelector('[data-ot-teacher2]')) return
  const id = sessionStorage.getItem('ot-last-class-id') || window.__otSelectedClass
  if (!id) return
  const cls = readClasses().find(item => String(item.id) === String(id))
  if (!cls) return

  const box = document.createElement('div')
  box.dataset.otTeacher2 = '1'
  box.className = 'teacher-second'
  card.appendChild(box)

  const render = () => {
    const current = readClasses().find(item => String(item.id) === String(id))?.teacher2
    box.innerHTML = ''
    const head = document.createElement('div')
    head.className = 'section-head'
    const title = document.createElement('div')
    const h = document.createElement('h3')
    h.textContent = 'İkinci Öğretmen'
    const p = document.createElement('p')
    p.className = 'muted'
    p.textContent = 'Öğleden sonra gelen branş öğretmeni.'
    title.append(h, p)
    head.appendChild(title)
    box.appendChild(head)

    if (current?.name) {
      const summary = document.createElement('div')
      summary.className = 'teacher-second-summary'
      const name = document.createElement('b')
      name.textContent = current.name
      const details = document.createElement('span')
      details.textContent = [current.branch, current.phone].filter(Boolean).join(' · ')
      summary.append(name, details)
      const actions = document.createElement('div')
      actions.className = 'row-actions'
      const edit = document.createElement('button')
      edit.className = 'secondary'
      edit.textContent = 'Düzenle'
      edit.onclick = () => form(current)
      const remove = document.createElement('button')
      remove.className = 'icon-btn'
      remove.textContent = 'Sil'
      remove.onclick = () => { if (!window.confirm('İkinci öğretmen silinsin mi?')) return; saveClasses(readClasses().map(item => String(item.id) === String(id) ? { ...item, teacher2: null } : item)); render() }
      actions.append(edit, remove)
      summary.appendChild(actions)
      box.appendChild(summary)
    } else {
      const add = document.createElement('button')
      add.className = 'secondary'
      add.textContent = 'Öğretmen Ekle'
      add.onclick = () => form({})
      box.appendChild(add)
    }
  }

  const form = current => {
    box.innerHTML = ''
    const head = document.createElement('div')
    head.className = 'section-head'
    const h = document.createElement('h3')
    h.textContent = 'İkinci Öğretmen Bilgileri'
    head.appendChild(h)
    box.appendChild(head)
    const grid = document.createElement('div')
    grid.className = 'teacher-second-grid'
    const fields = [
      teacherField('Adı soyadı', 'name', current.name),
      teacherField('Branş', 'branch', current.branch),
      teacherField('Telefon', 'phone', current.phone),
      teacherField('E-posta', 'email', current.email),
    ]
    fields.forEach(field => grid.appendChild(field))
    box.appendChild(grid)
    const actions = document.createElement('div')
    actions.className = 'row-actions'
    const cancel = document.createElement('button')
    cancel.className = 'secondary'
    cancel.textContent = 'Vazgeç'
    cancel.onclick = render
    const save = document.createElement('button')
    save.className = 'primary'
    save.textContent = 'Kaydet'
    save.onclick = () => {
      const data = Object.fromEntries(fields.map(field => [field.querySelector('input').name, clean(field.querySelector('input').value)]))
      if (!data.name) { window.alert('Öğretmenin adı soyadı gerekli.'); return }
      saveClasses(readClasses().map(item => String(item.id) === String(id) ? { ...item, teacher2: data } : item))
      render()
    }
    actions.append(cancel, save)
    box.appendChild(actions)
  }

  render()
}

export default function RuntimeFixes() {
  useEffect(() => {
    installClassSaveGuard()
    const onClick = event => {
      const button = event.target.closest('button')
      if (!button) return
      const text = clean(button.textContent)
      if (button.classList.contains('brand') || ['Ana Sayfa', 'Ders Programı', 'Belgeler', 'Raporlar', 'Arşiv', 'Çöp Kutusu', 'Ayarlar'].includes(text)) sessionStorage.removeItem('ot-last-class-id')
    }
    document.addEventListener('click', onClick)
    const observer = new MutationObserver(() => addSecondTeacher())
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = setInterval(() => { restoreClass(); addSecondTeacher() }, 250)
    return () => { document.removeEventListener('click', onClick); observer.disconnect(); clearInterval(timer) }
  }, [])
  return null
}
