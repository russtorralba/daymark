import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'daymark-tasks-v1'
const statuses = ['Not Started', 'In Progress', 'Completed']
const priorities = ['Low', 'Medium', 'High']
const day = (offset) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10) }
const sampleTasks = [
  { id: 'sample-1', title: 'Review homepage copy', project: 'Fictional: Northstar Launch', dueDate: day(0), priority: 'High', status: 'In Progress', sample: true },
  { id: 'sample-2', title: 'Send sprint recap', project: 'Fictional: Orbit Mobile', dueDate: day(2), priority: 'Medium', status: 'Not Started', sample: true },
  { id: 'sample-3', title: 'Archive research notes', project: 'Fictional: Willow Studio', dueDate: day(-2), priority: 'Low', status: 'Not Started', sample: true },
  { id: 'sample-4', title: 'Confirm color system', project: 'Fictional: Northstar Launch', dueDate: day(-1), priority: 'High', status: 'Completed', sample: true }
]

const blankTask = () => ({ title: '', project: '', dueDate: day(0), priority: 'Medium', status: 'Not Started' })
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
const dateLabel = (value) => { const diff = Math.round((new Date(`${value}T00:00:00`) - new Date(`${day(0)}T00:00:00`)) / 86400000); if (diff === 0) return 'Due today'; if (diff === 1) return 'Due tomorrow'; if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`; return `Due in ${diff} days` }

export default function App() {
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || sampleTasks } catch { return sampleTasks } })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sort, setSort] = useState('soonest')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(blankTask)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  const [isIosDevice] = useState(() => /iPad|iPhone|iPod/.test(window.navigator.userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1))
  const [isMobileDevice] = useState(() => /Android|iPad|iPhone|iPod|IEMobile|Opera Mini/i.test(window.navigator.userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1))
  const [showInstallHelp, setShowInstallHelp] = useState(false)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }, [tasks])
  useEffect(() => {
    const onBeforeInstallPrompt = event => { event.preventDefault(); setInstallPrompt(event) }
    const onAppInstalled = () => { setInstallPrompt(null); setIsStandalone(true); setShowInstallHelp(false) }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt); window.removeEventListener('appinstalled', onAppInstalled) }
  }, [])
  useEffect(() => {
    if (!showInstallHelp) return undefined
    const onKeyDown = event => { if (event.key === 'Escape') setShowInstallHelp(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showInstallHelp])
  const today = day(0)
  const counts = useMemo(() => ({
    today: tasks.filter(t => t.status !== 'Completed' && t.dueDate === today).length,
    upcoming: tasks.filter(t => t.status !== 'Completed' && t.dueDate > today).length,
    overdue: tasks.filter(t => t.status !== 'Completed' && t.dueDate < today).length,
    completed: tasks.filter(t => t.status === 'Completed').length
  }), [tasks, today])
  const visibleTasks = useMemo(() => tasks.filter(t => {
    const text = `${t.title} ${t.project}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === 'All' || t.status === statusFilter) && (priorityFilter === 'All' || t.priority === priorityFilter)
  }).sort((a, b) => sort === 'soonest' ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate)), [tasks, search, statusFilter, priorityFilter, sort])
  const openNew = () => { setForm(blankTask()); setModal('new') }
  const openEdit = task => { setForm({ ...task }); setModal('edit') }
  const save = event => { event.preventDefault(); if (!form.title.trim()) return; if (modal === 'new') setTasks(list => [...list, { ...form, title: form.title.trim(), id: crypto.randomUUID() }]); else setTasks(list => list.map(t => t.id === form.id ? { ...form, title: form.title.trim() } : t)); setModal(null) }
  const remove = id => { if (window.confirm('Delete this task?')) setTasks(list => list.filter(t => t.id !== id)) }
  const cycleStatus = task => setTasks(list => list.map(t => t.id === task.id ? { ...t, status: statuses[(statuses.indexOf(t.status) + 1) % statuses.length] } : t))
  const requestInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt()
        await installPrompt.userChoice
      } catch {
        setShowInstallHelp(true)
      } finally {
        setInstallPrompt(null)
      }
    } else setShowInstallHelp(true)
  }
  const showInstallButton = !isStandalone && Boolean(installPrompt || isMobileDevice)

  return <main>
    <section className="hero"><div className="brand"><span className="logo">◷</span><span>DayMark</span></div><div className="hero-content"><p className="eyebrow">YOUR DEADLINES, AT A GLANCE</p><h1>Make every day<br />count.</h1><p className="subtitle">A quieter way to stay on top of what matters.</p></div><div className="hero-actions"><button className="add-btn" onClick={openNew}><span>+</span> Add task</button>{showInstallButton && <button className="install-btn" type="button" onClick={requestInstall}>↓ Install DayMark</button>}</div></section>
    <section className="workspace">
      <div className="overview"><div><p className="section-kicker">OVERVIEW</p><h2>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}.</h2><p className="muted">Here’s the shape of your workload.</p></div><p className="date-stamp">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p></div>
      <div className="stats"><Stat value={counts.today} label="Due today" tone="today" /><Stat value={counts.upcoming} label="Upcoming" tone="upcoming" /><Stat value={counts.overdue} label="Overdue" tone="overdue" /><Stat value={counts.completed} label="Completed" tone="completed" /></div>
      <div className="tasks-head"><div><p className="section-kicker">TASKS</p><h2>Your deadline list</h2></div><span className="task-total">{visibleTasks.length} task{visibleTasks.length === 1 ? '' : 's'}</span></div>
      <div className="filters"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or projects" /></label><Select value={statusFilter} onChange={setStatusFilter} options={['All', ...statuses]} label="Status" /><Select value={priorityFilter} onChange={setPriorityFilter} options={['All', ...priorities]} label="Priority" /><select className="sort" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort tasks"><option value="soonest">Due date: soonest</option><option value="latest">Due date: latest</option></select></div>
      <div className="task-list">{visibleTasks.length ? visibleTasks.map(task => <TaskRow key={task.id} task={task} onEdit={() => openEdit(task)} onDelete={() => remove(task.id)} onCycle={() => cycleStatus(task)} />) : <div className="empty"><strong>No tasks found.</strong><span>Try changing your filters or add a new task.</span></div>}</div>
    </section>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><form className="modal" onSubmit={save} onMouseDown={e => e.stopPropagation()}><div className="modal-header"><div><p className="section-kicker">{modal === 'new' ? 'NEW TASK' : 'EDIT TASK'}</p><h2>{modal === 'new' ? 'Add a deadline' : 'Update task'}</h2></div><button type="button" className="icon-button" onClick={() => setModal(null)}>×</button></div><label>Task title<input required autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to get done?" /></label><label>Project name <span className="optional">optional</span><input value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} placeholder="e.g. Spring campaign" /></label><div className="form-grid"><label>Due date<input type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{priorities.map(x => <option key={x}>{x}</option>)}</select></label></div><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{statuses.map(x => <option key={x}>{x}</option>)}</select></label><div className="modal-actions"><button type="button" className="cancel" onClick={() => setModal(null)}>Cancel</button><button className="save" type="submit">{modal === 'new' ? 'Add task' : 'Save changes'}</button></div></form></div>}
    {showInstallHelp && <div className="install-backdrop" onMouseDown={() => setShowInstallHelp(false)}><section className="install-panel" role="dialog" aria-modal="true" aria-labelledby="install-help-title" onMouseDown={event => event.stopPropagation()}><div className="modal-header"><div><p className="section-kicker">INSTALL DAYMARK</p><h2 id="install-help-title">Install DayMark</h2></div><button className="icon-button" type="button" onClick={() => setShowInstallHelp(false)} aria-label="Close install instructions" autoFocus>×</button></div><p>{isIosDevice ? 'Tap the Share button, then choose Add to Home Screen.' : 'Open your browser menu and choose Install app or Add to Home screen.'}</p><div className="modal-actions"><button className="cancel" type="button" onClick={() => setShowInstallHelp(false)}>Close</button></div></section></div>}
  </main>
}

