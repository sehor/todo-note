import React, { useState, useEffect } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { TodoAttribute, AttributeFilter as AttributeFilterType } from '../types'
import { AttributeTag } from './AttributeTag'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AttributeFilterProps {
  filter: AttributeFilterType
  onFilterChange: (filter: AttributeFilterType) => void
  className?: string
}

/**
 * 属性筛选组件 - 用于根据属性筛选todo列表
 */
export const AttributeFilter: React.FC<AttributeFilterProps> = ({
  filter,
  onFilterChange,
  className = ''
}) => {
  const { user } = useAuth()
  const [availableAttributes, setAvailableAttributes] = useState<TodoAttribute[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<TodoAttribute[]>([])
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

  // 根据filter.attributeIds更新selectedAttributes
  useEffect(() => {
    if (availableAttributes.length > 0) {
      const selected = availableAttributes.filter(attr => 
        filter.attributeIds.includes(attr.id)
      )
      setSelectedAttributes(selected)
    }
  }, [filter.attributeIds, availableAttributes])

  useEffect(() => {
    fetchAttributes()
  }, [user])

  // 切换属性选择
  const toggleAttribute = (attribute: TodoAttribute) => {
    const isSelected = filter.attributeIds.includes(attribute.id)
    let newAttributeIds: string[]
    
    if (isSelected) {
      newAttributeIds = filter.attributeIds.filter(id => id !== attribute.id)
    } else {
      newAttributeIds = [...filter.attributeIds, attribute.id]
    }
    
    onFilterChange({
      ...filter,
      attributeIds: newAttributeIds
    })
  }

  // 移除属性
  const removeAttribute = (attributeId: string) => {
    onFilterChange({
      ...filter,
      attributeIds: filter.attributeIds.filter(id => id !== attributeId)
    })
  }

  // 清空筛选
  const clearFilter = () => {
    onFilterChange({
      attributeIds: [],
      operator: 'AND'
    })
  }

  // 切换操作符
  const toggleOperator = () => {
    onFilterChange({
      ...filter,
      operator: filter.operator === 'AND' ? 'OR' : 'AND'
    })
  }

  const hasActiveFilter = filter.attributeIds.length > 0

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 筛选控制栏 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
              hasActiveFilter 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            <span>按属性筛选</span>
            <ChevronDown size={16} className={`transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {/* 属性选择下拉框 */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">选择属性</span>
                  {hasActiveFilter && (
                    <button
                      onClick={clearFilter}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      清空
                    </button>
                  )}
                </div>
                
                {/* 操作符选择 */}
                {filter.attributeIds.length > 1 && (
                  <div className="mb-2">
                    <button
                      onClick={toggleOperator}
                      className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
                    >
                      {filter.operator === 'AND' ? '包含所有' : '包含任一'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">加载中...</div>
                ) : availableAttributes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    暂无属性
                  </div>
                ) : (
                  availableAttributes.map(attribute => {
                    const isSelected = filter.attributeIds.includes(attribute.id)
                    
                    return (
                      <button
                        key={attribute.id}
                        onClick={() => toggleAttribute(attribute)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // 由onClick处理
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: attribute.color }}
                        />
                        <span className="flex-1 text-left">{attribute.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 清空筛选按钮 */}
        {hasActiveFilter && (
          <button
            onClick={clearFilter}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
          >
            <X size={14} />
            清空筛选
          </button>
        )}
      </div>

      {/* 已选择的筛选属性 */}
      {selectedAttributes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>筛选条件:</span>
            {selectedAttributes.length > 1 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                {filter.operator === 'AND' ? '包含所有' : '包含任一'}
              </span>
            )}
          </div>
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
        </div>
      )}

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