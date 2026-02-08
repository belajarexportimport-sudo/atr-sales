-- Verify Revenue Data in Database
-- Check if admin's manual edit actually saved to DB

-- Step 1: Get latest 5 inquiries with revenue data
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    est_commission,
    quote_status,
    created_at,
    updated_at
FROM inquiries
WHERE est_revenue IS NOT NULL AND est_revenue > 0
ORDER BY updated_at DESC
LIMIT 5;

-- Step 2: Check specific inquiry by customer name
-- Replace 'CUSTOMER_NAME' with actual customer name
SELECT 
    id,
    customer_name,
    est_revenue,
    est_gp,
    est_commission,
    awb_number,
    updated_at
FROM inquiries
WHERE customer_name ILIKE '%abc%'  -- Change 'abc' to customer name
ORDER BY created_at DESC;

-- Expected: Revenue should show if admin edited it
-- If revenue shows here but NOT in UI → Frontend cache issue
-- If revenue is NULL here → UPDATE didn't work
