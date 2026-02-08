-- Quick Check: Does original_user_id column exist?

-- Step 1: Check if column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inquiries'
AND column_name = 'original_user_id';

-- Expected Result:
-- If column EXISTS: 1 row returned
-- If column NOT EXISTS: 0 rows (NEED TO RUN MIGRATION!)

-- Step 2: Check recent inquiries
SELECT 
    customer_name,
    user_id,
    original_user_id,
    est_revenue,
    created_at
FROM inquiries
ORDER BY created_at DESC
LIMIT 3;

-- Expected Result:
-- If migration done: original_user_id has values
-- If migration NOT done: ERROR (column doesn't exist)
