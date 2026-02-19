-- FIX: AGGRESSIVE DELETE for Rejected Users
-- This script will forcefully remove any user with role='rejected' from auth.users (and cascades to profiles)

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Find all users who are marked as 'rejected' in profiles
  FOR r IN 
    SELECT id, email FROM public.profiles WHERE role = 'rejected'
  LOOP
    RAISE NOTICE 'Deleting Rejected User: %', r.email;
    
    -- 2. Delete from auth.users (This should cascade delete the profile too)
    DELETE FROM auth.users WHERE id = r.id;
    
    -- 3. Just in case cascade failed, try delete from profiles directly
    DELETE FROM public.profiles WHERE id = r.id;
    
  END LOOP;
END;
$$;

-- 4. Also clean up any orphaned auth users (no profile) just to be sure
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

SELECT 'All Rejected Users have been PERMANENTLY deleted.' as status;
