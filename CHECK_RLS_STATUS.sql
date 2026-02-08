-- Check if RLS is still disabled

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'inquiries';

-- Expected: rls_enabled = false

-- If rls_enabled = true → RLS was re-enabled somehow!
-- This would explain why UPDATE fails silently
