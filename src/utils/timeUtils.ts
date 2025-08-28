/**
 * 时间转换工具函数
 */

/**
 * 将日期字符串转换为毫秒数
 * @param dateStr - 日期字符串 (YYYY-MM-DD 格式)
 * @returns 毫秒数字符串
 */
export const dateToMs = (dateStr: string): string => {
  if (!dateStr) return getCurrentTimeMs()
  const date = new Date(dateStr.replace(/-/g, '/'))
  return date.getTime().toString()
}

/**
 * 将毫秒数转换为日期字符串
 * @param ms - 毫秒数 (字符串或数字)，null表示无截止时间
 * @returns YYYY-MM-DD 格式的日期字符串
 */
export const msToDateString = (ms: string | number | null): string => {
  // 如果为null或空，表示无截止时间
  if (ms === null || ms === undefined || ms === '') {
    return '无截止时间'
  }
  
  // 对于普通时间值，进行转换
  const date = new Date(Number(ms))
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期'
  }
  
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取当前时间的毫秒数
 * @returns 当前时间的毫秒数字符串
 */
export const getCurrentTimeMs = (): string => {
  return new Date().getTime().toString()
}

/**
 * 获取最大时间值（表示无截止时间）
 * @returns 最大 bigint 值的字符串
 */
export const getMaxTimeMs = (): string => {
  return '9223372036854775807'
}

/**
 * 检查是否为无截止时间（null值）
 * @param ms - 毫秒数字符串或null
 * @returns 是否为无截止时间
 */
export const isNoDeadline = (ms: string | null): boolean => {
  return ms === null || ms === undefined || ms === ''
}

/**
 * 检查是否为最大时间值（无截止时间）- 保持向后兼容
 * @param ms - 毫秒数字符串
 * @returns 是否为最大时间值
 * @deprecated 使用 isNoDeadline 替代
 */
export const isMaxTime = (ms: string): boolean => {
  return ms === getMaxTimeMs()
}

/**
 * 计算时间差并转换为可读格式
 * @param startMs - 开始时间毫秒数
 * @param endMs - 结束时间毫秒数，null表示无截止时间
 * @returns 时间差的可读字符串
 */
export const calculateTimeDifference = (startMs: string, endMs: string | null): string => {
  // 如果结束时间为null，表示无截止时间
  if (endMs === null || endMs === undefined || endMs === '') {
    return '无限期'
  }

  const start = Number(startMs)
  const end = Number(endMs)
  const diffMs = end - start

  if (diffMs < 0) {
    // 已逾期
    const overdueDiffMs = Math.abs(diffMs)
    return formatTimeDuration(overdueDiffMs, true)
  } else {
    // 剩余时间
    return formatTimeDuration(diffMs, false)
  }
}

/**
 * 计算距离截止时间的剩余时间
 * @param dueMs - 截止时间毫秒数，null表示无截止时间
 * @returns 剩余时间的可读字符串
 */
export const calculateTimeRemaining = (dueMs: string | null): string => {
  // 如果截止时间为null，表示无截止时间
  if (dueMs === null || dueMs === undefined || dueMs === '') {
    return '无限期'
  }
  
  const currentMs = getCurrentTimeMs()
  return calculateTimeDifference(currentMs, dueMs)
}

/**
 * 格式化时间持续时间
 * @param durationMs - 持续时间毫秒数
 * @param isOverdue - 是否为逾期时间
 * @returns 格式化的时间字符串
 */
const formatTimeDuration = (durationMs: number, isOverdue: boolean): string => {
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

  const prefix = isOverdue ? '已逾期' : '剩余'

  if (days > 0) {
    return `${prefix} ${days} 天 ${hours} 小时`
  } else if (hours > 0) {
    return `${prefix} ${hours} 小时 ${minutes} 分钟`
  } else {
    return `${prefix} ${minutes} 分钟`
  }
}

/**
 * 处理输入的日期值，如果为空则返回默认值
 * @param dateInput - 输入的日期字符串
 * @param useCurrentTime - 是否使用当前时间作为默认值，false时返回null表示无截止时间
 * @returns 处理后的毫秒数字符串或null
 */
export const processDateInput = (dateInput: string | null, useCurrentTime: boolean = true): string | null => {
  if (!dateInput) {
    return useCurrentTime ? getCurrentTimeMs() : null
  }
  return dateToMs(dateInput)
}