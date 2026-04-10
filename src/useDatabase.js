import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

/* ─── Generic table hook ─── */
function useTable(table, orderBy = 'created_at') {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data: rows } = await supabase
      .from(table).select('*').eq('user_id', user.id).order(orderBy, { ascending: false })
    setData(rows || [])
    setLoading(false)
  }, [user, table, orderBy])

  useEffect(() => { fetch() }, [fetch])

  const insert = async (row) => {
    const { data: r, error } = await supabase.from(table).insert({ ...row, user_id: user.id }).select().single()
    if (!error && r) setData(prev => [r, ...prev])
    return { data: r, error }
  }

  const update = async (id, changes) => {
    const { data: r, error } = await supabase.from(table).update(changes).eq('id', id).eq('user_id', user.id).select().single()
    if (!error && r) setData(prev => prev.map(x => x.id === id ? r : x))
    return { data: r, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
    if (!error) setData(prev => prev.filter(x => x.id !== id))
    return { error }
  }

  return { data, loading, insert, update, remove, refresh: fetch, setData }
}

/* ─── TASKS ─── */
export function useTasks() {
  const hook = useTable('tasks')

  const addTask = async (text, priority = 'medium') => {
    if (!text.trim()) return
    return hook.insert({ text: text.trim(), priority, status: 'pending' })
  }

  const moveTask = async (id, newStatus) => {
    return hook.update(id, { status: newStatus })
  }

  const cycleStatus = async (id) => {
    const order = ['pending', 'doing', 'done']
    const task = hook.data.find(t => t.id === id)
    if (!task) return
    return hook.update(id, { status: order[(order.indexOf(task.status) + 1) % 3] })
  }

  return { tasks: hook.data, loading: hook.loading, addTask, moveTask, cycleStatus, deleteTask: hook.remove, updateTask: hook.update }
}

/* ─── PROJECTS ─── */
export function useProjects() {
  const hook = useTable('projects')

  const addProject = async (name, color) => {
    return hook.insert({ name, color, progress: 0, total_tasks: 0, completed_tasks: 0, files: [], folders: [], doc_content: '' })
  }

  const updateProject = hook.update

  return { projects: hook.data, loading: hook.loading, addProject, updateProject, deleteProject: hook.remove }
}

/* ─── NOTES / IDEAS ─── */
export function useNotes() {
  const hook = useTable('notes')

  const addNote = async (text, category = 'general') => {
    const colors = ['#a78bfa', '#6ee7b7', '#fbbf24', '#f87171', '#38bdf8']
    return hook.insert({ text, color: colors[hook.data.length % colors.length], pinned: false, category })
  }

  const togglePin = async (id) => {
    const note = hook.data.find(n => n.id === id)
    if (!note) return
    return hook.update(id, { pinned: !note.pinned })
  }

  const updateNote = hook.update

  return { notes: hook.data, loading: hook.loading, addNote, togglePin, updateNote, deleteNote: hook.remove }
}

/* ─── SHARED FILES ─── */
export function useSharedFiles() {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    // Get files shared BY me or WITH me
    const { data: owned } = await supabase.from('shared_files').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    const { data: shared } = await supabase.from('shared_files').select('*').contains('shared_with', [user.id]).order('created_at', { ascending: false })
    // Also get public shared files
    const { data: pub } = await supabase.from('shared_files').select('*').eq('is_public', true).neq('owner_id', user.id).order('created_at', { ascending: false })

    const all = [...(owned || []), ...(shared || []), ...(pub || [])]
    const unique = Array.from(new Map(all.map(f => [f.id, f])).values())
    setFiles(unique)
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const shareFile = async (fileName, fileUrl, isPublic = false, sharedWith = []) => {
    const { data, error } = await supabase.from('shared_files')
      .insert({ owner_id: user.id, owner_name: user.user_metadata?.display_name || user.email, file_name: fileName, file_url: fileUrl, is_public: isPublic, shared_with: sharedWith })
      .select().single()
    if (!error) setFiles(prev => [data, ...prev])
    return { data, error }
  }

  const removeShared = async (id) => {
    await supabase.from('shared_files').delete().eq('id', id).eq('owner_id', user.id)
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return { files, loading, shareFile, removeShared, refresh: fetch }
}

/* ─── FILE STORAGE ─── */
export function useStorage() {
  const { user } = useAuth()

  const uploadFile = async (file, path) => {
    const filePath = `${user.id}/${path || ''}${file.name}`
    const { data, error } = await supabase.storage.from('project-files').upload(filePath, file, { upsert: true })
    if (error) return { error }
    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath)
    return { data: { path: filePath, url: urlData.publicUrl, name: file.name, size: file.size, type: file.type } }
  }

  const deleteFile = async (filePath) => {
    return supabase.storage.from('project-files').remove([filePath])
  }

  const getUrl = (filePath) => {
    const { data } = supabase.storage.from('project-files').getPublicUrl(filePath)
    return data.publicUrl
  }

  return { uploadFile, deleteFile, getUrl }
}
