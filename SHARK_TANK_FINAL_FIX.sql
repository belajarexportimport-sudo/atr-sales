-- FINAL FIX FOR SHARK TANK (OPEN MARKET)
-- 1. Allow 'user_id' to be NULL (Critical constraint fix)
-- 2. Update RLS policies to allow Admins to manage these 'Unassigned' leads

-- STEP 1: MODIFY TABLE SCHEMA
-- This is likely why it failed before: the database forced every inquiry to have an owner.
ALTER TABLE inquiries ALTER COLUMN user_id DROP NOT NULL;

-- STEP 2: REFRESH RLS POLICIES (Standard SQL - Error Free)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- DROP ALL EXISTNG POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for users" ON inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can update everything" ON inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Enable read access for users" ON inquiries;
DROP POLICY IF EXISTS "Enable update for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Enable delete for users" ON inquiries;

-- INSERT POLICY
-- Users: Can insert if they own it.
-- Admins: Can insert ANY row (including user_id = NULL for Shark Tank).
CREATE POLICY "Enable insert for users and admins"
ON inquiries FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SELECT POLICY
-- Users: See their own + Unassigned (Shark Tank).
-- Admins: See everything.
CREATE POLICY "Enable read access for users"
ON inquiries FOR SELECT
USING (
  auth.uid() = user_id
  OR
  user_id IS NULL  -- Everyone can see Shark Tank
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- UPDATE POLICY
-- Users: Can update their own.
-- Admins: Can update ANY (including assigning Shark Tank leads).
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

-- DELETE POLICY
CREATE POLICY "Enable delete for users"
ON inquiries FOR DELETE
USING (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