function Stat({ value, label, tone }) { return <div className={`stat ${tone}`}><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div> }
function Select({ value, onChange, options, label }) { return <select value={value} onChange={e => onChange(e.target.value)} aria-label={`Filter by ${label}`}><option value="All">All {label.toLowerCase()}es</option>{options.filter(x => x !== 'All').map(x => <option key={x}>{x}</option>)}</select> }
function TaskRow({ task, onEdit, onDelete, onCycle }) { const overdue = task.status !== 'Completed' && task.dueDate < day(0); const today = task.status !== 'Completed' && task.dueDate === day(0); return <article className={`task ${task.status === 'Completed' ? 'done' : ''}`}><button className={`check ${task.status.toLowerCase().replaceAll(' ', '-')}`} onClick={onCycle} title="Change status">{task.status === 'Completed' ? '✓' : ''}</button><div className="task-main"><div className="title-line"><h3>{task.title}</h3>{task.sample && <span className="sample">SAMPLE</span>}</div>{task.project && <p>{task.project}</p>}</div><div className="task-meta"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span className={`deadline ${overdue ? 'overdue' : today ? 'today' : ''}`}>{dateLabel(task.dueDate)}<small>{formatDate(task.dueDate)}</small></span><span className={`status ${task.status.toLowerCase().replaceAll(' ', '-')}`}>{task.status}</span></div><div className="row-actions"><button onClick={onEdit}>Edit</button><button className="delete" onClick={onDelete} aria-label={`Delete ${task.title}`}>×</button></div></article> }
