import { useState, useEffect } from 'react'
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types'

/**
 * Notes 管理页面组件
 */
export default function Notes() {
  const { user } = useAuthStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [editNote, setEditNote] = useState({ title: '', content: '' })

  /**
   * 获取 Notes 列表
   */
  const fetchNotes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('获取 Notes 列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 创建新 Note
   */
  const createNote = async () => {
    if (!newNote.title.trim()) return
    
    try {
      const noteData: CreateNoteInput = {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        user_id: user!.id
      }
      
      const { error } = await supabase
        .from('notes')
        .insert([noteData])
      
      if (error) throw error
      
      setNewNote({ title: '', content: '' })
      setCreating(false)
      fetchNotes()
    } catch (error) {
      console.error('创建 Note 失败:', error)
    }
  }

  /**
   * 更新 Note
   */
  const updateNote = async (id: string, updates: UpdateNoteInput) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('更新 Note 失败:', error)
    }
  }

  /**
   * 删除 Note
   */
  const deleteNote = async (id: string) => {
    if (!confirm('确定要删除这个笔记吗？')) return
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('删除 Note 失败:', error)
    }
  }

  /**
   * 开始编辑
   */
  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditNote({ title: note.title, content: note.content })
  }

  /**
   * 保存编辑
   */
  const saveEdit = async () => {
    if (!editNote.title.trim() || !editingId) return
    
    await updateNote(editingId, {
      title: editNote.title.trim(),
      content: editNote.content.trim()
    })
    
    setEditingId(null)
    setEditNote({ title: '', content: '' })
  }

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingId(null)
    setEditNote({ title: '', content: '' })
  }



  /**
   * 截取内容预览
   */
  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  useEffect(() => {
    if (user) {
      fetchNotes()
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">笔记</h2>
            <p className="text-gray-600 mt-1">记录您的想法和重要信息</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>新建笔记</span>
          </button>
        </div>

        {/* 创建新 Note */}
        {creating && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建新笔记</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题 *
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="输入笔记标题"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容 *
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="输入笔记内容"
                  rows={8}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createNote}
                  disabled={!newNote.title.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
                >
                  创建笔记
                </button>
                <button
                  onClick={() => {
                    setCreating(false)
                    setNewNote({ title: '', content: '' })
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes 列表 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">加载中...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有笔记</h3>
            <p className="text-gray-600 mb-4">创建您的第一个笔记开始记录想法</p>
            <button
              onClick={() => setCreating(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              创建笔记
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {editingId === note.id ? (
                  // 编辑模式
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          标题 *
                        </label>
                        <input
                          type="text"
                          value={editNote.title}
                          onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          内容 *
                        </label>
                        <textarea
                          value={editNote.content}
                          onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={6}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={!editNote.title.trim()}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <>
                    <div className="p-6 pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {note.title}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => startEdit(note)}
                            className="text-gray-400 hover:text-green-600 transition-colors p-1"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-600 text-sm whitespace-pre-wrap line-clamp-4 mb-4">
                        {getContentPreview(note.content)}
                      </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 border-t">
                      <p className="text-xs text-gray-500">
                        更新于 {new Date(note.updated_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}