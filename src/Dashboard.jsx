import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CheckCircle2, Circle, Clock, Plus, X, Trash2,
  LayoutDashboard, ListTodo, FolderKanban, Lightbulb, Upload,
  Sparkles, Menu, ArrowRight, LogOut,
  FileText, Image, File, Star, Flame, Zap, Target, Coffee,
  ChevronDown, Search, Bell, Settings, Loader2
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { useTasks, useProjects, useNotes } from './useDatabase'

/* ─── helpers ─── */
const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })

const STATUS_CFG = {
  pending: { label: 'Pendiente', icon: Circle, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  doing:   { label: 'En curso', icon: Clock, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  done:    { label: 'Hecho', icon: CheckCircle2, color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
}

const PRIO_CFG = {
  high:   { label: 'Alta', icon: Flame, color: '#f87171' },
  medium: { label: 'Media', icon: Zap, color: '#fbbf24' },
  low:    { label: 'Baja', icon: Coffee, color: '#94a3b8' },
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks',     label: 'Tareas',    icon: ListTodo },
  { id: 'projects',  label: 'Proyectos', icon: FolderKanban },
  { id: 'ideas',     label: 'Ideas',     icon: Lightbulb },
]

/* ─── Micro-components ─── */

function GlassCard({ children, className = '', onClick, style }) {
  return (
    <div onClick={onClick} style={style}
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  )
}

function Badge({ children, color, bg }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase"
      style={{ color, background: bg || `${color}18` }}>
      {children}
    </span>
  )
}

function ProgressRing({ value, size = 44, stroke = 3.5, color = '#a78bfa' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        className="transition-all duration-700 ease-out" />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        className="fill-white/90 font-bold transform rotate-90"
        style={{ fontSize: size * 0.26, transformOrigin: 'center' }}>
        {value}%
      </text>
    </svg>
  )
}

function ProgressBar({ value, color = '#a78bfa', height = 6 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="text-violet-400 animate-spin" />
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
/*  MAIN DASHBOARD SHELL                           */
/* ═══════════════════════════════════════════════ */

export default function Dashboard() {
  const { user, signOut, displayName } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { tasks, loading: tasksLoading, addTask, cycleStatus, deleteTask } = useTasks()
  const { projects, loading: projLoading, addProject, updateProgress, addFile, removeFile, deleteProject } = useProjects()
  const { notes, loading: notesLoading, addNote, togglePin, deleteNote } = useNotes()

  useEffect(() => { setMounted(true) }, [])

  const tasksDone = tasks.filter(t => t.status === 'done').length
  const tasksDoing = tasks.filter(t => t.status === 'doing').length
  const tasksPending = tasks.filter(t => t.status === 'pending').length
  const completionPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0
  const total = tasks.length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white/90 flex overflow-hidden"
      style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      {/* ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70vw] h-[70vw] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className="absolute -bottom-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full opacity-[0.035]"
          style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />
      </div>

      {/* mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ─── sidebar ─── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] flex flex-col
        border-r border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-2xl
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #6ee7b7 100%)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Workspace</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = page === item.id
            const Icon = item.icon
            return (
              <button key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200
                  ${active ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'}`}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #6ee7b7)' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── main ─── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/[0.05]">
              <Menu size={20} className="text-white/70" />
            </button>
            <h1 className="text-[15px] font-semibold capitalize">{NAV.find(n => n.id === page)?.label || page}</h1>
          </div>
        </header>

        <div className={`flex-1 p-4 sm:p-8 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {page === 'dashboard' && <DashboardView {...{ tasks, projects, notes, completionPct, tasksDone, tasksDoing, tasksPending, total, greeting, displayName, cycleStatus, setPage, tasksLoading, projLoading, notesLoading }} />}
          {page === 'tasks' && <TasksView {...{ tasks, addTask, cycleStatus, deleteTask, loading: tasksLoading }} />}
          {page === 'projects' && <ProjectsView {...{ projects, addProject, addFile, removeFile, deleteProject, loading: projLoading }} />}
          {page === 'ideas' && <IdeasView {...{ notes, addNote, deleteNote, togglePin, loading: notesLoading }} />}
        </div>
      </main>
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  DASHBOARD VIEW                                 */
/* ═══════════════════════════════════════════════ */

function DashboardView({ tasks, projects, notes, completionPct, tasksDone, tasksDoing, tasksPending, total, greeting, displayName, cycleStatus, setPage, tasksLoading, projLoading, notesLoading }) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{greeting}, {displayName}</h2>
        <p className="text-white/50 text-sm mt-1">Aquí tienes el resumen de tu workspace.</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completado', value: `${completionPct}%`, sub: 'hoy', color: '#a78bfa', icon: Target },
          { label: 'Hecho', value: tasksDone, sub: `de ${total}`, color: '#6ee7b7', icon: CheckCircle2 },
          { label: 'En curso', value: tasksDoing, sub: 'activas', color: '#fbbf24', icon: Clock },
          { label: 'Pendientes', value: tasksPending, sub: 'en cola', color: '#94a3b8', icon: Circle },
        ].map((s, i) => (
          <GlassCard key={i} className="p-5 hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/50 font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-2" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[12px] text-white/40 mt-0.5">{s.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* progress bar */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Progreso de hoy</p>
            <p className="text-[12px] text-white/50 mt-0.5">{tasksDone} de {total} tareas completadas</p>
          </div>
          <span className="text-2xl font-bold" style={{ color: '#a78bfa' }}>{completionPct}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #a78bfa 0%, #6ee7b7 50%, #fbbf24 100%)' }} />
        </div>
        <div className="flex justify-between mt-3 text-[11px] text-white/30">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* recent tasks */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium">Tareas recientes</p>
            <button onClick={() => setPage('tasks')} className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              Ver todo <ArrowRight size={12} />
            </button>
          </div>
          {tasksLoading ? <LoadingSpinner /> : (
            <div className="space-y-2">
              {tasks.slice(0, 4).map(t => {
                const st = STATUS_CFG[t.status]
                const pr = PRIO_CFG[t.priority]
                return (
                  <div key={t.id} onClick={() => cycleStatus(t.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-all group">
                    <st.icon size={18} style={{ color: st.color }} className="shrink-0 transition-transform group-hover:scale-110" />
                    <span className={`flex-1 text-[13px] truncate ${t.status === 'done' ? 'line-through text-white/40' : 'text-white/80'}`}>{t.text}</span>
                    <Badge color={pr.color}><pr.icon size={10} />{pr.label}</Badge>
                  </div>
                )
              })}
              {tasks.length === 0 && <p className="text-center text-white/30 text-sm py-6">Sin tareas todavía</p>}
            </div>
          )}
        </GlassCard>

        {/* projects */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium">Proyectos activos</p>
            <button onClick={() => setPage('projects')} className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              Ver todo <ArrowRight size={12} />
            </button>
          </div>
          {projLoading ? <LoadingSpinner /> : (
            <div className="space-y-4">
              {projects.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-[13px] font-medium text-white/80">{p.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: p.color }}>{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color} />
                </div>
              ))}
              {projects.length === 0 && <p className="text-center text-white/30 text-sm py-6">Sin proyectos todavía</p>}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  TASKS VIEW                                     */
/* ═══════════════════════════════════════════════ */

function TasksView({ tasks, addTask, cycleStatus, deleteTask, loading }) {
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const inputRef = useRef(null)

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const handleAdd = async () => {
    if (!input.trim()) return
    await addTask(input, priority)
    setInput('')
    setPriority('medium')
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tareas</h2>
        <p className="text-white/50 text-sm mt-1">{tasks.length} tareas · {tasks.filter(t => t.status === 'done').length} completadas</p>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Añadir nueva tarea..."
            className="flex-1 bg-transparent border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/90 placeholder:text-white/35 focus:border-violet-500/40 transition-colors" />
          <div className="flex gap-2">
            {Object.entries(PRIO_CFG).map(([key, cfg]) => (
              <button key={key} onClick={() => setPriority(key)}
                className={`px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 ${priority === key ? 'scale-105' : 'opacity-40 hover:opacity-70'}`}
                style={priority === key ? { background: `${cfg.color}20`, color: cfg.color } : {}}>
                {cfg.label}
              </button>
            ))}
            <button onClick={handleAdd} disabled={!input.trim()}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all duration-200 disabled:opacity-20"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'Todas' }, ...Object.entries(STATUS_CFG).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-200 ${
              filter === f.key ? 'bg-white/[0.1] text-white' : 'text-white/45 hover:text-white/60 hover:bg-white/[0.03]'}`}>
            {f.label}
            <span className="ml-1.5 text-[11px] opacity-50">
              {f.key === 'all' ? tasks.length : tasks.filter(t => t.status === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {filtered.map(t => {
            const st = STATUS_CFG[t.status]
            const pr = PRIO_CFG[t.priority]
            return (
              <div key={t.id} className="group flex items-center gap-3 p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-200">
                <button onClick={() => cycleStatus(t.id)} className="shrink-0 transition-transform hover:scale-125 active:scale-95">
                  <st.icon size={20} style={{ color: st.color }} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13.5px] truncate ${t.status === 'done' ? 'line-through text-white/40' : 'text-white/85'}`}>{t.text}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{fmt(t.created_at)}</p>
                </div>
                <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                <Badge color={pr.color}><pr.icon size={10} />{pr.label}</Badge>
                <button onClick={() => deleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-white/35 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="text-center py-16 text-white/40 text-sm">Sin tareas. Añade una arriba para empezar.</div>}
        </div>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  PROJECTS VIEW                                  */
/* ═══════════════════════════════════════════════ */

function ProjectsView({ projects, addProject, addFile, removeFile, deleteProject, loading }) {
  const [expanded, setExpanded] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const newRef = useRef(null)

  const PROJECT_COLORS = ['#a78bfa', '#6ee7b7', '#fbbf24', '#f87171', '#38bdf8', '#fb923c', '#e879f9']

  const handleDrop = useCallback(async (projId, e) => {
    e.preventDefault()
    setDragOver(null)
    const files = Array.from(e.dataTransfer?.files || [])
    for (const f of files) {
      await addFile(projId, f.name)
    }
  }, [addFile])

  const handleNewProject = async () => {
    if (!newName.trim()) return
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
    await addProject(newName.trim(), color)
    setNewName('')
    setShowNewForm(false)
  }

  const fileIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['png','jpg','jpeg','gif','svg','webp'].includes(ext)) return Image
    if (['pdf','doc','docx','txt','md'].includes(ext)) return FileText
    return File
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proyectos</h2>
          <p className="text-white/50 text-sm mt-1">{projects.length} proyectos activos</p>
        </div>
        <button onClick={() => { setShowNewForm(true); setTimeout(() => newRef.current?.focus(), 100) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {showNewForm && (
        <GlassCard className="p-4">
          <div className="flex gap-3">
            <input ref={newRef} value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNewProject(); if (e.key === 'Escape') setShowNewForm(false) }}
              placeholder="Nombre del proyecto..."
              className="flex-1 bg-transparent border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/90 placeholder:text-white/35 focus:border-violet-500/40 transition-colors" />
            <button onClick={handleNewProject} disabled={!newName.trim()}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-white disabled:opacity-20 transition-all"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>
              Crear
            </button>
            <button onClick={() => setShowNewForm(false)} className="px-3 py-2 rounded-xl text-white/40 hover:text-white/70 transition-colors">
              <X size={16} />
            </button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {projects.map(p => {
          const isOpen = expanded === p.id
          return (
            <GlassCard key={p.id} className="overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-4 p-5">
                <button onClick={() => setExpanded(isOpen ? null : p.id)} className="flex-1 flex items-center gap-4 text-left hover:opacity-90 transition-opacity">
                  <ProgressRing value={p.progress} color={p.color} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold">{p.name}</h3>
                    <p className="text-[12px] text-white/50 mt-0.5">{(p.files || []).length} archivos · Progreso: {p.progress}%</p>
                  </div>
                  <ChevronDown size={18} className={`text-white/45 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => deleteProject(p.id)}
                  className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 space-y-5 border-t border-white/[0.04]">
                  <div className="pt-4">
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className="text-white/55">Progreso</span>
                      <span className="font-semibold" style={{ color: p.color }}>{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} color={p.color} height={8} />
                  </div>

                  <div>
                    <p className="text-[12px] text-white/55 mb-3 font-medium uppercase tracking-wider">Archivos</p>
                    {(p.files || []).length > 0 && (
                      <div className="space-y-2 mb-3">
                        {p.files.map((f, i) => {
                          const FIcon = fileIcon(f)
                          return (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] group">
                              <FIcon size={16} className="text-white/45 shrink-0" />
                              <span className="flex-1 text-[13px] text-white/65 truncate">{f}</span>
                              <button onClick={() => removeFile(p.id, f)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-white/35 hover:text-red-400 transition-all">
                                <X size={12} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(p.id) }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(p.id, e)}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer
                        ${dragOver === p.id ? 'border-violet-400/40 bg-violet-400/[0.05]' : 'border-white/[0.06] hover:border-white/[0.12] bg-transparent'}`}>
                      <Upload size={24} className={`mx-auto mb-3 ${dragOver === p.id ? 'text-violet-400/60' : 'text-white/30'}`} />
                      <p className="text-[13px] text-white/45">
                        {dragOver === p.id ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
                      </p>
                      <p className="text-[11px] text-white/30 mt-1">o haz clic para buscar</p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          )
        })}
        {projects.length === 0 && !showNewForm && (
          <div className="text-center py-20">
            <FolderKanban size={32} className="mx-auto mb-4 text-white/25" />
            <p className="text-white/40 text-sm">Sin proyectos. Crea uno para empezar.</p>
          </div>
        )}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  IDEAS VIEW                                     */
/* ═══════════════════════════════════════════════ */

function IdeasView({ notes, addNote, deleteNote, togglePin, loading }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const handleAdd = async () => {
    if (!input.trim()) return
    await addNote(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ideas</h2>
        <p className="text-white/50 text-sm mt-1">Notas rápidas y muro de inspiración</p>
      </div>

      <GlassCard className="p-4">
        <div className="flex gap-3">
          <input ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Captura una idea..."
            className="flex-1 bg-transparent border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white/90 placeholder:text-white/35 focus:border-violet-500/40 transition-colors" />
          <button onClick={handleAdd} disabled={!input.trim()}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all duration-200 disabled:opacity-20 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>
            <Lightbulb size={14} /> Añadir
          </button>
        </div>
      </GlassCard>

      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(n => (
            <GlassCard key={n.id}
              className="p-5 group hover:border-white/[0.12] transition-all duration-300 relative"
              style={{ borderTop: `2px solid ${n.color}30` }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: n.color }} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => togglePin(n.id)}
                    className={`p-1 rounded-md transition-colors ${n.pinned ? 'text-yellow-400/80' : 'text-white/35 hover:text-yellow-400/60'}`}>
                    <Star size={13} className={n.pinned ? 'fill-yellow-400/80' : ''} />
                  </button>
                  <button onClick={() => deleteNote(n.id)}
                    className="p-1 rounded-md text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-white/70 leading-relaxed">{n.text}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                <span className="text-[11px] text-white/35">{fmt(n.created_at)}</span>
                {n.pinned && <span className="text-[10px] text-yellow-400/60 font-medium uppercase tracking-wider">Fijada</span>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className="text-center py-20">
          <Lightbulb size={32} className="mx-auto mb-4 text-white/25" />
          <p className="text-white/40 text-sm">Sin ideas todavía. Empieza a capturar pensamientos arriba.</p>
        </div>
      )}
    </div>
  )
}
