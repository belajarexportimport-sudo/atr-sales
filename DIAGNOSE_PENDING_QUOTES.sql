-- DIAGNOSE PENDING QUOTES

-- 1. Check if there are ANY pending quotes
SELECT count(*) as pending_count FROM inquiries WHERE quote_status = 'Pending';

-- 2. Show details of pending quotes
SELECT 
    id, 
    customer_name, 
    quote_status, 
    user_id,
    created_at
FROM inquiries 
WHERE quote_status = 'Pending'
ORDER BY created_at DESC;

-- 3. Check if we can join with profiles
SELECT 
    i.id,
    i.customer_name,
    p.email,
    p.full_name
FROM inquiries i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.quote_status = 'Pending';

-- 4. Check RLS policies on inquiries
select * from pg_policies where tablename = 'inquiries';
