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
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todo_attribute_assignments: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          todo_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          todo_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          todo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_attribute_assignments_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "todo_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_attribute_assignments_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_attributes: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      todo_recurring_attribute_assignments: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          template_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          template_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_recurring_attribute_assignments_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "todo_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_recurring_attribute_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "todo_recurring_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_recurring_templates: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          end_date: string | null
          frequency: string
          id: string
          interval_value: number
          last_generated_date: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
          weekdays: number[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          end_date?: string | null
          frequency: string
          id?: string
          interval_value: number
          last_generated_date?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
          weekdays?: number[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          end_date?: string | null
          frequency?: string
          id?: string
          interval_value?: number
          last_generated_date?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          weekdays?: number[] | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          recurring_template_id: string | null
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          recurring_template_id?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          recurring_template_id?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "todo_recurring_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}