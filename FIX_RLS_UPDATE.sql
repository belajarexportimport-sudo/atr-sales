-- FIX RLS UPDATE POLICIES (CRITICAL)
-- The "Enable update for users and admins" policy is likely trapping Admins 
-- because its WITH CHECK clause strictly enforces ownership (auth.uid() = user_id),
-- blocking Admins from updating other people's rows via the Frontend.

-- 1. Drop the problematic "Hybrid" policies
DROP POLICY IF EXISTS "Enable update for users and admins" ON inquiries;
DROP POLICY IF EXISTS "Admins can update all inquiries" ON inquiries;

-- 2. Create SEPARATE, CLEAN policies
-- A. Admin Policy (Full Access)
CREATE POLICY "Admins Determine All"
ON inquiries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- B. User Policy (Own Rows Only)
CREATE POLICY "Users Update Own"
ON inquiries FOR UPDATE
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);
