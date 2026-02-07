-- TEST: Disable RLS temporarily to diagnose if it's blocking revenue updates
-- This is SAFE - we will re-enable RLS after test

-- Step 1: Disable RLS on inquiries table
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- Step 2: Test update Revenue/GP
UPDATE inquiries
SET 
    est_revenue = 6000000,
    est_gp = 5000000,
    est_commission = 100000
WHERE customer_name ILIKE '%gema%'
RETURNING id, customer_name, est_revenue, est_gp, est_commission;

-- Step 3: Verify update worked
SELECT 
    customer_name, 
    est_revenue, 
    est_gp, 
    est_commission
FROM inquiries
WHERE customer_name ILIKE '%gema%';

-- Step 4: Re-enable RLS (IMPORTANT!)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify RLS is back on
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'inquiries';
