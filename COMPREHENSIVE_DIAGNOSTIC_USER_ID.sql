-- COMPREHENSIVE DIAGNOSTIC: Find WHY user_id keeps changing

-- 1. CHECK FOR TRIGGERS that might overwrite user_id
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
ORDER BY trigger_name;

-- Expected: Should NOT see any trigger that sets user_id to auth.uid()

-- 2. CHECK RECENT INQUIRY with details
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    quote_status,
    status,
    created_at,
    updated_at
FROM inquiries
ORDER BY updated_at DESC
LIMIT 3;

-- 3. MANUAL TEST: Try UPDATE and see if user_id changes
-- First, get a recent inquiry ID
SELECT id, customer_name, user_id 
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 1;

-- Then copy the ID and user_id, and run this:
-- UPDATE inquiries
-- SET est_revenue = 999999,
--     user_id = 'PASTE_ORIGINAL_USER_ID_HERE'
-- WHERE id = 'PASTE_ID_HERE'
-- RETURNING id, customer_name, user_id, est_revenue;

-- If user_id STILL changes after explicit SET → Database trigger issue
-- If user_id stays same → Frontend code issue

-- 4. CHECK RLS POLICIES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inquiries'
ORDER BY policyname;

-- 5. CHECK if RLS is even enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'inquiries';
