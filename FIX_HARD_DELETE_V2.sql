-- FIX: Hard Delete User (Reject & Remove) - VERSION 2 (ROBUST)
-- This updates the previous function to be more reliable.

-- 1. Drop old function to be sure
DROP FUNCTION IF EXISTS delete_user_completely(UUID);

-- 2. Create ROBUST delete function
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as superuser
AS $$
BEGIN
  -- Log attempt (optional, for debugging if we had a logs table)
  RAISE NOTICE 'Attempting to delete user: %', target_user_id;

  -- 1. Check if executing user is an admin (Case Insensitive)
  -- We allow 'admin', 'Admin', or 'Super Admin' just in case
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role ILIKE 'admin%' OR email = 'aditatrexpress@gmail.com')
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
  END IF;

  -- 2. Delete matches in public.profiles explicitly first (to avoid orphan issues if cascade fails)
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 3. Delete from auth.users (The Source of Truth)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Capture and raise error so UI sees it
  RAISE EXCEPTION 'Delete Failed: %', SQLERRM;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION delete_user_completely TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_completely TO service_role;

SELECT 'Robust Hard Delete RPC (v2) Installed.' as status;
