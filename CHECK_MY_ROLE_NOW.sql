-- Check current user's role and auth status

-- Step 1: Check auth.uid()
SELECT auth.uid() as my_user_id;

-- Step 2: Check my role in profiles table
SELECT 
    id,
    email,
    role,
    full_name
FROM profiles
WHERE id = auth.uid();

-- Step 3: Check if email matches
SELECT 
    id,
    email,
    role
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- Expected: role should be 'admin' for aditatrexpress@gmail.com
