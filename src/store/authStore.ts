import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

/**
 * 认证状态管理 Store
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

// 初始化认证状态
const initAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    useAuthStore.getState().setUser(session?.user ?? null)
  } catch (error) {
    console.error('获取用户会话失败:', error)
  } finally {
    useAuthStore.getState().setLoading(false)
  }
}

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null)
  useAuthStore.getState().setLoading(false)
})

// 初始化