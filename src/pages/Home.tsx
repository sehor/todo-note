import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, FileText, Plus, User, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Todo, Note } from '../types'

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

  useEffect(() => {
    if (user) {
      fetchStats()
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </main>
    </div>
  )
}