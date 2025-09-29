-- Add new fields to thoughts table
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thoughts_is_public ON thoughts(is_public);
CREATE INDEX IF NOT EXISTS idx_thoughts_is_collaborative ON thoughts(is_collaborative);
CREATE INDEX IF NOT EXISTS idx_thoughts_tags ON thoughts USING GIN(tags);

-- Add comments for documentation
COMMENT ON COLUMN thoughts.is_public IS 'Whether the thought is publicly visible';
COMMENT ON COLUMN thoughts.is_collaborative IS 'Whether the thought supports collaborative features';
COMMENT ON COLUMN thoughts.tags IS 'Array of tags associated with the thought';