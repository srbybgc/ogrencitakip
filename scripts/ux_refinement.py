from pathlib import Path

def replace_once(text, old, new, label):
    if old not in text: raise SystemExit(f'missing {label}')
    return text.replace(old, new, 1)

p=Path('src/App.jsx'); s=p.read_text()
s=replace_once(s,"<Home classes={activeClasses} groups={groups} dayLessons={dayLessons} currentLesson={currentLesson} activeDay={activeDay} setActiveDay={setActiveDay} onClass={goClass} onSchedule={() => setView('schedule')} onAdd={() => { setError(''); setModal('new') }} />","<Home classes={activeClasses} groups={groups} dayLessons={dayLessons} currentLesson={currentLesson} activeDay={activeDay} setActiveDay={activeDay} onClass={goClass} onSchedule={() => setView('schedule')} onAdd={() => { setError(''); setModal('new') }} onAddClass={() => { setError(''); setModal('class') }} search={search} setSearch={setSearch} />",'Home props')
