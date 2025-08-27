import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Database {
  public: {
    Tables: {
      todo_recurring_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          frequency: string
          interval_value: number
          weekdays: number[] | null
          start_time: string | null
          end_date: string | null
          enabled: boolean
          last_generated_date: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
      }
      todos: {
        Row: {
          id: string
          title: string
          description: string | null
          completed: boolean
          start_date: string | null
          due_date: string | null
          recurring_template_id: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          completed?: boolean
          start_date?: string | null
          due_date?: string | null
          recurring_template_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
      }
      todo_recurring_attribute_assignments: {
        Row: {
          id: string
          template_id: string
          attribute_id: string
          created_at: string
        }
      }
      todo_attribute_assignments: {
        Insert: {
          id?: string
          todo_id: string
          attribute_id: string
          created_at?: string
        }
      }
    }
  }
}

/**
 * 计算下一个重复日期
 */
function getNextRecurringDate(lastDate: Date, frequency: string, intervalValue: number, weekdays?: number[]): Date {
  const nextDate = new Date(lastDate)
  
  if (frequency === 'daily') {
    nextDate.setDate(nextDate.getDate() + intervalValue)
  } else if (frequency === 'weekly' && weekdays && weekdays.length > 0) {
    // 找到下一个符合条件的周几
    let daysToAdd = 1
    let found = false
    
    while (!found && daysToAdd <= 7 * intervalValue) {
      const testDate = new Date(lastDate)
      testDate.setDate(testDate.getDate() + daysToAdd)
      const dayOfWeek = testDate.getDay()
      
      if (weekdays.includes(dayOfWeek)) {
        // 检查是否满足间隔周数要求
        const weeksDiff = Math.floor(daysToAdd / 7)
        if (weeksDiff === 0 || weeksDiff % intervalValue === 0) {
          nextDate.setTime(testDate.getTime())
          found = true
        }
      }
      daysToAdd++
    }
    
    if (!found) {
      // 如果在当前周期内没找到，跳到下一个周期的第一个匹配日
      const weeksToAdd = intervalValue
      nextDate.setDate(nextDate.getDate() + (weeksToAdd * 7))
      const targetDay = Math.min(...weekdays)
      const currentDay = nextDate.getDay()
      const daysToTarget = (targetDay - currentDay + 7) % 7
      nextDate.setDate(nextDate.getDate() + daysToTarget)
    }
  }
  
  return nextDate
}

/**
 * 生成重复任务实例
 */
async function generateRecurringTodos() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 获取所有启用的重复任务模板
  const { data: templates, error: templatesError } = await supabase
    .from('todo_recurring_templates')
    .select('*')
    .eq('enabled', true)
    .or(`end_date.is.null,end_date.gte.${today.toISOString().split('T')[0]}`)
  
  if (templatesError) {
    console.error('获取重复任务模板失败:', templatesError)
    return { error: templatesError }
  }
  
  const results = []
  
  for (const template of templates || []) {
    try {
      // 确定上次生成日期
      const lastGeneratedDate = template.last_generated_date 
        ? new Date(template.last_generated_date)
        : new Date(template.created_at)
      
      // 计算需要生成的日期
      const datesToGenerate: Date[] = []
      let currentDate = new Date(lastGeneratedDate)
      
      // 生成从上次生成日期到今天的所有应该生成的日期
      while (currentDate < today) {
        const nextDate = getNextRecurringDate(currentDate, template.frequency, template.interval_value, template.weekdays || undefined)
        
        if (nextDate <= today) {
          datesToGenerate.push(new Date(nextDate))
          currentDate = nextDate
        } else {
          break
        }
      }
      
      // 为每个日期生成待办事项
      for (const targetDate of datesToGenerate) {
        // 设置开始时间
        const startDateTime = new Date(targetDate)
        if (template.start_time) {
          const [hours, minutes] = template.start_time.split(':')
          startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        }
        
        // 设置截止时间为当天23:59:59
        const dueDateTime = new Date(targetDate)
        dueDateTime.setHours(23, 59, 59, 999)
        
        // 检查是否已存在相同日期的实例
        const { data: existingTodos } = await supabase
          .from('todos')
          .select('id')
          .eq('recurring_template_id', template.id)
          .gte('start_date', targetDate.toISOString().split('T')[0])
          .lt('start_date', new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        
        if (existingTodos && existingTodos.length > 0) {
          continue // 已存在，跳过
        }
        
        // 创建新的待办事项实例
        const { data: newTodo, error: todoError } = await supabase
          .from('todos')
          .insert({
            title: template.title,
            description: template.description,
            start_date: startDateTime.toISOString(),
            due_date: dueDateTime.toISOString(),
            recurring_template_id: template.id,
            user_id: template.user_id,
            completed: false
          })
          .select('id')
          .single()
        
        if (todoError) {
          console.error(`创建待办事项失败 (模板: ${template.id}):`, todoError)
          continue
        }
        
        // 复制模板的属性到新实例
        const { data: templateAttributes } = await supabase
          .from('todo_recurring_attribute_assignments')
          .select('attribute_id')
          .eq('template_id', template.id)
        
        if (templateAttributes && templateAttributes.length > 0) {
          const attributeAssignments = templateAttributes.map(attr => ({
            todo_id: newTodo.id,
            attribute_id: attr.attribute_id
          }))
          
          await supabase
            .from('todo_attribute_assignments')
            .insert(attributeAssignments)
        }
        
        results.push({
          templateId: template.id,
          todoId: newTodo.id,
          date: targetDate.toISOString().split('T')[0]
        })
      }
      
      // 更新模板的最后生成日期
      if (datesToGenerate.length > 0) {
        const lastDate = datesToGenerate[datesToGenerate.length - 1]
        await supabase
          .from('todo_recurring_templates')
          .update({ last_generated_date: lastDate.toISOString().split('T')[0] })
          .eq('id', template.id)
      }
      
    } catch (error) {
      console.error(`处理模板 ${template.id} 时出错:`, error)
    }
  }
  
  return { success: true, generated: results.length, details: results }
}

serve(async (req) => {
  // 处理CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }
  
  try {
    const result = await generateRecurringTodos()
    
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Edge Function 执行失败:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      },
    )
  }
})