-- FIX ADMIN VISIBILITY & PENDING QUOTES

-- 1. Create a secure function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add a PERMISSIVE policy for Admins
-- This allows admins to see EVERYTHING, regardless of other policies
DROP POLICY IF EXISTS "admin_select_all" ON inquiries;

CREATE POLICY "admin_select_all"
ON inquiries
FOR SELECT
TO authenticated
USING (
  is_admin()
);

-- 3. Verify quote_status is actually 'Pending'
-- Case sensitivity fix just in case
UPDATE inquiries
SET quote_status = 'Pending'
WHERE quote_status ILIKE 'pending' AND quote_status != 'Pending';

-- 4. Check Foreign Key for Profiles Join
-- (This is needed for the frontend join to work)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'inquiries_user_id_fkey'
    ) THEN
        ALTER TABLE inquiries
        ADD CONSTRAINT inquiries_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES profiles(id);
    END IF;
END $$;

-- 5. Diagnostic: Show me the pending quotes now
SELECT 
    id, 
    customer_name, 
    quote_status, 
    (SELECT role FROM profiles WHERE id = auth.uid()) as my_role
FROM inquiries 
WHERE quote_status = 'Pending';
