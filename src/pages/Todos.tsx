import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Check, X, Edit2, Trash2, User, LogOut, Home, Filter, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { AttributeSelector } from '../components/AttributeSelector'
import { AttributeFilter } from '../components/AttributeFilter'
import { AttributeTag } from '../components/AttributeTag'
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoWithAttributes, TodoAttribute, AttributeFilter as AttributeFilterType } from '../types'

/**
 * Todo 管理页面组件
 */
export default function Todos() {
  const { user, signOut } = useAuth()
  const [todos, setTodos] = useState<TodoWithAttributes[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTodo, setNewTodo] = useState({ title: '', description: '' })
  const [editTodo, setEditTodo] = useState({ title: '', description: '' })
  const [newTodoAttributes, setNewTodoAttributes] = useState<string[]>([])
  const [editTodoAttributes, setEditTodoAttributes] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(false)
  const [attributeFilter, setAttributeFilter] = useState<AttributeFilterType>({ attributeIds: [], operator: 'OR' })

  /**
   * 获取 Todo 列表（包含属性信息）
   */
  const fetchTodos = async () => {
    try {
      setLoading(true)
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
      console.error('获取 Todo 列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 创建新 Todo（包含属性分配）
   */
  const createTodo = async () => {
    if (!newTodo.title.trim()) return
    
    try {
      const todoData: CreateTodoInput = {
        title: newTodo.title.trim(),
        description: newTodo.description.trim() || null,
        user_id: user!.id
      }
      
      const { data: todoResult, error: todoError } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single()
      
      if (todoError) throw todoError
      
      // 分配属性
      if (newTodoAttributes.length > 0) {
        const assignments = newTodoAttributes.map(attributeId => ({
          todo_id: todoResult.id,
          attribute_id: attributeId
        }))
        
        const { error: assignmentError } = await supabase
          .from('todo_attribute_assignments')
          .insert(assignments)
        
        if (assignmentError) throw assignmentError
      }
      
      setNewTodo({ title: '', description: '' })
      setNewTodoAttributes([])
      setCreating(false)
      fetchTodos()
    } catch (error) {
      console.error('创建 Todo 失败:', error)
    }
  }

  /**
   * 更新 Todo
   */
  const updateTodo = async (id: string, updates: UpdateTodoInput) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      fetchTodos()
    } catch (error) {
      console.error('更新 Todo 失败:', error)
    }
  }

  /**
   * 删除 Todo
   */
  const deleteTodo = async (id: string) => {
    if (!confirm('确定要删除这个待办事项吗？')) return
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchTodos()
    } catch (error) {
      console.error('删除 Todo 失败:', error)
    }
  }

  /**
   * 切换完成状态
   */
  const toggleComplete = async (id: string, completed: boolean) => {
    await updateTodo(id, { completed: !completed })
  }

  /**
   * 开始编辑
   */
  const startEdit = (todo: TodoWithAttributes) => {
    setEditingId(todo.id)
    setEditTodo({ title: todo.title, description: todo.description || '' })
    setEditTodoAttributes(todo.attributes?.map(attr => attr.id) || [])
  }

  /**
   * 保存编辑（包含属性更新）
   */
  const saveEdit = async () => {
    if (!editTodo.title.trim() || !editingId) return
    
    try {
      // 更新todo基本信息
      await updateTodo(editingId, {
        title: editTodo.title.trim(),
        description: editTodo.description.trim() || null
      })
      
      // 删除现有属性分配
      const { error: deleteError } = await supabase
        .from('todo_attribute_assignments')
        .delete()
        .eq('todo_id', editingId)
      
      if (deleteError) throw deleteError
      
      // 添加新的属性分配
      if (editTodoAttributes.length > 0) {
        const assignments = editTodoAttributes.map(attributeId => ({
          todo_id: editingId,
          attribute_id: attributeId
        }))
        
        const { error: assignmentError } = await supabase
          .from('todo_attribute_assignments')
          .insert(assignments)
        
        if (assignmentError) throw assignmentError
      }
      
      setEditingId(null)
      setEditTodo({ title: '', description: '' })
      setEditTodoAttributes([])
      fetchTodos()
    } catch (error) {
      console.error('保存编辑失败:', error)
    }
  }

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingId(null)
    setEditTodo({ title: '', description: '' })
    setEditTodoAttributes([])
  }

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

  useEffect(() => {
    if (user) {
      fetchTodos()
    }
  }, [user])

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
                  className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
                >
                  <Home className="h-4 w-4" />
                  <span>首页</span>
                </Link>
                <Link 
                  to="/todos" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  待办事项
                </Link>
                <Link 
                  to="/notes" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  笔记
                </Link>
                <Link 
                  to="/attributes" 
                  className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>属性管理</span>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">待办事项</h2>
            <p className="text-gray-600 mt-1">管理您的任务和目标</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                showFilter 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>筛选</span>
            </button>
            <button
              onClick={() => setCreating(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>新建待办</span>
            </button>
          </div>
        </div>

        {/* 属性筛选器 */}
        {showFilter && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <AttributeFilter
              filter={attributeFilter}
              onFilterChange={setAttributeFilter}
            />
          </div>
        )}

        {/* 创建新 Todo */}
        {creating && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建新待办事项</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题 *
                </label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入待办事项标题"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入详细描述（可选）"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  属性标签
                </label>
                <AttributeSelector
                  selectedAttributes={newTodoAttributes.map(id => {
                    // 从已获取的属性中找到对应的完整属性信息
                    const foundAttr = todos.flatMap(t => t.attributes || []).find(attr => attr.id === id)
                    return foundAttr || { id, name: '', color: '#3B82F6', user_id: user?.id || '', created_at: '', updated_at: '' }
                  })}
                  onAttributesChange={(attrs) => setNewTodoAttributes(attrs.map(attr => attr.id))}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createTodo}
                  disabled={!newTodo.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>创建</span>
                </button>
                <button
                  onClick={() => {
                    setCreating(false)
                    setNewTodo({ title: '', description: '' })
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>取消</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Todo 列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">加载中...</p>
            </div>
          ) : (() => {
            // 应用属性筛选
            const filteredTodos = todos.filter(todo => {
              if (attributeFilter.attributeIds.length === 0) return true
              
              const todoAttributeIds = todo.attributes?.map(attr => attr.id) || []
              
              if (attributeFilter.operator === 'AND') {
                return attributeFilter.attributeIds.every(id => todoAttributeIds.includes(id))
              } else {
                return attributeFilter.attributeIds.some(id => todoAttributeIds.includes(id))
              }
            })
            
            return filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Check className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {todos.length === 0 ? '还没有待办事项' : '没有符合筛选条件的待办事项'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {todos.length === 0 ? '创建您的第一个待办事项开始管理任务' : '尝试调整筛选条件或创建新的待办事项'}
                </p>
                <button
                  onClick={() => setCreating(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  创建待办事项
                </button>
              </div>
            ) : (
              filteredTodos.map((todo) => (
              <div key={todo.id} className="bg-white rounded-lg shadow-sm border p-6">
                {editingId === todo.id ? (
                  // 编辑模式
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        标题 *
                      </label>
                      <input
                        type="text"
                        value={editTodo.title}
                        onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        描述
                      </label>
                      <textarea
                        value={editTodo.description}
                        onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        属性标签
                      </label>
                      <AttributeSelector
                        selectedAttributes={editTodoAttributes.map(id => {
                          // 从已获取的属性中找到对应的完整属性信息
                          const foundAttr = todos.flatMap(t => t.attributes || []).find(attr => attr.id === id)
                          return foundAttr || { id, name: '', color: '#3B82F6', user_id: user?.id || '', created_at: '', updated_at: '' }
                        })}
                        onAttributesChange={(attrs) => setEditTodoAttributes(attrs.map(attr => attr.id))}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={saveEdit}
                        disabled={!editTodo.title.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                      >
                        <Check className="h-4 w-4" />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>取消</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => toggleComplete(todo.id, todo.completed)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:border-blue-600'
                        }`}
                      >
                        {todo.completed && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${
                          todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`mt-1 text-sm ${
                            todo.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        {todo.attributes && todo.attributes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {todo.attributes.map(attribute => (
                              <AttributeTag
                                key={attribute.id}
                                attribute={attribute}
                                size="sm"
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          创建于 {new Date(todo.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => startEdit(todo)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
            )
          })()
        }
        </div>
      </main>
    </div>
  )
}