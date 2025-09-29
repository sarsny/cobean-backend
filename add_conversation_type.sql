-- Add conversation_type field to conversations table
-- Execute this in Supabase SQL Editor

-- Add conversation_type column if it doesn't exist
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'thought' 
CHECK (conversation_type IN ('thought', 'execution'));

-- Update existing records to have 'thought' as default
UPDATE conversations 
SET conversation_type = 'thought' 
WHERE conversation_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

-- Add comment for documentation
COMMENT ON COLUMN conversations.conversation_type IS 'Type of conversation: thought (for discussing thoughts) or execution (for discussing action execution)';