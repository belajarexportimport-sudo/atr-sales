-- ADD SETTINGS COLUMNS TO PROFILES
-- Adds bank details and preferences to the profiles table.

-- 1. Add Columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
ADD COLUMN IF NOT EXISTS bank_holder_name TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"notifications": true, "focus_mode": false}'::jsonb;

-- 2. Ensure RLS allows users to update their own profile (Safety Check)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
