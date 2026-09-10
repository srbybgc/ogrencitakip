from pathlib import Path

p = Path('src/App.jsx')
s = p.read_text()

if "./ReferenceDashboard" in s:
    print('Dashboard already migrated')
    raise SystemExit(0)

s = s.replace("import ClassSchedulePage from './ClassSchedulePage'", "import ClassSchedulePage from './ClassSchedulePage'\nimport ReferenceDashboard from './ReferenceDashboard'")
old = "{view === 'home' && <Home classes={activeClasses} groups={groups} dayLessons={dayLessons} currentLesson={currentLesson} activeDay={activeDay} setActiveDay={setActiveDay} onClass={goClass} onSchedule={() => setView('schedule')} onAdd={() => { setError(''); setModal('new') }} onAddClass={() => { setError(''); setModal('class') }} search={search} setSearch={setSearch} />}"
new = "{view === 'home' && <ReferenceDashboard classes={activeClasses} schedule={schedule} documents={documents} search={search} setSearch={setSearch} onClass={goClass} onClasses={() => setView('classes')} onSchedule={() => setView('schedule')} onAddClass={() => { setError(''); setModal('class') }} onNewStudent={() => setView('classes')} onDocument={() => setView('documents')} />}"
if old not in s:
    raise SystemExit('Home render pattern not found')
s = s.replace(old, new)
p.write_text(s)
print('Dashboard migration applied')
