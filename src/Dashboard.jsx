import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CheckCircle2, Circle, Clock, Plus, X, Trash2, LayoutDashboard, ListTodo,
  FolderKanban, Lightbulb, Upload, Sparkles, Menu, ArrowRight, LogOut,
  FileText, Image, File as FileIcon, Star, Flame, Zap, Target, Coffee, ChevronDown,
  Sun, Moon, Settings, Loader2, Edit3, Pin, Search, Tag, FolderPlus, Download,
  Eye, Share2, Link2, Users, Lock, Globe, Bold, Italic, List, ListOrdered,
  Quote, Heading1, Heading2, GripVertical, MoreHorizontal, Copy, Check, User
} from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { useTasks, useProjects, useNotes, useSharedFiles, useStorage } from './useDatabase'

/* ─── helpers ─── */
const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB'

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
  { id: 'shared',    label: 'Compartido', icon: Share2 },
  { id: 'settings',  label: 'Ajustes',   icon: Settings },
]
const IDEA_CATEGORIES = ['general', 'diseño', 'código', 'negocio', 'personal']
const CAT_COLORS = { general: '#94a3b8', 'diseño': '#a78bfa', 'código': '#6ee7b7', negocio: '#fbbf24', personal: '#f87171' }

/* ─── Themed helpers ─── */
const tc = (dark, darkClass, lightClass) => dark ? darkClass : lightClass

function GlassCard({ children, className = '', style, dark }) {
  return (
    <div style={style} className={`rounded-2xl border backdrop-blur-xl shadow-lg transition-colors duration-300
      ${dark ? 'border-white/[0.08] bg-white/[0.04] shadow-black/20' : 'border-gray-200/60 bg-white/80 shadow-gray-200/40'} ${className}`}>
      {children}
    </div>
  )
}

function Badge({ children, color, bg }) {
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase" style={{ color, background: bg || `${color}18` }}>{children}</span>
}

function ProgressBar({ value, color = '#a78bfa', height = 6, dark }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
    </div>
  )
}

function Spinner() { return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="text-violet-400 animate-spin" /></div> }

function Input({ dark, className = '', ...props }) {
  return <input {...props} className={`w-full rounded-xl px-4 py-2.5 text-[13px] transition-colors border
    ${dark ? 'bg-white/[0.03] border-white/[0.08] text-white/90 placeholder:text-white/35 focus:border-violet-500/40'
           : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20'} ${className}`} />
}

