-- Migration: Create users table and RLS policies
-- Created: 2025-10-10

-- Create users table to store profile info aligned with codebase types
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- should match auth.uid()
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

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trigger to keep updated_at fresh on updates
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own row (id must equal auth.uid())
DROP POLICY IF EXISTS "Users can insert their own row" ON users;
CREATE POLICY "Users can insert their own row" ON users
FOR INSERT
WITH CHECK (id = auth.uid());

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
FOR SELECT
USING (id = auth.uid());

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Notes:
-- If you have an auth.users trigger that inserts into a different table (e.g. profiles),
-- ensure it targets this 'users' table or remove/disable the conflicting trigger.
-- This table schema matches the app's expected fields in src/types/index.ts and middleware/ensureUser.ts.