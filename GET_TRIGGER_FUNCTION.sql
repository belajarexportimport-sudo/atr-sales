-- CHECK TRIGGER FUNCTION CONTENT

-- Get the actual function code for update_inquiries_updated_at
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_updated_at_column'
   OR p.proname LIKE '%update%inquir%'
   OR p.proname LIKE '%updated_at%';

-- This will show us if the trigger function modifies user_id