function Btn({ children, variant = 'primary', className = '', ...props }) {
  const base = variant === 'primary'
    ? 'text-white shadow-lg shadow-violet-500/20'
    : 'text-white/60 hover:text-white/90'
  return (
    <button {...props} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all disabled:opacity-30 ${base} ${className}`}
      style={variant === 'primary' ? { background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' } : {}}>
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════ */
/*  MAIN SHELL                                     */
/* ═══════════════════════════════════════════════ */

export default function Dashboard() {
  const { user, signOut, displayName } = useAuth()
  const { dark, toggle } = useTheme()
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const taskHook = useTasks()
  const projHook = useProjects()
  const noteHook = useNotes()
  const sharedHook = useSharedFiles()
  const storageHook = useStorage()

  useEffect(() => { setMounted(true) }, [])

  const { tasks } = taskHook
  const tasksDone = tasks.filter(t => t.status === 'done').length
  const tasksDoing = tasks.filter(t => t.status === 'doing').length
  const tasksPending = tasks.filter(t => t.status === 'pending').length
  const completionPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U'

  const d = dark // shorthand

  return (
    <div className={`min-h-screen flex overflow-hidden transition-colors duration-300 ${d ? 'bg-[#0a0a0f] text-white/90' : 'bg-[#f8f9fb] text-gray-900'}`}
      style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      {/* ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[40%] -left-[20%] w-[70vw] h-[70vw] rounded-full ${d ? 'opacity-[0.06]' : 'opacity-[0.12]'}`}
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className={`absolute -bottom-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full ${d ? 'opacity-[0.05]' : 'opacity-[0.08]'}`}
          style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }} />
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r backdrop-blur-2xl transform transition-all duration-300 ease-out
        ${d ? 'border-white/[0.06] bg-[#0a0a0f]/90' : 'border-gray-200/60 bg-white/90'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`h-16 flex items-center gap-3 px-6 border-b ${d ? 'border-white/[0.06]' : 'border-gray-200/60'}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #6ee7b7 100%)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className={`text-[15px] font-semibold tracking-tight ${d ? '' : 'text-gray-900'}`}>Workboard</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = page === item.id; const Icon = item.icon
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200
                  ${active
                    ? (d ? 'bg-white/[0.08] text-white' : 'bg-violet-50 text-violet-700')
                    : (d ? 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60')}`}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </button>
            )
          })}
        </nav>

        <div className={`p-4 border-t ${d ? 'border-white/[0.06]' : 'border-gray-200/60'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #6ee7b7)' }}>{initial}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{displayName}</p>
              <p className={`text-[11px] truncate ${d ? 'text-white/40' : 'text-gray-400'}`}>{user?.email}</p>
            </div>
            <button onClick={toggle} className={`p-1.5 rounded-lg transition-colors ${d ? 'text-white/30 hover:text-yellow-300' : 'text-gray-400 hover:text-violet-500'}`}>
              {d ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={signOut} className={`p-1.5 rounded-lg transition-colors ${d ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`} title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-8 border-b backdrop-blur-xl
          ${d ? 'border-white/[0.06] bg-[#0a0a0f]/80' : 'border-gray-200/60 bg-[#f8f9fb]/80'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <Menu size={20} className={d ? 'text-white/70' : 'text-gray-600'} />
            </button>
            <h1 className="text-[15px] font-semibold">{NAV.find(n => n.id === page)?.label || page}</h1>
          </div>
        </header>

        <div className={`flex-1 p-4 sm:p-8 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {page === 'dashboard' && <DashboardHome {...{ d, tasks, tasksDone, tasksDoing, tasksPending, completionPct, greeting, displayName, projects: projHook.projects, notes: noteHook.notes, setPage, cycleStatus: taskHook.cycleStatus, tasksLoading: taskHook.loading }} />}
          {page === 'tasks' && <KanbanView d={d} {...taskHook} />}
          {page === 'projects' && <ProjectsView d={d} {...projHook} storage={storageHook} />}
          {page === 'ideas' && <IdeasView d={d} {...noteHook} />}
          {page === 'shared' && <SharedView d={d} {...sharedHook} storage={storageHook} />}
          {page === 'settings' && <SettingsView d={d} />}
        </div>
      </main>
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  DASHBOARD HOME                                 */
/* ═══════════════════════════════════════════════ */

function DashboardHome({ d, tasks, tasksDone, tasksDoing, tasksPending, completionPct, greeting, displayName, projects, notes, setPage, cycleStatus, tasksLoading }) {
  const total = tasks.length
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{greeting}, {displayName}</h2>
        <p className={`text-sm mt-1 ${d ? 'text-white/50' : 'text-gray-500'}`}>Resumen de tu workspace.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completado', value: `${completionPct}%`, sub: 'hoy', color: '#a78bfa', icon: Target },
          { label: 'Hecho', value: tasksDone, sub: `de ${total}`, color: '#6ee7b7', icon: CheckCircle2 },
          { label: 'En curso', value: tasksDoing, sub: 'activas', color: '#fbbf24', icon: Clock },
          { label: 'Pendientes', value: tasksPending, sub: 'en cola', color: '#94a3b8', icon: Circle },
        ].map((s, i) => (
          <GlassCard key={i} dark={d} className="p-5 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[11px] uppercase tracking-widest font-medium ${d ? 'text-white/50' : 'text-gray-400'}`}>{s.label}</p>
                <p className="text-2xl font-bold mt-2" style={{ color: s.color }}>{s.value}</p>
                <p className={`text-[12px] mt-0.5 ${d ? 'text-white/40' : 'text-gray-400'}`}>{s.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* progress */}
      <GlassCard dark={d} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Progreso de hoy</p>
            <p className={`text-[12px] mt-0.5 ${d ? 'text-white/50' : 'text-gray-400'}`}>{tasksDone} de {total} tareas</p>
          </div>
          <span className="text-2xl font-bold" style={{ color: '#a78bfa' }}>{completionPct}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #a78bfa 0%, #6ee7b7 50%, #fbbf24 100%)' }} />
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard dark={d} className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium">Tareas recientes</p>
            <button onClick={() => setPage('tasks')} className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1"><span>Ver todo</span><ArrowRight size={12} /></button>
          </div>
          {tasksLoading ? <Spinner /> : (
            <div className="space-y-2">
              {tasks.slice(0, 4).map(t => {
                const st = STATUS_CFG[t.status]; const pr = PRIO_CFG[t.priority]
                return (
                  <div key={t.id} onClick={() => cycleStatus(t.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${d ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}>
                    <st.icon size={18} style={{ color: st.color }} className="shrink-0" />
                    <span className={`flex-1 text-[13px] truncate ${t.status === 'done' ? (d ? 'line-through text-white/40' : 'line-through text-gray-300') : (d ? 'text-white/80' : 'text-gray-700')}`}>{t.text}</span>
                    <Badge color={pr.color}><pr.icon size={10} />{pr.label}</Badge>
                  </div>
                )
              })}
              {tasks.length === 0 && <p className={`text-center text-sm py-6 ${d ? 'text-white/30' : 'text-gray-400'}`}>Sin tareas todavía</p>}
            </div>
          )}
        </GlassCard>

        <GlassCard dark={d} className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium">Proyectos</p>
            <button onClick={() => setPage('projects')} className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1"><span>Ver todo</span><ArrowRight size={12} /></button>
          </div>
          <div className="space-y-4">
            {projects.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className={`text-[13px] font-medium ${d ? 'text-white/80' : 'text-gray-700'}`}>{p.name}</span>
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: p.color }}>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} color={p.color} dark={d} />
              </div>
            ))}
            {projects.length === 0 && <p className={`text-center text-sm py-6 ${d ? 'text-white/30' : 'text-gray-400'}`}>Sin proyectos</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  KANBAN VIEW (Tasks)                            */
/* ═══════════════════════════════════════════════ */

function KanbanCard({ task, d, deleteTask }) {
  const pr = PRIO_CFG[task.priority]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`group p-4 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing
        ${d ? 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]' : 'border-gray-200/80 bg-white hover:shadow-md'}`}>
      <div className="flex items-start gap-2">
        <div {...listeners} className={`mt-0.5 ${d ? 'text-white/20' : 'text-gray-300'}`}><GripVertical size={14} /></div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-relaxed ${task.status === 'done' ? (d ? 'line-through text-white/30' : 'line-through text-gray-300') : (d ? 'text-white/80' : 'text-gray-700')}`}>{task.text}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <Badge color={pr.color}><pr.icon size={10} />{pr.label}</Badge>
            <span className={`text-[10px] ${d ? 'text-white/25' : 'text-gray-400'}`}>{fmt(task.created_at)}</span>
          </div>
        </div>
        <button onClick={() => deleteTask(task.id)}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${d ? 'text-white/20 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function KanbanColumn({ status, tasks, d, deleteTask }) {
  const cfg = STATUS_CFG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef}
      className={`flex-1 min-w-[280px] rounded-2xl p-4 transition-all duration-200
        ${d ? 'bg-white/[0.02]' : 'bg-gray-50/80'}
        ${isOver ? (d ? 'ring-2 ring-violet-500/30 bg-violet-500/[0.03]' : 'ring-2 ring-violet-400/30 bg-violet-50/50') : ''}`}>
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <cfg.icon size={16} style={{ color: cfg.color }} />
        <span className={`text-[13px] font-semibold ${d ? 'text-white/70' : 'text-gray-600'}`}>{cfg.label}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${d ? 'bg-white/[0.06] text-white/40' : 'bg-gray-200/60 text-gray-500'}`}>{tasks.length}</span>
      </div>
      <div className="space-y-2.5 min-h-[60px]">
        {tasks.map(t => <KanbanCard key={t.id} task={t} d={d} deleteTask={deleteTask} />)}
      </div>
    </div>
  )
}

