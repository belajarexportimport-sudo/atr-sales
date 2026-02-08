-- FINAL TEST: Direct UPDATE without any frontend

-- Step 1: Get a real inquiry ID
SELECT id, customer_name, user_id, est_revenue 
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 3;

-- Step 2: Pick one ID and UPDATE it directly
-- Copy ID from Step 1, paste below
UPDATE inquiries
SET 
    est_revenue = 7777777,
    est_gp = 6666666,
    est_commission = 133333
WHERE id = (SELECT id FROM inquiries ORDER BY created_at DESC LIMIT 1)
RETURNING id, customer_name, user_id, est_revenue, est_gp, est_commission;

-- Step 3: Verify
SELECT id, customer_name, user_id, est_revenue, est_gp, est_commission
FROM inquiries
WHERE est_revenue = 7777777;

-- If Step 3 shows revenue = 7777777 AND user_id unchanged:
-- → Database works! Problem is 100% in frontend code
-- → AdminQuickEdit component not executing UPDATE correctly

-- If Step 3 shows NULL or user_id changed:
-- → Database has hidden constraint/policy blocking UPDATE
