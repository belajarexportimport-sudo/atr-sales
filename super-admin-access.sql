-- Super Admin Access for ATR Sales CRM
-- This script grants super admin privileges to specific users

-- Step 1: Add super_admin column to profiles table (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS super_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Set super admin for specific emails
UPDATE profiles 
SET super_admin = TRUE, role = 'admin'
WHERE email IN ('aditatrexpress@gmail.com', 'arfaibow@gmail.com');

-- Step 3: Verify super admin users
SELECT id, email, role, super_admin 
FROM profiles 
WHERE super_admin = TRUE;

-- Step 4: Update RLS policies for leads table
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own leads" ON leads;

-- Create new policy: super admins see all, regular users see own
CREATE POLICY "Users can view leads based on role" ON leads
FOR SELECT
USING (
  auth.uid() = sales_rep_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.super_admin = TRUE
  )
);

-- Step 5: Update RLS policies for inquiries table
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;

-- Create new policy: super admins see all, regular users see own
CREATE POLICY "Users can view inquiries based on role" ON inquiries
FOR SELECT
USING (
  auth.uid() = sales_rep_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.super_admin = TRUE
  )
);

-- Step 6: Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('leads', 'inquiries')
ORDER BY tablename, policyname;

-- NOTES:
-- 1. Run this script in Supabase SQL Editor
-- 2. Super admins can now see ALL leads and inquiries
-- 3. Regular users still only see their own data
-- 4. Frontend will automatically respect these policies