function KanbanView({ d, tasks, loading, addTask, moveTask, deleteTask }) {
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [activeTask, setActiveTask] = useState(null)
  const inputRef = useRef(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleAdd = async () => {
    if (!input.trim()) return
    await addTask(input, priority)
    setInput(''); setPriority('medium'); inputRef.current?.focus()
  }

  const handleDragStart = (event) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task)
  }

  const handleDragEnd = async (event) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return
    const overId = over.id
    // Check if dropped on a column
    if (['pending', 'doing', 'done'].includes(overId)) {
      const task = tasks.find(t => t.id === active.id)
      if (task && task.status !== overId) {
        await moveTask(active.id, overId)
      }
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tablero de Tareas</h2>
        <p className={`text-sm mt-1 ${d ? 'text-white/50' : 'text-gray-500'}`}>Arrastra las tarjetas entre columnas para cambiar su estado</p>
      </div>

      {/* add form */}
      <GlassCard dark={d} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input dark={d} ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Nueva tarea..." />
          <div className="flex gap-2">
            {Object.entries(PRIO_CFG).map(([key, cfg]) => (
              <button key={key} onClick={() => setPriority(key)}
                className={`px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 ${priority === key ? 'scale-105' : 'opacity-40 hover:opacity-70'}`}
                style={priority === key ? { background: `${cfg.color}20`, color: cfg.color } : {}}>
                {cfg.label}
              </button>
            ))}
            <Btn onClick={handleAdd} disabled={!input.trim()}><Plus size={16} /></Btn>
          </div>
        </div>
      </GlassCard>

      {/* kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {['pending', 'doing', 'done'].map(status => (
            <KanbanColumn key={status} status={status} tasks={tasks.filter(t => t.status === status)} d={d} deleteTask={deleteTask} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className={`p-4 rounded-xl border shadow-2xl rotate-2 ${d ? 'border-violet-500/30 bg-[#1a1a2e]' : 'border-violet-300 bg-white'}`}>
              <p className={`text-[13px] ${d ? 'text-white/80' : 'text-gray-700'}`}>{activeTask.text}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  PROJECTS VIEW                                  */
/* ═══════════════════════════════════════════════ */

function ProjectsView({ d, projects, loading, addProject, updateProject, deleteProject, storage }) {
  const [expanded, setExpanded] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)
  const COLORS = ['#a78bfa','#6ee7b7','#fbbf24','#f87171','#38bdf8','#fb923c','#e879f9']
  const fileInputRef = useRef(null)

  const handleNew = async () => {
    if (!newName.trim()) return
    await addProject(newName.trim(), COLORS[projects.length % COLORS.length])
    setNewName(''); setShowNew(false)
  }

  const handleUpload = async (projId, files) => {
    setUploading(true)
    const proj = projects.find(p => p.id === projId)
    const currentFiles = proj?.files || []
    for (const file of files) {
      const { data } = await storage.uploadFile(file, `${projId}/`)
      if (data) currentFiles.push({ name: data.name, path: data.path, url: data.url, size: file.size, type: file.type })
    }
    await updateProject(projId, { files: currentFiles })
    setUploading(false)
  }

  const removeFile = async (projId, filePath) => {
    const proj = projects.find(p => p.id === projId)
    const files = (proj?.files || []).filter(f => f.path !== filePath)
    await storage.deleteFile(filePath)
    await updateProject(projId, { files })
  }

  const saveDoc = async (projId, content) => {
    await updateProject(projId, { doc_content: content })
  }

  const isImage = (name) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proyectos</h2>
          <p className={`text-sm mt-1 ${d ? 'text-white/50' : 'text-gray-500'}`}>{projects.length} proyectos</p>
        </div>
        <Btn onClick={() => setShowNew(true)}><Plus size={15} /> Nuevo</Btn>
      </div>

      {showNew && (
        <GlassCard dark={d} className="p-4">
          <div className="flex gap-3">
            <Input dark={d} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleNew(); if (e.key === 'Escape') setShowNew(false) }} placeholder="Nombre del proyecto..." autoFocus />
            <Btn onClick={handleNew} disabled={!newName.trim()}>Crear</Btn>
            <button onClick={() => setShowNew(false)} className={`px-3 rounded-xl ${d ? 'text-white/40' : 'text-gray-400'}`}><X size={16} /></button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {projects.map(p => {
          const isOpen = expanded === p.id
          return (
            <GlassCard key={p.id} dark={d} className="overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <button onClick={() => setExpanded(isOpen ? null : p.id)} className="flex-1 flex items-center gap-4 text-left">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-bold text-white" style={{ background: p.color }}>
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold">{p.name}</h3>
                    <p className={`text-[12px] mt-0.5 ${d ? 'text-white/50' : 'text-gray-400'}`}>{(p.files||[]).length} archivos · {p.progress}%</p>
                  </div>
                  <ChevronDown size={18} className={`transition-transform duration-300 ${d ? 'text-white/40' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => deleteProject(p.id)} className={`p-1.5 rounded-lg transition-colors ${d ? 'text-white/20 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}>
                  <Trash2 size={14} />
                </button>
              </div>

              {isOpen && (
                <div className={`px-5 pb-5 space-y-6 border-t ${d ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                  {/* progress slider */}
                  <div className="pt-4">
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className={d ? 'text-white/55' : 'text-gray-500'}>Progreso</span>
                      <span className="font-semibold" style={{ color: p.color }}>{p.progress}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={p.progress}
                      onChange={e => updateProject(p.id, { progress: parseInt(e.target.value) })}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: p.color }} />
                  </div>

                  {/* files */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-[12px] font-medium uppercase tracking-wider ${d ? 'text-white/55' : 'text-gray-500'}`}>Archivos</p>
                      <button onClick={() => fileInputRef.current?.click()}
                        className={`text-[12px] flex items-center gap-1 ${d ? 'text-violet-400' : 'text-violet-500'}`}>
                        <Upload size={12} /> Subir
                      </button>
                      <input ref={fileInputRef} type="file" multiple className="hidden"
                        onChange={e => { handleUpload(p.id, Array.from(e.target.files)); e.target.value = '' }} />
                    </div>

                    {uploading && <div className="flex items-center gap-2 mb-3"><Loader2 size={14} className="animate-spin text-violet-400" /><span className={`text-[12px] ${d ? 'text-white/50' : 'text-gray-400'}`}>Subiendo...</span></div>}

                    {(p.files||[]).length > 0 && (
                      <div className="grid gap-2 mb-3">
                        {p.files.map((f, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl group ${d ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                            {isImage(f.name) && f.url ? (
                              <img src={f.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d ? 'bg-white/[0.05]' : 'bg-gray-100'}`}>
                                <FileText size={16} className={d ? 'text-white/40' : 'text-gray-400'} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] truncate ${d ? 'text-white/70' : 'text-gray-700'}`}>{f.name}</p>
                              <p className={`text-[11px] ${d ? 'text-white/30' : 'text-gray-400'}`}>{f.size ? fmtSize(f.size) : ''}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {f.url && <a href={f.url} target="_blank" rel="noreferrer" className={`p-1.5 rounded-md ${d ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'}`}><Eye size={13} /></a>}
                              {f.url && <a href={f.url} download className={`p-1.5 rounded-md ${d ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'}`}><Download size={13} /></a>}
                              <button onClick={() => removeFile(p.id, f.path)} className={`p-1.5 rounded-md ${d ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* drop zone */}
                    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleUpload(p.id, Array.from(e.dataTransfer.files)) }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
                        ${d ? 'border-white/[0.08] hover:border-violet-500/30' : 'border-gray-200 hover:border-violet-300'}`}
                      onClick={() => fileInputRef.current?.click()}>
                      <Upload size={20} className={`mx-auto mb-2 ${d ? 'text-white/25' : 'text-gray-300'}`} />
                      <p className={`text-[12px] ${d ? 'text-white/40' : 'text-gray-400'}`}>Arrastra archivos o haz clic</p>
                    </div>
                  </div>

                  {/* document editor */}
                  <div>
                    <p className={`text-[12px] font-medium uppercase tracking-wider mb-3 ${d ? 'text-white/55' : 'text-gray-500'}`}>Documento</p>
                    <SimpleEditor dark={d} content={p.doc_content || ''} onSave={content => saveDoc(p.id, content)} />
                  </div>
                </div>
              )}
            </GlassCard>
          )
        })}
        {projects.length === 0 && !showNew && (
          <div className="text-center py-20">
            <FolderKanban size={32} className={`mx-auto mb-4 ${d ? 'text-white/25' : 'text-gray-300'}`} />
            <p className={`text-sm ${d ? 'text-white/40' : 'text-gray-400'}`}>Sin proyectos. Crea uno para empezar.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* Simple rich text editor */
function SimpleEditor({ dark: d, content, onSave }) {
  const editorRef = useRef(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const exec = (cmd, val) => { document.execCommand(cmd, false, val); editorRef.current?.focus() }

  const handleSave = () => {
    onSave(editorRef.current?.innerHTML || '')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const btnClass = `p-1.5 rounded-md transition-colors ${d ? 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`

  return (
    <div className={`rounded-xl border overflow-hidden ${d ? 'border-white/[0.08]' : 'border-gray-200'}`}>
      <div className={`flex items-center gap-1 px-3 py-2 border-b ${d ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
        <button onClick={() => exec('bold')} className={btnClass}><Bold size={14} /></button>
        <button onClick={() => exec('italic')} className={btnClass}><Italic size={14} /></button>
        <button onClick={() => exec('formatBlock', 'h1')} className={btnClass}><Heading1 size={14} /></button>
        <button onClick={() => exec('formatBlock', 'h2')} className={btnClass}><Heading2 size={14} /></button>
        <button onClick={() => exec('insertUnorderedList')} className={btnClass}><List size={14} /></button>
        <button onClick={() => exec('insertOrderedList')} className={btnClass}><ListOrdered size={14} /></button>
        <button onClick={() => exec('formatBlock', 'blockquote')} className={btnClass}><Quote size={14} /></button>
        <div className="flex-1" />
        <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${saved ? 'text-green-500' : 'text-violet-400 hover:bg-violet-500/10'}`}>
          {saved ? <><Check size={13} /> Guardado</> : 'Guardar'}
        </button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        className={`editor-content px-4 py-3 min-h-[200px] text-[14px] focus:outline-none ${d ? 'text-white/80' : 'text-gray-700'}`}
        data-placeholder="Escribe aquí..." />
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  IDEAS VIEW                                     */
/* ═══════════════════════════════════════════════ */

function IdeasView({ d, notes, loading, addNote, togglePin, updateNote, deleteNote }) {
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('general')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')

  const handleAdd = async () => {
    if (!input.trim()) return
    await addNote(input.trim(), category)
    setInput(''); setCategory('general')
  }

  const startEdit = (note) => { setEditing(note.id); setEditText(note.text) }
  const saveEdit = async () => {
    if (editing && editText.trim()) { await updateNote(editing, { text: editText.trim() }); setEditing(null) }
  }

  let filtered = [...notes]
  if (filterCat !== 'all') filtered = filtered.filter(n => n.category === filterCat)
  if (search) filtered = filtered.filter(n => n.text.toLowerCase().includes(search.toLowerCase()))
  filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ideas</h2>
        <p className={`text-sm mt-1 ${d ? 'text-white/50' : 'text-gray-500'}`}>Tu muro de inspiración · {notes.length} notas</p>
      </div>

      {/* add */}
      <GlassCard dark={d} className="p-4 space-y-3">
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAdd() }}
          placeholder="Escribe una idea... (Cmd+Enter para guardar)"
          rows={3}
          className={`w-full rounded-xl px-4 py-3 text-[13px] resize-none border transition-colors
            ${d ? 'bg-white/[0.03] border-white/[0.08] text-white/90 placeholder:text-white/35 focus:border-violet-500/40'
                 : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-400'}`} />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {IDEA_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all
                  ${category === cat ? 'scale-105' : 'opacity-50 hover:opacity-80'}`}
                style={category === cat ? { background: `${CAT_COLORS[cat]}20`, color: CAT_COLORS[cat] } : {}}>
                {cat}
              </button>
            ))}
          </div>
          <Btn onClick={handleAdd} disabled={!input.trim()}><Lightbulb size={14} /> Guardar</Btn>
        </div>
      </GlassCard>

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${d ? 'text-white/30' : 'text-gray-400'}`} />
          <Input dark={d} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ideas..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterCat('all')}
            className={`px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${filterCat === 'all' ? (d ? 'bg-white/[0.1] text-white' : 'bg-gray-200 text-gray-800') : (d ? 'text-white/40' : 'text-gray-400')}`}>
            Todas
          </button>
          {IDEA_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-2 rounded-xl text-[12px] font-medium capitalize transition-all ${filterCat === cat ? 'scale-105' : 'opacity-50'}`}
              style={filterCat === cat ? { background: `${CAT_COLORS[cat]}20`, color: CAT_COLORS[cat] } : {}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(n => (
          <GlassCard key={n.id} dark={d} className="p-5 group hover:scale-[1.01] transition-all duration-300" style={{ borderTop: `2px solid ${n.color || '#a78bfa'}30` }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ color: CAT_COLORS[n.category] || '#94a3b8', background: `${CAT_COLORS[n.category] || '#94a3b8'}15` }}>
                {n.category || 'general'}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(n)} className={`p-1 rounded-md ${d ? 'text-white/30 hover:text-violet-400' : 'text-gray-400 hover:text-violet-500'}`}><Edit3 size={12} /></button>
                <button onClick={() => togglePin(n.id)} className={`p-1 rounded-md ${n.pinned ? 'text-yellow-400' : (d ? 'text-white/30 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500')}`}>
                  <Star size={12} className={n.pinned ? 'fill-yellow-400' : ''} />
                </button>
                <button onClick={() => deleteNote(n.id)} className={`p-1 rounded-md ${d ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}><Trash2 size={12} /></button>
              </div>
            </div>

            {editing === n.id ? (
              <div className="space-y-2">
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} autoFocus
                  className={`w-full rounded-lg px-3 py-2 text-[13px] resize-none border ${d ? 'bg-white/[0.03] border-white/[0.1] text-white/90' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-[11px] text-green-500 font-medium">Guardar</button>
                  <button onClick={() => setEditing(null)} className="text-[11px] text-gray-400">Cancelar</button>
                </div>
              </div>
            ) : (
              <p className={`text-[13px] leading-relaxed ${d ? 'text-white/70' : 'text-gray-600'}`}>{n.text}</p>
            )}

            <div className={`flex items-center justify-between mt-4 pt-3 border-t ${d ? 'border-white/[0.04]' : 'border-gray-100'}`}>
              <span className={`text-[11px] ${d ? 'text-white/30' : 'text-gray-400'}`}>{fmt(n.created_at)}</span>
              {n.pinned && <span className="text-[10px] text-yellow-400/80 font-medium uppercase tracking-wider">Fijada</span>}
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Lightbulb size={32} className={`mx-auto mb-4 ${d ? 'text-white/25' : 'text-gray-300'}`} />
          <p className={`text-sm ${d ? 'text-white/40' : 'text-gray-400'}`}>{search ? 'No se encontraron ideas' : 'Empieza a capturar ideas arriba'}</p>
        </div>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  SHARED VIEW                                    */
/* ═══════════════════════════════════════════════ */

function SharedView({ d, files, loading, shareFile, removeShared, storage }) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(null)
  const fileRef = useRef(null)

  const handleUpload = async (fileList) => {
    setUploading(true)
    for (const file of fileList) {
      const { data } = await storage.uploadFile(file, 'shared/')
      if (data) await shareFile(data.name, data.url, true)
    }
    setUploading(false)
  }

  const copyLink = (url) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Espacio compartido</h2>
          <p className={`text-sm mt-1 ${d ? 'text-white/50' : 'text-gray-500'}`}>Comparte archivos con otros usuarios mediante enlace público</p>
        </div>
        <Btn onClick={() => fileRef.current?.click()}><Upload size={15} /> Compartir archivo</Btn>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={e => { handleUpload(Array.from(e.target.files)); e.target.value = '' }} />
      </div>

      {uploading && <div className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-violet-400" /><span className={`text-sm ${d ? 'text-white/50' : 'text-gray-500'}`}>Subiendo...</span></div>}

      {/* drop zone */}
      <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleUpload(Array.from(e.dataTransfer.files)) }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
          ${d ? 'border-white/[0.08] hover:border-violet-500/30' : 'border-gray-200 hover:border-violet-300'}`}
        onClick={() => fileRef.current?.click()}>
        <Globe size={28} className={`mx-auto mb-3 ${d ? 'text-white/20' : 'text-gray-300'}`} />
        <p className={`text-sm ${d ? 'text-white/40' : 'text-gray-400'}`}>Arrastra archivos aquí para compartir</p>
        <p className={`text-[11px] mt-1 ${d ? 'text-white/25' : 'text-gray-300'}`}>Cualquiera con el enlace podrá descargarlo</p>
      </div>

      {/* file list */}
      <div className="space-y-3">
        {files.map(f => (
          <GlassCard key={f.id} dark={d} className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d ? 'bg-white/[0.05]' : 'bg-gray-100'}`}>
                <FileIcon size={18} className={d ? 'text-white/40' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-medium truncate ${d ? 'text-white/80' : 'text-gray-700'}`}>{f.file_name}</p>
                <p className={`text-[11px] mt-0.5 ${d ? 'text-white/35' : 'text-gray-400'}`}>
                  Compartido por {f.owner_id === user?.id ? 'ti' : f.owner_name} · {fmt(f.created_at)}
                  {f.is_public && <span className="ml-2 text-green-400">● Público</span>}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => copyLink(f.file_url)}
                  className={`p-2 rounded-lg transition-all ${copied === f.file_url ? 'text-green-400' : (d ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-700')}`}>
                  {copied === f.file_url ? <Check size={15} /> : <Link2 size={15} />}
                </button>
                {f.file_url && <a href={f.file_url} target="_blank" rel="noreferrer" className={`p-2 rounded-lg ${d ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'}`}><Download size={15} /></a>}
                {f.owner_id === user?.id && (
                  <button onClick={() => removeShared(f.id)} className={`p-2 rounded-lg ${d ? 'text-white/30 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}><Trash2 size={15} /></button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {files.length === 0 && (
        <div className="text-center py-16">
          <Share2 size={32} className={`mx-auto mb-4 ${d ? 'text-white/25' : 'text-gray-300'}`} />
          <p className={`text-sm ${d ? 'text-white/40' : 'text-gray-400'}`}>Nada compartido todavía. Sube un archivo para empezar.</p>
        </div>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════ */
/*  SETTINGS VIEW                                  */
/* ═══════════════════════════════════════════════ */

function SettingsView({ d }) {
  const { user, updatePassword, updateProfile, displayName, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const [name, setName] = useState(displayName)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const handleName = async () => {
    if (!name.trim()) return
    const { error } = await updateProfile({ display_name: name.trim() })
    if (error) setErr(error.message)
    else { setMsg('Nombre actualizado'); setTimeout(() => setMsg(''), 3000) }
  }

  const handlePass = async () => {
    setErr(''); setMsg('')
    if (newPass.length < 6) { setErr('Mínimo 6 caracteres'); return }
    if (newPass !== confirmPass) { setErr('Las contraseñas no coinciden'); return }
    const { error } = await updatePassword(newPass)
    if (error) setErr(error.message)
    else { setMsg('Contraseña actualizada'); setNewPass(''); setConfirmPass(''); setTimeout(() => setMsg(''), 3000) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold tracking-tight">Ajustes</h2>

      {msg && <div className={`p-3 rounded-xl text-[13px] border ${d ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600'}`}>{msg}</div>}
      {err && <div className={`p-3 rounded-xl text-[13px] border ${d ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>{err}</div>}

      {/* profile */}
      <GlassCard dark={d} className="p-6 space-y-5">
        <h3 className="text-[15px] font-semibold flex items-center gap-2"><User size={18} /> Perfil</h3>
        <div>
          <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${d ? 'text-white/50' : 'text-gray-500'}`}>Nombre</label>
          <div className="flex gap-3">
            <Input dark={d} value={name} onChange={e => setName(e.target.value)} />
            <Btn onClick={handleName} disabled={name === displayName}>Guardar</Btn>
          </div>
        </div>
        <div>
          <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${d ? 'text-white/50' : 'text-gray-500'}`}>Email</label>
          <p className={`text-[14px] ${d ? 'text-white/70' : 'text-gray-600'}`}>{user?.email}</p>
        </div>
      </GlassCard>

      {/* password */}
      <GlassCard dark={d} className="p-6 space-y-5">
        <h3 className="text-[15px] font-semibold flex items-center gap-2"><Lock size={18} /> Cambiar contraseña</h3>
        <div>
          <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${d ? 'text-white/50' : 'text-gray-500'}`}>Nueva contraseña</label>
          <Input dark={d} type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${d ? 'text-white/50' : 'text-gray-500'}`}>Confirmar contraseña</label>
          <Input dark={d} type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repite la contraseña" />
        </div>
        <Btn onClick={handlePass} disabled={!newPass || !confirmPass}>Actualizar contraseña</Btn>
      </GlassCard>

      {/* theme */}
      <GlassCard dark={d} className="p-6">
        <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-4">{dark ? <Moon size={18} /> : <Sun size={18} />} Apariencia</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[14px] ${d ? 'text-white/80' : 'text-gray-700'}`}>Modo {dark ? 'oscuro' : 'claro'}</p>
            <p className={`text-[12px] ${d ? 'text-white/40' : 'text-gray-400'}`}>Cambia entre tema claro y oscuro</p>
          </div>
          <button onClick={toggle}
            className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${dark ? 'bg-violet-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${dark ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>
      </GlassCard>

      {/* danger */}
      <GlassCard dark={d} className="p-6">
        <h3 className="text-[15px] font-semibold text-red-400 mb-4">Zona peligrosa</h3>
        <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </GlassCard>
    </div>
  )
}
