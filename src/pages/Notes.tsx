import { useState, useEffect } from 'react'
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { NoteEditModal } from '../components/NoteEditModal'
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)

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
  const createNote = async (noteData: { title: string; content: string }) => {
    try {
      const createData: CreateNoteInput = {
        title: noteData.title,
        content: noteData.content,
        user_id: user!.id
      }
      
      const { error } = await supabase
        .from('notes')
        .insert([createData])
      
      if (error) throw error
      
      fetchNotes()
    } catch (error) {
      console.error('创建 Note 失败:', error)
    }
  }

  /**
   * 更新 Note
   */
  const updateNote = async (noteData: { title: string; content: string }) => {
    if (!editingNote) return
    
    try {
      const updates: UpdateNoteInput = {
        title: noteData.title,
        content: noteData.content
      }
      
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', editingNote.id)
      
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
   * 打开创建笔记弹窗
   */
  const openCreateModal = () => {
    setEditingNote(null)
    setIsCreating(true)
    setShowEditModal(true)
  }

  /**
   * 打开编辑笔记弹窗
   */
  const openEditModal = (note: Note) => {
    setEditingNote(note)
    setIsCreating(false)
    setShowEditModal(true)
  }

  /**
   * 关闭弹窗
   */
  const closeModal = () => {
    setShowEditModal(false)
    setEditingNote(null)
    setIsCreating(false)
  }

  /**
   * 处理保存
   */
  const handleSave = async (noteData: { title: string; content: string }) => {
    if (isCreating) {
      await createNote(noteData)
    } else {
      await updateNote(noteData)
    }
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
            onClick={openCreateModal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>新建笔记</span>
          </button>
        </div>



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
              onClick={openCreateModal}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              创建笔记
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {note.title}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => openEditModal(note)}
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
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 笔记编辑弹窗 */}
      <NoteEditModal
        isOpen={showEditModal}
        note={editingNote}
        isCreating={isCreating}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  )
}