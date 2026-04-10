import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

/* ─── Generic hook for any table ─── */
function useSupabaseTable(table, orderBy = 'created_at') {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    const { data: rows, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', user.id)
      .order(orderBy, { ascending: false })

    if (!error) setData(rows || [])
    setLoading(false)
  }, [user, table, orderBy])

  useEffect(() => { fetchData() }, [fetchData])

  const insert = async (row) => {
    const { data: newRow, error } = await supabase
      .from(table)
      .insert({ ...row, user_id: user.id })
      .select()
      .single()
    if (!error && newRow) setData(prev => [newRow, ...prev])
    return { data: newRow, error }
  }

  const update = async (id, changes) => {
    const { data: updated, error } = await supabase
      .from(table)
      .update(changes)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && updated) {
      setData(prev => prev.map(r => r.id === id ? updated : r))
    }
    return { data: updated, error }
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setData(prev => prev.filter(r => r.id !== id))
    return { error }
  }

  return { data, loading, insert, update, remove, refresh: fetchData }
}

/* ─── Typed hooks ─── */

export function useTasks() {
  const hook = useSupabaseTable('tasks')

  const addTask = async (text, priority = 'medium') => {
    if (!text.trim()) return
    return hook.insert({ text: text.trim(), priority, status: 'pending' })
  }

  const cycleStatus = async (id) => {
    const order = ['pending', 'doing', 'done']
    const task = hook.data.find(t => t.id === id)
    if (!task) return
    const next = order[(order.indexOf(task.status) + 1) % 3]
    return hook.update(id, { status: next })
  }

  return {
    tasks: hook.data,
    loading: hook.loading,
    addTask,
    cycleStatus,
    deleteTask: hook.remove,
  }
}

export function useProjects() {
  const hook = useSupabaseTable('projects')

  const addProject = async (name, color) => {
    return hook.insert({ name, color, progress: 0, total_tasks: 0, completed_tasks: 0, files: [] })
  }

  const updateProgress = async (id, progress) => {
    return hook.update(id, { progress })
  }

  const addFile = async (id, fileName) => {
    const proj = hook.data.find(p => p.id === id)
    if (!proj) return
    const files = [...(proj.files || []), fileName]
    return hook.update(id, { files })
  }

  const removeFile = async (id, fileName) => {
    const proj = hook.data.find(p => p.id === id)
    if (!proj) return
    const files = (proj.files || []).filter(f => f !== fileName)
    return hook.update(id, { files })
  }

  return {
    projects: hook.data,
    loading: hook.loading,
    addProject,
    updateProgress,
    addFile,
    removeFile,
    deleteProject: hook.remove,
  }
}

export function useNotes() {
  const hook = useSupabaseTable('notes')

  const addNote = async (text) => {
    const colors = ['#a78bfa', '#6ee7b7', '#fbbf24', '#f87171', '#38bdf8']
    const color = colors[hook.data.length % colors.length]
    return hook.insert({ text, color, pinned: false })
  }

  const togglePin = async (id) => {
    const note = hook.data.find(n => n.id === id)
    if (!note) return
    return hook.update(id, { pinned: !note.pinned })
  }

  return {
    notes: hook.data,
    loading: hook.loading,
    addNote,
    togglePin,
    deleteNote: hook.remove,
  }
}
