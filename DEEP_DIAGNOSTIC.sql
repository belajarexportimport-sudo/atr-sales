-- DEEP ANALYSIS: What's REALLY blocking PT Amuka revenue from showing?
-- Let's check EVERYTHING that could prevent revenue display

-- 1. Check PT Amuka data (raw)
SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    user_id,
    created_at,
    updated_at
FROM inquiries
WHERE customer_name ILIKE '%amuka%'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check if there's a TRIGGER blocking updates
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND trigger_name LIKE '%revenue%' OR trigger_name LIKE '%commission%';

-- 3. Check RLS policies that might BLOCK admin updates
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
AND cmd = 'UPDATE';

-- 4. Check if there's a CONSTRAINT preventing revenue = 0
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'inquiries'::regclass
AND conname LIKE '%revenue%';

-- 5. Check if admin user has proper role
SELECT 
    id,
    email,
    role,
    created_at
FROM profiles
WHERE email = 'aditatrexpress@gmail.com';

-- 6. Check if there's a VIEW or MATERIALIZED VIEW filtering revenue
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%inquir%';

-- HYPOTHESIS:
-- Maybe revenue IS being saved, but:
-- - A trigger is reverting it
-- - RLS is blocking the update
-- - A constraint is rejecting est_revenue = 0
-- - Frontend is filtering it out
-- - There's a caching issue
