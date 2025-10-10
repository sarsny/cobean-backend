# Supabase 数据库设置

## 问题诊断
当前API测试失败，错误信息：`Could not find the 'user_id' column of 'thoughts' in the schema cache`

这表明Supabase数据库中还没有创建表结构。

## 解决方案

### 方法1：通过Supabase控制台SQL编辑器创建表

1. 访问 Supabase 控制台：https://supabase.com/dashboard
2. 选择你的项目：vyfbbniyaafjjygnzusn
3. 进入 SQL Editor
4. 执行以下SQL语句：

```sql
-- Create users table (required for registration and ensureUser middleware)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own row" ON users;
CREATE POLICY "Users can insert their own row" ON users
FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'done', 'skipped', 'rejected')),
    owner TEXT NOT NULL CHECK (owner IN ('cobean', 'user')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_choices table
CREATE TABLE IF NOT EXISTS user_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    choice_type TEXT NOT NULL CHECK (choice_type IN ('accept', 'reject', 'modify', 'propose_new', 'discuss_only')),
    choice_content JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create action_history table
CREATE TABLE IF NOT EXISTS action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    final_status TEXT NOT NULL CHECK (final_status IN ('planned', 'done', 'skipped', 'rejected')),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preference_key TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, preference_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_thought_id ON actions(thought_id);
CREATE INDEX IF NOT EXISTS idx_user_choices_user_id ON user_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_choices_action_id ON user_choices(action_id);
CREATE INDEX IF NOT EXISTS idx_action_history_action_id ON action_history(action_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
```

### 方法2：使用Supabase CLI（如果已安装）

```bash
supabase db reset
```

## 验证表创建

执行SQL后，可以通过以下方式验证表是否创建成功：

1. 在SQL编辑器中运行：
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

2. 或者使用REST API：
```bash
curl -X GET "https://vyfbbniyaafjjygnzusn.supabase.co/rest/v1/thoughts" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZmJibml5YWFmamp5Z256dXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTY1MDIsImV4cCI6MjA3NDA5MjUwMn0._4Tgh5LTLB_cYCmimFOIIBxXG0kftpck7ldxSGeIXw4" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZmJibml5YWFmamp5Z256dXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTY1MDIsImV4cCI6MjA3NDA5MjUwMn0._4Tgh5LTLB_cYCmimFOIIBxXG0kftpck7ldxSGeIXw4"

# 验证 users 表的 RLS 与插入权限（需用户登录后）
curl -X POST "https://vyfbbniyaafjjygnzusn.supabase.co/rest/v1/users" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<AUTH_UID>",
    "email": "test@example.com",
    "username": "testuser"
  }'
```

## 测试API

表创建完成后，使用以下命令测试API：

```bash
# 生成JWT token
node -e "
const jwt = require('jsonwebtoken');
const payload = {
  id: '12345678-90ab-cdef-1234-567890abcdef',
  email: 'test@test.com'
};
const secret = 'your_super_secret_jwt_key_for_development_only';
const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log('Generated token:', token);
"

# 测试创建想法
curl -X POST "http://localhost:3000/api/v1/thoughts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_TOKEN_HERE]" \
  -d '{
    "title": "测试想法",
    "description": "这是一个测试Supabase连接的想法"
  }'
```