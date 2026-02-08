-- DIRECT UPDATE TEST - Manual SQL
-- This will bypass ALL frontend code and test UPDATE directly

-- Step 1: Get inquiry ID that you want to update
SELECT id, customer_name, est_revenue, est_gp 
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Copy an ID from above, then run this UPDATE
-- Replace 'PASTE-ID-HERE' with actual inquiry ID
UPDATE inquiries
SET 
    est_revenue = 9999999,
    est_gp = 8888888,
    est_commission = 177777,
    updated_at = NOW()
WHERE id = 'PASTE-ID-HERE'::uuid
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Step 3: Verify the update worked
SELECT id, customer_name, est_revenue, est_gp, est_commission, updated_at
FROM inquiries
WHERE id = 'PASTE-ID-HERE'::uuid;

-- Expected: est_revenue = 9999999, est_gp = 8888888

-- If this works → Frontend issue
-- If this fails → Database trigger/constraint blocking UPDATE
