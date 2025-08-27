-- 为 todos 表添加 description 字段
ALTER TABLE todos ADD COLUMN description TEXT;

-- 创建 todo_attributes 表
CREATE TABLE todo_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- 十六进制颜色代码
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 todo_attribute_assignments 表
CREATE TABLE todo_attribute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES todo_attributes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_todo_attributes_user_id ON todo_attributes(user_id);
CREATE UNIQUE INDEX idx_todo_attributes_user_name ON todo_attributes(user_id, name);
CREATE INDEX idx_todo_attr_assign_todo_id ON todo_attribute_assignments(todo_id);
CREATE INDEX idx_todo_attr_assign_attr_id ON todo_attribute_assignments(attribute_id);
CREATE UNIQUE INDEX idx_todo_attr_assign_unique ON todo_attribute_assignments(todo_id, attribute_id);

-- 设置权限
GRANT SELECT ON todo_attributes TO anon;
GRANT ALL PRIVILEGES ON todo_attributes TO authenticated;
GRANT SELECT ON todo_attribute_assignments TO anon;
GRANT ALL PRIVILEGES ON todo_attribute_assignments TO authenticated;

-- 启用 RLS
ALTER TABLE todo_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_attribute_assignments ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can only see their own attributes" ON todo_attributes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see assignments for their todos" ON todo_attribute_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_attribute_assignments.todo_id 
            AND todos.user_id = auth.uid()
        )
    );

-- 为 todo_attributes 表创建触发器
CREATE TRIGGER update_todo_attributes_updated_at
    BEFORE UPDATE ON todo_attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入一些默认属性
INSERT INTO todo_attributes (name, color, user_id) VALUES
('紧急', '#EF4444', auth.uid()),
('重要', '#F59E0B', auth.uid()),
('长远', '#10B981', auth.uid()),
('工作', '#3B82F6', auth.uid()),
('个人', '#8B5CF6', auth.uid())
ON CONFLICT DO NOTHING;