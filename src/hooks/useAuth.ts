import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { LoginForm, RegisterForm } from '../types'

/**
 * 认证状态管理 Hook
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前用户会话
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  /**
   * 用户登录
   */
  const signIn = async (credentials: LoginForm) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  /**
   * 用户注册
   */
  const signUp = async (credentials: RegisterForm) => {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  /**
   * 用户登出
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}