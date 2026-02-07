-- CHECK RLS POLICIES BLOCKING INSERT
-- This will show ALL policies on inquiries table

SELECT 
    policyname,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'inquiries'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Expected: Should allow admin to INSERT with revenue
-- If WITH CHECK blocks est_revenue, that's the problem!

-- Also check if there's a CHECK CONSTRAINT
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'inquiries'::regclass
AND contype = 'c'  -- CHECK constraint
AND pg_get_constraintdef(oid) LIKE '%revenue%';
