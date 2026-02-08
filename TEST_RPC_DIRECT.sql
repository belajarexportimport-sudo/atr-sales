-- Direct RPC Test: Update revenue via RPC function
-- This will confirm if RPC function works correctly

-- Step 1: Get latest inquiry ID
SELECT id, customer_name, est_revenue 
FROM inquiries 
ORDER BY created_at DESC 
LIMIT 1;

-- Step 2: Copy the ID from above, then run this (replace <inquiry-id>):
SELECT * FROM admin_update_inquiry_financials(
    p_inquiry_id := '<paste-inquiry-id-here>'::uuid,
    p_revenue := 888888,
    p_gp := 666666,
    p_commission := 13333,
    p_awb := 'TEST-RPC-DIRECT'
);

-- Step 3: Verify update
SELECT id, customer_name, est_revenue, est_gp, est_commission, awb_number
FROM inquiries
WHERE id = '<paste-same-inquiry-id-here>'::uuid;

-- Expected: est_revenue = 888888, est_gp = 666666, est_commission = 13333
