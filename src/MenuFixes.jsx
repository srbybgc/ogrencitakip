import { useEffect } from 'react'

const items = [
  ['Raporlar', 'Raporlar'],
  ['Arşiv', 'Arşiv'],
  ['Çöp Kutusu', 'Çöp Kutusu'],
  ['Ayarlar', 'Ayarlar'],
]

export default function MenuFixes() {
  useEffect(() => {
    const install = () => {
      const list = document.querySelector('.menu-list')
      if (!list) return
      items.forEach(([label, navLabel]) => {
        if ([...list.querySelectorAll('button')].some(button => button.dataset.otMenuLabel === label)) return
        const nav = [...document.querySelectorAll('.desktop-nav button')].find(button => button.textContent.replace(/\s+/g, ' ').trim() === navLabel)
        if (!nav) return
        const button = document.createElement('button')
        button.dataset.otMenuLabel = label
        button.type = 'button'
        button.textContent = label
        const arrow = document.createElement('span')
        arrow.textContent = '›'
        arrow.setAttribute('aria-hidden', 'true')
        button.appendChild(arrow)
        button.onclick = () => { nav.click(); document.querySelector('.modal-backdrop .icon-btn')?.click() }
        list.appendChild(button)
      })
    }
    const observer = new MutationObserver(install)
    observer.observe(document.body, { childList: true, subtree: true })
    install()
    return () => observer.disconnect()
  }, [])
  return null
}
