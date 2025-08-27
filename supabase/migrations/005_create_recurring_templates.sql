-- 创建重复任务模板表
CREATE TABLE todo_recurring_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    interval_value INTEGER NOT NULL DEFAULT 1 CHECK (interval_value > 0),
    weekdays INTEGER[] DEFAULT NULL, -- 仅当frequency='weekly'时使用，0-6表示周日-周六
    start_time TIME WITH TIME ZONE DEFAULT NULL, -- 计划开始时间
    end_date DATE DEFAULT NULL, -- 结束日期，NULL表示永不结束
    enabled BOOLEAN DEFAULT TRUE,
    last_generated_date DATE DEFAULT NULL, -- 上次生成实例的日期
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建重复任务模板属性分配表
CREATE TABLE todo_recurring_attribute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES todo_recurring_templates(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES todo_attributes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为todos表添加recurring_template_id字段
ALTER TABLE todos ADD COLUMN recurring_template_id UUID REFERENCES todo_recurring_templates(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX idx_recurring_templates_user_id ON todo_recurring_templates(user_id);
CREATE INDEX idx_recurring_templates_enabled ON todo_recurring_templates(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_recurring_templates_last_generated ON todo_recurring_templates(last_generated_date);
CREATE INDEX idx_recurring_attr_assign_template_id ON todo_recurring_attribute_assignments(template_id);
CREATE INDEX idx_recurring_attr_assign_attr_id ON todo_recurring_attribute_assignments(attribute_id);
CREATE UNIQUE INDEX idx_recurring_attr_assign_unique ON todo_recurring_attribute_assignments(template_id, attribute_id);
CREATE INDEX idx_todos_recurring_template_id ON todos(recurring_template_id) WHERE recurring_template_id IS NOT NULL;

-- 创建联合唯一约束，防止同一模板同一天重复生成
CREATE UNIQUE INDEX idx_todos_template_start_date_unique ON todos(recurring_template_id, start_date) 
WHERE recurring_template_id IS NOT NULL AND start_date IS NOT NULL;

-- 设置权限
GRANT SELECT ON todo_recurring_templates TO anon;
GRANT ALL PRIVILEGES ON todo_recurring_templates TO authenticated;
GRANT SELECT ON todo_recurring_attribute_assignments TO anon;
GRANT ALL PRIVILEGES ON todo_recurring_attribute_assignments TO authenticated;

-- 启用RLS
ALTER TABLE todo_recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_recurring_attribute_assignments ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can only see their own recurring templates" ON todo_recurring_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see assignments for their templates" ON todo_recurring_attribute_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM todo_recurring_templates 
            WHERE todo_recurring_templates.id = todo_recurring_attribute_assignments.template_id 
            AND todo_recurring_templates.user_id = auth.uid()
        )
    );

-- 为重复任务模板表创建触发器
CREATE TRIGGER update_recurring_templates_updated_at
    BEFORE UPDATE ON todo_recurring_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE todo_recurring_templates IS '重复任务模板表';
COMMENT ON COLUMN todo_recurring_templates.frequency IS '重复频率：daily(每天) 或 weekly(每周)';
COMMENT ON COLUMN todo_recurring_templates.interval_value IS '间隔值：每N天或每N周';
COMMENT ON COLUMN todo_recurring_templates.weekdays IS '每周重复的天数，仅当frequency=weekly时使用，0=周日，1=周一...6=周六';
COMMENT ON COLUMN todo_recurring_templates.start_time IS '每天的计划开始时间';
COMMENT ON COLUMN todo_recurring_templates.end_date IS '重复结束日期，NULL表示永不结束';
COMMENT ON COLUMN todo_recurring_templates.last_generated_date IS '上次生成实例的日期，用于避免重复生成';
COMMENT ON COLUMN todos.recurring_template_id IS '关联的重复任务模板ID，NULL表示非重复任务';