import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Settings } from 'lucide-react'
import { TodoAttribute, CreateTodoAttributeInput, UpdateTodoAttributeInput, ATTRIBUTE_COLORS, DEFAULT_ATTRIBUTES } from '../types'
import { AttributeTag } from './AttributeTag'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

interface AttributesModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 属性管理弹窗组件 - 用于创建、编辑、删除用户的属性
 */
export const AttributesModal: React.FC<AttributesModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [attributes, setAttributes] = useState<TodoAttribute[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<{ name: string; color: string }>({ name: '', color: ATTRIBUTE_COLORS[0] })

  // 获取用户的所有属性
  const fetchAttributes = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('todo_attributes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAttributes(data || [])
    } catch (error) {
      console.error('获取属性失败:', error)
      toast.error('获取属性失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建属性
  const createAttribute = async () => {
    if (!user || !formData.name.trim()) return
    
    try {
      const input: CreateTodoAttributeInput = {
        name: formData.name.trim(),
        color: formData.color,
        user_id: user.id
      }
      
      const { data, error } = await supabase
        .from('todo_attributes')
        .insert([input])
        .select()
        .single()
      
      if (error) throw error
      
      setAttributes([data, ...attributes])
      setFormData({ name: '', color: ATTRIBUTE_COLORS[0] })
      setShowCreateForm(false)
      toast.success('属性创建成功')
    } catch (error: any) {
      console.error('创建属性失败:', error)
      if (error.code === '23505') {
        toast.error('属性名称已存在')
      } else {
        toast.error('创建属性失败')
      }
    }
  }

  // 更新属性
  const updateAttribute = async (id: string, updates: UpdateTodoAttributeInput) => {
    try {
      const { data, error } = await supabase
        .from('todo_attributes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setAttributes(attributes.map(attr => 
        attr.id === id ? data : attr
      ))
      setEditingId(null)
      toast.success('属性更新成功')
    } catch (error: any) {
      console.error('更新属性失败:', error)
      if (error.code === '23505') {
        toast.error('属性名称已存在')
      } else {
        toast.error('更新属性失败')
      }
    }
  }

  // 删除属性
  const deleteAttribute = async (id: string) => {
    if (!confirm('确定要删除这个属性吗？删除后相关的todo关联也会被移除。')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('todo_attributes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setAttributes(attributes.filter(attr => attr.id !== id))
      toast.success('属性删除成功')
    } catch (error) {
      console.error('删除属性失败:', error)
      toast.error('删除属性失败')
    }
  }

  // 初始化默认属性
  const initializeDefaultAttributes = async () => {
    if (!user) return
    
    try {
      const inputs = DEFAULT_ATTRIBUTES.map(attr => ({
        name: attr.name,
        color: attr.color,
        user_id: user.id
      }))
      
      const { data, error } = await supabase
        .from('todo_attributes')
        .insert(inputs)
        .select()
      
      if (error) throw error
      
      setAttributes([...data, ...attributes])
      toast.success('默认属性创建成功')
    } catch (error) {
      console.error('创建默认属性失败:', error)
      toast.error('创建默认属性失败')
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      fetchAttributes()
    }
  }, [isOpen, user])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">属性管理</h2>
            <p className="text-gray-600 mt-1">管理您的todo属性标签，用于分类和筛选任务</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                创建属性
              </button>
              
              {attributes.length === 0 && (
                <button
                  onClick={initializeDefaultAttributes}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  初始化默认属性
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              共 {attributes.length} 个属性
            </div>
          </div>

          {/* 创建表单 */}
          {showCreateForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-4">创建新属性</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    属性名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入属性名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    颜色
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ATTRIBUTE_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={createAttribute}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ name: '', color: ATTRIBUTE_COLORS[0] })
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 属性列表 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : attributes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">暂无属性</div>
              <p className="text-sm text-gray-400 mb-4">
                创建属性来为您的todo添加分类标签
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attributes.map(attribute => (
                <AttributeCard
                  key={attribute.id}
                  attribute={attribute}
                  isEditing={editingId === attribute.id}
                  onEdit={() => setEditingId(attribute.id)}
                  onSave={(updates) => updateAttribute(attribute.id, updates)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => deleteAttribute(attribute.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 属性卡片组件
interface AttributeCardProps {
  attribute: TodoAttribute
  isEditing: boolean
  onEdit: () => void
  onSave: (updates: UpdateTodoAttributeInput) => void
  onCancel: () => void
  onDelete: () => void
}

const AttributeCard: React.FC<AttributeCardProps> = ({
  attribute,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete
}) => {
  const [editData, setEditData] = useState<{ name: string; color: string }>({
    name: attribute.name,
    color: attribute.color
  })

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: attribute.name,
        color: attribute.color
      })
    }
  }, [isEditing, attribute])

  const handleSave = () => {
    if (!editData.name.trim()) return
    onSave(editData)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex flex-wrap gap-2">
            {ATTRIBUTE_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setEditData({ ...editData, color })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  editData.color === color 
                    ? 'border-gray-800 scale-110' 
                    : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!editData.name.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              保存
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              <X size={14} />
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <AttributeTag attribute={attribute} size="md" />
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="编辑"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            创建于 {new Date(attribute.created_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default AttributesModal