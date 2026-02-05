-- FIX RLS POLICIES FOR SHARK TANK (OPEN MARKET) - CORRECTED
-- This script ensures Admins can create and update inquiries with user_id = NULL (Unassigned)
-- Removed dependency on 'item_exists' function to prevent errors.

-- 1. Enable RLS (Just to be sure)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (Method safe for re-running)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for users" ON inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can update everything" ON inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Enable read access for users" ON inquiries;
DROP POLICY IF EXISTS "Enable update for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Enable delete for users" ON inquiries;

-- 3. CREATE NEW POLICIES (Standard SQL - No Custom Functions)

-- INSERT: 
-- Users can insert if they assign it to themselves.
-- Admins can insert ANY row (including user_id = NULL).
CREATE POLICY "Enable insert for users and admins"
ON inquiries FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SELECT:
-- Users see their own + Open Market (user_id IS NULL).
-- Admins see everything.
CREATE POLICY "Enable read access for users"
ON inquiries FOR SELECT
USING (
  auth.uid() = user_id
  OR
  user_id IS NULL
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- UPDATE:
-- Users can update their own data.
-- Admins can update ANY data.
CREATE POLICY "Enable update for users and admins"
ON inquiries FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- DELETE:
-- Users can delete their own.
-- Admins can delete any.
CREATE POLICY "Enable delete for users"
ON inquiries FOR DELETE
USING (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
