-- DIAGNOSTIC: Check Dashboard Revenue Issue for "Won - Verification at WHS"
-- Run this in Supabase SQL Editor to verify data

-- 1. Check if any inquiries exist with the new status
SELECT 
    id,
    customer_name,
    status,
    est_revenue,
    est_gp,
    user_id,
    original_user_id,
    created_at
FROM inquiries
WHERE status = 'Won - Verification at WHS'
ORDER BY created_at DESC;

-- 2. Check if revenue values are populated (not NULL or 0)
SELECT 
    COUNT(*) as total_count,
    COUNT(CASE WHEN est_revenue IS NULL OR est_revenue = 0 THEN 1 END) as zero_revenue_count,
    SUM(COALESCE(est_revenue, 0)) as total_revenue
FROM inquiries
WHERE status = 'Won - Verification at WHS';

-- 3. Check original_user_id vs user_id mismatch
SELECT 
    id,
    customer_name,
    status,
    user_id,
    original_user_id,
    est_revenue,
    CASE 
        WHEN user_id = original_user_id THEN 'MATCH'
        ELSE 'MISMATCH'
    END as id_status
FROM inquiries
WHERE status = 'Won - Verification at WHS';

-- 4. Verify status exact match (case-sensitive check)
SELECT DISTINCT status
FROM inquiries
WHERE status LIKE '%Verification%' OR status LIKE '%WHS%';

-- 5. Get sample data for a specific user (replace with actual user ID)
-- SELECT 
--     id,
--     customer_name,
--     status,
--     est_revenue,
--     original_user_id
-- FROM inquiries
-- WHERE original_user_id = 'YOUR_USER_ID_HERE'
-- AND status IN ('Won', 'Won - Verification at WHS', 'Invoiced', 'Paid')
-- ORDER BY created_at DESC;
