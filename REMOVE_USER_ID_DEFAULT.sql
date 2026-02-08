-- FIX: Remove DEFAULT from user_id column

-- This will prevent user_id from being auto-set to current auth user on UPDATE

-- Step 1: Remove DEFAULT constraint
ALTER TABLE inquiries 
ALTER COLUMN user_id DROP DEFAULT;

-- Step 2: Verify DEFAULT is removed
SELECT 
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inquiries'
AND column_name = 'user_id';

-- Expected result:
-- column_default = NULL (no default)

-- Step 3: Test UPDATE after removing DEFAULT
UPDATE inquiries
SET 
    est_revenue = 7777777,
    user_id = user_id  -- Explicitly preserve current value
WHERE customer_name ILIKE '%Angkasa%';

-- Step 4: Verify user_id unchanged
SELECT 
    customer_name,
    user_id,
    est_revenue
FROM inquiries
WHERE customer_name ILIKE '%Angkasa%';

-- If user_id is still the original (not changed to admin):
-- ✅ FIX SUCCESSFUL!
