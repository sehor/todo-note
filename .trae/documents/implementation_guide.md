# Todo 属性管理功能实现指南

## 1. 数据库迁移

### 1.1 执行迁移

1. 将 `002_add_todo_attributes_migration.sql` 文件内容复制到 Supabase 控制台的 SQL 编辑器中执行
2. 或者在项目的 `supabase/migrations/` 目录下创建新的迁移文件

### 1.2 验证迁移

```sql
-- 验证表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('todo_attributes', 'todo_attribute_assignments');

-- 验证索引是否创建成功
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('todo_attributes', 'todo_attribute_assignments');
```

## 2. 类型定义更新

### 2.1 更新 src/types/index.ts

将 `todo_attributes_types.ts` 中的类型定义合并到现有的 `src/types/index.ts` 文件中。

### 2.2 更新 Todo 接口

```typescript
// 更新现有的 Todo 接口，添加 description 字段
export interface Todo {
  id: string
  title: string
  description: string | null // 新增字段
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

// 更新 CreateTodoInput 和 UpdateTodoInput
export interface CreateTodoInput {
  title: string
  description?: string | null // 新增字段
  user_id: string
}

export interface UpdateTodoInput {
  title?: string
  description?: string | null // 新增字段
  completed?: boolean
}
```

## 3. 前端组件实现

### 3.1 属性管理页面 (src/pages/Attributes.tsx)

```typescript
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Palette } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { TodoAttribute, CreateTodoAttributeInput, AttributeStats } from '../types'

/**
 * 属性管理页面组件
 */
export default function Attributes() {
  const { user } = useAuth()
  const [attributes, setAttributes] = useState<AttributeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newAttribute, setNewAttribute] = useState({ name: '', color: '#3B82F6' })
  const [editAttribute, setEditAttribute] = useState({ name: '', color: '' })

  // 获取属性列表及使用统计
  const fetchAttributes = async () => {
    // 实现获取属性和统计逻辑
  }

  // 创建新属性
  const createAttribute = async () => {
    // 实现创建属性逻辑
  }

  // 更新属性
  const updateAttribute = async (id: string) => {
    // 实现更新属性逻辑
  }

  // 删除属性
  const deleteAttribute = async (id: string) => {
    // 实现删除属性逻辑
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面内容 */}
    </div>
  )
}
```

### 3.2 属性选择组件 (src/components/AttributeSelector.tsx)

```typescript
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { TodoAttribute } from '../types'

interface AttributeSelectorProps {
  selectedAttributes: TodoAttribute[]
  onAttributesChange: (attributes: TodoAttribute[]) => void
  userId: string
}

/**
 * 属性选择组件
 */
export default function AttributeSelector({ 
  selectedAttributes, 
  onAttributesChange, 
  userId 
}: AttributeSelectorProps) {
  const [availableAttributes, setAvailableAttributes] = useState<TodoAttribute[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // 获取可用属性
  const fetchAvailableAttributes = async () => {
    // 实现获取可用属性逻辑
  }

  // 添加属性
  const addAttribute = (attribute: TodoAttribute) => {
    // 实现添加属性逻辑
  }

  // 移除属性
  const removeAttribute = (attributeId: string) => {
    // 实现移除属性逻辑
  }

  return (
    <div className="relative">
      {/* 组件内容 */}
    </div>
  )
}
```

### 3.3 属性标签组件 (src/components/AttributeTag.tsx)

```typescript
import { X } from 'lucide-react'
import type { TodoAttribute } from '../types'

interface AttributeTagProps {
  attribute: TodoAttribute
  removable?: boolean
  onRemove?: () => void
  size?: 'sm' | 'md'
}

/**
 * 属性标签组件
 */
export default function AttributeTag({ 
  attribute, 
  removable = false, 
  onRemove, 
  size = 'md' 
}: AttributeTagProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium text-white ${
        sizeClasses[size]
      }`}
      style={{ backgroundColor: attribute.color }}
    >
      {attribute.name}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
```

### 3.4 属性筛选组件 (src/components/AttributeFilter.tsx)

```typescript
import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import type { TodoAttribute, AttributeFilter } from '../types'
import AttributeTag from './AttributeTag'

interface AttributeFilterProps {
  onFilterChange: (filter: AttributeFilter | null) => void
  userId: string
}

/**
 * 属性筛选组件
 */
export default function AttributeFilter({ onFilterChange, userId }: AttributeFilterProps) {
  const [attributes, setAttributes] = useState<TodoAttribute[]>([])
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([])
  const [operator, setOperator] = useState<'AND' | 'OR'>('OR')
  const [showFilter, setShowFilter] = useState(false)

  // 实现筛选逻辑

  return (
    <div className="relative">
      {/* 筛选组件内容 */}
    </div>
  )
}
```

## 4. 更新现有组件

### 4.1 更新 Todos.tsx 页面

1. 导入新的组件和类型
2. 添加属性管理相关的状态
3. 更新 Todo 获取逻辑，包含属性信息
4. 在 Todo 列表中显示属性标签
5. 在创建/编辑 Todo 时支持属性选择
6. 添加属性筛选功能

### 4.2 更新路由配置

在 `src/App.tsx` 中添加属性管理页面的路由：

```typescript
import Attributes from './pages/Attributes'

// 在路由配置中添加
<Route path="/attributes" element={
  <ProtectedRoute>
    <Attributes />
  </ProtectedRoute>
} />
```

### 4.3 更新导航菜单

在主页面和其他导航组件中添加属性管理的链接。

## 5. API 集成

### 5.1 创建属性管理 Hook (src/hooks/useAttributes.ts)

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TodoAttribute, CreateTodoAttributeInput, UpdateTodoAttributeInput } from '../types'

/**
 * 属性管理自定义 Hook
 */
export function useAttributes(userId: string) {
  const [attributes, setAttributes] = useState<TodoAttribute[]>([])
  const [loading, setLoading] = useState(true)

  // 获取属性列表
  const fetchAttributes = async () => {
    // 实现逻辑
  }

  // 创建属性
  const createAttribute = async (input: CreateTodoAttributeInput) => {
    // 实现逻辑
  }

  // 更新属性
  const updateAttribute = async (id: string, input: UpdateTodoAttributeInput) => {
    // 实现逻辑
  }

  // 删除属性
  const deleteAttribute = async (id: string) => {
    // 实现逻辑
  }

  return {
    attributes,
    loading,
    fetchAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute
  }
}
```

## 6. 测试建议

### 6.1 单元测试

- 测试属性 CRUD 操作
- 测试属性分配和移除
- 测试属性筛选逻辑

### 6.2 集成测试

- 测试完整的属性管理流程
- 测试 Todo 与属性的关联
- 测试权限控制

### 6.3 用户体验测试

- 测试属性创建和编辑的用户体验
- 测试属性筛选的响应性能
- 测试移动端适配

## 7. 部署注意事项

1. 确保数据库迁移在生产环境中正确执行
2. 验证 RLS 策略的安全性
3. 测试新功能的性能影响
4. 准备回滚计划

## 8. 后续优化建议

1. 添加属性使用统计和分析
2. 支持属性的拖拽排序
3. 添加属性模板和快速创建
4. 支持属性的批量操作
5. 添加属性的导入导出功能
