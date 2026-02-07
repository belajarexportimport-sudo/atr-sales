-- GET FULL DEFINITION of handle_lost_inquiry trigger function

SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_lost_inquiry';
