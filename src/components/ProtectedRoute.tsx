import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 路由保护组件，确保只有已认证用户可以访问
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // 加载中显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 未认证用户重定向到登录页
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 已认证用户显示子组件
  return <>{children}</>
}