-- FIX: Clean Orphaned & Rejected Users to allow Sign Up retry
-- This deletes users from auth.users if they don't have a profile OR are rejected.

-- 1. Delete Orphaned Auth Users (No Profile found)
-- This happens if we manually deleted the profile but not the auth user
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Delete Rejected Users (If any remain)
DELETE FROM auth.users
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'rejected');

SELECT 'Stuck users cleaned up! You can now Sign Up again.' as status;
