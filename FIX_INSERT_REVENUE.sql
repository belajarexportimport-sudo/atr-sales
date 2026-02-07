-- FIX: Allow Admin to INSERT with Revenue/GP/Commission
-- Problem: Current INSERT policy blocks financial fields
-- Solution: Add admin bypass for financial fields

-- Step 1: Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "Users can insert own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for users and admins" ON inquiries;

-- Step 2: Create new INSERT policy with admin financial access
CREATE POLICY "insert_inquiry_with_financials"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can insert their own inquiries (without financial data)
    (auth.uid() = user_id)
    OR
    -- Admins can insert ANY inquiry (with or without financial data)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 3: Verify policy created
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'inquiries'
AND cmd = 'INSERT';

-- Expected result: "insert_inquiry_with_financials" policy should appear

-- Step 4: Test by creating PT Amuka again
-- After running this script:
-- 1. Delete PT Amuka inquiry (if exists)
-- 2. Create new PT Amuka with revenue
-- 3. Revenue should save correctly!
