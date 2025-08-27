/**
 * Todo 项目类型定义
 */
export interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  start_date: string | null // 计划执行时间，可空表示无特定开始时间
  due_date: string | null // 到期时间，可空表示永远不会到期
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
  start_date?: string | null // 计划执行时间，可空表示无特定开始时间
  due_date?: string | null // 到期时间，可空表示永远不会到期
  user_id: string
}

/**
 * 更新 Todo 时的输入类型
 */
export interface UpdateTodoInput {
  title?: string
  description?: string | null
  completed?: boolean
  start_date?: string | null // 计划执行时间，可空表示无特定开始时间
  due_date?: string | null // 到期时间，可空表示永远不会到期
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

/**
 * Todo 属性类型定义
 */
export interface TodoAttribute {
  id: string
  name: string
  color: string // 十六进制颜色代码，如 #FF0000
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * 创建 Todo 属性时的输入类型
 */
export interface CreateTodoAttributeInput {
  name: string
  color: string
  user_id: string
}

/**
 * 更新 Todo 属性时的输入类型
 */
export interface UpdateTodoAttributeInput {
  name?: string
  color?: string
}

/**
 * Todo 属性分配关系类型
 */
export interface TodoAttributeAssignment {
  id: string
  todo_id: string
  attribute_id: string
  created_at: string
}

/**
 * 创建 Todo 属性分配时的输入类型
 */
export interface CreateTodoAttributeAssignmentInput {
  todo_id: string
  attribute_id: string
}

/**
 * 带有属性的 Todo 类型（扩展原有 Todo 类型）
 */
export interface TodoWithAttributes extends Todo {
  todo_attribute_assignments?: {
    todo_attributes: TodoAttribute
  }[]
  attributes?: TodoAttribute[] // 便于使用的扁平化属性数组
}

/**
 * 属性筛选选项
 */
export interface AttributeFilter {
  attributeIds: string[]
  operator: 'AND' | 'OR' // AND: 必须包含所有选中属性, OR: 包含任一选中属性
}

/**
 * 属性统计信息
 */
export interface AttributeStats {
  id: string
  name: string
  color: string
  usage_count: number // 使用该属性的 Todo 数量
}

/**
 * 预定义的属性颜色选项
 */
export const ATTRIBUTE_COLORS = [
  '#EF4444', // 红色 - 紧急
  '#F59E0B', // 橙色 - 重要
  '#10B981', // 绿色 - 长远
  '#3B82F6', // 蓝色 - 工作
  '#8B5CF6', // 紫色 - 个人
  '#EC4899', // 粉色 - 娱乐
  '#6B7280', // 灰色 - 其他
  '#14B8A6', // 青色 - 学习
] as const

/**
 * 预定义的属性模板
 */
export const DEFAULT_ATTRIBUTES = [
  { name: '紧急', color: '#EF4444' },
  { name: '重要', color: '#F59E0B' },
  { name: '长远', color: '#10B981' },
  { name: '工作', color: '#3B82F6' },
  { name: '个人', color: '#8B5CF6' },
] as const