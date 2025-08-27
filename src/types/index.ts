/**
 * Todo 项目类型定义
 */
export interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * 创建 Todo 时的输入类型
 */
export interface CreateTodoInput {
  title: string
  description?: string | null
  user_id: string
}

/**
 * 更新 Todo 时的输入类型
 */
export interface UpdateTodoInput {
  title?: string
  description?: string | null
  completed?: boolean
}

/**
 * Note 笔记类型定义
 */
export interface Note {
  id: string
  title: string
  content: string | null
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * 创建 Note 时的输入类型
 */
export interface CreateNoteInput {
  title: string
  content: string
  user_id: string
}

/**
 * 更新 Note 时的输入类型
 */
export interface UpdateNoteInput {
  title?: string
  content?: string
}

/**
 * 用户类型定义
 */
export interface User {
  id: string
  email: string
  created_at: string
}

/**
 * 认证状态类型
 */
export interface AuthState {
  user: User | null
  loading: boolean
}

/**
 * 登录表单类型
 */
export interface LoginForm {
  email: string
  password: string
}

/**
 * 注册表单类型
 */
export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
}