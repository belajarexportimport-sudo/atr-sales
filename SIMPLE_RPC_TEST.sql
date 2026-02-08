-- SIMPLE RPC TEST: Update revenue terakhir yang dibuat

-- Step 1: Update inquiry terakhir dengan revenue 888888
SELECT * FROM admin_update_inquiry_financials(
    p_inquiry_id := (SELECT id FROM inquiries ORDER BY created_at DESC LIMIT 1),
    p_revenue := 888888,
    p_gp := 666666,
    p_commission := 13333,
    p_awb := 'TEST-RPC-SUCCESS'
);

-- Step 2: Verify - lihat inquiry terakhir
SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    awb_number,
    created_at
FROM inquiries
ORDER BY created_at DESC
LIMIT 1;

-- Expected result:
-- est_revenue = 888888
-- est_gp = 666666
-- est_commission = 13333
-- awb_number = 'TEST-RPC-SUCCESS'
