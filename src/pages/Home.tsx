import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { CheckSquare, Plus, Edit2, Trash2, Calendar, Clock, RotateCcw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { AttributeTag } from '../components/AttributeTag'
import { AttributeSelector } from '../components/AttributeSelector'
import { AttributesModal } from '../components/AttributesModal'
import type { TodoWithAttributes, UpdateTodoInput, TodoAttribute } from '../types'
import { msToDateString, processDateInput, calculateTimeRemaining as utilCalculateTimeRemaining, isNoDeadline } from '../utils/timeUtils'

/**
 * 主页面组件，显示导航和统计概览
 */
export default function Home() {
  const { user } = useAuthStore()

  const [todos, setTodos] = useState<TodoWithAttributes[]>([])
  const [todosLoading, setTodosLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTodo, setEditTodo] = useState({ title: '', description: '', start_date: '', start_time: '', due_date: '', due_time: '' })
  const [editAttributes, setEditAttributes] = useState<TodoAttribute[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTodo, setNewTodo] = useState({ title: '', description: '', start_date: '', start_time: '', due_date: '', due_time: '' })
  const [newTodoAttributes, setNewTodoAttributes] = useState<TodoAttribute[]>([])
  const [showAttributesModal, setShowAttributesModal] = useState(false)
  const [attributesRefreshTrigger, setAttributesRefreshTrigger] = useState(0)

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
      
      // 转换数据格式，正确处理null值
      const todosWithAttributes: TodoWithAttributes[] = (data || []).map(todo => ({
        ...todo,
        start_date: todo.start_date?.toString() || '',
        due_date: todo.due_date ? todo.due_date.toString() : null,
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
    // 显示确认对话框
    if (!window.confirm('确定要删除这个待办事项吗？此操作无法撤销。')) {
      return
    }
    
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
   * 将毫秒数格式化为 yyyy-MM-dd
   */
  const formatDateForInput = (ms: string | null): string => {
    if (ms === null || ms === undefined || ms === '') return '' // null值表示无截止时间，不显示
    return msToDateString(ms)
  }

  /**
   * 将毫秒数格式化为 HH:mm
   */
  const formatTimeForInput = (ms: string | null): string => {
    if (ms === null || ms === undefined || ms === '') return ''
    const date = new Date(Number(ms))
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * 合并日期和时间为毫秒数
   */
  const combineDateAndTime = (dateStr: string, timeStr: string): string | null => {
    if (!dateStr) return null
    
    const date = new Date(dateStr)
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)
    } else {
      date.setHours(0, 0, 0, 0)
    }
    
    return date.getTime().toString()
  }

  /**
   * 开始编辑Todo
   */
  const startEdit = (todo: TodoWithAttributes) => {
    setEditingId(todo.id)
    setEditTodo({
      title: todo.title,
      description: todo.description || '',
      start_date: formatDateForInput(todo.start_date),
      start_time: formatTimeForInput(todo.start_date),
      due_date: formatDateForInput(todo.due_date),
      due_time: formatTimeForInput(todo.due_date)
    })
    setEditAttributes(todo.attributes || [])
  }

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingId(null)
    setEditTodo({ title: '', description: '', start_date: '', start_time: '', due_date: '', due_time: '' })
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
        start_date: combineDateAndTime(editTodo.start_date, editTodo.start_time) || new Date().getTime().toString(),
        due_date: combineDateAndTime(editTodo.due_date, editTodo.due_time)
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
        start_date: combineDateAndTime(newTodo.start_date, newTodo.start_time) || new Date().getTime().toString(),
        due_date: combineDateAndTime(newTodo.due_date, newTodo.due_time),
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
      setNewTodo({ title: '', description: '', start_date: '', start_time: '', due_date: '', due_time: '' })
      setNewTodoAttributes([])
      setShowCreateForm(false)
    } catch (error) {
      console.error('创建Todo失败:', error)
    }
  }

  /**
   * 计算剩余时间
   */
  const calculateTimeRemaining = (dueDate: string): string => {
    return utilCalculateTimeRemaining(dueDate)
  }

  useEffect(() => {
    if (user) {
      fetchTodos()
    }
  }, [user])

  // 添加定时器来动态更新剩余时间显示
  useEffect(() => {
    const interval = setInterval(() => {
      // 强制重新渲染组件以更新剩余时间显示
      setTodos(prevTodos => [...prevTodos])
    }, 60000) // 每分钟更新一次

    return () => clearInterval(interval)
  }, [])



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 待办事项列表 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">待办事项</h2>
          </div>
          
          <div className="p-6">
            {todosLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <CheckSquare className="h-10 w-10 text-blue-500" />
                </div>
                <p className="text-gray-600 text-lg font-medium">暂无待办事项</p>
                <p className="text-gray-400 text-sm mt-2">点击下方按钮创建您的第一个待办事项</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todos.map((todo) => (
                  <div key={todo.id} className="group bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/60 rounded-xl p-6 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-1">
                    {editingId === todo.id ? (
                      // 编辑模式
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editTodo.title}
                          onChange={(e) => setEditTodo(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                          placeholder="待办事项标题"
                        />
                        <textarea
                          value={editTodo.description}
                          onChange={(e) => setEditTodo(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none"
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
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                            />
                            <input
                              type="time"
                              value={editTodo.start_time}
                              onChange={(e) => setEditTodo(prev => ({ ...prev, start_time: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 mt-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                            <input
                              type="date"
                              value={editTodo.due_date}
                              onChange={(e) => setEditTodo(prev => ({ ...prev, due_date: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                            />
                            <input
                              type="time"
                              value={editTodo.due_time}
                              onChange={(e) => setEditTodo(prev => ({ ...prev, due_time: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">属性</label>
                          <AttributeSelector
                            selectedAttributes={editAttributes}
                            onAttributesChange={setEditAttributes}
                            onManageAttributes={() => setShowAttributesModal(true)}
                            refreshTrigger={attributesRefreshTrigger}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={cancelEdit}
                            className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          >
                            取消
                          </button>
                          <button
                            onClick={saveEdit}
                            className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 显示模式
                      <div className="relative h-32 w-full">
                        {/* 右上方：时间信息 */}
                        <div className="absolute top-0 right-0 text-xs text-gray-500 space-y-1">
                          <div className="flex items-center space-x-1 justify-end bg-blue-50/80 px-2 py-1 rounded-lg">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-600 font-medium">开始: {new Date(Number(todo.start_date)).toLocaleDateString()}</span>
                          </div>
                          {/* 只有未完成的todo才显示剩余时间 */}
                          {!todo.completed && (
                            <div className={`flex items-center space-x-1 justify-end px-2 py-1 rounded-lg ${
                              calculateTimeRemaining(todo.due_date).includes('已逾期') 
                                ? 'bg-red-50/80' 
                                : calculateTimeRemaining(todo.due_date) === '无限期'
                                ? 'bg-indigo-50/80'
                                : 'bg-green-50/80'
                            }`}>
                              <Clock className={`h-3 w-3 ${
                                calculateTimeRemaining(todo.due_date).includes('已逾期') 
                                  ? 'text-red-500' 
                                  : calculateTimeRemaining(todo.due_date) === '无限期'
                                  ? 'text-indigo-500'
                                  : 'text-green-500'
                              }`} />
                              <span className={`font-medium ${
                                calculateTimeRemaining(todo.due_date).includes('已逾期') 
                                  ? 'text-red-600' 
                                  : calculateTimeRemaining(todo.due_date) === '无限期'
                                  ? 'text-indigo-600'
                                  : 'text-green-600'
                              }`}>
                                {calculateTimeRemaining(todo.due_date)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 左侧：内容 */}
                        <div className="h-full pr-24 pb-8">
                          <div className="flex-1 min-w-0">
                            {/* 标题和属性在同一行 */}
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium truncate flex-shrink-0 ${
                                todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}>
                                {/* 已完成的todo在标题前显示勾选图标 */}
                                {todo.completed && (
                                  <span className="text-green-500 mr-1">✓</span>
                                )}
                                {todo.title}
                              </h3>
                              {/* 属性标签紧贴标题 */}
                              {todo.attributes && todo.attributes.length > 0 && (
                                <div className="flex flex-wrap gap-1 flex-shrink min-w-0">
                                  {todo.attributes.map((attr) => (
                                    <AttributeTag key={attr.id} attribute={attr} />
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* 描述 */}
                             {todo.description && (
                               <p className={`text-sm overflow-hidden ${
                                 todo.completed ? 'text-gray-400' : 'text-gray-600'
                               }`}
                               style={{
                                 display: '-webkit-box',
                                 WebkitLineClamp: 2,
                                 WebkitBoxOrient: 'vertical',
                                 whiteSpace: 'pre-wrap'
                               }}>
                                 {todo.description}
                               </p>
                             )}
                          </div>
                        </div>

                        {/* 右下方：开关和操作按钮 */}
                        <div className="absolute bottom-0 right-0 flex items-center space-x-3">
                          {/* 完成状态开关 */}
                          <button
                            onClick={() => toggleComplete(todo.id, todo.completed)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl ${
                              todo.completed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-200 to-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                                todo.completed ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          
                          <button
                            onClick={() => startEdit(todo)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group-hover:opacity-100 opacity-70"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group-hover:opacity-100 opacity-70"
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
          <div className="p-6 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-blue-50/30">
            {!showCreateForm ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  <span>创建新待办事项</span>
                </button>
                <Link
                  to="/recurring"
                  className="w-full flex items-center justify-center space-x-2 py-3 px-6 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md bg-white/60 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>管理重复任务模板</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="待办事项标题"
                  autoFocus
                />
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                    />
                    <input
                      type="time"
                      value={newTodo.start_time}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 mt-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                    <input
                      type="date"
                      value={newTodo.due_date}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                    />
                    <input
                      type="time"
                      value={newTodo.due_time}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, due_time: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 mt-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">属性</label>
                  <AttributeSelector
                    selectedAttributes={newTodoAttributes}
                    onAttributesChange={setNewTodoAttributes}
                    onManageAttributes={() => setShowAttributesModal(true)}
                    refreshTrigger={attributesRefreshTrigger}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewTodo({ title: '', description: '', start_date: '', start_time: '', due_date: '', due_time: '' })
                      setNewTodoAttributes([])
                    }}
                    className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={createTodo}
                    className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
        onClose={() => {
          setShowAttributesModal(false)
          setAttributesRefreshTrigger(prev => prev + 1)
        }}
      />
    </div>
  )
}