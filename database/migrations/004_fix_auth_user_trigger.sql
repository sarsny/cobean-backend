-- Migration: Fix auth.users trigger to insert into public.users instead of public.profiles
-- Created: 2025-10-10

-- Ensure public.users exists with expected columns
CREATE TABLE IF NOT EXISTS public.users (
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

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Trigger function to insert a row into public.users when a new auth.users row is created
-- Drop existing trigger first (if present), then drop any existing function to avoid dependency errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- New auth user email can be NULL for phone-only accounts; handle gracefully
  v_email := NEW.email;

  -- Insert a corresponding row into public.users; ignore if it already exists
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, v_email, now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

-- Recreate trigger pointing to our function
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: keep updated_at fresh on updates
DROP FUNCTION IF EXISTS public.set_updated_at();
CREATE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS and basic policies if not already present
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Insert policy: allow users to insert their own row (id must equal auth.uid())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own row'
  ) THEN
    CREATE POLICY "Users can insert their own row" ON public.users
    FOR INSERT
    WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Select policy: allow users to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (id = auth.uid());
  END IF;
END $$;

-- Update policy: allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Notes:
-- This migration replaces any previous trigger that inserted into public.profiles.
-- It ensures new auth.users rows create a corresponding public.users row to satisfy app logic.