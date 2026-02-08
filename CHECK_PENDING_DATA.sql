
-- 1. Check for ANY quotes that look like pending (case insensitive)
SELECT id, customer_name, quote_status, user_id, created_at
FROM inquiries
WHERE quote_status ILIKE 'pending';

-- 2. Check the specific 'PT Agra Ali' inquiry
SELECT id, customer_name, quote_status, user_id
FROM inquiries
WHERE customer_name ILIKE '%Agra Ali%';

-- 3. Check Admin User Status
SELECT id, email, role 
FROM profiles 
WHERE email = 'aditatrexpress@gmail.com';

-- 4. Check if RLS is enabled on inquiries
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE oid = 'inquiries'::regclass;

-- 5. List all policies on inquiries
SELECT * FROM pg_policies WHERE tablename = 'inquiries';
