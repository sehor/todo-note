-- supabase/migrations/008_make_dates_not_null.sql

-- 将 start_date 和 due_date 字段改为 bigint NOT NULL
-- 如果 start_date 为 null，使用当前时间
-- 如果 due_date 为 null，使用最大数值

-- 首先更新现有的 null 值
-- 对于 start_date 为 null 的记录，设置为当前时间的毫秒数
UPDATE public.todos 
SET start_date = EXTRACT(EPOCH FROM NOW()) * 1000
WHERE start_date IS NULL;

-- 对于 due_date 为 null 的记录，设置为最大 bigint 值
UPDATE public.todos 
SET due_date = 9223372036854775807  -- 最大 bigint 值
WHERE due_date IS NULL;

-- 将 start_date 字段改为 NOT NULL
ALTER TABLE public.todos 
ALTER COLUMN start_date SET NOT NULL;

-- 将 due_date 字段改为 NOT NULL  
ALTER TABLE public.todos 
ALTER COLUMN due_date SET NOT NULL;

-- 设置默认值
-- start_date 默认为当前时间的毫秒数
ALTER TABLE public.todos 
ALTER COLUMN start_date SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000);

-- due_date 默认为最大 bigint 值
ALTER TABLE public.todos 
ALTER COLUMN due_date SET DEFAULT 9223372036854775807;

-- 更新注释
COMMENT ON COLUMN public.todos.start_date IS 'Start date of the todo, stored as milliseconds since Unix epoch. NOT NULL, defaults to current time.';
COMMENT ON COLUMN public.todos.due_date IS 'Due date of the todo, stored as milliseconds since Unix epoch. NOT NULL, defaults to max bigint value (no deadline).';