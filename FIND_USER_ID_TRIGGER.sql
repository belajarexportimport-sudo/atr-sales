-- Find the trigger that's changing user_id!

-- Step 1: Check all triggers on inquiries table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
ORDER BY trigger_name;

-- Step 2: Look for triggers with 'user' or 'auth' in the code
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND (
    action_statement ILIKE '%user_id%' OR
    action_statement ILIKE '%auth.uid%'
);

-- Step 3: Check if there's a BEFORE UPDATE trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND event_manipulation = 'UPDATE'
AND action_timing = 'BEFORE';

-- Expected: Find trigger that sets user_id = auth.uid() on UPDATE
-- This is the bug - it overwrites original sales user_id with admin's uid!
