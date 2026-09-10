from pathlib import Path

p = Path('src/App.jsx')
s = p.read_text()

if "./ReferenceDashboard" in s:
    print('Dashboard already migrated')
    raise SystemExit(0)

s = s.replace("import ClassSchedulePage from './ClassSchedulePage'", "import ClassSchedulePage from './ClassSchedulePage'\nimport ReferenceDashboard from './ReferenceDashboard'")
s = s.replace("import { ChevronLeft, ChevronRight, Clock3, FileText, FolderOpen, LayoutGrid, Menu, Plus, Search, Trash2, Upload, Users, X } from 'lucide-react'", "import { Archive, BookOpen, CalendarDays, FileText as FileTextIcon, Home as HomeIcon, Menu, Settings, Trash2, Upload, UserRound, Users, X } from 'lucide-react'")

start = s.index('    <header className="topbar">')
end = s.index('\n    {error && <div className="content">', start)
header = '''    <aside className="topbar sidebar"><button className="brand" onClick={()=>{setError('');setView('home')}}><span className="brand-leaf" aria-hidden="true"><span/></span><span><b>Öğrenci Takip</b><small>Daha güzel yarınlar için</small></span></button><nav className="desktop-nav"><button className={view==='home'?'nav-active':''} onClick={()=>setView('home')}><HomeIcon size={22}/><span>Ana Sayfa</span></button><button className={view==='classes'?'nav-active':''} onClick={()=>setView('classes')}><UserRound size={22}/><span>Öğrenciler</span></button><button className={view==='classes'?'nav-active':''} onClick={()=>setView('classes')}><BookOpen size={22}/><span>Sınıflar</span></button><button className={view==='schedule'?'nav-active':''} onClick={()=>setView('schedule')}><CalendarDays size={22}/><span>Ders Programı</span></button><button className={view==='documents'?'nav-active':''} onClick={()=>setView('documents')}><FileTextIcon size={22}/><span>Belgeler</span></button></nav><div className="sidebar-divider"/><nav className="desktop-nav sidebar-lower"><button className={view==='archive'?'nav-active':''} onClick={()=>setView('archive')}><Archive size={22}/><span>Arşiv</span></button><button className={view==='trash'?'nav-active':''} onClick={()=>setView('trash')}><Trash2 size={22}/><span>Çöp Kutusu</span></button><button><Settings size={22}/><span>Ayarlar</span></button></nav><div className="sidebar-quote"><span>“</span><p>Küçük adımlar<br/>büyük değişimler<br/>yaratır.</p><i/></div><button className="icon-btn mobile-menu" onClick={()=>setModal('menu')}><Menu size={20}/></button></aside>\n    <div className="main-area">'''
s = s[:start] + header + s[end:]

old = "{view === 'home' && <Home classes={activeClasses} groups={groups} dayLessons={dayLessons} currentLesson={currentLesson} activeDay={activeDay} setActiveDay={setActiveDay} onClass={goClass} onSchedule={() => setView('schedule')} onAdd={() => { setError(''); setModal('new') }} onAddClass={() => { setError(''); setModal('class') }} search={search} setSearch={setSearch} />}"
new = "{view === 'home' && <ReferenceDashboard classes={activeClasses} schedule={schedule} documents={documents} search={search} setSearch={setSearch} onClass={goClass} onClasses={() => setView('classes')} onSchedule={() => setView('schedule')} onAddClass={() => { setError(''); setModal('class') }} onNewStudent={() => setView('classes')} onDocument={() => setView('documents')} />}"
if old not in s:
    raise SystemExit('Home render pattern not found')
s = s.replace(old, new)
p.write_text(s)
print('Dashboard migration applied')
