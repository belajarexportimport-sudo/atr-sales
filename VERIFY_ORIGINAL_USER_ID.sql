-- VERIFY: Check if original_user_id column exists

-- Step 1: Check column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inquiries'
AND column_name = 'original_user_id';

-- Expected: 1 row showing original_user_id column
-- If NO rows → Column belum dibuat! Run FINAL_SOLUTION_ORIGINAL_USER.sql

-- Step 2: Check data populated
SELECT 
    customer_name,
    user_id,
    original_user_id,
    est_revenue
FROM inquiries
ORDER BY created_at DESC
LIMIT 5;

-- Expected: original_user_id NOT NULL for all rows
-- If original_user_id = NULL → Data belum dipopulate!

-- Step 3: Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'inquiries'
AND trigger_name = 'set_original_user_id_trigger';

-- Expected: 1 row showing trigger
-- If NO rows → Trigger belum dibuat!
