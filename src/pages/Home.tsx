import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, FileText, Plus, User, LogOut, Check, Edit2, Trash2, Clock, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { AttributeTag } from '../components/AttributeTag'
import type { Todo, Note, TodoWithAttributes, UpdateTodoInput } from '../types'

/**
 * 主页面组件，显示导航和统计概览
 */
export default function Home() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalTodos: 0,
    completedTodos: 0,
    totalNotes: 0
  })
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState<TodoWithAttributes[]>([])
  const [todosLoading, setTodosLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTodo, setEditTodo] = useState({ title: '', description: '', start_date: '', due_date: '' })

  /**
   * 获取Todo列表（限制显示最近10个）
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
        .limit(10)
      
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
   * 获取统计数据
   */
  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // 获取 Todos 统计
      const { data: todos, error: todosError } = await supabase
        .from('todos')
        .select('completed')
        .eq('user_id', user?.id)
      
      if (todosError) throw todosError
      
      // 获取 Notes 统计
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', user?.id)
      
      if (notesError) throw notesError
      
      const totalTodos = todos?.length || 0
      const completedTodos = todos?.filter(todo => todo.completed).length || 0
      const totalNotes = notes?.length || 0
      
      setStats({
        totalTodos,
        completedTodos,
        totalNotes
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
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
      
      // 刷新统计数据
      fetchStats()
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
      
      // 刷新统计数据
      fetchStats()
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
  }

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingId(null)
    setEditTodo({ title: '', description: '', start_date: '', due_date: '' })
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
      
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', editingId)
      
      if (error) throw error
      
      // 更新本地状态
      setTodos(prev => prev.map(todo => 
        todo.id === editingId ? { ...todo, ...updateData } : todo
      ))
      
      cancelEdit()
    } catch (error) {
      console.error('更新Todo失败:', error)
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
      fetchStats()
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
                  to="/todos" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  待办事项
                </Link>
                <Link 
                  to="/notes" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  笔记
                </Link>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来！</h2>
          <p className="text-gray-600">管理您的待办事项和笔记</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待办事项</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalTodos}
                </p>
                <p className="text-sm text-gray-500">
                  已完成 {loading ? '-' : stats.completedTodos} 项
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">笔记</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalNotes}
                </p>
                <p className="text-sm text-gray-500">总计</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完成率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500">今日进度</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">
                  {loading ? '-' : stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link 
            to="/todos"
            className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">创建待办事项</h3>
                <p className="text-gray-600">添加新的任务和目标</p>
              </div>
            </div>
          </Link>
          
          <Link 
            to="/notes"
            className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">创建笔记</h3>
                <p className="text-gray-600">记录想法和重要信息</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 最近的待办事项 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">最近的待办事项</h2>
              <Link
                to="/todos"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                查看全部
              </Link>
            </div>
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
                <Link
                  to="/todos"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                >
                  创建第一个待办事项
                </Link>
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
        </div>
      </main>
    </div>
  )
}