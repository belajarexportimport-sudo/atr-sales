-- EMERGENCY FIX: INFINITE RECURSION LOOP

-- 1. Drop the problematic policy immediately
DROP POLICY IF EXISTS "admin_view_all_profiles" ON profiles;

-- 2. Create a SAFETY FUNCTION (Security Definer) to break the loop
-- This function runs with "superuser" privileges checking the table, 
-- avoiding RLS recursion.
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN _role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the policy using the SAFE FUNCTION
CREATE POLICY "admin_view_all_profiles_safe"
ON profiles
FOR SELECT
TO authenticated
USING (
    -- User sees their own profile
    id = auth.uid() 
    OR 
    -- User is admin (checked safely via function)
    check_user_is_admin()
);

-- 4. Verify it works by selecting own profile
SELECT * FROM profiles WHERE id = auth.uid();
