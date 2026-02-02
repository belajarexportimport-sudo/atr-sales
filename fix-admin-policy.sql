-- FIX ADMIN VIEW ALL PROFILES
-- Currently, Admins can only see their own profile due to default RLS.
-- This script adds a policy allowing Admins to view ALL profiles.

-- 1. Create a Secure Function to check Admin status (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies on Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it conflicts/exists (names vary, so we just add a new specific one)
DROP POLICY IF EXISTS "Users can see own profile only" ON public.profiles; 
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create comprehensive viewing policy
CREATE POLICY "Admins can view all, Users view own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_admin() OR auth.uid() = id
);

-- 3. Grant access to everyone (RLS will filter)
GRANT SELECT ON public.profiles TO authenticated;

-- Confirmation
SELECT 'Policy Applied. Admins can now view all profiles.' as result;
