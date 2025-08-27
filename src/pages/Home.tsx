import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Plus, User, LogOut, Check, Edit2, Trash2, Clock, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { AttributeTag } from '../components/AttributeTag'
import { AttributeSelector } from '../components/AttributeSelector'
import { AttributesModal } from '../components/AttributesModal'
import type { TodoWithAttributes, UpdateTodoInput, TodoAttribute } from '../types'

/**
 * 主页面组件，显示导航和统计概览
 */
export default function Home() {
  const { user, signOut } = useAuth()

  const [todos, setTodos] = useState<TodoWithAttributes[]>([])
  const [todosLoading, setTodosLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTodo, setEditTodo] = useState({ title: '', description: '', start_date: '', due_date: '' })
  const [editAttributes, setEditAttributes] = useState<TodoAttribute[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTodo, setNewTodo] = useState({ title: '', description: '', start_date: '', due_date: '' })
  const [newTodoAttributes, setNewTodoAttributes] = useState<TodoAttribute[]>([])
  const [showAttributesModal, setShowAttributesModal] = useState(false)

  /**
   * 获取Todo列表
   */
  const fetchTodos = async () => {
    try {
      setTodosLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select(`
          *,
          todo_attribute_assignments(
            todo_attributes(*)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 转换数据格式
      const todosWithAttributes: TodoWithAttributes[] = (data || []).map(todo => ({
        ...todo,
        attributes: todo.todo_attribute_assignments?.map((assignment: any) => assignment.todo_attributes) || []
      }))
      
      setTodos(todosWithAttributes)
    } catch (error) {
      console.error('获取Todo列表失败:', error)
    } finally {
      setTodosLoading(false)
    }
  }



  /**
   * 切换Todo完成状态
   */
  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)
      
      if (error) throw error
      
      // 更新本地状态
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
      

    } catch (error) {
      console.error('更新Todo状态失败:', error)
    }
  }

  /**
   * 删除Todo
   */
  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // 更新本地状态
      setTodos(prev => prev.filter(todo => todo.id !== id))
      

    } catch (error) {
      console.error('删除Todo失败:', error)
    }
  }

  /**
   * 开始编辑Todo
   */
  const startEdit = (todo: TodoWithAttributes) => {
    setEditingId(todo.id)
    setEditTodo({
      title: todo.title,
      description: todo.description || '',
      start_date: todo.start_date || '',
      due_date: todo.due_date || ''
    })
    setEditAttributes(todo.attributes || [])
  }

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingId(null)
    setEditTodo({ title: '', description: '', start_date: '', due_date: '' })
    setEditAttributes([])
  }

  /**
   * 保存编辑
   */
  const saveEdit = async () => {
    if (!editingId || !editTodo.title.trim()) return
    
    try {
      const updateData: UpdateTodoInput = {
        title: editTodo.title.trim(),
        description: editTodo.description.trim() || null,
        start_date: editTodo.start_date || null,
        due_date: editTodo.due_date || null
      }
      
      // 更新todo基本信息
      const { error: updateError } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', editingId)
      
      if (updateError) throw updateError
      
      // 删除旧的属性关联
      const { error: deleteError } = await supabase
        .from('todo_attribute_assignments')
        .delete()
        .eq('todo_id', editingId)
      
      if (deleteError) throw deleteError
      
      // 创建新的属性关联
      if (editAttributes.length > 0) {
        const assignments = editAttributes.map(attr => ({
          todo_id: editingId,
          attribute_id: attr.id
        }))
        
        const { error: insertError } = await supabase
          .from('todo_attribute_assignments')
          .insert(assignments)
        
        if (insertError) throw insertError
      }
      
      // 重新获取todo列表以更新属性
      fetchTodos()
      
      cancelEdit()
    } catch (error) {
      console.error('更新Todo失败:', error)
    }
  }

  /**
   * 创建新Todo
   */
  const createTodo = async () => {
    if (!newTodo.title.trim()) return
    
    try {
      const todoData = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || null,
        start_date: newTodo.start_date || null,
        due_date: newTodo.due_date || null,
        user_id: user?.id,
        completed: false
      }
      
      // 创建todo并获取返回的id
      const { data: todoResult, error: todoError } = await supabase
        .from('todos')
        .insert([todoData])
        .select('id')
        .single()
      
      if (todoError) throw todoError
      
      // 如果有选择的属性，创建属性关联
      if (newTodoAttributes.length > 0 && todoResult) {
        const assignments = newTodoAttributes.map(attr => ({
          todo_id: todoResult.id,
          attribute_id: attr.id
        }))
        
        const { error: assignmentError } = await supabase
          .from('todo_attribute_assignments')
          .insert(assignments)
        
        if (assignmentError) throw assignmentError
      }
      
      // 重新获取todo列表
      fetchTodos()
      
      // 重置表单
      setNewTodo({ title: '', description: '', start_date: '', due_date: '' })
      setNewTodoAttributes([])
      setShowCreateForm(false)
    } catch (error) {
      console.error('创建Todo失败:', error)
    }
  }

  /**
   * 计算剩余时间
   */
  const calculateTimeRemaining = (dueDate: string | null): string => {
    if (!dueDate) return '无截止时间'
    
    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()
    
    if (diffMs < 0) {
      const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))
      return `已逾期 ${overdueDays} 天`
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `剩余 ${days} 天 ${hours} 小时`
    } else if (hours > 0) {
      return `剩余 ${hours} 小时`
    } else {
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `剩余 ${minutes} 分钟`
    }
  }

  useEffect(() => {
    if (user) {
      fetchTodos()
    }
  }, [user])

  /**
   * 处理登出
   */
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Todo & Notes</h1>
              <div className="hidden md:flex space-x-6">
                <Link 
                  to="/" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  首页
                </Link>
                <Link 
                  to="/notes" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  笔记
                </Link>
                <button
                  onClick={() => setShowAttributesModal(true)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  管理属性
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">登出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 待办事项列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">待办事项</h2>
          </div>
          
          <div className="p-6">
            {todosLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无待办事项</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todos.map((todo) => (
                  <div key={todo.id} className="border rounded-lg p-4">
                    {editingId === todo.id ? (
                      // 编辑模式
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editTodo.title}
                          onChange={(e) => setEditTodo(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="待办事项标题"
                        />
                        <textarea
                          value={editTodo.description}
                          onChange={(e) => setEditTodo(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="描述（可选）"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                            <input
                              type="date"
                              value={editTodo.start_date}
                              onChange={(e) => setEditTodo(prev => ({ ...prev, start_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                            <input
                              type="date"
                              value={editTodo.due_date}
                              onChange={(e) => setEditTodo(prev => ({ ...prev, due_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">属性</label>
                          <AttributeSelector
                            selectedAttributes={editAttributes}
                            onAttributesChange={setEditAttributes}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            取消
                          </button>
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 显示模式
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <button
                            onClick={() => toggleComplete(todo.id, todo.completed)}
                            className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                              todo.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {todo.completed && <Check className="h-3 w-3" />}
                          </button>
                          
                          <div className="flex-1">
                            <h3 className={`font-medium ${
                              todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {todo.title}
                            </h3>
                            
                            {todo.description && (
                              <p className={`text-sm mt-1 ${
                                todo.completed ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {todo.description}
                              </p>
                            )}
                            
                            {/* 属性标签 */}
                            {todo.attributes && todo.attributes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {todo.attributes.map((attr) => (
                                  <AttributeTag key={attr.id} attribute={attr} />
                                ))}
                              </div>
                            )}
                            
                            {/* 时间信息 */}
                            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                              {todo.start_date && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>开始: {new Date(todo.start_date).toLocaleDateString()}</span>
                                </div>
                              )}
                              {todo.due_date && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span className={`${
                                    calculateTimeRemaining(todo.due_date).includes('已逾期') 
                                      ? 'text-red-500' 
                                      : 'text-gray-500'
                                  }`}>
                                    {calculateTimeRemaining(todo.due_date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => startEdit(todo)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 创建新Todo按钮和表单 */}
          <div className="p-6 border-t">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>创建新待办事项</span>
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="待办事项标题"
                  autoFocus
                />
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="描述（可选）"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                    <input
                      type="date"
                      value={newTodo.start_date}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                    <input
                      type="date"
                      value={newTodo.due_date}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">属性</label>
                  <AttributeSelector
                    selectedAttributes={newTodoAttributes}
                    onAttributesChange={setNewTodoAttributes}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewTodo({ title: '', description: '', start_date: '', due_date: '' })
                      setNewTodoAttributes([])
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={createTodo}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    创建
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* 属性管理弹窗 */}
      <AttributesModal 
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
      />
    </div>
  )
}