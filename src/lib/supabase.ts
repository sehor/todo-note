import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = 'https://odtrwwsrsaiyvygkuoxs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdHJ3d3Nyc2FpeXZ5Z2t1b3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI0OTUsImV4cCI6MjA3MTgyODQ5NX0.6lKrSNMJ3gm22UcPN15tWNgYluoGx6u_9uZvo5jb8ZY'

/**
 * 创建 Supabase 客户端实例
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 数据库表类型定义
 */
export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          title: string
          completed: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          completed?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          completed?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          title: string
          content: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}