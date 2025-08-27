import React, { useState, useEffect } from 'react'
import { X, Clock, Calendar, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  RecurringTemplateWithAttributes,
  CreateRecurringTemplateInput,
  UpdateRecurringTemplateInput,
  RecurringFrequency,
  TodoAttribute,
  WEEKDAY_NAMES
} from '../types'

interface RecurringTemplateFormProps {
  template?: RecurringTemplateWithAttributes | null
  attributes: TodoAttribute[]
  onSuccess: () => void
  onCancel: () => void
}

/**
 * 重复任务模板表单组件
 */
const RecurringTemplateForm: React.FC<RecurringTemplateFormProps> = ({
  template,
  attributes,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as RecurringFrequency,
    interval_value: 1,
    weekdays: [] as number[],
    start_time: '',
    end_date: '',
    enabled: true,
    selectedAttributes: [] as string[]
  })

  /**
   * 初始化表单数据
   */
  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        description: template.description || '',
        frequency: template.frequency as RecurringFrequency,
        interval_value: template.interval_value,
        weekdays: template.weekdays || [],
        start_time: template.start_time || '',
        end_date: template.end_date || '',
        enabled: template.enabled,
        selectedAttributes: template.attributes?.map(attr => attr.id) || []
      })
    }
  }, [template])

  /**
   * 处理周几选择
   */
  const handleWeekdayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort()
    }))
  }

  /**
   * 处理属性选择
   */
  const handleAttributeToggle = (attributeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAttributes: prev.selectedAttributes.includes(attributeId)
        ? prev.selectedAttributes.filter(id => id !== attributeId)
        : [...prev.selectedAttributes, attributeId]
    }))
  }

  /**
   * 表单验证
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('请输入任务标题')
      return false
    }

    if (formData.interval_value < 1) {
      alert('间隔值必须大于0')
      return false
    }

    if (formData.frequency === 'weekly' && formData.weekdays.length === 0) {
      alert('每周重复时请至少选择一天')
      return false
    }

    if (formData.end_date && new Date(formData.end_date) <= new Date()) {
      alert('结束日期必须在今天之后')
      return false
    }

    return true
  }

  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !validateForm()) return

    setLoading(true)

    try {
      const templateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        frequency: formData.frequency,
        interval_value: formData.interval_value,
        weekdays: formData.frequency === 'weekly' ? formData.weekdays : null,
        start_time: formData.start_time || null,
        end_date: formData.end_date || null,
        enabled: formData.enabled,
        user_id: user.id
      }

      let templateId: string

      if (template) {
        // 更新现有模板
        const { error } = await supabase
          .from('todo_recurring_templates')
          .update(templateData)
          .eq('id', template.id)

        if (error) throw error
        templateId = template.id
      } else {
        // 创建新模板
        const { data, error } = await supabase
          .from('todo_recurring_templates')
          .insert(templateData)
          .select('id')
          .single()

        if (error) throw error
        templateId = data.id
      }

      // 更新属性关联
      if (template) {
        // 删除现有属性关联
        await supabase
          .from('todo_recurring_attribute_assignments')
          .delete()
          .eq('template_id', templateId)
      }

      // 添加新的属性关联
      if (formData.selectedAttributes.length > 0) {
        const attributeAssignments = formData.selectedAttributes.map(attributeId => ({
          template_id: templateId,
          attribute_id: attributeId
        }))

        const { error: assignmentError } = await supabase
          .from('todo_recurring_attribute_assignments')
          .insert(attributeAssignments)

        if (assignmentError) throw assignmentError
      }

      onSuccess()
    } catch (error) {
      console.error('保存重复任务模板失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {template ? '编辑重复任务模板' : '创建重复任务模板'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：每日跑步"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="详细描述任务内容..."
              />
            </div>
          </div>

          {/* 重复规则 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              重复规则
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重复频率 *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="frequency"
                    value="daily"
                    checked={formData.frequency === 'daily'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      frequency: e.target.value as RecurringFrequency,
                      weekdays: []
                    }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">每天</div>
                    <div className="text-sm text-gray-500">每隔指定天数重复</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="frequency"
                    value="weekly"
                    checked={formData.frequency === 'weekly'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      frequency: e.target.value as RecurringFrequency
                    }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">每周</div>
                    <div className="text-sm text-gray-500">选择周几重复</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                间隔值 *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">每</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.interval_value}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    interval_value: parseInt(e.target.value) || 1
                  }))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">
                  {formData.frequency === 'daily' ? '天' : '周'}
                </span>
              </div>
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择周几 *
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(WEEKDAY_NAMES).map(([day, name]) => {
                    const dayNum = parseInt(day)
                    const isSelected = formData.weekdays.includes(dayNum)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleWeekdayToggle(dayNum)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 时间设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              时间设置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始时间
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">留空表示永不结束</p>
              </div>
            </div>
          </div>

          {/* 属性选择 */}
          {attributes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">属性标签</h3>
              <div className="flex flex-wrap gap-2">
                {attributes.map((attr) => {
                  const isSelected = formData.selectedAttributes.includes(attr.id)
                  return (
                    <button
                      key={attr.id}
                      type="button"
                      onClick={() => handleAttributeToggle(attr.id)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: isSelected ? attr.color : undefined
                      }}
                    >
                      {attr.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 启用状态 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              启用此模板
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '保存中...' : (template ? '更新' : '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecurringTemplateForm