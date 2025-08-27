-- 为 todos 表添加到期时间字段
ALTER TABLE todos ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

-- 创建索引以提高查询性能
CREATE INDEX idx_todos_due_date ON todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_todos_due_date_completed ON todos(due_date, completed) WHERE due_date IS NOT NULL;