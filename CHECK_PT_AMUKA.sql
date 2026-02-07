-- QUICK CHECK: Verify PT Amuka inquiry data
-- Run this in Supabase SQL Editor to see what's saved

-- 1. Check if inquiry exists
SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    created_at
FROM inquiries
WHERE customer_name ILIKE '%amuka%'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check if new RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'admin_update%'
AND routine_schema = 'public';

-- Expected results:
-- - admin_update_revenue
-- - admin_update_awb
-- - admin_update_inquiry_financials

-- 3. If functions don't exist, you need to run SIMPLIFY_REVENUE_AWB.sql first!
