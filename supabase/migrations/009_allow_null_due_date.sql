-- supabase/migrations/009_allow_null_due_date.sql

-- 允许 due_date 字段为 null，撤销之前的 NOT NULL 约束
-- 这样可以更自然地表示"无截止时间"的待办事项

-- 移除 due_date 的默认值
ALTER TABLE public.todos 
ALTER COLUMN due_date DROP DEFAULT;

-- 将使用最大值表示无截止时间的记录改为 null
UPDATE public.todos 
SET due_date = NULL
WHERE due_date = 9223372036854775807;

-- 允许 due_date 字段为 null
ALTER TABLE public.todos 
ALTER COLUMN due_date DROP NOT NULL;

-- 更新注释
COMMENT ON COLUMN public.todos.due_date IS 'Due date of the todo, stored as milliseconds since Unix epoch. NULL means no deadline.';