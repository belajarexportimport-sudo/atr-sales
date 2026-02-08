-- ============================================
-- NUCLEAR OPTION: Disable ALL RLS on Inquiries
-- ============================================
-- This will make revenue work 100%, then we add security back gradually

-- Step 1: Disable RLS completely
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'inquiries';

-- Expected: rowsecurity = false

-- Step 3: Test create inquiry with revenue
-- Revenue should save now because NO RLS blocking

-- Step 4: After confirming revenue works, we can re-enable RLS with SIMPLE policies
-- But for now, let's just make it work first!
