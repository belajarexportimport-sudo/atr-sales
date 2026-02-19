-- FIX: "Cannot reject" issue due to RLS recursion or role constraints

-- 1. Remove strict check constraint on 'role' if it exists (to allow 'rejected')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- Add it back with 'rejected' allowed, or just leave it open for now
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'sales', 'user', 'manager', 'rejected'));

-- 2. Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS to avoid infinite recursion when querying profiles inside a profile policy
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies to use the safe function
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

CREATE POLICY "Admins can update any profile" 
ON profiles FOR UPDATE 
USING ( is_admin() );

CREATE POLICY "Admins can delete any profile" 
ON profiles FOR DELETE 
USING ( is_admin() );

-- 4. Ensure Users can still update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO service_role;
