-- FIX: Allow Admins to UPDATE any profile (including role and approved status)
-- Currently, they might only be able to update their own.

-- 1. Drop existing policy if it conflicts or is too narrow
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Re-create robust policies
-- Policy for Users: Can only update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy for Admins: Can update ANY profile
CREATE POLICY "Admins can update any profile" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. Ensure enable row level security is on
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions just in case
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
