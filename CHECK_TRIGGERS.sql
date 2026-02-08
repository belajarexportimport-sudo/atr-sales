-- Check for triggers that might block UPDATE

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
ORDER BY trigger_name;

-- This will show all triggers on inquiries table
-- Look for BEFORE UPDATE or AFTER UPDATE triggers
-- that might be blocking or reverting revenue changes
