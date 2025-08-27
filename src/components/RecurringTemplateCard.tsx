import React from 'react'
import { Edit2, Trash2, Clock, Calendar, RotateCcw, Tag } from 'lucide-react'
import {
  RecurringTemplateWithAttributes,
  WEEKDAY_NAMES,
  FREQUENCY_NAMES
} from '../types'

interface RecurringTemplateCardProps {
  template: RecurringTemplateWithAttributes
  onEdit: (template: RecurringTemplateWithAttributes) => void
  onDelete: (templateId: string) => void
  onToggleEnabled: (templateId: string, enabled: boolean) => void
}

/**
 * 重复任务模板卡片组件
 */
const RecurringTemplateCard: React.FC<RecurringTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onToggleEnabled
}) => {
  /**
   * 格式化重复规则显示文本
   */
  const formatRecurrenceRule = () => {
    const { frequency, interval_value, weekdays } = template
    
    if (frequency === 'daily') {
      return interval_value === 1 
        ? '每天' 
        : `每 ${interval_value} 天`
    }
    
    if (frequency === 'weekly') {
      const weekdayNames = weekdays
        ?.map(day => WEEKDAY_NAMES[day])
        .join('、') || ''
      
      const intervalText = interval_value === 1 
        ? '每周' 
        : `每 ${interval_value} 周`
      
      return `${intervalText} ${weekdayNames}`
    }
    
    return FREQUENCY_NAMES[frequency] || frequency
  }

  /**
   * 格式化时间显示
   */
  const formatTime = (timeString: string | null) => {
    if (!timeString) return null
    
    try {
      const [hours, minutes] = timeString.split(':')
      return `${hours}:${minutes}`
    } catch {
      return timeString
    }
  }

  /**
   * 格式化日期显示
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    
    try {
      return new Date(dateString).toLocaleDateString('zh-CN')
    } catch {
      return dateString
    }
  }

  /**
   * 获取下次执行时间显示
   */
  const getNextExecutionText = () => {
    if (!template.enabled) {
      return '已禁用'
    }
    
    if (template.end_date && new Date(template.end_date) < new Date()) {
      return '已过期'
    }
    
    return '活跃中'
  }

  /**
   * 获取状态颜色
   */
  const getStatusColor = () => {
    if (!template.enabled) return 'text-gray-500'
    if (template.end_date && new Date(template.end_date) < new Date()) return 'text-red-500'
    return 'text-green-500'
  }

  return (
    <div className={`bg-white rounded-lg border p-6 transition-all hover:shadow-md ${
      template.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
    }`}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-lg font-semibold ${
              template.enabled ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {template.title}
            </h3>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getNextExecutionText()}
            </span>
          </div>
          
          {template.description && (
            <p className={`text-sm mb-3 ${
              template.enabled ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {template.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 启用/禁用切换 */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={template.enabled}
              onChange={(e) => onToggleEnabled(template.id, e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors ${
              template.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                template.enabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </label>
          
          {/* 编辑按钮 */}
          <button
            onClick={() => onEdit(template)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="编辑模板"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          {/* 删除按钮 */}
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除模板"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 重复规则 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4 text-gray-400" />
          <span className={template.enabled ? 'text-gray-700' : 'text-gray-400'}>
            {formatRecurrenceRule()}
          </span>
        </div>

        {/* 时间信息 */}
        <div className="flex items-center gap-4 text-sm">
          {template.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={template.enabled ? 'text-gray-700' : 'text-gray-400'}>
                {formatTime(template.start_time)}
              </span>
            </div>
          )}
          
          {template.end_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={template.enabled ? 'text-gray-700' : 'text-gray-400'}>
                截止 {formatDate(template.end_date)}
              </span>
            </div>
          )}
        </div>

        {/* 属性标签 */}
        {template.attributes && template.attributes.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {template.attributes.map((attr) => (
                <span
                  key={attr.id}
                  className={`px-2 py-1 text-xs rounded-full text-white ${
                    template.enabled ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{ backgroundColor: attr.color }}
                >
                  {attr.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 最后生成时间 */}
        {template.last_generated_date && (
          <div className="text-xs text-gray-500">
            最后生成: {formatDate(template.last_generated_date)}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecurringTemplateCard