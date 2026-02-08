-- DEEP DEBUG: Check what's happening with UPDATE

-- Step 1: Check if there's an AFTER UPDATE trigger that overwrites user_id
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND event_manipulation = 'UPDATE'
AND action_timing = 'AFTER';

-- Step 2: Check if RLS is actually disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'inquiries';

-- Step 3: Check current RLS policies (even if disabled, might still interfere)
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
WHERE tablename = 'inquiries';

-- Step 4: Get actual inquiry data to see what's happening
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    quote_status,
    created_at,
    updated_at
FROM inquiries
ORDER BY updated_at DESC
LIMIT 5;

-- This will show us if there's hidden interference
