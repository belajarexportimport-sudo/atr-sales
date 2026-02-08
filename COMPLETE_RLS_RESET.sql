-- COMPLETE RESET: Drop ALL policies and restore clean working state
-- This will fix the infinite recursion and restore functionality

-- Step 1: Drop EVERY policy on inquiries table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'inquiries') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON inquiries';
    END LOOP;
END $$;

-- Step 2: Create SIMPLE working policies (no recursion)

-- SELECT: Admin sees all, users see own + unassigned
CREATE POLICY "inquiries_select"
ON inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
    OR user_id IS NULL
);

-- INSERT: Anyone can insert their own
CREATE POLICY "inquiries_insert"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- UPDATE: Admin updates all, users update own
CREATE POLICY "inquiries_update"
ON inquiries FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
);

-- DELETE: Admin deletes all, users delete own
CREATE POLICY "inquiries_delete"
ON inquiries FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = user_id
);

-- Step 3: Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'inquiries' ORDER BY policyname;
