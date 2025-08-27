import React, { useState, useEffect } from 'react'
import { Plus, Check } from 'lucide-react'
import { TodoAttribute } from '../types'
import { AttributeTag } from './AttributeTag'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AttributeSelectorProps {
  selectedAttributes: TodoAttribute[]
  onAttributesChange: (attributes: TodoAttribute[]) => void
  onManageAttributes?: () => void
  className?: string
  refreshTrigger?: number
}

/**
 * 属性选择组件 - 用于选择和管理todo的属性
 */
export const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  selectedAttributes,
  onAttributesChange,
  onManageAttributes,
  className = '',
  refreshTrigger
}) => {
  const { user } = useAuth()
  const [availableAttributes, setAvailableAttributes] = useState<TodoAttribute[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 获取用户的所有属性
  const fetchAttributes = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('todo_attributes')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      
      if (error) throw error
      setAvailableAttributes(data || [])
    } catch (error) {
      console.error('获取属性失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttributes()
  }, [user, refreshTrigger])

  // 切换属性选择状态
  const toggleAttribute = (attribute: TodoAttribute) => {
    const isSelected = selectedAttributes.some(attr => attr.id === attribute.id)
    
    if (isSelected) {
      // 移除属性
      onAttributesChange(selectedAttributes.filter(attr => attr.id !== attribute.id))
    } else {
      // 添加属性
      onAttributesChange([...selectedAttributes, attribute])
    }
  }

  // 移除属性
  const removeAttribute = (attributeId: string) => {
    onAttributesChange(selectedAttributes.filter(attr => attr.id !== attributeId))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 已选择的属性标签 */}
      {selectedAttributes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAttributes.map(attribute => (
            <AttributeTag
              key={attribute.id}
              attribute={attribute}
              removable
              onRemove={() => removeAttribute(attribute.id)}
              size="sm"
            />
          ))}
        </div>
      )}

      {/* 属性选择下拉框 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <Plus size={16} />
          添加属性
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">加载中...</div>
              ) : availableAttributes.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  暂无属性，请先创建属性
                </div>
              ) : (
                availableAttributes.map(attribute => {
                  const isSelected = selectedAttributes.some(attr => attr.id === attribute.id)
                  
                  return (
                    <button
                      key={attribute.id}
                      type="button"
                      onClick={() => {
                        toggleAttribute(attribute)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: attribute.color }}
                        />
                        <span>{attribute.name}</span>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-green-600" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
            
            {/* 管理属性链接 */}
            {onManageAttributes && (
              <div className="border-t border-gray-200 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false)
                    onManageAttributes()
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  管理属性
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 点击外部关闭下拉框 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}