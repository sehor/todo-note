/**
 * 时间工具函数测试
 */
import { describe, test, expect } from 'vitest'
import {
  dateToMs,
  msToDateString,
  getCurrentTimeMs,
  getMaxTimeMs,
  isMaxTime,
  isNoDeadline,
  calculateTimeDifference,
  calculateTimeRemaining,
  processDateInput
} from '../src/utils/timeUtils'

describe('时间工具函数测试', () => {
  test('dateToMs - 将日期字符串转换为毫秒数', () => {
    const dateStr = '2024-01-15'
    const result = dateToMs(dateStr)
    expect(typeof result).toBe('string')
    expect(Number(result)).toBeGreaterThan(0)
  })

  test('msToDateString - 将毫秒数转换为日期字符串', () => {
    const ms = '1705276800000' // 2024-01-15
    const result = msToDateString(ms)
    expect(result).toBe('2024-01-15')
  })

  test('getCurrentTimeMs - 获取当前时间毫秒数', () => {
    const result = getCurrentTimeMs()
    expect(typeof result).toBe('string')
    expect(Number(result)).toBeGreaterThan(0)
  })

  test('getMaxTimeMs - 获取最大时间值', () => {
    const result = getMaxTimeMs()
    expect(result).toBe('9223372036854775807')
  })

  test('isMaxTime - 检查是否为最大时间值', () => {
    expect(isMaxTime(getMaxTimeMs())).toBe(true)
    expect(isMaxTime('1705276800000')).toBe(false)
  })

  test('isNoDeadline - 检查是否为无截止时间', () => {
    expect(isNoDeadline(null)).toBe(true)
    expect(isNoDeadline(undefined)).toBe(true)
    expect(isNoDeadline('')).toBe(true)
    expect(isNoDeadline('1705276800000')).toBe(false)
  })

  test('msToDateString - 处理null值', () => {
    expect(msToDateString(null)).toBe('无截止时间')
    expect(msToDateString(undefined)).toBe('无截止时间')
    expect(msToDateString('')).toBe('无截止时间')
  })

  test('calculateTimeDifference - 计算时间差', () => {
    const now = Date.now().toString()
    const future = (Date.now() + 24 * 60 * 60 * 1000).toString() // 24小时后
    const result = calculateTimeDifference(now, future)
    expect(result).toContain('剩余')
    expect(result).toContain('天')
  })

  test('calculateTimeDifference - 处理null值（无截止时间）', () => {
    const now = Date.now().toString()
    const result = calculateTimeDifference(now, null)
    expect(result).toBe('无限期')
  })

  test('calculateTimeRemaining - 计算剩余时间', () => {
    const future = (Date.now() + 2 * 60 * 60 * 1000).toString() // 2小时后
    const result = calculateTimeRemaining(future)
    expect(result).toContain('剩余')
    expect(result).toContain('小时')
  })

  test('calculateTimeRemaining - 处理null值（无截止时间）', () => {
    const result = calculateTimeRemaining(null)
    expect(result).toBe('无限期')
  })

  test('processDateInput - 处理日期输入', () => {
    // 测试有效日期
    const validDate = '2024-01-15'
    const result1 = processDateInput(validDate, true)
    expect(typeof result1).toBe('string')
    expect(Number(result1)).toBeGreaterThan(0)

    // 测试空值 - 使用当前时间
    const result2 = processDateInput(null, true)
    expect(typeof result2).toBe('string')
    expect(Number(result2)).toBeGreaterThan(0)

    // 测试空值 - 返回null（无截止时间）
    const result3 = processDateInput(null, false)
    expect(result3).toBe(null)
  })

  test('时间精度测试 - 确保大数值不丢失精度', () => {
    const testDate = '2024-01-15'
    const dateMs = dateToMs(testDate)
    const backToDate = msToDateString(dateMs)
    
    // 往返转换应该保持日期一致
    expect(backToDate).toBe(testDate)
    
    // 确保转换的毫秒数是有效的
    expect(Number(dateMs)).toBeGreaterThan(0)
  })

  test('时间存储测试 - 验证毫秒数格式存储', () => {
    const testDates = [
      '2024-01-01',
      '2024-12-31',
      '2023-06-15',
      '2025-03-20'
    ]
    
    testDates.forEach(dateStr => {
      const ms = dateToMs(dateStr)
      expect(typeof ms).toBe('string')
      expect(ms).toMatch(/^\d+$/)
      expect(Number(ms)).toBeGreaterThan(0)
      expect(Number(ms)).toBeLessThan(Number(getMaxTimeMs()))
    })
  })

  test('时间提取测试 - 从毫秒数提取日期', () => {
    const testCases = [
      { ms: '1704067200000', expected: '2024-01-01' }, // 2024年1月1日
      { ms: '1735689600000', expected: '2025-01-01' }, // 2025年1月1日
      { ms: '1672531200000', expected: '2023-01-01' }  // 2023年1月1日
    ]
    
    testCases.forEach(({ ms, expected }) => {
      const result = msToDateString(ms)
      expect(result).toBe(expected)
    })
  })

  test('时间转换工具边界测试', () => {
    // 测试有效日期（避免时区问题）
    const validDate = '2000-01-01'
    const validMs = dateToMs(validDate)
    expect(Number(validMs)).toBeGreaterThan(0)
    
    // 测试null值处理
    expect(isNoDeadline(null)).toBe(true)
    expect(msToDateString(null)).toBe('无截止时间')
  })

  test('时间差计算详细测试', () => {
    const baseTime = Date.now()
    
    // 测试不同时间差
    const testCases = [
      { diff: 1000 * 60, expected: '分钟' },           // 1分钟
      { diff: 1000 * 60 * 60, expected: '小时' },      // 1小时
      { diff: 1000 * 60 * 60 * 24, expected: '天' },   // 1天
      { diff: 1000 * 60 * 60 * 24 * 7, expected: '天' } // 7天
    ]
    
    testCases.forEach(({ diff, expected }) => {
      const futureTime = (baseTime + diff).toString()
      const result = calculateTimeDifference(baseTime.toString(), futureTime)
      expect(result).toContain(expected)
      expect(result).toContain('剩余')
    })
  })

  test('过期时间计算测试', () => {
    const baseTime = Date.now()
    const pastTime = (baseTime - 1000 * 60 * 60).toString() // 1小时前
    
    const result = calculateTimeDifference(baseTime.toString(), pastTime)
    expect(result).toContain('已逾期')
  })

  test('时间格式化测试', () => {
    const now = Date.now()
    
    // 测试不同的剩余时间格式
    const testCases = [
      { future: now + 30 * 60 * 1000, expected: '分钟' },      // 30分钟
      { future: now + 2 * 60 * 60 * 1000, expected: '小时' },   // 2小时
      { future: now + 3 * 24 * 60 * 60 * 1000, expected: '天' } // 3天
    ]
    
    testCases.forEach(({ future, expected }) => {
      const result = calculateTimeRemaining(future.toString())
      expect(result).toContain(expected)
    })
  })

  test('processDateInput 综合测试', () => {
    // 测试各种输入情况
    const validDate = '2024-06-15'
    const emptyString = ''
    const nullValue = null
    const undefinedValue = undefined
    
    // 有效日期输入
    const result1 = processDateInput(validDate, true)
    expect(typeof result1).toBe('string')
    expect(Number(result1)).toBeGreaterThan(0)
    
    // 空字符串 - 使用当前时间
    const result2 = processDateInput(emptyString, true)
    expect(typeof result2).toBe('string')
    expect(Number(result2)).toBeGreaterThan(0)
    
    // null值 - 返回null（无截止时间）
    const result3 = processDateInput(nullValue, false)
    expect(result3).toBe(null)
    
    // undefined值 - 使用当前时间
    const result4 = processDateInput(undefinedValue, true)
    expect(typeof result4).toBe('string')
    expect(Number(result4)).toBeGreaterThan(0)
  })

  test('时间一致性测试 - 往返转换', () => {
    const originalDate = '2024-08-15'
    
    // 日期 -> 毫秒 -> 日期
    const ms = dateToMs(originalDate)
    const backToDate = msToDateString(ms)
    
    expect(backToDate).toBe(originalDate)
  })

  test('大数值处理测试', () => {
    const maxMs = getMaxTimeMs()
    
    // 确保最大值是字符串格式
    expect(typeof maxMs).toBe('string')
    
    // 确保最大值可以被正确识别
    expect(isMaxTime(maxMs)).toBe(true)
    
    // 确保最大值是预期的 bigint 最大值
    expect(maxMs).toBe('9223372036854775807')
    
    // 测试大数值比较（避免 JavaScript 精度问题）
    expect(BigInt(maxMs)).toBe(BigInt('9223372036854775807'))
  })
})