-- FINAL DIAGNOSTIC FOR PENDING QUOTES

-- 1. Check if ANY rows exist with 'Pending' status (bypassing RLS with count)
-- If this returns 0, then no data exists regardless of user
SELECT count(*) as total_pending_raw FROM inquiries WHERE quote_status = 'Pending';

-- 2. Check my current role and ID
SELECT 
    auth.uid() as my_id,
    (SELECT role FROM profiles WHERE id = auth.uid()) as my_role,
    (SELECT email FROM profiles WHERE id = auth.uid()) as my_email;


-- 3. Check RLS Policies on inquiries table
SELECT 
    polname, 
    polcmd, 
    polroles, 
    polqual, 
    polwithcheck 
FROM pg_policy 
WHERE polrelid = 'inquiries'::regclass;


-- 4. Try to select pending quotes with explicit join (simulating the frontend query)
SELECT 
    i.id,
    i.customer_name,
    i.quote_status,
    i.user_id,
    p.email as sales_email,
    p.full_name as sales_name
FROM inquiries i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.quote_status = 'Pending';

-- 5. Force update 'arfibow@gmail.com' (or whatever email is logged in) to admin
-- Replace with the email you are currently using to test!
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'arfibow@gmail.com'; 

-- 6. Verify profile update
SELECT email, role FROM profiles WHERE email = 'arfibow@gmail.com';
