-- Verify RPC function exists with correct signature
SELECT 
    routine_name,
    routine_type,
    security_type,
    pg_get_function_arguments(p.oid) as parameters
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_name = 'admin_update_inquiry_financials'
AND routine_schema = 'public';

-- Expected parameters:
-- p_inquiry_id uuid, p_revenue numeric, p_gp numeric, p_commission numeric, p_awb text
