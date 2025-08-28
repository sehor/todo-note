-- 清理自动触发器逻辑，移除自动生成相关字段
-- 这个迁移将重复任务改为手动生成模式

-- 移除 last_generated_date 字段，因为不再需要跟踪自动生成
ALTER TABLE todo_recurring_templates DROP COLUMN IF EXISTS last_generated_date;

-- 移除相关索引
DROP INDEX IF EXISTS idx_recurring_templates_last_generated;

-- 移除防重复生成的唯一约束，因为手动生成时用户可以自己控制
DROP INDEX IF EXISTS idx_todos_template_start_date_unique;

-- 添加注释说明新的工作模式
COMMENT ON TABLE todo_recurring_templates IS '重复任务模板表 - 手动生成模式';
COMMENT ON COLUMN todo_recurring_templates.enabled IS '模板是否启用，启用的模板可以手动生成任务';