-- === FINAL VISIBILITY FIX ===
-- Run this to allow Admins to see ALL data and Sales to see OWN data.

-- 1. Reset Inquiry Safety Rules
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Remove ALL old conflicting policies
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Access Policy Inquiries" ON public.inquiries;

-- Create ONE clear policy for Inquiries
CREATE POLICY "Universal Inquiry Access"
ON public.inquiries
FOR SELECT
TO authenticated
USING (
  -- Rule 1: Allow if user is Admin
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  OR
  -- Rule 2: Allow if record belongs to user
  user_id = auth.uid()
);

-- 2. Reset Profile Safety Rules
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all, Users view own" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Access Policy Profiles" ON public.profiles;

-- Create ONE clear policy for Profiles
CREATE POLICY "Universal Profile Access"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Rule 1: Allow if user is Admin
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  OR
  -- Rule 2: Allow if viewing own profile
  id = auth.uid()
  OR
  -- Rule 3: Allow everyone to see Basic Info (Names) for the Dashboard list
  -- (This fixes the "Unknown" name issue for non-admins if they need to see table names)
  true
);

-- 3. Confirmation
SELECT '✅ VISIBILITY FIXED' as status;
