-- VERIFICATION TEST - Check if user_id overwrite is fixed

-- Step 1: Create test RFQ as sales user (via frontend)
-- Then get the inquiry details
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    created_at
FROM inquiries
ORDER BY created_at DESC
LIMIT 3;

-- Step 2: Note the user_id from Step 1
-- This should be the SALES user UUID

-- Step 3: After admin edits revenue via pencil icon, run this:
SELECT 
    id,
    customer_name,
    user_id,
    est_revenue,
    est_gp,
    updated_at
FROM inquiries
WHERE customer_name ILIKE '%test%'  -- Replace with actual customer name
ORDER BY updated_at DESC
LIMIT 1;

-- EXPECTED RESULT:
-- ✅ est_revenue = (new value entered by admin)
-- ✅ user_id = (SAME as Step 2 - sales user UUID, NOT admin UUID)

-- If user_id changed to admin UUID → Fix failed
-- If user_id stayed as sales UUID → Fix successful! ✅
