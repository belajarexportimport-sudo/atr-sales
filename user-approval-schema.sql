-- User Approval System - Database Schema
-- Run this in Supabase SQL Editor

-- Step 1: Add approval fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Step 2: Approve existing users (so they don't get locked out)
UPDATE profiles 
SET approved = TRUE, 
    approved_at = NOW()
WHERE approved IS NULL OR approved = FALSE;

-- Step 3: Create function to get pending users
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.created_at
  FROM profiles p
  WHERE p.approved = FALSE
  ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to approve user
CREATE OR REPLACE FUNCTION approve_user(
  p_user_id UUID,
  p_initials TEXT,
  p_approved_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET approved = TRUE,
      approved_at = NOW(),
      approved_by = p_approved_by,
      initials = p_initials
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to reject user
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete user from auth.users and profiles
  DELETE FROM auth.users WHERE id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Verify setup
SELECT 'User Approval System setup complete!' as status;

-- Check pending users
SELECT * FROM get_pending_users();

-- NOTES:
-- 1. All existing users are auto-approved
-- 2. New sign-ups will have approved = FALSE by default
-- 3. Admin can approve/reject from Ops page
-- 4. Initials are set during approval
