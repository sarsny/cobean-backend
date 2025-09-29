-- Create Cobean database tables
-- Execute this in Supabase SQL Editor

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