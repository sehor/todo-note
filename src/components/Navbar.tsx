import { Link, useLocation } from 'react-router-dom'
import { User, LogOut, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * 共享导航栏组件
 * 包含导航链接、用户信息和登出功能
 */
export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  /**
   * 处理用户登出
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  /**
   * 判断当前链接是否为活跃状态
   */
  const isActiveLink = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex space-x-6">
              <Link 
                to="/" 
                className={`font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActiveLink('/') 
                    ? 'text-blue-600 bg-blue-50/50 hover:text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/30'
                }`}
              >
                待办事项
              </Link>
              <Link 
                to="/notes" 
                className={`font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActiveLink('/notes') 
                    ? 'text-blue-600 bg-blue-50/50 hover:text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/30'
                }`}
              >
                笔记
              </Link>
              <Link 
                to="/recurring" 
                className={`font-medium flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActiveLink('/recurring') 
                    ? 'text-blue-600 bg-blue-50/50 hover:text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/30'
                }`}
              >
                <RotateCcw className="h-4 w-4" />
                重复任务
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700 bg-gray-100/80 px-3 py-1 rounded-full">
              <User className="h-4 w-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-50/80 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">登出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}