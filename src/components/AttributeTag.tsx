import React from 'react'
import { X } from 'lucide-react'
import { TodoAttribute } from '../types'

interface AttributeTagProps {
  attribute: TodoAttribute
  removable?: boolean
  onRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 属性标签组件 - 用于显示todo的属性标签
 */
export const AttributeTag: React.FC<AttributeTagProps> = ({
  attribute,
  removable = false,
  onRemove,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: attribute.color }}
    >
      <span>{attribute.name}</span>
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
          aria-label={`移除 ${attribute.name} 标签`}
        >
          <X size={iconSizes[size]} />
        </button>
      )}
    </span>
  )
}