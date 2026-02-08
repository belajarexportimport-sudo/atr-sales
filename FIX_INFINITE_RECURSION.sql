-- FIX: Infinite Recursion in RLS Policy
-- Problem: UPDATE policy WITH CHECK has subquery causing recursion
-- Solution: Simplify WITH CHECK to not query inquiries table

-- Step 1: Drop broken policies
DROP POLICY IF EXISTS "select_inquiries" ON inquiries;
DROP POLICY IF EXISTS "insert_inquiries" ON inquiries;
DROP POLICY IF EXISTS "update_inquiries" ON inquiries;
DROP POLICY IF EXISTS "delete_inquiries" ON inquiries;

-- Step 2: Create FIXED policies

-- SELECT: Admin sees all, users see own
CREATE POLICY "select_inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
    OR user_id IS NULL
);

-- INSERT: Anyone can insert (NO restrictions)
CREATE POLICY "insert_inquiries"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Admin updates all, users update own
-- FIXED: No subquery in WITH CHECK to avoid recursion
CREATE POLICY "update_inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
);

-- DELETE: Admin deletes all, users delete own
CREATE POLICY "delete_inquiries"
ON inquiries FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
);

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'inquiries' ORDER BY cmd;
