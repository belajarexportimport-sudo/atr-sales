-- TEST RPC MANUALLY
-- 1. Grab a recent inquiry ID
WITH latest_inquiry AS (
    SELECT id, est_revenue FROM inquiries ORDER BY created_at DESC LIMIT 1
)
-- 2. Call RPC to update it to a test value (e.g., 999999)
SELECT admin_update_financials(
    (SELECT id FROM latest_inquiry),
    999999, -- Revenue
    888888, -- GP
    777777  -- Commission
);

-- 3. Check if it stuck
SELECT id, est_revenue, est_gp, est_commission 
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 1;
