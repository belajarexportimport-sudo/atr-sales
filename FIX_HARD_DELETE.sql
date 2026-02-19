-- FIX: Hard Delete User (Reject & Remove)
-- This allows the user to Sign Up again with the same email.

-- 1. Create a SECURITY DEFINER function to delete from auth.users
-- Only Admins should be able to call this.
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as superuser to access auth schema
AS $$
BEGIN
  -- Check if executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
  END IF;

  -- Delete from auth.users (Cascades to profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user_completely TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_completely TO service_role;

-- 3. Cleanup "Rejected" users from auth.users (Fix current stuck state)
-- Caution: This deletes anyone marked as 'rejected' in profiles
DELETE FROM auth.users 
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'rejected');

SELECT 'Hard Delete RPC Installed & Stuck Users Cleared' as status;
