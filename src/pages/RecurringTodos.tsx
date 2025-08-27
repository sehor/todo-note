import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, Clock, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import {
  RecurringTemplate,
  RecurringTemplateWithAttributes,
  CreateRecurringTemplateInput,
  UpdateRecurringTemplateInput,
  RecurringFrequency,
  WEEKDAY_NAMES,
  FREQUENCY_NAMES,
  TodoAttribute
} from '../types'
import RecurringTemplateForm from '../components/RecurringTemplateForm'

/**
 * 重复任务管理页面
 */
const RecurringTodos: React.FC = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<RecurringTemplateWithAttributes[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplateWithAttributes | null>(null)
  const [attributes, setAttributes] = useState<TodoAttribute[]>([])

  /**
   * 获取重复任务模板列表
   */
  const fetchTemplates = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('todo_recurring_templates')
        .select(`
          *,
          todo_recurring_attribute_assignments (
            todo_attributes (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 处理属性数据
      const templatesWithAttributes = data?.map(template => ({
        ...template,
        attributes: template.todo_recurring_attribute_assignments?.map(
          (assignment: any) => assignment.todo_attributes
        ) || []
      })) || []

      setTemplates(templatesWithAttributes)
    } catch (error) {
      console.error('获取重复任务模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 获取用户属性列表
   */
  const fetchAttributes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('todo_attributes')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setAttributes(data || [])
    } catch (error) {
      console.error('获取属性列表失败:', error)
    }
  }

  /**
   * 删除重复任务模板
   */
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除这个重复任务模板吗？这将不会影响已生成的待办事项。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('todo_recurring_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('删除重复任务模板失败:', error)
      alert('删除失败，请重试')
    }
  }

  /**
   * 切换模板启用状态
   */
  const toggleTemplate = async (templateId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('todo_recurring_templates')
        .update({ enabled })
        .eq('id', templateId)

      if (error) throw error

      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, enabled } : t
      ))
    } catch (error) {
      console.error('更新模板状态失败:', error)
      alert('更新失败，请重试')
    }
  }

  /**
   * 格式化重复规则显示
   */
  const formatRecurrenceRule = (template: RecurringTemplate) => {
    const frequencyName = FREQUENCY_NAMES[template.frequency as RecurringFrequency]
    
    if (template.frequency === 'daily') {
      return template.interval_value === 1 
        ? '每天' 
        : `每${template.interval_value}天`
    } else if (template.frequency === 'weekly' && template.weekdays) {
      const weekdayNames = template.weekdays
        .sort()
        .map(day => WEEKDAY_NAMES[day as keyof typeof WEEKDAY_NAMES])
        .join('、')
      
      const intervalText = template.interval_value === 1 
        ? '每周' 
        : `每${template.interval_value}周`
      
      return `${intervalText}的${weekdayNames}`
    }
    
    return frequencyName
  }

  /**
   * 处理表单提交成功
   */
  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTemplate(null)
    fetchTemplates()
  }

  useEffect(() => {
    if (user) {
      fetchTemplates()
      fetchAttributes()
    }
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">请先登录</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">重复任务管理</h1>
          <p className="text-gray-600 mt-1">创建和管理周期性重复的任务模板</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建模板
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有重复任务模板</h3>
          <p className="text-gray-500 mb-4">创建模板来自动生成周期性的待办事项</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建第一个模板
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg border p-6 transition-all ${
                template.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-medium ${
                      template.enabled ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {template.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {template.enabled ? '启用' : '禁用'}
                    </span>
                  </div>
                  
                  {template.description && (
                    <p className="text-gray-600 mb-3">{template.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <RotateCcw className="w-4 h-4" />
                      {formatRecurrenceRule(template)}
                    </div>
                    
                    {template.start_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {template.start_time}
                      </div>
                    )}
                    
                    {template.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        结束于 {new Date(template.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {template.attributes && template.attributes.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {template.attributes.map((attr) => (
                        <span
                          key={attr.id}
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: attr.color }}
                        >
                          {attr.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {template.last_generated_date && (
                    <p className="text-xs text-gray-400 mt-2">
                      上次生成: {new Date(template.last_generated_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={template.enabled}
                      onChange={(e) => toggleTemplate(template.id, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      template.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        template.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                  
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 表单弹窗 */}
      {(showForm || editingTemplate) && (
        <RecurringTemplateForm
          template={editingTemplate}
          attributes={attributes}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingTemplate(null)
          }}
        />
      )}
      </div>
    </div>
  )
}

export default RecurringTodos