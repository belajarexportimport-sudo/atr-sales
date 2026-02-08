-- Check if RPC function is being called from frontend

-- Step 1: Check function exists
SELECT 
    proname as function_name,
    pronargs as num_args
FROM pg_proc
WHERE proname = 'admin_update_revenue_preserve_owner';

-- Step 2: Test call RPC directly with PT Rasio Abadi
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue
FROM inquiries
WHERE customer_name ILIKE '%Rasio%'
ORDER BY created_at DESC
LIMIT 1;

-- Step 3: Copy ID from Step 2, then manually call RPC
-- Replace 'PASTE-ID' with actual ID
SELECT admin_update_revenue_preserve_owner(
    'PASTE-ID-HERE'::uuid,
    6666666,  -- test revenue
    5555555,  -- test gp
    111111,   -- test commission
    'MANUAL-TEST'
);

-- Step 4: Verify
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    awb_number
FROM inquiries
WHERE customer_name ILIKE '%Rasio%'
ORDER BY updated_at DESC
LIMIT 1;

-- If Step 4 shows revenue = 6666666 and user_id unchanged:
-- → RPC works, problem is frontend not calling it
-- → Need to clear browser cache completely
