import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Note } from '../types'

interface NoteEditModalProps {
  isOpen: boolean
  note: Note | null
  onClose: () => void
  onSave: (noteData: { title: string; content: string }) => void
  isCreating?: boolean
}

/**
 * 笔记编辑弹窗组件
 */
export function NoteEditModal({ isOpen, note, onClose, onSave, isCreating = false }: NoteEditModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // 当弹窗打开时，初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (note && !isCreating) {
        setTitle(note.title)
        setContent(note.content)
      } else {
        setTitle('')
        setContent('')
      }
    }
  }, [isOpen, note, isCreating])

  /**
   * 处理保存
   */
  const handleSave = () => {
    if (!title.trim()) return
    
    onSave({
      title: title.trim(),
      content: content.trim()
    })
    
    onClose()
  }

  /**
   * 处理关闭
   */
  const handleClose = () => {
    setTitle('')
    setContent('')
    onClose()
  }

  /**
   * 处理键盘快捷键
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onKeyDown={handleKeyDown}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreating ? '创建新笔记' : '编辑笔记'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* 表单内容 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  placeholder="输入笔记标题"
                  autoFocus
                />
              </div>
              
              {/* 内容输入 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容 *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="输入笔记内容"
                  rows={20}
                  style={{ minHeight: '400px' }}
                />
              </div>
            </div>
          </div>
          
          {/* 底部按钮 */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="text-sm text-gray-500">
              提示：按 Ctrl+Enter 快速保存，按 Esc 关闭
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isCreating ? '创建笔记' : '保存更改'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}