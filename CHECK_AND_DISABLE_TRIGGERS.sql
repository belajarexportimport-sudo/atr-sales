-- NUCLEAR OPTION: Check and disable ALL triggers on inquiries table

-- Step 1: List ALL triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries';

-- Step 2: Get trigger function source code
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%inquiry%' OR p.proname LIKE '%user%';

-- Step 3: DISABLE ALL TRIGGERS (TEMPORARY - for testing)
-- Uncomment these lines to disable:

-- ALTER TABLE inquiries DISABLE TRIGGER ALL;

-- Step 4: Test UPDATE after disabling triggers
-- UPDATE inquiries
-- SET est_revenue = 888888
-- WHERE customer_name LIKE '%Test%'
-- RETURNING id, customer_name, user_id, est_revenue;

-- Step 5: Re-enable triggers after testing
-- ALTER TABLE inquiries ENABLE TRIGGER ALL;

-- ===== ALTERNATIVE: Drop specific problematic triggers =====

-- If you find a trigger that sets user_id, drop it:
-- DROP TRIGGER IF EXISTS trigger_name_here ON inquiries;
