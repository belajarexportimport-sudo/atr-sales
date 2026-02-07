-- EMERGENCY DIAGNOSTIC: Check EVERYTHING blocking revenue
-- Run this in Supabase SQL Editor to see current state

-- 1. Check current INSERT policies
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'inquiries'
AND cmd = 'INSERT';

-- 2. Check if admin user exists and has correct role
SELECT 
    id,
    email,
    role
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- 3. Check latest inquiry (should be your new RFQ)
SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    user_id,
    created_at
FROM inquiries
ORDER BY created_at DESC
LIMIT 3;

-- 4. Check if there's a TRIGGER overwriting revenue
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND (action_statement LIKE '%revenue%' OR action_statement LIKE '%commission%');

-- EXPECTED RESULTS:
-- 1. Should see "insert_inquiry_with_financials" policy
-- 2. Should see admin user with role = 'admin'
-- 3. Latest inquiry should have est_revenue > 0 (if you filled it)
-- 4. Should NOT have any trigger modifying revenue

-- If est_revenue is still 0/NULL, then:
-- - Frontend is not sending the data, OR
-- - There's a trigger resetting it, OR
-- - RLS policy still blocking it
