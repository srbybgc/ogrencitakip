from pathlib import Path

p = Path('src/App.jsx')
s = p.read_text()

# Home dashboard import/render is already applied; now finish the reference sidebar shell.
s = s.replace("import { ChevronLeft, ChevronRight, Clock3, FileText, FolderOpen, LayoutGrid, Menu, Plus, Search, Trash2, Upload, Users, X } from 'lucide-react'", "import { Archive, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, FileText as FileTextIcon, FolderOpen, Home as HomeIcon, LayoutGrid, Menu, Plus, Search, Settings, Trash2, Upload, UserRound, Users, X } from 'lucide-react'")

if 'className="sidebar"' not in s:
    start = s.index('    <header className="topbar">')
    end = s.index('\n    {error && <div className="content">', start)
    header = '''    <aside className="topbar sidebar"><button className="brand" onClick={() => { setError(''); setView('home') }}><span className="brand-mark">Ö</span><span><b>Öğrenci Takip</b><small>Daha güzel yarınlar için</small></span></button><nav className="desktop-nav"><button className={view==='home'?'nav-active':''} onClick={()=>setView('home')}><HomeIcon size={22}/><span>Ana Sayfa</span></button><button className={view==='classes'?'nav-active':''} onClick={()=>setView('classes')}><UserRound size={22}/><span>Öğrenciler</span></button><button className={view==='classes'?'nav-active':''} onClick={()=>setView('classes')}><BookOpen size={22}/><span>Sınıflar</span></button><button className={view==='schedule'?'nav-active':''} onClick={()=>setView('schedule')}><CalendarDays size={22}/><span>Ders Programı</span></button><button className={view==='documents'?'nav-active':''} onClick={()=>setView('documents')}><FileTextIcon size={22}/><span>Belgeler</span></button></nav><div className="sidebar-divider"/><nav className="desktop-nav sidebar-lower"><button className={view==='archive'?'nav-active':''} onClick={()=>setView('archive')}><Archive size={22}/><span>Arşiv</span></button><button className={view==='trash'?'nav-active':''} onClick={()=>setView('trash')}><Trash2 size={22}/><span>Çöp Kutusu</span></button><button><Settings size={22}/><span>Ayarlar</span></button></nav><div className="sidebar-quote"><span>“</span><p>Küçük adımlar<br/>büyük değişimler<br/>yaratır.</p><i/></div><button className="icon-btn mobile-menu" onClick={()=>setModal('menu')}><Menu size={20}/></button></aside>\n    <div className="main-area">'''
    s = s[:start] + header + s[end:]
    s = s.replace('  </div>\n}\n\nfunction Home(', '  </div></div>\n}\n\nfunction Home(', 1)

p.write_text(s)
print('Reference sidebar shell applied')
