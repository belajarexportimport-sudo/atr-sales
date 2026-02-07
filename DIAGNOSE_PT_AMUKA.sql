-- DIAGNOSTIC: Check PT Amuka Data & Dashboard Query
-- Run this in Supabase SQL Editor

-- 1. Check if PT Amuka data exists
SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    status,
    user_id,
    created_at
FROM inquiries
WHERE customer_name ILIKE '%amuka%'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check what Dashboard query would return
-- (This simulates the frontend query)
SELECT 
    customer_name,
    est_revenue,
    est_gp,
    status
FROM inquiries
WHERE est_revenue IS NOT NULL 
AND est_revenue > 0
ORDER BY created_at DESC;

-- 3. If PT Amuka NOT in results above, check if est_revenue is NULL
SELECT 
    customer_name,
    est_revenue,
    CASE 
        WHEN est_revenue IS NULL THEN '❌ Revenue is NULL'
        WHEN est_revenue = 0 THEN '❌ Revenue is 0'
        WHEN est_revenue > 0 THEN '✅ Revenue exists'
    END as revenue_status
FROM inquiries
WHERE customer_name ILIKE '%amuka%';

-- 4. If revenue is NULL, we need to UPDATE it manually
-- UPDATE inquiries
-- SET est_revenue = 80000,
--     est_gp = 70000,
--     est_commission = 1400
-- WHERE customer_name ILIKE '%amuka%';
