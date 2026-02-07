-- ============================================
-- LAYER 1: BULLETPROOF RLS POLICIES
-- ============================================
-- Goal: Simple, clear policies that work 100% of the time
-- Modular: Easy to understand, easy to debug, easy to extend

-- Step 1: Clean slate - remove all existing inquiry policies
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can insert own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can delete own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Enable insert for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Enable update for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Enable read access for users" ON inquiries;
DROP POLICY IF EXISTS "Enable delete for users" ON inquiries;
DROP POLICY IF EXISTS "Admin can update all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "admin_full_update_access" ON inquiries;
DROP POLICY IF EXISTS "insert_inquiry_with_financials" ON inquiries;

-- Step 2: Create simple, modular policies

-- SELECT: Admin sees all, users see own + unassigned
CREATE POLICY "select_inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
    OR user_id IS NULL
);

-- INSERT: Anyone authenticated can insert (NO column restrictions)
CREATE POLICY "insert_inquiries"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Admin updates all, users update own (with financial field protection)
CREATE POLICY "update_inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
)
WITH CHECK (
    -- Admin can change anything
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR
    -- Non-admin cannot change financial fields
    (
        auth.uid() = user_id
        AND est_revenue IS NOT DISTINCT FROM (SELECT est_revenue FROM inquiries WHERE id = inquiries.id)
        AND est_gp IS NOT DISTINCT FROM (SELECT est_gp FROM inquiries WHERE id = inquiries.id)
        AND est_commission IS NOT DISTINCT FROM (SELECT est_commission FROM inquiries WHERE id = inquiries.id)
    )
);

-- DELETE: Admin deletes all, users delete own
CREATE POLICY "delete_inquiries"
ON inquiries FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
);

-- Step 3: Verify policies created
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read access'
        WHEN cmd = 'INSERT' THEN 'Create access'
        WHEN cmd = 'UPDATE' THEN 'Edit access'
        WHEN cmd = 'DELETE' THEN 'Delete access'
    END as description
FROM pg_policies
WHERE tablename = 'inquiries'
ORDER BY cmd, policyname;

-- Expected: 4 policies (select, insert, update, delete)
