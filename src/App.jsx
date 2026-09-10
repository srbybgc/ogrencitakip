import { useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, Clock3, FileText, LayoutGrid, Plus, Users } from 'lucide-react'

const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']

const demoClasses = [
  { id: 1, name: '1-A', students: 18 },
  { id: 2, name: '1-B', students: 16 },
  { id: 3, name: '2-A', students: 20 },
]

const demoSchedule = [
  { day: 0, start: '09:00', end: '09:40', className: '1-A', lesson: 'Türkçe' },
  { day: 0, start: '10:00', end: '10:40', className: '2-A', lesson: 'Matematik' },
  { day: 1, start: '09:00', end: '09:40', className: '1-B', lesson: 'Hayat Bilgisi' },
]

function App() {
  const [activeDay, setActiveDay] = useState(0)
  const [view, setView] = useState('today')

  const todaySchedule = useMemo(
    () => demoSchedule.filter((item) => item.day === activeDay),
    [activeDay],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">Ö</div>
          <div>
            <strong>Öğrenci Takip</strong>
            <span>Günlük sınıf yönetimi</span>
          </div>
        </div>
        <button className="icon-button" aria-label="Takvim">
          <CalendarDays size={20} />
        </button>
      </header>

      <main className="content">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">Bugün</p>
            <h1>Sınıfların</h1>
            <p className="muted">Ders programın ve sınıfların tek bakışta.</p>
          </div>
          <button className="primary-button"><Plus size={18} /> Yeni</button>
        </section>

        <section className="day-strip">
          {weekDays.map((day, index) => (
            <button
              key={day}
              className={activeDay === index ? 'day-chip active' : 'day-chip'}
              onClick={() => { setActiveDay(index); setView('today') }}
            >
              <span>{day.slice(0, 3)}</span>
              <strong>{index + 8}</strong>
            </button>
          ))}
        </section>

        <section className="section-card schedule-card">
          <div className="section-heading">
            <div>
              <div className="section-title"><Clock3 size={18} /> Ders Programı</div>
              <p className="muted">Bugünkü dersler</p>
            </div>
            <button className="text-button">Tümünü gör <ChevronRight size={16} /></button>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="empty-state">Bu gün için henüz ders programı girilmemiş.</div>
          ) : (
            <div className="schedule-list">
              {todaySchedule.map((item) => (
                <div className="schedule-item" key={`${item.className}-${item.start}`}>
                  <div className="time">{item.start}<span>{item.end}</span></div>
                  <div className="schedule-main">
                    <strong>{item.className}</strong>
                    <span>{item.lesson}</span>
                  </div>
                  <ChevronRight size={18} className="chevron" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <div className="section-title"><LayoutGrid size={18} /> Sınıflar</div>
              <p className="muted">Sınıflarını ve öğrenci sayılarını yönet</p>
            </div>
            <button className="icon-add"><Plus size={18} /></button>
          </div>
          <div className="class-grid">
            {demoClasses.map((item, index) => (
              <button className={index === 0 && activeDay === 0 ? 'class-card priority' : 'class-card'} key={item.id}>
                <div className="class-icon"><Users size={19} /></div>
                <div className="class-info"><strong>{item.name}</strong><span>{item.students} öğrenci</span></div>
                <ChevronRight size={18} className="chevron" />
              </button>
            ))}
          </div>
        </section>

        <section className="quick-actions">
          <button className="quick-card" onClick={() => setView('files')}>
            <div className="quick-icon"><FileText size={20} /></div>
            <div><strong>Belge / Dosya Ekle</strong><span>Dosyayı sınıf, grup veya öğrenciyle ilişkilendir</span></div>
            <ChevronRight size={18} />
          </button>
        </section>

        {view === 'files' && (
          <div className="notice">Dosya ekleme ekranını bir sonraki adımda Firebase Storage ile bağlayacağız.</div>
        )}
      </main>
    </div>
  )
}

export default App
