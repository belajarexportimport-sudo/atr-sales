-- Step 1: Check current profiles in database
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- Step 2: Update admin roles for specific emails
UPDATE profiles
SET role = 'admin'
WHERE email IN ('arfaibow@gmail.com', 'aditatrexpress@gmail.com');

-- Step 3: Verify the update
SELECT id, email, role 
FROM profiles 
WHERE email IN ('arfaibow@gmail.com', 'aditatrexpress@gmail.com');
