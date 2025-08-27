-- 为 todos 表添加 start_date 字段（计划执行时间）
ALTER TABLE todos ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;

-- 添加注释说明字段用途
COMMENT ON COLUMN todos.start_date IS '计划执行时间，可空表示无特定开始时间';