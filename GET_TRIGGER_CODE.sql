-- Check the content of update_inquiries_updated_at trigger

-- Step 1: Get the function that the trigger calls
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname ILIKE '%updated_at%'
OR p.proname ILIKE '%inquiry%';

-- Step 2: Also check for any function with 'user' in it
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname ILIKE '%user%'
AND n.nspname = 'public';

-- This will show the actual code of the trigger function
-- Look for lines that set user_id = auth.uid()
