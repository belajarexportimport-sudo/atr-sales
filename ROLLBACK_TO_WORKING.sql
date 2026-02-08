-- ============================================
-- ROLLBACK: Restore Working RLS Policies
-- ============================================
-- Kembali ke policy yang SUDAH JALAN sebelumnya
-- Hapus semua policy broken yang saya buat

-- Step 1: Drop ALL broken policies
DROP POLICY IF EXISTS "select_inquiries" ON inquiries;
DROP POLICY IF EXISTS "insert_inquiries" ON inquiries;
DROP POLICY IF EXISTS "update_inquiries" ON inquiries;
DROP POLICY IF EXISTS "delete_inquiries" ON inquiries;

-- Step 2: Restore ORIGINAL working policies
-- (Policy yang sudah jalan sebelum saya "simplify")

CREATE POLICY "Users can view own inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR user_id IS NULL
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Users can insert own inquiries"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admin can update all inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Step 3: Verify policies restored
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'inquiries' ORDER BY policyname;
